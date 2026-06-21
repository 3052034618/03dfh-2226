import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import {
  FileCheck,
  Truck,
  Thermometer,
  Clock,
  AlertTriangle,
  Snowflake,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import SignOffReceipt from '@/components/SignOffReceipt'
import TemperatureChart from '@/components/TemperatureChart'

export default function ReceiptShare() {
  const { waybillId } = useParams<{ waybillId: string }>()

  useEffect(() => {
    document.body.style.background =
      'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)'
    return () => {
      document.body.style.background = '#f0f9ff'
    }
  }, [])

  const waybill = useStore((s) => s.getWaybillById(waybillId || ''))
  const handoverRecord = useStore((s) =>
    waybillId ? s.handoverRecords[waybillId] : undefined
  )
  const getTemperatureRecords = useStore((s) => s.getTemperatureRecords)
  const getTemperatureHasOvershoot = useStore((s) => s.getTemperatureHasOvershoot)

  const records = waybillId ? getTemperatureRecords(waybillId) : []
  const hasOvershoot = waybillId ? getTemperatureHasOvershoot(waybillId) : false

  const temps = records.map((r) => r.temperature)
  const minTemp = temps.length > 0 ? Math.min(...temps) : 0
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 0
  const avgTemp =
    temps.length > 0
      ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10
      : 0

  let durationMin = 0
  if (records.length >= 2) {
    const t0 = new Date(records[0].timestamp).getTime()
    const t1 = new Date(records[records.length - 1].timestamp).getTime()
    durationMin = Math.round((t1 - t0) / 60000)
  }

  if (!waybill) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-warn-100 rounded-full flex items-center justify-center mb-5">
          <AlertTriangle className="w-10 h-10 text-warn-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2 text-center">
          回执不存在或已失效
        </h2>
        <p className="text-sm text-slate-500 text-center">
          请检查链接是否正确，或联系发货方重新分享
        </p>
      </div>
    )
  }

  if (!handoverRecord) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-cold-100 rounded-full flex items-center justify-center mb-5">
          <Truck className="w-10 h-10 text-cold-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2 text-center">
          该运单尚未完成签收
        </h2>
        <p className="text-sm text-slate-500 text-center">
          运单号：{waybill.waybillNo}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen max-w-md mx-auto px-4 py-8 pb-12">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cold-500 to-cold-700 flex items-center justify-center shadow-lg">
            <Snowflake className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-cold-900">冷链运输签收回执</h1>
            <p className="text-[11px] text-slate-500">Cold Chain Receipt</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-cold-100 p-4 mb-4">
        <h3 className="text-sm font-semibold text-cold-800 mb-3 flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-cold-600" />
          温度摘要
        </h3>

        <TemperatureChart
          records={records}
          tempRange={waybill.tempRange}
          compact
        />

        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <Thermometer className="w-3 h-3 text-cyan-500" />
              <span className="text-[9px] text-slate-500">最低</span>
            </div>
            <p className="text-sm font-bold text-cyan-600">{minTemp.toFixed(1)}°</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <Thermometer className="w-3 h-3 text-warn-500" />
              <span className="text-[9px] text-slate-500">最高</span>
            </div>
            <p className="text-sm font-bold text-warn-600">{maxTemp.toFixed(1)}°</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <Thermometer className="w-3 h-3 text-cold-500" />
              <span className="text-[9px] text-slate-500">平均</span>
            </div>
            <p className="text-sm font-bold text-cold-600">{avgTemp.toFixed(1)}°</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-[9px] text-slate-500">时长</span>
            </div>
            <p className="text-sm font-bold text-slate-700">{durationMin}分</p>
          </div>
        </div>

        {hasOvershoot && (
          <div className="mt-3 flex items-center justify-center gap-1.5 bg-warn-50 rounded-lg py-2 px-3 text-xs text-warn-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            存在温度超温记录
          </div>
        )}
      </div>

      <SignOffReceipt waybillId={waybill.id} />

      <div className="text-center mt-6 pt-4 border-t border-cold-100">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Snowflake className="w-3.5 h-3.5 text-cold-400" />
          <span className="text-xs font-medium text-cold-700">冷链通</span>
        </div>
        <p className="text-[11px] text-slate-400">专业冷链物流温度监控</p>
      </div>
    </div>
  )
}
