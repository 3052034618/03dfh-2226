import { useStore } from '@/store/useStore'
import { statusLabels } from '@/data/mock'
import { cn } from '@/lib/utils'

const tabs: { key: 'all' | 'pending' | 'in_transit' | 'completed'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: statusLabels['pending'] },
  { key: 'in_transit', label: statusLabels['in_transit'] },
  { key: 'completed', label: statusLabels['completed'] },
]

export default function StatusTabs() {
  const activeStatusFilter = useStore((s) => s.activeStatusFilter)
  const setActiveStatusFilter = useStore((s) => s.setActiveStatusFilter)

  return (
    <div className="flex gap-2 px-4 py-3">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveStatusFilter(tab.key)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors min-h-[44px] flex items-center',
            activeStatusFilter === tab.key
              ? 'bg-cold-500 text-white'
              : 'bg-transparent text-slate-500'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
