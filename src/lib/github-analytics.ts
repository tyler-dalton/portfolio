/**
 * Pure GitHub analytics.
 *
 * The snapshot stores observations. Every displayed number is recomputed here
 * and checked against those observations. Contribution dates are GitHub's
 * profile calendar dates. Commit dates are the UTC day of commit.author.date.
 * Those clocks can disagree around midnight, so the windows stay separate.
 */

export const OWNER_LOGIN = "tyler-dalton";
export const OWNER_EMAIL = "tldalton54@gmail.com";
export const GRAPH_COMMIT_PREFIX = "chore(git contributions):";

export const METRIC_DAYS = 30;
export const SERIES_DAYS = 90;
export const MONTH_COUNT = 12;
export const RAIL_LIMIT = 12;
export const ACTIVE_REPO_LIMIT = 6;
export const LANGUAGE_LIMIT = 5;
export const REPO_LANGUAGE_LIMIT = 3;

export const ANALYTICS_TIMEZONE = "UTC";

export const ANALYTICS_SOURCE = {
  contributions: "public/github/contributions.svg",
  commits: "https://api.github.com/repos/tyler-dalton/{repo}/commits",
  languages: "https://api.github.com/repos/tyler-dalton/{repo}/languages",
};

export const ANALYTICS_SCOPE = {
  owner: OWNER_LOGIN,
  contributions:
    "GitHub profile contribution calendar in public/github/contributions.svg. Dates are the calendar dates GitHub reports. The total may include private contributions. Private repository names are not stored.",
  commits:
    `Default-branch commits on public, non-fork, non-archived repositories owned by ${OWNER_LOGIN}, excluding the profile repository. Counted when author.login is ${OWNER_LOGIN}, or when that login is absent and the git author email is ${OWNER_EMAIL}. Merges and commits whose message starts with "${GRAPH_COMMIT_PREFIX}" are omitted. The date is the UTC calendar date of commit.author.date.`,
  languages:
    "Linguist bytes for that same public repository cohort. Not a time window, and not a measure of time spent.",
};

export const ANALYTICS_UNITS = {
  contributions: "github-profile-contributions",
  commits: "authored-non-merge-commits",
  languages: "linguist-bytes",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const GENERATED_AT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const SNAPSHOT_KEYS = [
  "generatedAt",
  "lastSuccessfulRefresh",
  "timezone",
  "contributionAsOf",
  "commitAsOf",
  "source",
  "scope",
  "units",
  "windows",
  "contributionDays",
  "commits",
  "repositories",
];

export type ContributionDay = {
  date: string;
  count: number;
};

export type CommitEvent = {
  repo: string;
  date: string;
};

export type RepositoryRecord = {
  name: string;
  url: string;
  languages: Record<string, number>;
};

export type DateWindow = {
  start: string;
  end: string;
  days: number;
};

export type AnalyticsWindows = {
  metrics: DateWindow;
  weekdays: DateWindow;
  commits: DateWindow;
};

export type AnalyticsSnapshot = {
  generatedAt: string;
  lastSuccessfulRefresh: string;
  timezone: typeof ANALYTICS_TIMEZONE;
  contributionAsOf: string;
  commitAsOf: string;
  source: typeof ANALYTICS_SOURCE;
  scope: typeof ANALYTICS_SCOPE;
  units: typeof ANALYTICS_UNITS;
  windows: AnalyticsWindows;
  contributionDays: ContributionDay[];
  commits: CommitEvent[];
  repositories: RepositoryRecord[];
};

export type CommitCandidate = {
  authorLogin: string | null;
  authorEmail: string | null;
  authorDate: string | null;
  message: string | null;
  parentCount: number | null;
};

export type ActivityMetric = {
  id: "contributions" | "activeRepos" | "activeDays" | "longestStreak" | "currentStreak";
  value: number;
  label: string;
  detail: string | null;
};

export type ActivityBar = {
  id: string;
  label: string;
  shortLabel: string | null;
  value: number;
  scale: number;
};

export type LanguageShare = {
  name: string;
  bytes: number;
  percent: number;
};

export type RecentCommitDay = {
  date: string;
  label: string;
  count: number;
};

export type ActiveRepository = {
  name: string;
  url: string;
  commits: number;
  scale: number;
  languages: string[];
  lastActive: string;
  lastActiveLabel: string;
};

export type AnalyticsView = {
  generatedAt: string;
  contributionAsOf: string;
  commitAsOf: string;
  contributionFrom: string;
  contributionTo: string;
  contributionTotal: number;
  metricsWindow: DateWindow;
  weekdayWindow: DateWindow;
  commitWindow: DateWindow;
  metrics: ActivityMetric[];
  months: ActivityBar[];
  weekdays: ActivityBar[];
  languages: LanguageShare[];
  recentDays: RecentCommitDay[];
  activeRepositories: ActiveRepository[];
};

export function parseDate(value: string): Date {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error(`Invalid date: ${value}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}

export function formatISODate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
  if (!Number.isInteger(days)) throw new Error(`Day offset is not an integer: ${days}`);
  const date = parseDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return formatISODate(date);
}

/** Monday is 0. The index uses the UTC calendar date. */
export function weekdayIndex(iso: string): number {
  return (parseDate(iso).getUTCDay() + 6) % 7;
}

export function formatDay(iso: string): string {
  const date = parseDate(iso);
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function formatFull(iso: string): string {
  const date = parseDate(iso);
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function formatLastActive(iso: string, asOf: string): string {
  const day = formatDay(iso);
  return iso.slice(0, 4) === parseDate(asOf).getUTCFullYear().toString() ? day : formatFull(iso);
}

export function formatCount(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Count is not a non-negative integer: ${value}`);
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function countLabel(value: number, singular: string): string {
  const word = value === 1 ? singular : `${singular}s`;
  return `${formatCount(value)} ${word}`;
}

function word(value: number, singular: string): string {
  return value === 1 ? singular : `${singular}s`;
}

/**
 * UTC calendar day of a git timestamp.
 * Date-only values are already calendar days. Zoned timestamps convert to UTC.
 * A clock time with no zone is rejected so the machine timezone cannot move the day.
 */
export function utcDay(timestamp: string): string | null {
  if (DATE_PATTERN.test(timestamp)) {
    try {
      parseDate(timestamp);
      return timestamp;
    } catch {
      return null;
    }
  }

  const match = TIMESTAMP_PATTERN.exec(timestamp);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (hour > 23 || minute > 59 || second > 59) return null;

  const zoned = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    zoned.getUTCFullYear() !== year
    || zoned.getUTCMonth() !== month - 1
    || zoned.getUTCDate() !== day
    || zoned.getUTCHours() !== hour
    || zoned.getUTCMinutes() !== minute
    || zoned.getUTCSeconds() !== second
  ) {
    return null;
  }

  let offsetMinutes = 0;
  if (match[7] !== "Z") {
    const sign = match[7].startsWith("-") ? -1 : 1;
    offsetMinutes = sign * (Number(match[7].slice(1, 3)) * 60 + Number(match[7].slice(4, 6)));
  }

  return formatISODate(new Date(zoned.getTime() - offsetMinutes * 60_000));
}

export function qualifyingCommitDate(commit: CommitCandidate): string | null {
  const login = commit.authorLogin;
  const email = commit.authorEmail?.trim().toLowerCase() ?? null;
  const identity = login === OWNER_LOGIN || (login === null && email === OWNER_EMAIL);
  if (!identity) return null;
  if (commit.parentCount !== 1) return null;
  if (typeof commit.message !== "string" || commit.message.length === 0) return null;
  if (commit.message.startsWith(GRAPH_COMMIT_PREFIX)) return null;
  if (typeof commit.authorDate !== "string") return null;
  return utcDay(commit.authorDate);
}

export function parseContributionSvg(svg: string): ContributionDay[] {
  if (!svg.includes("<svg")) throw new Error("Contribution graph is not an SVG");

  const pattern = /<rect\b([^>]*?)(?:\/>|>([\s\S]*?)<\/rect>)/g;
  const days: ContributionDay[] = [];

  for (const match of svg.matchAll(pattern)) {
    const attributes = match[1] ?? "";
    const body = match[2] ?? "";
    const date = /data-date="(\d{4}-\d{2}-\d{2})"/.exec(attributes);
    const count = /data-count="(\d+)"/.exec(attributes);
    if (!date && !count) continue;
    if (!date || !count) throw new Error("Contribution cell is missing a date or a count");

    const value = Number(count[1]);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Contribution count for ${date[1]} is invalid`);
    }
    try {
      parseDate(date[1]);
    } catch {
      throw new Error(`Contribution cell has an invalid date ${date[1]}`);
    }

    const title = /<title>([^<]*)<\/title>/.exec(body);
    if (title) {
      const expected = `${date[1]}: ${value} ${value === 1 ? "contribution" : "contributions"}`;
      if (title[1] !== expected) throw new Error(`Contribution cell ${date[1]} disagrees with its title`);
    }

    days.push({ date: date[1], count: value });
  }

  if (days.length === 0) throw new Error("Contribution graph has no dated days");
  days.sort((left, right) => left.date.localeCompare(right.date));
  for (let index = 1; index < days.length; index += 1) {
    if (days[index].date === days[index - 1].date) {
      throw new Error(`Duplicate contribution date ${days[index].date}`);
    }
  }
  return days;
}

export function windowsFor(contributionAsOf: string, commitAsOf: string): AnalyticsWindows {
  parseDate(contributionAsOf);
  parseDate(commitAsOf);
  if (commitAsOf < contributionAsOf) {
    throw new Error("commitAsOf is earlier than the contribution calendar");
  }

  const windows = {
    metrics: {
      start: addDays(contributionAsOf, -(METRIC_DAYS - 1)),
      end: contributionAsOf,
      days: METRIC_DAYS,
    },
    weekdays: {
      start: addDays(contributionAsOf, -(SERIES_DAYS - 1)),
      end: contributionAsOf,
      days: SERIES_DAYS,
    },
    commits: {
      start: addDays(commitAsOf, -(SERIES_DAYS - 1)),
      end: commitAsOf,
      days: SERIES_DAYS,
    },
  };

  if (windows.metrics.start < windows.commits.start) {
    throw new Error("Commit window does not cover the 30-day contribution window");
  }
  return windows;
}

export function longestStreak(days: readonly ContributionDay[]): number {
  if (days.length === 0) return 0;
  const counts = countMap(days);
  const sorted = [...counts.keys()].sort();
  let best = 0;
  let run = 0;
  for (let cursor = sorted[0]; cursor <= sorted[sorted.length - 1]; cursor = addDays(cursor, 1)) {
    if ((counts.get(cursor) ?? 0) > 0) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

/**
 * Consecutive positive days ending at asOf.
 * A zero on asOf steps back exactly one day, then the run must be positive.
 * A missing day ends the run.
 */
export function currentStreak(days: readonly ContributionDay[], asOf: string): number {
  const counts = countMap(days);
  if (!counts.has(asOf)) throw new Error(`No contribution count for ${asOf}`);
  let cursor = asOf;
  if (counts.get(cursor) === 0) cursor = addDays(cursor, -1);
  let run = 0;
  while ((counts.get(cursor) ?? 0) > 0) {
    run += 1;
    cursor = addDays(cursor, -1);
  }
  return run;
}

export function languageShares(repositories: readonly RepositoryRecord[]): LanguageShare[] {
  const totals = new Map<string, number>();
  for (const repository of repositories) {
    for (const [name, bytes] of Object.entries(repository.languages)) {
      if (name.trim() !== name || name.length === 0) throw new Error("Language name is blank");
      if (!Number.isSafeInteger(bytes) || bytes < 0) throw new Error(`Language byte count for ${name} is invalid`);
      if (bytes === 0) continue;
      totals.set(name, (totals.get(name) ?? 0) + bytes);
    }
  }

  const ranked = [...totals.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  if (ranked.length === 0) return [];

  const head = ranked.slice(0, LANGUAGE_LIMIT).map(([name, bytes]) => ({ name, bytes }));
  const rest = ranked.slice(LANGUAGE_LIMIT).reduce((sum, [, bytes]) => sum + bytes, 0);
  const items = rest > 0 ? [...head, { name: "Other", bytes: rest }] : head;
  const shares = largestRemainder(items);
  const percentSum = shares.reduce((sum, share) => sum + share.percent, 0);
  if (percentSum !== 100) throw new Error(`Language percents sum to ${percentSum}`);
  return shares;
}

export function parseSnapshot(raw: unknown): AnalyticsSnapshot {
  const record = objectRecord(raw, "Analytics snapshot");
  assertExactKeys(record, SNAPSHOT_KEYS, "Analytics snapshot");

  const generatedAt = requiredString(record, "generatedAt");
  const lastSuccessfulRefresh = requiredString(record, "lastSuccessfulRefresh");
  if (!GENERATED_AT_PATTERN.test(generatedAt) || utcDay(generatedAt) === null) {
    throw new Error("generatedAt is not a UTC timestamp");
  }
  if (lastSuccessfulRefresh !== generatedAt) {
    throw new Error("lastSuccessfulRefresh must be the timestamp that wrote this snapshot");
  }
  if (record.timezone !== ANALYTICS_TIMEZONE) throw new Error("Analytics timezone must be UTC");

  sameStrings(record.source, ANALYTICS_SOURCE, "source");
  sameStrings(record.scope, ANALYTICS_SCOPE, "scope");
  sameStrings(record.units, ANALYTICS_UNITS, "units");

  const contributionAsOf = requireIsoDate(record.contributionAsOf, "contributionAsOf");
  const commitAsOf = requireIsoDate(record.commitAsOf, "commitAsOf");
  const generatedDay = utcDay(generatedAt);
  if (generatedDay === null || generatedDay < commitAsOf) {
    throw new Error("generatedAt is earlier than commitAsOf");
  }

  const windows = parseWindows(record.windows, contributionAsOf, commitAsOf);
  const contributionDays = parseContributionDays(record.contributionDays);
  if (contributionDays[contributionDays.length - 1].date !== contributionAsOf) {
    throw new Error("contributionAsOf is not the last day in the contribution calendar");
  }
  assertContiguous(contributionDays);

  const repositories = parseRepositories(record.repositories);
  const names = new Set(repositories.map((repository) => repository.name));
  const commits = parseCommits(record.commits, names, windows.commits);

  return {
    generatedAt,
    lastSuccessfulRefresh,
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
}

export function buildView(snapshot: AnalyticsSnapshot): AnalyticsView {
  const counts = countMap(snapshot.contributionDays);
  const total = snapshot.contributionDays.reduce((sum, day) => sum + day.count, 0);
  requireRange(counts, snapshot.windows.metrics.start, snapshot.windows.metrics.end, "30-day contribution window");
  requireRange(counts, snapshot.windows.weekdays.start, snapshot.windows.weekdays.end, "90-day contribution window");

  const metricsEnd = snapshot.contributionAsOf;
  let contributions = 0;
  let activeDays = 0;
  for (let cursor = snapshot.windows.metrics.start; cursor <= metricsEnd; cursor = addDays(cursor, 1)) {
    const count = counts.get(cursor) ?? 0;
    contributions += count;
    if (count > 0) activeDays += 1;
  }

  const repoNamesInMetrics = new Set(
    snapshot.commits
      .filter((commit) => commit.date >= snapshot.windows.metrics.start && commit.date <= metricsEnd)
      .map((commit) => commit.repo),
  );

  const longest = longestStreak(snapshot.contributionDays);
  const current = currentStreak(snapshot.contributionDays, metricsEnd);
  const months = monthBars(counts, metricsEnd);
  const weekdays = weekdayBars(counts, snapshot.windows.weekdays);
  const languages = languageShares(snapshot.repositories);
  const recentDays = recentCommitDays(snapshot.commits);
  const activeRepositories = activeRepositoryRows(snapshot);

  return {
    generatedAt: snapshot.generatedAt,
    contributionAsOf: snapshot.contributionAsOf,
    commitAsOf: snapshot.commitAsOf,
    contributionFrom: snapshot.contributionDays[0].date,
    contributionTo: snapshot.contributionAsOf,
    contributionTotal: total,
    metricsWindow: snapshot.windows.metrics,
    weekdayWindow: snapshot.windows.weekdays,
    commitWindow: snapshot.windows.commits,
    metrics: [
      { id: "contributions", value: contributions, label: word(contributions, "contribution"), detail: null },
      { id: "activeRepos", value: repoNamesInMetrics.size, label: word(repoNamesInMetrics.size, "active repo"), detail: null },
      { id: "activeDays", value: activeDays, label: word(activeDays, "active day"), detail: null },
      { id: "longestStreak", value: longest, label: "longest streak", detail: "on this graph" },
      { id: "currentStreak", value: current, label: "current streak", detail: "on this graph" },
    ],
    months,
    weekdays,
    languages,
    recentDays,
    activeRepositories,
  };
}

function monthBars(counts: Map<string, number>, asOf: string): ActivityBar[] {
  const asOfDate = parseDate(asOf);
  const endIndex = asOfDate.getUTCFullYear() * 12 + asOfDate.getUTCMonth();
  const bars: ActivityBar[] = [];

  for (let offset = MONTH_COUNT - 1; offset >= 0; offset -= 1) {
    const index = endIndex - offset;
    const year = Math.floor(index / 12);
    const month = index % 12;
    const start = formatISODate(new Date(Date.UTC(year, month, 1)));
    const monthEnd = formatISODate(new Date(Date.UTC(year, month + 1, 0)));
    const end = monthEnd < asOf ? monthEnd : asOf;
    requireRange(counts, start, end, `${MONTH_NAMES[month]} ${year}`);

    let value = 0;
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) value += counts.get(cursor) ?? 0;
    bars.push({
      id: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: `${MONTH_NAMES[month]} ${year}`,
      shortLabel: `${MONTH_NAMES[month]} '${String(year).slice(2)}`,
      value,
      scale: 0,
    });
  }

  applyScale(bars);
  return bars;
}

function weekdayBars(counts: Map<string, number>, window: DateWindow): ActivityBar[] {
  const values = [0, 0, 0, 0, 0, 0, 0];
  for (let cursor = window.start; cursor <= window.end; cursor = addDays(cursor, 1)) {
    values[weekdayIndex(cursor)] += counts.get(cursor) ?? 0;
  }
  const bars = WEEKDAY_LABELS.map((label, index) => ({
    id: label.toLowerCase(),
    label,
    shortLabel: null,
    value: values[index],
    scale: 0,
  }));
  applyScale(bars);
  return bars;
}

function recentCommitDays(commits: readonly CommitEvent[]): RecentCommitDay[] {
  const byDate = new Map<string, number>();
  for (const commit of commits) byDate.set(commit.date, (byDate.get(commit.date) ?? 0) + 1);
  return [...byDate.entries()]
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[0].localeCompare(left[0]))
    .slice(0, RAIL_LIMIT)
    .map(([date, count]) => ({ date, label: formatDay(date), count }));
}

function activeRepositoryRows(snapshot: AnalyticsSnapshot): ActiveRepository[] {
  const byName = new Map(snapshot.repositories.map((repository) => [repository.name, repository]));
  const rows = new Map<string, { commits: number; lastActive: string }>();

  for (const commit of snapshot.commits) {
    const current = rows.get(commit.repo) ?? { commits: 0, lastActive: commit.date };
    current.commits += 1;
    if (commit.date > current.lastActive) current.lastActive = commit.date;
    rows.set(commit.repo, current);
  }

  const ranked = [...rows.entries()]
    .filter(([, row]) => row.commits > 0)
    .sort((left, right) => right[1].commits - left[1].commits || right[1].lastActive.localeCompare(left[1].lastActive) || left[0].localeCompare(right[0]))
    .slice(0, ACTIVE_REPO_LIMIT);

  const max = ranked.reduce((best, [, row]) => Math.max(best, row.commits), 0);
  return ranked.map(([name, row]) => {
    const repository = byName.get(name);
    if (!repository) throw new Error(`Commit refers to an unknown repository ${name}`);
    return {
      name,
      url: repository.url,
      commits: row.commits,
      scale: percentOfMax(row.commits, max),
      languages: topLanguages(repository.languages),
      lastActive: row.lastActive,
      lastActiveLabel: formatLastActive(row.lastActive, snapshot.commitAsOf),
    };
  });
}

function topLanguages(languages: Record<string, number>): string[] {
  return Object.entries(languages)
    .filter(([, bytes]) => bytes > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, REPO_LANGUAGE_LIMIT)
    .map(([name]) => name);
}

function largestRemainder(items: { name: string; bytes: number }[]): LanguageShare[] {
  const total = items.reduce((sum, item) => sum + item.bytes, 0);
  if (total <= 0) return [];

  const rows = items.map((item, index) => {
    const product = item.bytes * 100;
    return {
      name: item.name,
      bytes: item.bytes,
      index,
      percent: Math.floor(product / total),
      remainder: product % total,
    };
  });

  let deficit = 100 - rows.reduce((sum, row) => sum + row.percent, 0);
  if (deficit < 0 || deficit > rows.length) throw new Error(`Language percent remainder is ${deficit}`);
  const ranked = [...rows].sort((left, right) => (
    right.remainder - left.remainder
    || right.bytes - left.bytes
    || left.name.localeCompare(right.name)
    || left.index - right.index
  ));
  for (let index = 0; index < deficit; index += 1) ranked[index].percent += 1;
  return rows.map(({ name, bytes, percent }) => ({ name, bytes, percent }));
}

function applyScale(bars: ActivityBar[]): void {
  const max = bars.reduce((best, bar) => Math.max(best, bar.value), 0);
  for (const bar of bars) bar.scale = percentOfMax(bar.value, max);
}

function percentOfMax(value: number, max: number): number {
  if (max <= 0) return 0;
  const scale = (value / max) * 100;
  if (scale < 0 || scale > 100) throw new Error(`Bar scale ${scale} is outside 0–100`);
  return scale;
}

function countMap(days: readonly ContributionDay[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const day of days) {
    if (counts.has(day.date)) throw new Error(`Duplicate contribution date ${day.date}`);
    if (!Number.isSafeInteger(day.count) || day.count < 0) {
      throw new Error(`Contribution count for ${day.date} is invalid`);
    }
    parseDate(day.date);
    counts.set(day.date, day.count);
  }
  return counts;
}

function requireRange(counts: Map<string, number>, start: string, end: string, label: string): void {
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    if (!counts.has(cursor)) throw new Error(`${label} is missing ${cursor}`);
  }
}

function assertContiguous(days: readonly ContributionDay[]): void {
  for (let index = 1; index < days.length; index += 1) {
    const expected = addDays(days[index - 1].date, 1);
    if (days[index].date !== expected) {
      throw new Error(`Contribution calendar jumps from ${days[index - 1].date} to ${days[index].date}`);
    }
  }
}

function parseWindows(raw: unknown, contributionAsOf: string, commitAsOf: string): AnalyticsWindows {
  const record = objectRecord(raw, "windows");
  assertExactKeys(record, ["metrics", "weekdays", "commits"], "windows");
  const expected = windowsFor(contributionAsOf, commitAsOf);
  for (const key of ["metrics", "weekdays", "commits"] as const) {
    const window = objectRecord(record[key], key);
    assertExactKeys(window, ["start", "end", "days"], key);
    if (window.start !== expected[key].start || window.end !== expected[key].end || window.days !== expected[key].days) {
      throw new Error(`${key} window does not match ${contributionAsOf} and ${commitAsOf}`);
    }
  }
  return expected;
}

function parseContributionDays(raw: unknown): ContributionDay[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("contributionDays must list at least one day");
  const days = raw.map((item, index) => {
    const record = objectRecord(item, `contributionDays[${index}]`);
    assertExactKeys(record, ["date", "count"], `contributionDays[${index}]`);
    const date = requireIsoDate(record.date, `contributionDays[${index}].date`);
    if (!Number.isSafeInteger(record.count) || (record.count as number) < 0) {
      throw new Error(`contributionDays[${index}].count is invalid`);
    }
    return { date, count: record.count as number };
  });
  days.sort((left, right) => left.date.localeCompare(right.date));
  for (let index = 1; index < days.length; index += 1) {
    if (days[index].date === days[index - 1].date) {
      throw new Error(`Duplicate contribution date ${days[index].date}`);
    }
  }
  return days;
}

function parseRepositories(raw: unknown): RepositoryRecord[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("repositories must list the public cohort");
  const repositories = raw.map((item, index) => {
    const record = objectRecord(item, `repositories[${index}]`);
    assertExactKeys(record, ["name", "url", "languages"], `repositories[${index}]`);
    const name = requiredString(record, "name");
    const url = requiredString(record, "url");
    if (!/^[A-Za-z0-9._-]+$/.test(name) || name === OWNER_LOGIN) {
      throw new Error(`Repository name ${name} is outside the public cohort`);
    }
    if (url !== `https://github.com/${OWNER_LOGIN}/${name}`) {
      throw new Error(`Repository URL for ${name} is outside the public cohort`);
    }
    const languages = objectRecord(record.languages, `${name} languages`);
    const parsed: Record<string, number> = {};
    for (const [language, bytes] of Object.entries(languages)) {
      if (language.trim() !== language || language.length === 0) throw new Error(`Language name on ${name} is blank`);
      if (!Number.isSafeInteger(bytes) || bytes < 0) throw new Error(`Language byte count for ${language} is invalid`);
      parsed[language] = bytes;
    }
    return { name, url, languages: parsed };
  });

  repositories.sort((left, right) => left.name.localeCompare(right.name));
  for (let index = 1; index < repositories.length; index += 1) {
    if (repositories[index].name === repositories[index - 1].name) {
      throw new Error(`Duplicate repository ${repositories[index].name}`);
    }
  }
  return repositories;
}

function parseCommits(raw: unknown, names: Set<string>, window: DateWindow): CommitEvent[] {
  if (!Array.isArray(raw)) throw new Error("commits must be a list");
  const commits = raw.map((item, index) => {
    const record = objectRecord(item, `commits[${index}]`);
    assertExactKeys(record, ["repo", "date"], `commits[${index}]`);
    const repo = requiredString(record, "repo");
    const date = requireIsoDate(record.date, `commits[${index}].date`);
    if (!names.has(repo)) throw new Error(`Commit refers to an unknown repository ${repo}`);
    if (date < window.start || date > window.end) {
      throw new Error(`Commit ${repo} ${date} is outside the commit window`);
    }
    return { repo, date };
  });
  commits.sort((left, right) => left.date.localeCompare(right.date) || left.repo.localeCompare(right.repo));
  return commits;
}

function objectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} is missing`);
  return value as Record<string, unknown>;
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "" || value !== value.trim()) {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value;
}

function requireIsoDate(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} must be a date`);
  parseDate(value);
  return value;
}

function assertExactKeys(record: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} keys do not match the analytics contract`);
  }
}

function sameStrings(value: unknown, expected: Record<string, string>, label: string): void {
  const record = objectRecord(value, label);
  assertExactKeys(record, Object.keys(expected), label);
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (record[key] !== expectedValue) throw new Error(`${label}.${key} does not match the analytics contract`);
  }
}
