export interface RainConfig {
  dprCap: number;
  fontSize: number;
  density: number;
  trailRange: [number, number];
  speedRange: [number, number];
  pauseRange: [number, number];
  mutationRate: number;
  fpsCap: number;
  revealDuration: number;
  settleDuration: number;
}

export const DEFAULT_CONFIG: RainConfig = {
  dprCap: 2,
  fontSize: 15,
  density: 0.72,
  trailRange: [8, 28],
  speedRange: [4, 14],
  pauseRange: [600, 3200],
  mutationRate: 0.04,
  fpsCap: 60,
  revealDuration: 900,
  settleDuration: 600,
};

const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
  "0123456789" +
  "!@#$%^&*<>/\\|{}[]";

const GLYPH_ARRAY = Array.from(GLYPHS);

function randomGlyph(): string {
  return GLYPH_ARRAY[Math.floor(Math.random() * GLYPH_ARRAY.length)] ?? "0";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

type StreamLayer = "distant" | "mid" | "near";

interface Stream {
  col: number;
  headY: number;
  speed: number;
  trailLength: number;
  glyphs: string[];
  layer: StreamLayer;
  pauseMs: number;
  active: boolean;
}

function layerAlpha(layer: StreamLayer): number {
  switch (layer) {
    case "distant":
      return 0.32;
    case "mid":
      return 0.72;
    case "near":
      return 1;
  }
}

function pickLayer(): StreamLayer {
  const value = Math.random();
  if (value < 0.28) return "distant";
  if (value < 0.82) return "mid";
  return "near";
}

export type RainPhase = "idle" | "reveal" | "settle" | "ambient";

export class MatrixRain {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly cfg: RainConfig;

  private streams: Stream[] = [];
  private cols = 0;
  private rows = 0;
  private dpr = 1;
  private rafId = 0;
  private resizeRafId = 0;
  private lastTime = 0;
  private phase: RainPhase = "idle";
  private phaseStart = 0;
  private running = false;
  private paused = false;
  private hiddenAt = 0;

  constructor(canvas: HTMLCanvasElement, config: Partial<RainConfig> = {}) {
    this.canvas = canvas;
    this.cfg = { ...DEFAULT_CONFIG, ...config };

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
  }

  start(phase: RainPhase = "ambient") {
    if (this.running) {
      this.setPhase(phase);
      this.resume();
      return;
    }

    this.running = true;
    this.paused = false;
    this.phase = phase;
    this.phaseStart = performance.now();
    this.resize();
    this.attachListeners();
    this.lastTime = performance.now();

    if (!document.hidden) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  stop() {
    if (!this.running && !this.rafId) return;

    this.running = false;
    this.paused = false;
    cancelAnimationFrame(this.rafId);
    cancelAnimationFrame(this.resizeRafId);
    this.rafId = 0;
    this.resizeRafId = 0;
    this.detachListeners();
  }

  pause() {
    if (!this.running || this.paused) return;
    this.paused = true;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();

    if (!document.hidden) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  setPhase(phase: RainPhase) {
    this.phase = phase;
    this.phaseStart = performance.now();
  }

  isRunning() {
    return this.running;
  }

  isPaused() {
    return this.paused;
  }

  private resize() {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);

    this.dpr = Math.min(window.devicePixelRatio || 1, this.cfg.dprCap);
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.cols = Math.max(1, Math.floor(width / this.cfg.fontSize));
    this.rows = Math.ceil(height / this.cfg.fontSize) + 4;
    this.rebuildStreams();

    if (this.paused) {
      this.draw(performance.now());
    }
  }

  private handleResize = () => {
    if (!this.running || this.resizeRafId) return;

    this.resizeRafId = requestAnimationFrame(() => {
      this.resizeRafId = 0;
      if (this.running) this.resize();
    });
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.hiddenAt = performance.now();
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
      return;
    }

    if (!this.running || this.paused) return;

    const elapsed = Math.min(performance.now() - this.hiddenAt, 2000);
    this.advanceStreams(elapsed / 1000);
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  };

  private attachListeners() {
    window.addEventListener("resize", this.handleResize, { passive: true });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  private detachListeners() {
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }

  private rebuildStreams() {
    const target = Math.round(this.cols * clamp(this.cfg.density, 0, 1));
    this.streams = this.streams.filter((stream) => stream.col < this.cols);

    const usedColumns = new Set(this.streams.map((stream) => stream.col));
    const available: number[] = [];

    for (let col = 0; col < this.cols; col++) {
      if (!usedColumns.has(col)) available.push(col);
    }

    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j]!, available[i]!];
    }

    while (this.streams.length < target && available.length > 0) {
      const col = available.pop();
      if (col !== undefined) this.streams.push(this.makeStream(col));
    }

    while (this.streams.length > target) {
      this.streams.pop();
    }
  }

  private makeStream(col: number, startActive = Math.random() > 0.4): Stream {
    const [trailMin, trailMax] = this.cfg.trailRange;
    const [speedMin, speedMax] = this.cfg.speedRange;
    const trailLength = Math.round(trailMin + Math.random() * (trailMax - trailMin));

    return {
      col,
      headY: startActive ? Math.random() * this.rows : -trailLength,
      speed: speedMin + Math.random() * (speedMax - speedMin),
      trailLength,
      glyphs: Array.from({ length: trailLength }, randomGlyph),
      layer: pickLayer(),
      pauseMs: startActive ? 0 : Math.random() * this.cfg.pauseRange[1],
      active: startActive,
    };
  }

  private advanceStreams(dt: number) {
    const [pauseMin, pauseMax] = this.cfg.pauseRange;
    const mutationProbability = 1 - Math.pow(1 - this.cfg.mutationRate, dt * 60);

    for (const stream of this.streams) {
      if (!stream.active) {
        stream.pauseMs -= dt * 1000;

        if (stream.pauseMs <= 0) {
          stream.active = true;
          stream.headY = -stream.trailLength;
          stream.layer = pickLayer();
          stream.speed =
            this.cfg.speedRange[0] +
            Math.random() * (this.cfg.speedRange[1] - this.cfg.speedRange[0]);
          stream.trailLength = Math.round(
            this.cfg.trailRange[0] +
              Math.random() * (this.cfg.trailRange[1] - this.cfg.trailRange[0]),
          );
          stream.glyphs = Array.from({ length: stream.trailLength }, randomGlyph);
        }

        continue;
      }

      stream.headY += stream.speed * dt;

      for (let i = 0; i < stream.glyphs.length; i++) {
        if (Math.random() < mutationProbability) {
          stream.glyphs[i] = randomGlyph();
        }
      }

      if (stream.headY - stream.trailLength > this.rows) {
        stream.active = false;
        stream.pauseMs = pauseMin + Math.random() * (pauseMax - pauseMin);
      }
    }
  }

  private tick = (now: number) => {
    if (!this.running || this.paused) return;

    const minInterval = 1000 / this.cfg.fpsCap;
    if (now - this.lastTime < minInterval) {
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.advanceStreams(dt);
    this.draw(now);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private draw(now: number) {
    const { ctx, cfg } = this;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const fontSize = cfg.fontSize;

    let intensity = 1;
    const phaseElapsed = now - this.phaseStart;

    if (this.phase === "reveal") {
      intensity = lerp(1, 2.2, phaseElapsed / cfg.revealDuration);
    } else if (this.phase === "settle") {
      intensity = lerp(2.2, 1, phaseElapsed / cfg.settleDuration);
    }

    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    for (const stream of this.streams) {
      if (!stream.active) continue;

      const baseAlpha = layerAlpha(stream.layer) * Math.min(intensity, 2);
      const x = (stream.col + 0.5) * fontSize;

      for (let i = 0; i < stream.trailLength; i++) {
        const row = Math.floor(stream.headY) - i;
        if (row < 0 || row >= this.rows) continue;

        const y = (row + 1) * fontSize;
        if (y > height + fontSize) continue;

        const trailFraction = i / stream.trailLength;
        const alpha = baseAlpha * (1 - trailFraction) * (1 - trailFraction * 0.6);

        if (i === 0) {
          ctx.fillStyle = `rgba(200, 255, 210, ${Math.min(alpha * 1.4, 1)})`;
        } else if (i < 3) {
          ctx.fillStyle = `rgba(80, 220, 120, ${Math.min(alpha * 1.1, 1)})`;
        } else {
          const green = Math.round(lerp(180, 80, trailFraction));
          ctx.fillStyle = `rgba(20, ${green}, 60, ${Math.min(alpha, 1)})`;
        }

        ctx.fillText(stream.glyphs[i] ?? randomGlyph(), x, y);
      }
    }
  }
}
