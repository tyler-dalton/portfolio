import { mkdir, writeFile } from "node:fs/promises";

const token = process.env.GH_TOKEN;
const username = process.env.GITHUB_USERNAME ?? "tyler-dalton";

if (!token) {
  throw new Error("Missing GH_TOKEN");
}

const query = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions

          months {
            firstDay
            name
            year
          }

          weeks {
            firstDay

            contributionDays {
              date
              contributionCount
              contributionLevel
              weekday
            }
          }
        }
      }
    }
  }
`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",

  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "tyler-dalton-portfolio",
  },

  body: JSON.stringify({
    query,
    variables: {
      login: username,
    },
  }),
});

if (!response.ok) {
  throw new Error(
    `GitHub API request failed: ${response.status} ${response.statusText}`,
  );
}

const result = await response.json();

if (result.errors) {
  throw new Error(JSON.stringify(result.errors, null, 2));
}

const calendar =
  result.data?.user?.contributionsCollection?.contributionCalendar;

if (!calendar) {
  throw new Error(`Could not find contribution data for ${username}`);
}

const weeks = calendar.weeks;
const months = calendar.months;

/* Graph sizing */
const CELL = 10;
const GAP = 3;
const STEP = CELL + GAP;

const LEFT = 34;
const TOP = 24;

const GRID_WIDTH = weeks.length * STEP;
const GRID_HEIGHT = 7 * STEP;

const WIDTH = LEFT + GRID_WIDTH + 12;
const HEIGHT = TOP + GRID_HEIGHT + 34;

/* Contribution colors */
const colors = {
  NONE: "#405467",
  FIRST_QUARTILE: "#1a4a6b",
  SECOND_QUARTILE: "#1d6fa4",
  THIRD_QUARTILE: "#2196c9",
  FOURTH_QUARTILE: "#3dc8f5",
};

const textColor = "#ecf0f1";

/* Contribution squares */
const squares = weeks
  .map((week, weekIndex) =>
    week.contributionDays
      .map((day) => {
        const x = LEFT + weekIndex * STEP;
        const y = TOP + day.weekday * STEP;

        const color =
          colors[day.contributionLevel] ?? colors.NONE;

        const contributionWord =
          day.contributionCount === 1
            ? "contribution"
            : "contributions";

        return `
          <rect
            x="${x}"
            y="${y}"
            width="${CELL}"
            height="${CELL}"
            rx="2"
            fill="${color}"
            data-date="${day.date}"
            data-count="${day.contributionCount}"
            tabindex="0"
            role="img"
            aria-label="${day.date}: ${day.contributionCount} ${contributionWord}"
          >
            <title>${day.date}: ${day.contributionCount} ${contributionWord}</title>
          </rect>
        `;
      })
      .join(""),
  )
  .join("");

/* Month labels */
const monthLabels = months
  .map((month) => {
    const monthDate = new Date(
      `${month.firstDay}T00:00:00Z`,
    );

    const weekIndex = weeks.findIndex((week) => {
      const start = new Date(
        `${week.firstDay}T00:00:00Z`,
      );

      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 6);

      return monthDate >= start && monthDate <= end;
    });

    if (weekIndex === -1) {
      return "";
    }

    const x = LEFT + weekIndex * STEP;

    return `
      <text
        x="${x}"
        y="12"
        fill="${textColor}"
        fill-opacity="0.55"
        font-size="10"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        ${month.name.slice(0, 3)}
      </text>
    `;
  })
  .join("");

/* Weekday labels */
const weekdayLabels = [
  { label: "Mon", weekday: 1 },
  { label: "Wed", weekday: 3 },
  { label: "Fri", weekday: 5 },
]
  .map(({ label, weekday }) => {
    const y = TOP + weekday * STEP + CELL - 1;

    return `
      <text
        x="0"
        y="${y}"
        fill="${textColor}"
        fill-opacity="0.45"
        font-size="9"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        ${label}
      </text>
    `;
  })
  .join("");

/* Legend */
const legendColors = [
  colors.NONE,
  colors.FIRST_QUARTILE,
  colors.SECOND_QUARTILE,
  colors.THIRD_QUARTILE,
  colors.FOURTH_QUARTILE,
];

const LEGEND_GAP = 5;

const legendWidth =
  28 +
  legendColors.length * CELL +
  (legendColors.length - 1) * LEGEND_GAP +
  34;

const legendX = WIDTH - legendWidth;
const legendY = TOP + GRID_HEIGHT + 14;

const legendSquares = legendColors
  .map((color, index) => {
    const x =
      legendX + 28 + index * (CELL + LEGEND_GAP);

    return `
      <rect
        x="${x}"
        y="${legendY - CELL + 2}"
        width="${CELL}"
        height="${CELL}"
        rx="2"
        fill="${color}"
      />
    `;
  })
  .join("");

const moreX =
  legendX +
  28 +
  legendColors.length * CELL +
  (legendColors.length - 1) * LEGEND_GAP +
  6;

/* Final SVG */
const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${WIDTH}"
  height="${HEIGHT}"
  viewBox="0 0 ${WIDTH} ${HEIGHT}"
  role="img"
  aria-label="${username}'s GitHub contribution graph"
>
  ${monthLabels}
  ${weekdayLabels}
  ${squares}

  <text
    x="${legendX}"
    y="${legendY}"
    fill="${textColor}"
    fill-opacity="0.6"
    font-size="10"
    font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
  >
    Less
  </text>

  ${legendSquares}

  <text
    x="${moreX}"
    y="${legendY}"
    fill="${textColor}"
    fill-opacity="0.6"
    font-size="10"
    font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
  >
    More
  </text>
</svg>
`.trim();

await mkdir("public/github", {
  recursive: true,
});

await writeFile(
  "public/github/contributions.svg",
  svg,
  "utf8",
);

console.log(
  `Generated contribution graph for ${username} - ${calendar.totalContributions} contributions`,
);