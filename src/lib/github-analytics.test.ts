import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  ACTIVE_REPO_LIMIT,
  addDays,
  buildView,
  countLabel,
  currentStreak,
  formatCount,
  formatDay,
  formatFull,
  formatLastActive,
  languageShares,
  longestStreak,
  OWNER_EMAIL,
  OWNER_LOGIN,
  ANALYTICS_SCOPE,
  ANALYTICS_SOURCE,
  ANALYTICS_TIMEZONE,
  ANALYTICS_UNITS,
  parseContributionSvg,
  parseSnapshot,
  qualifyingCommitDate,
  RAIL_LIMIT,
  type AnalyticsSnapshot,
  type CommitCandidate,
  type ContributionDay,
  type RepositoryRecord,
  weekdayIndex,
  windowsFor,
} from "./github-analytics.ts";

const AS_OF = "2026-10-23";

function repository(name: string, languages: Record<string, number> = {}): RepositoryRecord {
  return { name, url: `https://github.com/tyler-dalton/${name}`, languages };
}

function calendar(asOf: string, length: number, counts: (date: string) => number = () => 0): ContributionDay[] {
  const start = addDays(asOf, -(length - 1));
  return Array.from({ length }, (_, index) => {
    const date = addDays(start, index);
    return { date, count: counts(date) };
  });
}

function snapshot(options: {
  asOf?: string;
  commitAsOf?: string;
  length?: number;
  counts?: (date: string) => number;
  commits?: AnalyticsSnapshot["commits"];
  repositories?: RepositoryRecord[];
  generatedAt?: string;
} = {}): AnalyticsSnapshot {
  const contributionAsOf = options.asOf ?? AS_OF;
  const commitAsOf = options.commitAsOf ?? contributionAsOf;
  const generatedAt = options.generatedAt ?? `${commitAsOf}T12:00:00.000Z`;
  const parsed = parseSnapshot({
    generatedAt,
    lastSuccessfulRefresh: generatedAt,
    timezone: ANALYTICS_TIMEZONE,
    contributionAsOf,
    commitAsOf,
    source: ANALYTICS_SOURCE,
    scope: ANALYTICS_SCOPE,
    units: ANALYTICS_UNITS,
    windows: windowsFor(contributionAsOf, commitAsOf),
    contributionDays: calendar(contributionAsOf, options.length ?? 400, options.counts),
    commits: options.commits ?? [],
    repositories: options.repositories ?? [repository("portfolio", { TypeScript: 80, CSS: 20 })],
  });
  return parsed;
}

function candidate(overrides: Partial<CommitCandidate> = {}): CommitCandidate {
  return {
    authorLogin: OWNER_LOGIN,
    authorEmail: OWNER_EMAIL,
    authorDate: "2026-10-24T03:25:39Z",
    message: "Record the analytics snapshot",
    parentCount: 1,
    ...overrides,
  };
}

describe("dates", () => {
  it("crosses leap day and month ends", () => {
    assert.equal(addDays("2024-02-28", 1), "2024-02-29");
    assert.equal(addDays("2024-02-29", 1), "2024-03-01");
    assert.equal(addDays("2024-03-01", -1), "2024-02-29");
    assert.equal(addDays("2025-02-28", 1), "2025-03-01");
    assert.equal(addDays("2026-01-01", -1), "2025-12-31");
    assert.equal(addDays("2026-10-23", -29), "2026-09-24");
    assert.throws(() => addDays("2026-02-31", 1), /Invalid date/);
  });

  it("treats Monday as weekday 0", () => {
    assert.equal(weekdayIndex("2024-01-01"), 0);
    assert.equal(weekdayIndex("2024-01-07"), 6);
  });

  it("formats calendar days without a locale-dependent space", () => {
    assert.equal(formatDay("2026-10-23"), "Oct 23");
    assert.equal(formatFull("2026-10-23"), "Oct 23, 2026");
    assert.equal(formatLastActive("2026-10-20", "2026-10-24"), "Oct 20");
    assert.equal(formatLastActive("2025-12-01", "2026-10-24"), "Dec 1, 2025");
    assert.equal(formatCount(1031), "1,031");
    assert.equal(countLabel(1, "contribution"), "1 contribution");
    assert.equal(countLabel(2, "active repo"), "2 active repos");
  });
});

describe("qualifying commits", () => {
  it("keeps an authored non-merge commit and converts zoned timestamps to the UTC day", () => {
    assert.equal(qualifyingCommitDate(candidate()), "2026-10-24");
    assert.equal(qualifyingCommitDate(candidate({ authorDate: "2026-10-23T20:00:00-07:00" })), "2026-10-24");
    assert.equal(qualifyingCommitDate(candidate({ authorLogin: null })), "2026-10-24");
    assert.equal(qualifyingCommitDate(candidate({ authorLogin: null, authorEmail: "  TLDalton54@gmail.com " })), "2026-10-24");
    assert.equal(qualifyingCommitDate(candidate({ authorEmail: "other@example.com" })), "2026-10-24");
  });

  it("drops merges, bots, graph chores, and incomplete records", () => {
    assert.equal(qualifyingCommitDate(candidate({ parentCount: 2, message: "Merge pull request #53 from tyler-dalton/docs" })), null);
    assert.equal(qualifyingCommitDate(candidate({ parentCount: 0 })), null);
    assert.equal(qualifyingCommitDate(candidate({ parentCount: null })), null);
    assert.equal(qualifyingCommitDate(candidate({ authorLogin: "dependabot[bot]", authorEmail: OWNER_EMAIL })), null);
    assert.equal(qualifyingCommitDate(candidate({ authorLogin: "someone-else", authorEmail: OWNER_EMAIL })), null);
    assert.equal(qualifyingCommitDate(candidate({ authorLogin: null, authorEmail: "other@example.com" })), null);
    assert.equal(qualifyingCommitDate(candidate({ message: "chore(git contributions): update contribution graph svg" })), null);
    assert.equal(qualifyingCommitDate(candidate({ message: "" })), null);
    assert.equal(qualifyingCommitDate(candidate({ message: null })), null);
    assert.equal(qualifyingCommitDate(candidate({ authorDate: null })), null);
    assert.equal(qualifyingCommitDate(candidate({ authorDate: "2026-02-31T00:00:00Z" })), null);
    assert.equal(qualifyingCommitDate(candidate({ authorDate: "2026-10-24T03:25:39" })), null);
  });
});

describe("streaks", () => {
  it("returns zero for an empty or all-zero calendar", () => {
    assert.equal(longestStreak([]), 0);
    assert.equal(longestStreak([{ date: "2026-10-23", count: 0 }]), 0);
    assert.equal(currentStreak([{ date: "2026-10-22", count: 0 }, { date: "2026-10-23", count: 0 }], "2026-10-23"), 0);
  });

  it("steps back one zero day, then counts the positive run", () => {
    const days = [
      { date: "2026-10-21", count: 1 },
      { date: "2026-10-22", count: 4 },
      { date: "2026-10-23", count: 0 },
    ];
    assert.equal(currentStreak(days, "2026-10-23"), 2);
    assert.equal(longestStreak(days), 2);
  });

  it("includes asOf when that day is positive", () => {
    const days = [
      { date: "2026-10-22", count: 0 },
      { date: "2026-10-23", count: 3 },
    ];
    assert.equal(currentStreak(days, "2026-10-23"), 1);
  });

  it("breaks a run on a missing day", () => {
    const days = [
      { date: "2026-10-20", count: 1 },
      { date: "2026-10-22", count: 1 },
      { date: "2026-10-23", count: 1 },
    ];
    assert.equal(longestStreak(days), 2);
    assert.equal(currentStreak(days, "2026-10-23"), 2);
    assert.throws(() => currentStreak(days, "2026-10-24"), /No contribution count/);
  });
});

describe("series", () => {
  it("labels twelve months across January and keeps a partial October inside the calendar", () => {
    const view = buildView(snapshot({
      asOf: "2026-01-15",
      counts: (date) => {
        if (date === "2026-01-15") return 4;
        if (date === "2025-12-31") return 2;
        if (date === "2025-02-01") return 7;
        return 0;
      },
    }));

    assert.equal(view.months.length, 12);
    assert.equal(view.months[0].label, "Feb 2025");
    assert.equal(view.months[0].shortLabel, "Feb '25");
    assert.equal(view.months[0].value, 7);
    assert.equal(view.months.at(-2)?.label, "Dec 2025");
    assert.equal(view.months.at(-2)?.value, 2);
    assert.equal(view.months.at(-1)?.label, "Jan 2026");
    assert.equal(view.months.at(-1)?.shortLabel, "Jan '26");
    assert.equal(view.months.at(-1)?.value, 4);
    assert.equal(view.months.at(-1)?.scale, (4 / 7) * 100);
    assert.equal(view.months[0].scale, 100);
  });

  it("puts February 29 in February", () => {
    const view = buildView(snapshot({
      asOf: "2024-03-01",
      counts: (date) => (date === "2024-02-29" ? 5 : date === "2024-03-01" ? 1 : 0),
    }));
    const february = view.months.find((month) => month.id === "2024-02");
    const march = view.months.find((month) => month.id === "2024-03");
    assert.equal(february?.value, 5);
    assert.equal(march?.value, 1);
  });

  it("sums weekdays on a Monday index inside the trailing 90 days", () => {
    let monday = addDays(AS_OF, -1);
    while (weekdayIndex(monday) !== 0) monday = addDays(monday, -1);
    const tuesday = addDays(monday, 1);
    assert.ok(tuesday <= AS_OF);

    const view = buildView(snapshot({
      counts: (date) => {
        if (date === monday) return 4;
        if (date === tuesday) return 1;
        return 0;
      },
    }));

    assert.deepEqual(view.weekdays.map((day) => day.label), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    assert.equal(view.weekdays[0].value, 4);
    assert.equal(view.weekdays[1].value, 1);
    assert.equal(view.weekdays[0].scale, 100);
    assert.equal(view.weekdays[1].scale, 25);
    assert.ok(view.weekdays.slice(2).every((day) => day.value === 0 && day.scale === 0));
  });

  it("draws an empty track when every value is zero", () => {
    const view = buildView(snapshot());
    assert.ok(view.months.every((month) => month.value === 0 && month.scale === 0));
    assert.ok(view.weekdays.every((day) => day.value === 0 && day.scale === 0));
  });

  it("refuses a calendar that does not cover the charts", () => {
    assert.throws(() => buildView(snapshot({ asOf: "2026-01-15", length: 40 })), /missing/);
  });
});

describe("windows and aggregates", () => {
  it("keeps the 30-day group on the contribution calendar and commits on their own window", () => {
    const metricsStart = addDays(AS_OF, -29);
    const before = addDays(metricsStart, -1);
    const view = buildView(snapshot({
      commitAsOf: "2026-10-24",
      counts: (date) => {
        if (date === metricsStart) return 2;
        if (date === AS_OF) return 3;
        if (date === before) return 9;
        return 0;
      },
      commits: [
        { repo: "portfolio", date: metricsStart },
        { repo: "portfolio", date: metricsStart },
        { repo: "dotfiles", date: "2026-10-24" },
        { repo: "homelab-infra", date: before },
      ],
      repositories: [
        repository("portfolio", { TypeScript: 50 }),
        repository("dotfiles", { Shell: 50 }),
        repository("homelab-infra"),
        repository("deployment-bags", { Python: 25 }),
      ],
    }));

    assert.equal(view.metricsWindow.start, "2026-09-24");
    assert.equal(view.metricsWindow.end, AS_OF);
    assert.equal(view.metrics[0].value, 5);
    assert.equal(view.metrics[0].label, "contributions");
    assert.equal(view.metrics[1].value, 1);
    assert.equal(view.metrics[1].label, "active repo");
    assert.equal(view.metrics[2].value, 2);
    assert.equal(view.metrics[2].label, "active days");
    assert.equal(view.metrics[3].detail, "on this graph");
    assert.equal(view.metrics[4].detail, "on this graph");
    assert.ok(view.metrics[3].value >= view.metrics[4].value);

    assert.deepEqual(view.activeRepositories.map((row) => [row.name, row.commits, row.scale, row.lastActive, row.languages]), [
      ["portfolio", 2, 100, metricsStart, ["TypeScript"]],
      ["dotfiles", 1, 50, "2026-10-24", ["Shell"]],
      ["homelab-infra", 1, 50, before, []],
    ]);
    assert.equal(view.activeRepositories[1].lastActiveLabel, "Oct 24");
    assert.deepEqual(view.recentDays.map((day) => [day.date, day.count]), [
      ["2026-10-24", 1],
      [metricsStart, 2],
      [before, 1],
    ]);

    assert.deepEqual(view.languages.map((language) => [language.name, language.percent]), [
      ["Shell", 40],
      ["TypeScript", 40],
      ["Python", 20],
    ]);
  });

  it("limits the rail and the repository comparison", () => {
    const commits = Array.from({ length: RAIL_LIMIT + 2 }, (_, index) => ({
      repo: "portfolio",
      date: addDays(AS_OF, -index),
    }));
    const repositories = Array.from({ length: ACTIVE_REPO_LIMIT + 1 }, (_, index) => repository(`repo-${index}`));
    const crowded = repositories.map((item, index) => ({ repo: item.name, date: addDays(AS_OF, -index) }));
    const view = buildView(snapshot({
      commits: [...commits, ...crowded],
      repositories: [repository("portfolio"), ...repositories],
    }));

    assert.equal(view.recentDays.length, RAIL_LIMIT);
    assert.equal(view.recentDays[0].date, AS_OF);
    assert.equal(view.recentDays.at(-1)?.date, addDays(AS_OF, -(RAIL_LIMIT - 1)));
    assert.equal(view.activeRepositories.length, ACTIVE_REPO_LIMIT);
    assert.equal(view.activeRepositories[0].commits >= view.activeRepositories.at(-1)!.commits, true);
  });

  it("rounds language shares to integers that sum to 100 and parks the tail in Other", () => {
    const tied = languageShares([repository("portfolio", { A: 1, B: 1, C: 1 })]);
    assert.deepEqual(tied.map((language) => [language.name, language.percent]), [
      ["A", 34],
      ["B", 33],
      ["C", 33],
    ]);

    const tail = languageShares([repository("portfolio", { A: 1, B: 10, C: 10, D: 10, E: 10, F: 10 })]);
    assert.equal(tail.at(-1)?.name, "Other");
    assert.equal(tail.at(-1)?.bytes, 1);
    assert.equal(tail.reduce((sum, language) => sum + language.percent, 0), 100);
    assert.deepEqual(languageShares([repository("portfolio")]), []);
  });

  it("rejects a hand-edited window or a prebaked total", () => {
    const base = snapshot();
    assert.throws(() => parseSnapshot({ ...base, windows: { ...base.windows, metrics: { ...base.windows.metrics, days: 7 } } }), /metrics window/);
    assert.throws(() => parseSnapshot({ ...base, totals: { contributions: 1 } }), /keys/);
    assert.throws(() => parseSnapshot({
      ...base,
      contributionDays: base.contributionDays.slice(0, -2),
    }), /contributionAsOf/);
  });

  it("rejects commits outside the queried window and repositories outside the cohort", () => {
    assert.throws(() => snapshot({
      commits: [{ repo: "portfolio", date: "2020-01-01" }],
    }), /outside the commit window/);
    assert.throws(() => snapshot({
      repositories: [repository("tyler-dalton")],
    }), /outside the public cohort/);
    assert.throws(() => snapshot({
      commits: [{ repo: "missing", date: AS_OF }],
    }), /unknown repository/);
  });
});

describe("contribution svg", () => {
  it("reads multiline attributes and ignores the legend", () => {
    const svg = `
      <svg>
        <rect fill="#405467" data-date="2026-10-22" data-count="0">
          <title>2026-10-22: 0 contributions</title>
        </rect>
        <rect
          fill="#3dc8f5"
          data-date="2026-10-23"
          data-count="1"
        >
          <title>2026-10-23: 1 contribution</title>
        </rect>
        <rect fill="#405467" />
      </svg>`;
    assert.deepEqual(parseContributionSvg(svg), [
      { date: "2026-10-22", count: 0 },
      { date: "2026-10-23", count: 1 },
    ]);
  });

  it("refuses a cell whose title disagrees with its count", () => {
    const svg = `
      <svg>
        <rect data-date="2026-10-23" data-count="2">
          <title>2026-10-23: 1 contribution</title>
        </rect>
      </svg>`;
    assert.throws(() => parseContributionSvg(svg), /disagrees/);
  });
});

describe("committed snapshot", () => {
  const root = new URL("../../", import.meta.url);
  const snapshotFile = new URL("src/data/github-analytics.json", root);
  const svgFile = new URL("public/github/contributions.svg", root);

  it("matches the contribution graph and recomputes every displayed total", () => {
    const raw = JSON.parse(readFileSync(snapshotFile, "utf8")) as unknown;
    const parsed = parseSnapshot(raw);
    const svgDays = parseContributionSvg(readFileSync(svgFile, "utf8"));
    assert.deepEqual(parsed.contributionDays, svgDays);

    const view = buildView(parsed);
    const daySum = parsed.contributionDays.reduce((sum, day) => sum + day.count, 0);
    assert.equal(view.contributionTotal, daySum);
    assert.equal(view.contributionFrom, svgDays[0].date);
    assert.equal(view.contributionTo, svgDays.at(-1)?.date);
    assert.equal(view.metrics[3].value >= view.metrics[4].value, true);

    const metricSum = parsed.contributionDays
      .filter((day) => day.date >= view.metricsWindow.start && day.date <= view.metricsWindow.end)
      .reduce((sum, day) => sum + day.count, 0);
    assert.equal(view.metrics[0].value, metricSum);

    for (const month of view.months) {
      const sum = parsed.contributionDays
        .filter((day) => day.date.startsWith(month.id))
        .reduce((total, day) => total + day.count, 0);
      assert.equal(month.value, sum, month.id);
    }

    const weekdaySum = parsed.contributionDays
      .filter((day) => day.date >= view.weekdayWindow.start && day.date <= view.weekdayWindow.end)
      .reduce((sum, day) => sum + day.count, 0);
    assert.equal(view.weekdays.reduce((sum, day) => sum + day.value, 0), weekdaySum);

    if (view.languages.length > 0) {
      assert.equal(view.languages.reduce((sum, language) => sum + language.percent, 0), 100);
    }
    assert.ok(view.recentDays.length <= RAIL_LIMIT);
    assert.ok(view.activeRepositories.length <= ACTIVE_REPO_LIMIT);
    for (let index = 1; index < view.recentDays.length; index += 1) {
      assert.ok(view.recentDays[index - 1].date > view.recentDays[index].date);
    }
  });
});
