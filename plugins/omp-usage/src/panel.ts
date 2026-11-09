// Controller for the OMP Stats sidebar panel (Overview + Models sub-tabs).
import { renderModelsTab } from './models-tab'
import { esc, renderActivityCard, renderStatGrids, renderTopHeader } from './overview-cards'
import { renderLatestRequestsCard, renderTokenMixCard } from './overview-sections'
import type { ActivityMetric, OverviewReport, ShareChartMode, SubTab, UsageRange } from './protocol'

type UiState = {
  range: UsageRange
  tab: SubTab
  metric: ActivityMetric
  shareMode: ShareChartMode
  expandedModelKey: string | null
  loading: boolean
  error: string | null
  report: OverviewReport | null
}

const STORAGE_KEY = 'omp-stats-overview.v2'

function loadCached(): { range: UsageRange; tab: SubTab; report: OverviewReport | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { range: '24h', tab: 'overview', report: null }
    }
    const parsed = JSON.parse(raw) as {
      range?: UsageRange
      tab?: SubTab
      report?: OverviewReport
    }
    return {
      range: parsed.range ?? '24h',
      tab: parsed.tab ?? 'overview',
      report: parsed.report ?? null
    }
  } catch {
    return { range: '24h', tab: 'overview', report: null }
  }
}

function saveCached(range: UsageRange, tab: SubTab, report: OverviewReport | null): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ range, tab, report }))
  } catch {
    // Ignore storage quota errors.
  }
}

const cached = loadCached()

const state: UiState = {
  range: cached.range,
  tab: cached.tab,
  metric: 'requests',
  shareMode: 'share',
  expandedModelKey: null,
  loading: false,
  error: null,
  report: cached.report
}

function render(): void {
  const root = document.getElementById('root')
  if (!root) {
    return
  }
  const { range, tab, metric, shareMode, expandedModelKey, report, loading, error } = state
  let html = renderTopHeader(range, tab, report, loading)

  if (error) {
    html += `<div class="card"><div class="empty">${esc(error)}</div></div>`
  }

  if (!report) {
    html += `<div class="card"><div class="empty">${loading ? 'Loading stats…' : 'No data available'}</div></div>`
  } else if (tab === 'models') {
    html += renderModelsTab(report, shareMode, expandedModelKey)
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
    saveCached(targetRange, state.tab, answer)
  } catch (cause) {
    state.error = cause instanceof Error ? cause.message : String(cause)
  } finally {
    state.loading = false
    render()
  }
}

document.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
    '[data-action],[data-range],[data-tab],[data-metric],[data-share-mode],[data-model-row]'
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
  if (target.dataset.tab) {
    state.tab = target.dataset.tab as SubTab
    saveCached(state.range, state.tab, state.report)
    render()
    return
  }
  if (target.dataset.metric) {
    state.metric = target.dataset.metric as ActivityMetric
    render()
    return
  }
  if (target.dataset.shareMode) {
    state.shareMode = target.dataset.shareMode as ShareChartMode
    render()
    return
  }
  if (target.dataset.modelRow) {
    const k = target.dataset.modelRow
    state.expandedModelKey = state.expandedModelKey === k ? null : k
    render()
  }
})

orca.on('theme', () => {
  render()
})

render()
void fetchOverview()
