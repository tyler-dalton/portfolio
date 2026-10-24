/**
 * Serves dist/ and checks routes plus a few interactions.
 * Run `npm run build` first. Set SMOKE_CHROMIUM to a browser executable
 * when Playwright's Chromium is not installed.
 */
import { createServer } from "node:http";
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import playwright from "playwright";

const { chromium } = playwright;
const dist = fileURLToPath(new URL("../dist", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".vcf": "text/vcard",
  ".ico": "image/x-icon",
};

function fileFor(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  const relative = normalize(pathname).replace(/^([/\\])+/, "");
  if (relative.startsWith("..")) return null;
  const candidate = join(dist, relative);
  if (candidate !== dist && !candidate.startsWith(dist + sep)) return null;
  if (!existsSync(candidate)) return null;
  if (statSync(candidate).isDirectory()) {
    const index = join(candidate, "index.html");
    return existsSync(index) ? index : null;
  }
  return candidate;
}

function serve() {
  return new Promise((resolve) => {
    const server = createServer(async (request, response) => {
      try {
        const file = fileFor(request.url ?? "/");
        if (!file) {
          response.writeHead(404);
          response.end("Not found");
          return;
        }
        const body = await readFile(file);
        response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
        response.end(body);
      } catch {
        response.writeHead(500);
        response.end("Server error");
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function launch() {
  const args = ["--no-sandbox"];
  if (process.env.SMOKE_CHROMIUM) {
    return chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM, args });
  }
  try {
    return await chromium.launch({ args });
  } catch (error) {
    if (existsSync("/snap/bin/chromium")) {
      return chromium.launch({ executablePath: "/snap/bin/chromium", args });
    }
    throw error;
  }
}

const failures = [];
function check(name, ok, detail = "") {
  const line = `${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`;
  console.log(line);
  if (!ok) failures.push(line);
}

if (!existsSync(join(dist, "index.html"))) {
  console.error("dist/index.html is missing. Run npm run build first.");
  process.exit(1);
}

const { server, origin } = await serve();
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(8000);

try {
  const routes = [
    ["/", "Hi, I'm Tyler Dalton."],
    ["/work/", "Systems, software, and the work behind them."],
    ["/work/projects/", "Projects"],
    ["/work/projects/panoptes/", "Panoptes"],
    ["/work/resume/", "My Resume"],
    ["/activity/", "A record of work in motion."],
    ["/activity/github/", "GitHub activity"],
    ["/activity/timeline/", "Timeline"],
    ["/activity/changelog/", "Changelog"],
    ["/about/", "The person behind the systems."],
    ["/contact/", "tldalton54@gmail.com"],
    ["/card/", "Save Contact"],
  ];

  for (const [path, text] of routes) {
    const response = await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").innerText();
    check(`${path} renders`, response?.status() === 200 && body.includes(text), `status ${response?.status()}`);
  }

  for (const asset of ["/media/tyler-dalton-resume.pdf", "/github/contributions.svg", "/sitemap-index.xml"]) {
    const response = await page.request.get(`${origin}${asset}`);
    check(`${asset} is served`, response.status() === 200, `status ${response.status()}`);
  }

  await page.goto(`${origin}/contact/`, { waitUntil: "domcontentloaded" });
  check("contact has no form", (await page.locator("form").count()) === 0);
  const mailto = await page.locator('a[href="mailto:tldalton54@gmail.com"]').count();
  check("contact mailto", mailto > 0, String(mailto));

  await page.goto(`${origin}/card/`, { waitUntil: "domcontentloaded" });
  check("card hides site header", (await page.locator("header.site-header").count()) === 0);
  const save = page.locator('a[href="/media/tyler-dalton.vcf"]');
  const saveCount = await save.count();
  const download = saveCount ? await save.first().getAttribute("download") : "";
  check("card downloads the vCard", saveCount > 0 && download === "Tyler-Dalton.vcf", download ?? "");

  await page.goto(`${origin}/work/resume/`, { waitUntil: "domcontentloaded" });
  check(
    "resume links the PDF",
    (await page.locator('a[href="/media/tyler-dalton-resume.pdf"]').count()) > 0,
  );

  await page.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-theme-toggle]:visible").click();
  await page.waitForTimeout(400);
  check("theme toggles to light", await page.evaluate(() => document.documentElement.dataset.theme) === "light");
  check(
    "light theme-color",
    (await page.locator('meta[name="theme-color"]').getAttribute("content"))?.toLowerCase() === "#ecf0f1",
  );
  await page.locator("[data-theme-toggle]:visible").click();
  await page.waitForTimeout(400);
  check("theme toggles back to dark", await page.evaluate(() => document.documentElement.dataset.theme) === "dark");

  await page.keyboard.press("Control+k");
  check("palette opens from the keyboard", await page.evaluate(() => document.getElementById("command-palette")?.open === true));
  await page.keyboard.press("Escape");
  check("palette closes with Escape", await page.evaluate(() => document.getElementById("command-palette")?.open === false));

  await page.locator("#white-rabbit-btn").click();
  check("rabbit fills the palette", (await page.locator("#palette-input").inputValue()) === "wake up");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  check("matrix activates", await page.evaluate(() => document.documentElement.dataset.theme) === "matrix");
  await page.locator("#matrix-exit-btn").click();
  await page.waitForTimeout(400);
  check("matrix exit restores dark", await page.evaluate(() => document.documentElement.dataset.theme) === "dark");

  await page.keyboard.press("Control+k");
  await page.locator("#palette-input").fill("resume");
  await page.waitForTimeout(50);
  const paletteLabel = (await page.locator("#palette-results [role='option']").first().innerText()).replace(/\s+/g, " ");
  check("palette lists the resume", paletteLabel.includes("Go to resume"), paletteLabel);
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/work\/resume\/?$/);
  check("palette opens the resume", /\/work\/resume\/?$/.test(new URL(page.url()).pathname));

  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("homepage has no page overflow at 320", overflow === 0, String(overflow));
  const graphScrolls = await page.locator(".overflow-x-auto").evaluate((element) => element.scrollWidth > element.clientWidth);
  check("contribution graph scrolls inside its frame", graphScrolls);
  await page.locator("#nav-toggle").click();
  check("mobile menu opens", await page.locator("#nav-toggle").getAttribute("aria-expanded") === "true");
  await page.locator("#mobile-nav a[href='/contact']").click();
  await page.waitForURL(/\/contact\/?$/);
  check("mobile menu opens contact", /\/contact\/?$/.test(new URL(page.url()).pathname));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error(`\n${failures.length} smoke check(s) failed`);
  process.exit(1);
}
console.log("\nsmoke checks passed");
