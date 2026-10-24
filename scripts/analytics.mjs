import { readFile, rename, unlink, writeFile } from "node:fs/promises";

import { selectPublicRepos } from "../src/lib/github-repos.ts";
import {
  ANALYTICS_SCOPE,
  ANALYTICS_SOURCE,
  ANALYTICS_TIMEZONE,
  ANALYTICS_UNITS,
  addDays,
  buildView,
  parseContributionSvg,
  parseSnapshot,
  qualifyingCommitDate,
  windowsFor,
} from "../src/lib/github-analytics.ts";

const USER = "tyler-dalton";
const SVG_PATH = new URL("../public/github/contributions.svg", import.meta.url);
const OUTPUT_PATH = new URL("../src/data/github-analytics.json", import.meta.url);
const TEMP_PATH = new URL("../src/data/github-analytics.json.tmp", import.meta.url);
const PAGE_CAP = 10;

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "tylerdalton-portfolio",
  "X-GitHub-Api-Version": "2022-11-28",
};

if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;

const svg = await readFile(SVG_PATH, "utf8");
const contributionDays = parseContributionSvg(svg);
const contributionAsOf = contributionDays.at(-1).date;
const commitAsOf = new Date().toISOString().slice(0, 10);
const windows = windowsFor(contributionAsOf, commitAsOf);

const remaining = await coreRemaining();
const repositoryPayload = await githubJson("https://api.github.com/users/tyler-dalton/repos?per_page=100&sort=pushed");
if (repositoryPayload.next) throw new Error("Repository list exceeded 100. Refusing a partial cohort.");
const selected = selectPublicRepos(repositoryPayload.body).sort((left, right) => left.name.localeCompare(right.name));
if (selected.length === 0) throw new Error("GitHub returned no public repositories after filtering.");

const needed = 1 + selected.length * 2;
if (remaining < needed) {
  throw new Error(`GitHub core rate limit has ${remaining} requests left; this refresh needs ${needed}.`);
}

const commits = [];
const repositories = [];

for (const repository of selected) {
  const events = await listCommits(repository.name, windows.commits.start, commitAsOf);
  for (const event of events) {
    const date = qualifyingCommitDate(event);
    if (!date || date < windows.commits.start || date > windows.commits.end) continue;
    commits.push({ repo: repository.name, date });
  }
  repositories.push({
    name: repository.name,
    url: repository.url,
    languages: sortRecord(await listLanguages(repository.name)),
  });
}

commits.sort((left, right) => left.date.localeCompare(right.date) || left.repo.localeCompare(right.repo));
repositories.sort((left, right) => left.name.localeCompare(right.name));

const generatedAt = new Date().toISOString();
const snapshot = {
  generatedAt,
  lastSuccessfulRefresh: generatedAt,
  timezone: ANALYTICS_TIMEZONE,
  contributionAsOf,
  commitAsOf,
  source: ANALYTICS_SOURCE,
  scope: ANALYTICS_SCOPE,
  units: ANALYTICS_UNITS,
  windows,
  contributionDays,
  commits,
  repositories,
};

const view = buildView(parseSnapshot(snapshot));
const daySum = contributionDays.reduce((sum, day) => sum + day.count, 0);
if (view.contributionTotal !== daySum) {
  throw new Error(`Recomputed contribution total ${view.contributionTotal} does not match the graph sum ${daySum}.`);
}

const json = `${JSON.stringify(snapshot, null, 2)}\n`;
let wrote = false;
try {
  await writeFile(TEMP_PATH, json);
  const reread = parseSnapshot(JSON.parse(await readFile(TEMP_PATH, "utf8")));
  const checked = buildView(reread);
  if (checked.contributionTotal !== daySum) throw new Error("Reread snapshot does not match the contribution graph.");
  await rename(TEMP_PATH, OUTPUT_PATH);
  wrote = true;
} finally {
  if (!wrote) await unlink(TEMP_PATH).catch(() => {});
}

console.log(`analytics: ${contributionDays.length} contribution days through ${contributionAsOf}, total ${view.contributionTotal}`);
console.log(`analytics: ${repositories.length} public repositories, ${commits.length} qualifying commits through ${commitAsOf}`);
console.log(`analytics: 30-day contributions ${view.metrics[0].value}, active repos ${view.metrics[1].value}, active days ${view.metrics[2].value}, longest streak ${view.metrics[3].value}, current streak ${view.metrics[4].value}`);

async function coreRemaining() {
  const response = await request("https://api.github.com/rate_limit");
  if (!response.ok) throw new Error(`GitHub rate limit check failed: ${response.status}`);
  const body = await response.json();
  const remaining = body?.resources?.core?.remaining;
  if (!Number.isInteger(remaining)) throw new Error("GitHub rate limit response had no core remaining count.");
  return remaining;
}

async function listCommits(name, since, untilDate) {
  let url = `https://api.github.com/repos/${USER}/${name}/commits?author=${encodeURIComponent(USER)}&since=${since}T00:00:00Z&until=${addDays(untilDate, 1)}T00:00:00Z&per_page=100`;
  const events = [];

  for (let page = 1; page <= PAGE_CAP; page += 1) {
    const { body, next, status } = await githubJson(url, { emptyOnConflict: true });
    if (status === 409) return [];
    if (!Array.isArray(body)) throw new Error(`${name} commits response was not a list.`);
    for (const item of body) events.push(toCandidate(item));
    if (!next) return events;
    if (page === PAGE_CAP) throw new Error(`${name} commits were truncated after ${PAGE_CAP} pages. Refusing a low count.`);
    url = next;
  }

  throw new Error(`${name} commits were truncated.`);
}

async function listLanguages(name) {
  const { body } = await githubJson(`https://api.github.com/repos/${USER}/${name}/languages`);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error(`${name} languages response was not an object.`);
  }
  const languages = {};
  for (const [language, bytes] of Object.entries(body)) {
    if (!Number.isInteger(bytes) || bytes < 0) throw new Error(`${name} has a non-integer byte count for ${language}.`);
    languages[language] = bytes;
  }
  return languages;
}

function toCandidate(item) {
  if (!item || typeof item !== "object") {
    return { authorLogin: null, authorEmail: null, authorDate: null, message: null, parentCount: null };
  }
  const author = item.author;
  const commit = item.commit;
  const gitAuthor = commit && typeof commit === "object" ? commit.author : null;
  return {
    authorLogin: author && typeof author.login === "string" ? author.login : null,
    authorEmail: gitAuthor && typeof gitAuthor.email === "string" ? gitAuthor.email : null,
    authorDate: gitAuthor && typeof gitAuthor.date === "string" ? gitAuthor.date : null,
    message: commit && typeof commit.message === "string" ? commit.message : null,
    parentCount: Array.isArray(item.parents) ? item.parents.length : null,
  };
}

async function githubJson(url, options = {}) {
  const response = await request(url);
  if (options.emptyOnConflict && response.status === 409) return { body: [], next: null, status: 409 };
  if (!response.ok) {
    const budget = response.headers.get("x-ratelimit-remaining");
    throw new Error(`GitHub ${response.status} for ${pathOf(url)}${budget === null ? "" : `, remaining ${budget}`}`);
  }
  return { body: await response.json(), next: nextLink(response.headers.get("link")), status: response.status };
}

async function request(url) {
  return fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
}

function nextLink(header) {
  if (!header) return null;
  for (const part of header.split(",")) {
    const match = /<([^>]+)>;\s*rel="next"/.exec(part);
    if (match) return match[1];
  }
  return null;
}

function pathOf(url) {
  return new URL(url).pathname;
}

function sortRecord(record) {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
}
