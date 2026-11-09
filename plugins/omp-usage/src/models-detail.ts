// Renders the expandable per-model detail panel (Efficiency, Latency, Tokens & performance chart)
// and assigns stable model swatch colors.
import {
  fmtBucketTick,
  fmtCompact,
  fmtErrorRate,
  fmtInt,
  fmtLatency,
  fmtPct,
  fmtTps
} from './format'
import { esc } from './overview-cards'
import type { ModelStatsRow, OverviewReport } from './protocol'

const MODEL_PALETTE = [
  '#5ad8e6',
  '#ed4abf',
  '#9d7bff',
  '#f5b54a',
  '#4ade80',
  '#5b8cff',
  '#ff7a59',
  '#2dd4bf',
  '#c3e94f',
  '#fb7185'
]

export function modelKey(m: { model: string; provider: string }): string {
  return `${m.model}::${m.provider}`
}

export function buildModelSwatches(models: ModelStatsRow[]): Map<string, string> {
  const sorted = [...models].sort(
    (a, b) => b.totalRequests - a.totalRequests || modelKey(a).localeCompare(modelKey(b))
  )
  const map = new Map<string, string>()
  sorted.forEach((m, idx) => {
    map.set(modelKey(m), MODEL_PALETTE[idx % MODEL_PALETTE.length] ?? '#5ad8e6')
  })
  return map
}

export function renderExpandedModelDetail(
  m: ModelStatsRow,
  color: string,
  report: OverviewReport
): string {
  const key = modelKey(m)
  const byTs = new Map<number, { tps: number | null; ttft: number | null }>()
  for (const pt of report.modelSeries) {
    if (modelKey(pt) === key) {
      byTs.set(pt.timestamp, { tps: pt.avgTokensPerSecond, ttft: pt.avgTtft })
    }
  }
  const tpsVals = report.buckets.map((b) => byTs.get(b)?.tps ?? 0)
  const maxTps = Math.max(1, ...tpsVals)

  const svgW = 280
  const svgH = 68
  const n = Math.max(1, report.buckets.length)
  const slotW = svgW / n
  const barW = Math.max(2.5, Math.min(10, slotW * 0.65))
  const bars = report.buckets
    .map((ts, i) => {
      const val = tpsVals[i] ?? 0
      if (val <= 0) {
        return ''
      }
      const h = Math.max(2, (val / maxTps) * (svgH - 14))
      const x = i * slotW + (slotW - barW) / 2
      const y = svgH - 10 - h
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${color}"><title>${esc(`${fmtBucketTick(ts, report.bucketMs)}: ${fmtTps(val)} tok/s`)}</title></rect>`
    })
    .join('')

  return `
    <div class="models-detail">
      <div class="models-detail-grid">
        <div>
          <div class="section-label">Efficiency</div>
          <dl class="detail-dl">
            <div><dt>Error rate</dt><dd class="num">${fmtErrorRate(m.errorRate)} <span class="dim">(${fmtInt(m.failedRequests)})</span></dd></div>
            <div><dt>Cache rate</dt><dd class="num">${fmtPct(m.cacheRate)}</dd></div>
            <div><dt>Cache savings</dt><dd class="num">${fmtPct(m.cacheSavings)}</dd></div>
            <div><dt>Premium reqs</dt><dd class="num">${fmtInt(Math.round(m.totalPremiumRequests * 100) / 100)}</dd></div>
          </dl>
        </div>
        <div>
          <div class="section-label">Latency & Throughput</div>
          <dl class="detail-dl">
            <div><dt>Avg duration</dt><dd class="num">${fmtLatency(m.avgDuration)}</dd></div>
            <div><dt>Avg TTFT</dt><dd class="num">${fmtLatency(m.avgTtft)}</dd></div>
            <div><dt>Tokens/s</dt><dd class="num">${fmtTps(m.avgTokensPerSecond)}</dd></div>
          </dl>
        </div>
        <div>
          <div class="section-label">Tokens</div>
          <dl class="detail-dl">
            <div><dt>Uncached in</dt><dd class="num">${fmtCompact(m.totalInputTokens)}</dd></div>
            <div><dt>Cache read</dt><dd class="num">${fmtCompact(m.totalCacheReadTokens)}</dd></div>
            <div><dt>Cache write</dt><dd class="num">${fmtCompact(m.totalCacheWriteTokens)}</dd></div>
            <div><dt>Output</dt><dd class="num">${fmtCompact(m.totalOutputTokens)}</dd></div>
          </dl>
        </div>
      </div>
      <div class="stack" style="gap: 4px; margin-top: 8px">
        <div class="section-label">Tokens/s over time (peak ${fmtTps(maxTps)}/s)</div>
        <svg class="chart-svg" viewBox="0 0 ${svgW} ${svgH}">
          <line x1="0" y1="${svgH - 10}" x2="${svgW}" y2="${svgH - 10}" stroke="var(--line-1)" />
          ${bars}
        </svg>
      </div>
    </div>
  `
}
