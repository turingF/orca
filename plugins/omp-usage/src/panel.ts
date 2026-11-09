// Controller for the OMP Stats Overview sidebar panel.
import { esc, renderActivityCard, renderStatGrids, renderTopHeader } from './overview-cards'
import { renderLatestRequestsCard, renderTokenMixCard } from './overview-sections'
import type { ActivityMetric, OverviewReport, UsageRange } from './protocol'

type UiState = {
  range: UsageRange
  metric: ActivityMetric
  loading: boolean
  error: string | null
  report: OverviewReport | null
}

const STORAGE_KEY = 'omp-stats-overview.v1'

function loadCached(): { range: UsageRange; report: OverviewReport | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { range: '24h', report: null }
    }
    const parsed = JSON.parse(raw) as { range?: UsageRange; report?: OverviewReport }
    return {
      range: parsed.range ?? '24h',
      report: parsed.report ?? null
    }
  } catch {
    return { range: '24h', report: null }
  }
}

function saveCached(range: UsageRange, report: OverviewReport): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ range, report }))
  } catch {
    // Ignore storage quota errors.
  }
}

const cached = loadCached()

const state: UiState = {
  range: cached.range,
  metric: 'requests',
  loading: false,
  error: null,
  report: cached.report
}

function render(): void {
  const root = document.getElementById('root')
  if (!root) {
    return
  }
  const { range, metric, report, loading, error } = state
  let html = renderTopHeader(range, report, loading)

  if (error) {
    html += `<div class="card"><div class="empty">${esc(error)}</div></div>`
  }

  if (!report) {
    html += `<div class="card"><div class="empty">${loading ? 'Loading overview…' : 'No data available'}</div></div>`
  } else {
    html += renderStatGrids(report)
    html += renderActivityCard(report, metric)
    html += renderTokenMixCard(report)
    html += renderLatestRequestsCard(report)
  }

  root.innerHTML = html
}

async function fetchOverview(nextRange?: UsageRange): Promise<void> {
  if (state.loading) {
    return
  }
  const targetRange = nextRange ?? state.range
  state.loading = true
  state.error = null
  if (nextRange) {
    state.range = nextRange
  }
  render()

  try {
    const answer = await orca.plugin.request(
      'usage.overview',
      { range: targetRange },
      { timeoutMs: 30_000 }
    )
    state.report = answer
    saveCached(targetRange, answer)
  } catch (cause) {
    state.error = cause instanceof Error ? cause.message : String(cause)
  } finally {
    state.loading = false
    render()
  }
}

document.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
    '[data-action],[data-range],[data-metric]'
  )
  if (!target) {
    return
  }
  if (target.dataset.action === 'refresh') {
    void fetchOverview()
    return
  }
  if (target.dataset.range) {
    void fetchOverview(target.dataset.range as UsageRange)
    return
  }
  if (target.dataset.metric) {
    state.metric = target.dataset.metric as ActivityMetric
    render()
  }
})

orca.on('theme', () => {
  render()
})

render()
void fetchOverview()
