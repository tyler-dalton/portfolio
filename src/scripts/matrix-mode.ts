import type { MatrixRain, RainPhase } from "./matrix-rain";

type NormalTheme = "light" | "dark";

const KEY_THEME = "theme";
const KEY_DISCOVERED = "matrix-discovered";
const KEY_SESSION = "matrix-session";
const KEY_PREVIOUS_THEME = "matrix-previous-theme";
const KEY_RABBIT_HINT_SEEN = "matrix-rabbit-hint-seen";

const SCRAMBLE_CHARS = "アイウエオカキクケコサシスセソ0123456789!@#$%^&*";
const CANVAS_FADE_MS = 180;
const RABBIT_HINT_DURATION_MS = 8000;
const RABBIT_HINT_SCROLL_DISMISS_DISTANCE = 640;

let matrixActive = false;
let rainPaused = false;
let rainInstance: MatrixRain | null = null;
let rainCanvas: HTMLCanvasElement | null = null;
let rainImportPromise: Promise<typeof import("./matrix-rain")> | null = null;
let activationVersion = 0;
let canvasHideTimer = 0;
let motionQuery: MediaQueryList | null = null;

let scrambleTimer = 0;
let scrambleTarget: HTMLElement | null = null;
let scrambleOriginal = "";
let scrambleFrame = 0;
let accessNoticeFrameTimer = 0;
let accessNoticeHideTimer = 0;
let rabbitHintHideTimer = 0;
let rabbitHintStartY = 0;
let rabbitHintVisible = false;
let rabbitHintScrollHandler: (() => void) | null = null;

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function ssGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function ssSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
}

function ssDel(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

export function applyTheme(theme: NormalTheme | "matrix") {
  document.documentElement.dataset.theme = theme;
}

export function getNormalTheme(): NormalTheme {
  return lsGet(KEY_THEME) === "light" ? "light" : "dark";
}

function getCurrentNormalTheme(): NormalTheme {
  const current = document.documentElement.dataset.theme;
  if (current === "light" || current === "dark") return current;
  return getNormalTheme();
}

function rememberPreviousTheme() {
  ssSet(KEY_PREVIOUS_THEME, getCurrentNormalTheme());
}

function getPreviousTheme(): NormalTheme {
  const previous = ssGet(KEY_PREVIOUS_THEME);
  if (previous === "light" || previous === "dark") return previous;
  return getNormalTheme();
}

export function isDiscovered(): boolean {
  return lsGet(KEY_DISCOVERED) === "1";
}

export function markDiscovered() {
  lsSet(KEY_DISCOVERED, "1");
}

export function isMatrixSession(): boolean {
  return ssGet(KEY_SESSION) === "1";
}

export function isRainPaused(): boolean {
  return rainPaused;
}

function prefersReducedMotion(): boolean {
  return motionQuery?.matches ?? window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ensureCanvas(): HTMLCanvasElement {
  window.clearTimeout(canvasHideTimer);

  let canvas = document.getElementById("matrix-canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "matrix-canvas";
    canvas.className = "matrix-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.setAttribute("role", "presentation");
    document.body.insertBefore(canvas, document.body.firstChild);
  }

  canvas.classList.add("matrix-canvas--visible");
  rainCanvas = canvas;
  return canvas;
}

function hideCanvas(immediate = false) {
  const canvas = rainCanvas ?? (document.getElementById("matrix-canvas") as HTMLCanvasElement | null);
  if (!canvas) return;

  window.clearTimeout(canvasHideTimer);
  canvas.classList.remove("matrix-canvas--visible");

  const releaseBuffer = () => {
    if (canvas.classList.contains("matrix-canvas--visible")) return;
    canvas.width = 0;
    canvas.height = 0;
  };

  if (immediate || prefersReducedMotion()) {
    releaseBuffer();
  } else {
    canvasHideTimer = window.setTimeout(releaseBuffer, CANVAS_FADE_MS);
  }
}

function canAnimate(version: number): boolean {
  return (
    matrixActive &&
    version === activationVersion &&
    !rainPaused &&
    !prefersReducedMotion()
  );
}

async function startRain(phase: RainPhase = "ambient", version = activationVersion) {
  if (!canAnimate(version)) return;

  if (!rainImportPromise) {
    rainImportPromise = import("./matrix-rain");
  }

  const mod = await rainImportPromise;
  if (!canAnimate(version)) return;

  if (!rainInstance) {
    const canvas = ensureCanvas();

    try {
      rainInstance = new mod.MatrixRain(canvas);
    } catch {
      hideCanvas(true);
      return;
    }
  } else {
    ensureCanvas();
  }

  if (!canAnimate(version)) return;

  if (!rainInstance.isRunning()) {
    rainInstance.start(phase);
  } else {
    rainInstance.setPhase(phase);
    if (rainInstance.isPaused()) rainInstance.resume();
  }
}

function stopRain(immediateCanvasHide = false) {
  rainInstance?.stop();
  rainInstance = null;
  hideCanvas(immediateCanvasHide);
}

function startScramble(version: number) {
  const target = document.querySelector<HTMLElement>("main [data-matrix-scramble], main h1");
  if (!target || target.children.length > 0) return;

  scrambleTarget = target;
  scrambleOriginal = target.textContent ?? "";
  scrambleFrame = 0;

  if (!scrambleOriginal) return;

  const totalFrames = 18;
  const frameMs = 55;

  const step = () => {
    if (
      !scrambleTarget ||
      !matrixActive ||
      version !== activationVersion ||
      prefersReducedMotion()
    ) {
      restoreScramble();
      return;
    }

    scrambleFrame += 1;
    const progress = scrambleFrame / totalFrames;
    const resolvedCount = Math.floor(progress * scrambleOriginal.length);
    let result = "";

    for (let i = 0; i < scrambleOriginal.length; i++) {
      const char = scrambleOriginal[i] ?? "";
      if (/\s/.test(char) || i < resolvedCount) {
        result += char;
      } else {
        result += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)] ?? "0";
      }
    }

    scrambleTarget.textContent = result;

    if (scrambleFrame < totalFrames) {
      scrambleTimer = window.setTimeout(step, frameMs);
    } else {
      restoreScramble();
    }
  };

  scrambleTimer = window.setTimeout(step, frameMs);
}

function restoreScramble() {
  window.clearTimeout(scrambleTimer);

  if (scrambleTarget && scrambleOriginal) {
    scrambleTarget.textContent = scrambleOriginal;
  }

  scrambleTarget = null;
  scrambleOriginal = "";
  scrambleFrame = 0;
}

function hideAccessNotice(immediate = false) {
  const notice = document.getElementById("matrix-access-notice");
  if (!notice) return;

  window.clearTimeout(accessNoticeFrameTimer);
  window.clearTimeout(accessNoticeHideTimer);
  notice.classList.remove("matrix-access-notice--visible");

  if (immediate || prefersReducedMotion()) {
    notice.setAttribute("hidden", "");
    return;
  }

  accessNoticeHideTimer = window.setTimeout(
    () => notice.setAttribute("hidden", ""),
    CANVAS_FADE_MS,
  );
}

function showAccessNotice(version: number) {
  const notice = document.getElementById("matrix-access-notice");
  const title = document.getElementById("matrix-access-title");
  const detail = document.getElementById("matrix-access-detail");
  if (!notice || !title || !detail) return;

  const finalTitle = "ACCESS GRANTED";
  const finalDetail = "SYSTEM OVERRIDE // UNRESTRICTED ACCESS";
  const totalFrames = 20;
  const frameMs = 55;
  let frame = 0;

  const decode = (value: string, resolvedCount: number) =>
    Array.from(value, (char, index) =>
      /\s/.test(char) || index < resolvedCount
        ? char
        : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)] ?? "0",
    ).join("");

  window.clearTimeout(accessNoticeFrameTimer);
  window.clearTimeout(accessNoticeHideTimer);
  notice.removeAttribute("hidden");
  title.textContent = finalTitle;
  detail.textContent = finalDetail;
  requestAnimationFrame(() => notice.classList.add("matrix-access-notice--visible"));

  if (prefersReducedMotion()) {
    accessNoticeHideTimer = window.setTimeout(() => hideAccessNotice(), 1800);
    return;
  }

  const step = () => {
    if (!matrixActive || version !== activationVersion) {
      hideAccessNotice(true);
      return;
    }

    frame += 1;
    title.textContent = decode(finalTitle, Math.floor((frame / totalFrames) * finalTitle.length));
    detail.textContent = decode(finalDetail, Math.floor((frame / totalFrames) * finalDetail.length));

    if (frame < totalFrames) {
      accessNoticeFrameTimer = window.setTimeout(step, frameMs);
    } else {
      title.textContent = finalTitle;
      detail.textContent = finalDetail;
      accessNoticeHideTimer = window.setTimeout(() => hideAccessNotice(), 850);
    }
  };

  step();
}

function hideRabbitHint(immediate = false) {
  const hint = document.getElementById("matrix-rabbit-hint");
  if (!hint) return;

  window.clearTimeout(rabbitHintHideTimer);
  rabbitHintVisible = false;
  if (rabbitHintScrollHandler) {
    window.removeEventListener("scroll", rabbitHintScrollHandler);
    rabbitHintScrollHandler = null;
  }
  hint.classList.remove("matrix-rabbit-hint--visible");

  if (immediate || prefersReducedMotion()) {
    hint.setAttribute("hidden", "");
    return;
  }

  rabbitHintHideTimer = window.setTimeout(() => hint.setAttribute("hidden", ""), CANVAS_FADE_MS);
}

function initRabbitHint() {
  const hint = document.getElementById("matrix-rabbit-hint");
  const dismiss = document.getElementById("matrix-rabbit-hint-dismiss");
  if (!hint || !dismiss || isDiscovered() || ssGet(KEY_RABBIT_HINT_SEEN) === "1") return;

  const handleScroll = () => {
    if (matrixActive || isDiscovered() || window.scrollY < 280) {
      if (isDiscovered()) window.removeEventListener("scroll", handleScroll);
      return;
    }

    ssSet(KEY_RABBIT_HINT_SEEN, "1");
    rabbitHintStartY = window.scrollY;
    rabbitHintVisible = true;
    hint.removeAttribute("hidden");
    requestAnimationFrame(() => hint.classList.add("matrix-rabbit-hint--visible"));
    rabbitHintHideTimer = window.setTimeout(() => hideRabbitHint(), RABBIT_HINT_DURATION_MS);
    window.removeEventListener("scroll", handleScroll);

    rabbitHintScrollHandler = () => {
      if (
        rabbitHintVisible &&
        Math.abs(window.scrollY - rabbitHintStartY) > RABBIT_HINT_SCROLL_DISMISS_DISTANCE
      ) {
        hideRabbitHint();
      }
    };
    window.addEventListener("scroll", rabbitHintScrollHandler, { passive: true });
  };

  dismiss.addEventListener("click", () => hideRabbitHint());
  window.addEventListener("scroll", handleScroll, { passive: true });
}

function updatePauseButton() {
  const button = document.getElementById("matrix-pause-btn") as HTMLButtonElement | null;
  if (!button) return;

  button.hidden = prefersReducedMotion();

  if (rainPaused) {
    button.textContent = "Resume rain";
    button.setAttribute("aria-label", "Resume matrix rain animation");
  } else {
    button.textContent = "Pause rain";
    button.setAttribute("aria-label", "Pause matrix rain animation");
  }
}

function showControls() {
  const controls = document.getElementById("matrix-controls");
  if (!controls) return;

  controls.hidden = false;
  controls.removeAttribute("aria-hidden");
  updatePauseButton();
}

function hideControls() {
  const controls = document.getElementById("matrix-controls");
  if (!controls) return;

  controls.hidden = true;
  controls.setAttribute("aria-hidden", "true");
}

function announce(message: string) {
  const liveRegion = document.getElementById("matrix-live");
  if (!liveRegion) return;

  liveRegion.textContent = "";
  requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

export async function activateMatrix() {
  if (matrixActive) return;

  rememberPreviousTheme();
  matrixActive = true;
  rainPaused = false;
  const version = ++activationVersion;

  markDiscovered();
  hideRabbitHint(true);
  ssSet(KEY_SESSION, "1");
  applyTheme("matrix");
  showControls();
  showAccessNotice(version);
  announce("Matrix mode activated.");

  if (prefersReducedMotion()) return;

  await delay(120);
  if (!canAnimate(version)) return;

  await startRain("reveal", version);
  if (!canAnimate(version)) return;

  await delay(180);
  if (!canAnimate(version)) return;
  startScramble(version);

  await delay(900);
  if (!canAnimate(version)) return;
  rainInstance?.setPhase("settle");

  await delay(600);
  if (!canAnimate(version)) return;
  rainInstance?.setPhase("ambient");
}

export async function reactivateMatrix() {
  if (matrixActive) return;

  matrixActive = true;
  rainPaused = false;
  const version = ++activationVersion;

  markDiscovered();
  ssSet(KEY_SESSION, "1");
  applyTheme("matrix");
  showControls();

  if (!prefersReducedMotion()) {
    await startRain("ambient", version);
  }
}

export function deactivateMatrix() {
  if (!matrixActive) return;

  matrixActive = false;
  rainPaused = false;
  activationVersion += 1;

  restoreScramble();
  hideAccessNotice();
  stopRain();
  hideControls();
  ssDel(KEY_SESSION);

  const previousTheme = getPreviousTheme();
  ssDel(KEY_PREVIOUS_THEME);
  applyTheme(previousTheme);
  announce("Returned to normal mode.");
}

export function pauseRain() {
  if (!matrixActive || rainPaused || prefersReducedMotion()) return;

  rainPaused = true;
  activationVersion += 1;
  rainInstance?.pause();
  updatePauseButton();
  announce("Matrix rain paused.");
}

export function resumeRain() {
  if (!matrixActive || !rainPaused || prefersReducedMotion()) return;

  rainPaused = false;
  const version = ++activationVersion;
  updatePauseButton();

  if (rainInstance?.isRunning()) {
    ensureCanvas();
    rainInstance.setPhase("ambient");
    rainInstance.resume();
  } else {
    void startRain("ambient", version);
  }

  announce("Matrix rain resumed.");
}

export function toggleRain() {
  if (rainPaused) resumeRain();
  else pauseRain();
}

export function isMatrixActive(): boolean {
  return matrixActive;
}

function openCommandPaletteWithQuery(query: string) {
  const opener = (window as Window & { __openPaletteWithQuery?: (value: string) => void })
    .__openPaletteWithQuery;

  if (typeof opener === "function") opener(query);
}

function handleControlClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return;
  const control = event.target.closest<HTMLElement>(
    "#white-rabbit-btn, #matrix-pause-btn, #matrix-exit-btn",
  );
  if (!control) return;

  if (control.id === "white-rabbit-btn") {
    markDiscovered();
    hideRabbitHint(true);
    openCommandPaletteWithQuery("wake up");
  } else if (control.id === "matrix-pause-btn") {
    toggleRain();
  } else if (control.id === "matrix-exit-btn") {
    deactivateMatrix();
  }
}

function handleMotionPreferenceChange() {
  if (!matrixActive) return;

  updatePauseButton();
  activationVersion += 1;
  restoreScramble();

  if (prefersReducedMotion()) {
    stopRain(true);
    announce("Matrix mode remains active with motion disabled.");
    return;
  }

  if (!rainPaused) {
    void startRain("ambient", activationVersion);
  }
}

export async function initMatrix() {
  const globalWindow = window as Window & {
    __matrixInitialized?: boolean;
    __matrix?: {
      activate: () => Promise<void>;
      deactivate: () => void;
      pause: () => void;
      resume: () => void;
      toggle: () => void;
      isActive: () => boolean;
      isDiscovered: () => boolean;
      isPaused: () => boolean;
    };
  };

  if (globalWindow.__matrixInitialized) return;
  globalWindow.__matrixInitialized = true;

  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  globalWindow.__matrix = {
    activate: () => activateMatrix(),
    deactivate: () => deactivateMatrix(),
    pause: () => pauseRain(),
    resume: () => resumeRain(),
    toggle: () => toggleRain(),
    isActive: () => matrixActive,
    isDiscovered: () => isDiscovered(),
    isPaused: () => rainPaused,
  };

  document.addEventListener("click", handleControlClick);
  motionQuery.addEventListener("change", handleMotionPreferenceChange);
  initRabbitHint();

  if (isMatrixSession()) {
    await reactivateMatrix();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
