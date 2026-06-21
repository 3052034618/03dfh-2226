import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronRight, Thermometer, Wifi, WifiOff } from 'lucide-react'
import type { Waybill } from '@/types'
import { cn } from '@/lib/utils'

function getTempColor(waybill: Waybill) {
  if (!waybill.probeOnline) return 'bg-red-500'
  const { currentTemp, tempRange } = waybill
  if (currentTemp < tempRange.min || currentTemp > tempRange.max) return 'bg-red-500'
  const margin = (tempRange.max - tempRange.min) * 0.15
  if (
    currentTemp < tempRange.min + margin ||
    currentTemp > tempRange.max - margin
  ) return 'bg-warn-500'
  return 'bg-safe-500'
}

interface WaybillCardProps {
  waybill: Waybill
  onBindDevice: (id: string) => void
  onStartTransit: (id: string) => void
}

export default function WaybillCard({ waybill, onBindDevice, onStartTransit }: WaybillCardProps) {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/waybill/${waybill.id}`)
  }

  const tempColor = getTempColor(waybill)

  return (
    <div
      className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('inline-block h-2.5 w-2.5 rounded-full shrink-0', tempColor)} />
            <span className="font-bold text-slate-900 truncate">{waybill.waybillNo}</span>
          </div>

          <div className="flex items-center gap-1 mt-2 text-sm text-slate-600">
            <span className="truncate">{waybill.origin}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{waybill.destination}</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block rounded-full bg-cold-50 px-2.5 py-0.5 text-xs font-medium text-cold-700">
              {waybill.goodsType}
            </span>
            <span className="text-xs text-slate-400">{waybill.vehiclePlate}</span>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <Thermometer className="h-4 w-4 text-slate-400" />
              <span className="text-2xl font-bold text-slate-900">
                {waybill.currentTemp}
              </span>
              <span className="text-sm text-slate-400">°C</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {waybill.probeOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-safe-500" />
                  <span className="text-safe-500">在线</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-red-500">离线</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between h-full gap-3">
          <ChevronRight className="h-5 w-5 text-slate-300" />

          {waybill.status === 'pending' && !waybill.deviceBound && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBindDevice(waybill.id)
              }}
              className="rounded-xl bg-cold-500 px-4 py-2 text-sm font-medium text-white min-h-[44px] active:bg-cold-600 transition-colors"
            >
              绑定设备
            </button>
          )}

          {waybill.status === 'pending' && waybill.deviceBound && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStartTransit(waybill.id)
              }}
              className="rounded-xl bg-safe-500 px-4 py-2 text-sm font-medium text-white min-h-[44px] active:bg-safe-600 transition-colors"
            >
              出发
            </button>
          )}

          {waybill.status === 'in_transit' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cold-50 px-3 py-1 text-xs font-medium text-cold-600">
              <span className="h-1.5 w-1.5 rounded-full bg-cold-500 animate-pulse" />
              在途
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
