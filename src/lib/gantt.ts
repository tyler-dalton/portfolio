/**
 * Layout maths for the timeline Gantt chart.
 *
 * Everything is computed in UTC days. A month-only date counts as the first of
 * that month, the same rule the activity data uses for sorting. An entry with no
 * end date is still running, so its bar stops at the "as of" date.
 */

export type GanttSpan = { id: string; start: string; end?: string };

export type GanttBar = { id: string; left: number; width: number; ongoing: boolean };
export type GanttMonth = { key: string; label: string; initial: string; left: number; width: number; showLabel: boolean };
export type GanttYear = { label: string; left: number; tight: boolean };

export type GanttLayout = {
  bars: GanttBar[];
  months: GanttMonth[];
  years: GanttYear[];
  today: number;
  /** Axis bounds in UTC milliseconds, so the page can move the today line between builds. */
  axisStart: number;
  axisEnd: number;
};

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parse(date: string): number {
  const [y, m, d = 1] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

const pct = (value: number) => Math.round(value * 100_000) / 1_000;

export function layoutGantt(spans: GanttSpan[], asOf: Date = new Date()): GanttLayout {
  const today = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate());
  const starts = spans.map((span) => parse(span.start));
  const first = new Date(Math.min(today, ...starts));
  const axisStart = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
  const axisEnd = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 1);
  const total = axisEnd - axisStart;
  const at = (time: number) => (time - axisStart) / total;

  const months: GanttMonth[] = [];
  const years: GanttYear[] = [];
  for (let cursor = new Date(axisStart); cursor.getTime() < axisEnd; ) {
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();
    const next = new Date(Date.UTC(y, m + 1, 1));
    if (months.length === 0 || m === 0) years.push({ label: String(y), left: pct(at(cursor.getTime())), tight: false });
    months.push({
      key: `${y}-${String(m + 1).padStart(2, "0")}`,
      label: MONTHS[m],
      initial: MONTHS[m][0],
      left: pct(at(cursor.getTime())),
      width: pct((next.getTime() - cursor.getTime()) / total),
      showLabel: true,
    });
    cursor = next;
  }
  // A short leading year has no room for its label on a narrow screen.
  years.forEach((year, index) => {
    const next = years[index + 1];
    year.tight = next !== undefined && next.left - year.left < 14;
  });
  // Past roughly a year and a half, label quarters only so the axis stays legible.
  if (months.length > 18) for (const month of months) month.showLabel = Number(month.key.slice(5)) % 3 === 1;

  const bars = spans.map((span, index) => {
    const start = starts[index];
    const ongoing = !span.end;
    // An end date is inclusive: the bar covers the whole last day.
    const end = ongoing ? today : Math.min(parse(span.end!) + DAY, axisEnd);
    return { id: span.id, left: pct(at(start)), width: pct(Math.max(end - start, DAY) / total), ongoing };
  });

  return {
    bars,
    months,
    years,
    today: pct(at(today)),
    axisStart,
    axisEnd,
  };
}
