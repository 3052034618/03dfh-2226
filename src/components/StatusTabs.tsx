import { useStore } from '@/store/useStore'
import { statusLabels } from '@/data/mock'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

const tabs: { key: 'all' | 'pending' | 'in_transit' | 'completed' | 'anomaly'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: statusLabels['pending'] },
  { key: 'in_transit', label: statusLabels['in_transit'] },
  { key: 'completed', label: statusLabels['completed'] },
  { key: 'anomaly', label: '异常签收' },
]

export default function StatusTabs() {
  const activeStatusFilter = useStore((s) => s.activeStatusFilter)
  const setActiveStatusFilter = useStore((s) => s.setActiveStatusFilter)
  const waybills = useStore((s) => s.waybills)
  const getTemperatureHasOvershoot = useStore((s) => s.getTemperatureHasOvershoot)
  const getCheckpointsForWaybill = useStore((s) => s.getCheckpointsForWaybill)

  const anomalyCount = waybills.filter((w) => {
    if (w.status !== 'completed') return false
    const hasOvershoot = getTemperatureHasOvershoot(w.id)
    const checkpoints = getCheckpointsForWaybill(w.id)
    const hasAnomalyCheckpoint = checkpoints.some((cp) => cp.type === 'anomaly')
    return hasOvershoot || hasAnomalyCheckpoint
  }).length

  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isAnomalyTab = tab.key === 'anomaly'
        const showBadge = isAnomalyTab && anomalyCount > 0
        return (
          <button
            key={tab.key}
            onClick={() => setActiveStatusFilter(tab.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors min-h-[44px] flex items-center gap-1.5 shrink-0',
              activeStatusFilter === tab.key
                ? isAnomalyTab
                  ? 'bg-warn-500 text-white'
                  : 'bg-cold-500 text-white'
                : isAnomalyTab
                ? 'bg-transparent text-warn-600'
                : 'bg-transparent text-slate-500'
            )}
          >
            {isAnomalyTab && <AlertTriangle className="w-3.5 h-3.5" />}
            {tab.label}
            {showBadge && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1',
                  activeStatusFilter === tab.key
                    ? 'bg-white/25 text-white'
                    : 'bg-warn-500 text-white'
                )}
              >
                {anomalyCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
