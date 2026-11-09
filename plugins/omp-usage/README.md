# OMP Stats Overview & Models

Orca sidebar plugin mirroring `omp stats` (`#/overview?range=24h` and `#/models?range=24h`).
Queries `~/.omp/stats.db` in read-only mode via a `trusted-worker`
(`worker/omp-stats-db.mjs`) and renders two sub-tabs in an isolated HTML frame:

## 1. Overview (`#/overview`)

- **5 Primary Stat Cards with SVG Sparklines**: `API-equivalent cost`, `Requests`,
  `Conversation tokens`, `Cache rate`, `Error rate`
- **8 Secondary Stat Cells**: `Uncached input`, `Cache read`, `Cache write`, `Output`,
  `Premium reqs`, `Tokens/s`, `Avg latency`, `Avg TTFT`
- **Activity Card**: Per-5-minute / Per-hour / Per-day SVG bar chart with `Requests`,
  `Tokens` and `Cost` toggle
- **Token mix & By agent Card**: Stacked token-mix bar + legend and `By agent` breakdown
- **Latest requests Card**: Most recent model calls across every session

## 2. Models (`#/models`)

- **4 Stat Cards**: `Models used`, `Most used`, `Requests` (with sparkline),
  `API-equivalent cost`
- **Request share Card**: Stacked bar chart per bucket with `Share` (%) vs `Requests`
  toggle and model color legend
- **All models Table**: Model + provider, request count with proportional meter bar,
  tokens & cache rate, cost & speed, mini trend sparkline, and **click-to-expand** row
  details (`Efficiency`, `Latency & Throughput`, `Tokens` facts + `Tokens/s over time`
  chart)
