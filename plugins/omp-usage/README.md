# OMP Stats Overview

Orca sidebar plugin mirroring `omp stats` (`#/overview?range=24h`). Queries
`~/.omp/stats.db` in read-only mode via a `trusted-worker` (`worker/omp-stats-db.mjs`)
and renders the exact Overview layout in an isolated HTML frame (`src/panel.html` +
`src/panel.ts`):

- **Topbar & Header**: Pulsing `Live` status chip + `1h / 24h / 7d / 30d / 90d / All`
  segmented range control
- **5 Primary Stat Cards with SVG Sparklines**: `API-equivalent cost`, `Requests`,
  `Conversation tokens`, `Cache rate`, `Error rate`
- **8 Secondary Stat Cells**: `Uncached input`, `Cache read`, `Cache write`, `Output`,
  `Premium reqs`, `Tokens/s`, `Avg latency`, `Avg TTFT`
- **Activity Card**: Per-5-minute / Per-hour / Per-day SVG bar chart with `Requests`,
  `Tokens` and `Cost` toggle
- **Token mix & By agent Card**: Stacked token-mix bar + legend (`Uncached input`,
  `Cache read`, `Cache write`, `Output`) and `By agent` (`Main agent`, `Subagents`)
- **Latest requests Card**: Most recent model calls with `Model / Provider`, `When / Duration`,
  `Tokens / Cost` and `Status` (`OK` / `Failed`)
