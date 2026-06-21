import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileCheck,
  MapPin,
  Truck,
  Thermometer,
  Clock,
  AlertTriangle,
  CheckCircle,
  Copy,
  Camera,
  ArrowRight,
  CheckCircle2,
  User,
  ClipboardList,
  Share2,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { detectOvershootSections } from '@/utils/anomalyUtils'
import { anomalyReasonLabels } from '@/data/mock'

interface SignOffReceiptProps {
  waybillId: string
}

export default function SignOffReceipt({ waybillId }: SignOffReceiptProps) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const waybill = useStore((s) => s.getWaybillById(waybillId))
  const checkpoints = useStore((s) => s.getCheckpointsForWaybill(waybillId))
  const handoverRecord = useStore((s) => s.handoverRecords[waybillId])
  const getTemperatureRecords = useStore((s) => s.getTemperatureRecords)

  const records = getTemperatureRecords(waybillId)
  const anomalyCheckpoints = checkpoints.filter((cp) => cp.type === 'anomaly')
  const photoCheckpoints = checkpoints.filter((cp) => cp.type === 'photo')
  const processingCheckpoints = checkpoints.filter((cp) => cp.type === 'processing')
  const overshootSections = detectOvershootSections(records)
  const hasAnyAnomaly = overshootSections.length > 0 || anomalyCheckpoints.length > 0 || processingCheckpoints.length > 0

  const temps = records.map((r) => r.temperature)
  const minTemp = temps.length > 0 ? Math.min(...temps) : 0
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 0
  const avgTemp =
    temps.length > 0
      ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10
      : 0
  const overshootCount = records.filter((r) => !r.isNormal).length

  let durationMin = 0
  if (records.length >= 2) {
    const t0 = new Date(records[0].timestamp).getTime()
    const t1 = new Date(records[records.length - 1].timestamp).getTime()
    durationMin = Math.round((t1 - t0) / 60000)
  }

  if (!waybill || !handoverRecord) return null

  const timestamp = new Date(handoverRecord.signedAt)
  const tsStr = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}`
  const receiptNo = `HD-${waybill.handoverCode || '------'}-${tsStr}`

  const buildReceiptText = () => {
    const lines = [
      '【冷链通 运输签收回执】',
      '',
      `回执编号：${receiptNo}`,
      '',
      '--- 运单摘要 ---',
      `运单号：${waybill.waybillNo}`,
      `运输路线：${waybill.origin} → ${waybill.destination}`,
      `货物类型：${waybill.goodsType}`,
      `车牌号：${waybill.vehiclePlate}`,
      `设备ID：${waybill.deviceId}`,
      '',
      '--- 温度统计 ---',
      `最低温度：${minTemp.toFixed(1)}°C`,
      `最高温度：${maxTemp.toFixed(1)}°C`,
      `平均温度：${avgTemp.toFixed(1)}°C`,
      `运输时长：${durationMin} 分钟`,
      `超温次数：${overshootCount} 次`,
      `正常温度范围：${waybill.tempRange.min}°C ~ ${waybill.tempRange.max}°C`,
      '',
      '--- 异常追溯 ---',
    ]

    if (!hasAnyAnomaly) {
      lines.push('全程温度正常，无异常记录 ✓')
    } else {
      lines.push(`超温段数：${overshootSections.length} 段`)
      lines.push(`异常上报：${anomalyCheckpoints.length} 次`)
      lines.push(`现场留证：${photoCheckpoints.length} 张`)
      lines.push(`处理记录：${processingCheckpoints.length} 条`)
      overshootSections.forEach((sec, idx) => {
        const start = new Date(sec.start).toLocaleString('zh-CN')
        const end = new Date(sec.end).toLocaleString('zh-CN')
        lines.push(`  [超温${idx + 1}] ${start} ~ ${end}`)
        lines.push(`         最高 ${sec.maxTemp}°C，持续 ${sec.durationMin} 分钟`)
      })
      anomalyCheckpoints.forEach((cp) => {
        const t = new Date(cp.timestamp).toLocaleString('zh-CN')
        const reason = cp.anomalyReason ? anomalyReasonLabels[cp.anomalyReason] : '未知'
        lines.push(`  [异常] ${t} - ${reason}`)
        if (cp.location) lines.push(`         地点：${cp.location}`)
        if (cp.note) lines.push(`         说明：${cp.note}`)
      })
      processingCheckpoints.forEach((cp) => {
        const t = new Date(cp.timestamp).toLocaleString('zh-CN')
        lines.push(`  [处理] ${t}`)
        if (cp.processingNote) lines.push(`         说明：${cp.processingNote}`)
      })
    }

    lines.push('')
    lines.push('--- 签收确认 ---')
    lines.push(`签收人：${handoverRecord.signerName}`)
    lines.push(`签收时间：${new Date(handoverRecord.signedAt).toLocaleString('zh-CN')}`)
    if (handoverRecord.hasOvershoot && handoverRecord.overshootNote) {
      lines.push(`超温说明：${handoverRecord.overshootNote}`)
    }
    lines.push('')
    lines.push('---')
    lines.push('此回执由冷链通系统自动生成，具有同等法律效力')

    return lines.join('\n')
  }

  const handleCopyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(buildReceiptText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('copy failed', e)
    }
  }

  const handleShare = () => {
    navigate(`/receipt/${waybillId}`)
  }

  const handleCopyLink = async () => {
    try {
      const link = `${window.location.origin}/receipt/${waybillId}`
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (e) {
      console.error('copy link failed', e)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cold-50 via-white to-cyan-50 shadow-lg">
      <div className="absolute top-0 right-0 opacity-[0.04] pointer-events-none select-none rotate-12 translate-x-8 -translate-y-4">
        <div className="text-[120px] font-black text-cold-900 whitespace-nowrap">冷链通</div>
      </div>
      <div className="absolute bottom-0 left-0 opacity-[0.04] pointer-events-none select-none -rotate-12 -translate-x-4 translate-y-6">
        <div className="text-[120px] font-black text-cold-900 whitespace-nowrap">COLD CHAIN</div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-cold-200/50" />

      <div className="relative p-5 space-y-4">
        <div className="text-center border-b border-dashed border-cold-200 pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileCheck className="w-6 h-6 text-cold-700" />
            <h2 className="text-xl font-bold text-cold-900">运输签收回执</h2>
          </div>
          <p className="text-xs text-slate-500 font-mono tracking-wider">
            回执编号：{receiptNo}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-cold-100">
          <h3 className="text-sm font-semibold text-cold-800 mb-3 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cold-600" />
            运单摘要
          </h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">运单号</span>
              <span className="font-semibold text-cold-700">{waybill.waybillNo}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-700 truncate flex-1">{waybill.origin}</span>
              <ArrowRight className="w-3.5 h-3.5 text-cold-500 shrink-0" />
              <span className="text-xs text-slate-700 truncate flex-1 text-right">{waybill.destination}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">货物</span>
                <span className="text-slate-700 font-medium">{waybill.goodsType}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Truck className="w-3 h-3 text-slate-400" />
                <span className="text-slate-700 font-medium">{waybill.vehiclePlate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs col-span-2">
                <span className="text-slate-400">设备ID</span>
                <span className="text-slate-700 font-mono text-xs">{waybill.deviceId}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-cold-100">
          <h3 className="text-sm font-semibold text-cold-800 mb-3 flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-cold-600" />
            温度统计
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-cold-50 rounded-lg p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Thermometer className="w-3 h-3 text-cyan-500" />
                <span className="text-[10px] text-slate-500">最低</span>
              </div>
              <p className="text-sm font-bold text-cyan-600">{minTemp.toFixed(1)}°C</p>
            </div>
            <div className="bg-warn-50 rounded-lg p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Thermometer className="w-3 h-3 text-warn-500" />
                <span className="text-[10px] text-slate-500">最高</span>
              </div>
              <p className="text-sm font-bold text-warn-600">{maxTemp.toFixed(1)}°C</p>
            </div>
            <div className="bg-cold-50 rounded-lg p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Thermometer className="w-3 h-3 text-cold-500" />
                <span className="text-[10px] text-slate-500">平均</span>
              </div>
              <p className="text-sm font-bold text-cold-600">{avgTemp.toFixed(1)}°C</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-slate-500">运输时长</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">{durationMin} 分钟</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-slate-500">超温次数</span>
              </div>
              <p className={`text-sm font-semibold ${overshootCount > 0 ? 'text-warn-600' : 'text-safe-600'}`}>
                {overshootCount} 次
              </p>
            </div>
          </div>
          <div className="mt-2.5 text-[10px] text-slate-400 text-center">
            正常范围：{waybill.tempRange.min}°C ~ {waybill.tempRange.max}°C
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-cold-100">
          <h3 className="text-sm font-semibold text-cold-800 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-warn-500" />
            异常追溯摘要
          </h3>
          {!hasAnyAnomaly ? (
            <div className="flex items-center gap-3 bg-safe-50 rounded-xl px-4 py-3 border border-safe-100">
              <div className="w-10 h-10 rounded-full bg-safe-100 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-safe-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-safe-700">全程温度正常 ✓</p>
                <p className="text-xs text-safe-500 mt-0.5">运输过程符合冷链要求</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-warn-50 rounded-lg p-2 text-center border border-warn-100">
                  <p className="text-[10px] text-slate-500">超温段数</p>
                  <p className="text-lg font-bold text-warn-600">{overshootSections.length}</p>
                </div>
                <div className="bg-warn-50 rounded-lg p-2 text-center border border-warn-100">
                  <p className="text-[10px] text-slate-500">异常上报</p>
                  <p className="text-lg font-bold text-warn-600">{anomalyCheckpoints.length}</p>
                </div>
                <div className="bg-cyan-50 rounded-lg p-2 text-center border border-cyan-100">
                  <p className="text-[10px] text-slate-500">现场留证</p>
                  <p className="text-lg font-bold text-cyan-600">{photoCheckpoints.length}</p>
                </div>
                <div className="bg-cold-50 rounded-lg p-2 text-center border border-cold-100">
                  <p className="text-[10px] text-slate-500">处理记录</p>
                  <p className="text-lg font-bold text-cold-600">{processingCheckpoints.length}</p>
                </div>
              </div>

              <div className="space-y-2">
                {overshootSections.map((sec, idx) => (
                  <div key={`sec-${idx}`} className="bg-warn-50/60 rounded-lg p-2.5 border border-warn-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-warn-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-medium text-warn-700">超温段 #{idx + 1}</span>
                      <span className="ml-auto text-[10px] text-slate-500">
                        最高 <span className="font-bold text-warn-600">{sec.maxTemp}°C</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {new Date(sec.start).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      {' → '}
                      {new Date(sec.end).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      <span className="text-slate-400 ml-2">（持续 {sec.durationMin} 分钟）</span>
                    </p>
                  </div>
                ))}

                {anomalyCheckpoints.map((cp) => (
                  <div key={`anom-${cp.id}`} className="bg-warn-50/60 rounded-lg p-2.5 border border-warn-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle className="w-4 h-4 text-warn-500 shrink-0" />
                      <span className="text-xs font-medium text-warn-700">异常上报</span>
                      <span className="ml-auto text-[10px] text-slate-400">
                        {new Date(cp.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="inline-block bg-warn-100 text-warn-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                        {cp.anomalyReason ? anomalyReasonLabels[cp.anomalyReason] : '未知原因'}
                      </span>
                      {cp.location && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {cp.location}
                        </span>
                      )}
                    </div>
                    {cp.note && (
                      <p className="text-[11px] text-slate-600 leading-relaxed">{cp.note}</p>
                    )}
                  </div>
                ))}

                {processingCheckpoints.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5 pt-1">
                      <ClipboardList className="w-3.5 h-3.5 text-cold-500" />
                      <span className="text-xs font-semibold text-cold-700">处理记录</span>
                      {processingCheckpoints.length > 0 && (
                        <span className="text-[10px] text-slate-400 ml-auto">
                          最新：{new Date(processingCheckpoints[0].timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {processingCheckpoints.map((cp) => (
                      <div key={`proc-${cp.id}`} className="bg-cold-50/60 rounded-lg p-2.5 border border-cold-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <ClipboardList className="w-3.5 h-3.5 text-cold-500 shrink-0" />
                          <span className="text-xs font-medium text-cold-700">处理记录</span>
                          <span className="ml-auto text-[10px] text-slate-400">
                            {new Date(cp.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {cp.processingNote && (
                          <p className="text-[11px] text-slate-600 leading-relaxed">{cp.processingNote}</p>
                        )}
                        {cp.photo && (
                          <div className="mt-1.5">
                            <img
                              src={cp.photo}
                              alt="处理照片"
                              className="w-14 h-14 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-cold-100">
          <h3 className="text-sm font-semibold text-cold-800 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-safe-500" />
            签收确认
          </h3>
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-safe-100 flex items-center justify-center mb-3 border-4 border-safe-50 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-safe-500" />
            </div>
            <p className="text-lg font-bold text-safe-700 mb-1">已签收确认</p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>签收人：</span>
              <span className="font-semibold text-slate-800">{handoverRecord.signerName}</span>
            </div>
            <p className="text-xs text-slate-500">
              {new Date(handoverRecord.signedAt).toLocaleString('zh-CN')}
            </p>
          </div>

          {handoverRecord.hasOvershoot && handoverRecord.overshootNote && (
            <div className="mt-3 bg-warn-50 rounded-xl p-3 border border-warn-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warn-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-warn-700 mb-1">超温情况说明</p>
                  <p className="text-xs text-warn-800 leading-relaxed whitespace-pre-wrap">
                    {handoverRecord.overshootNote}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center pt-2 pb-1 border-t border-dashed border-cold-200">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            此回执由冷链通系统自动生成，具有同等法律效力
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleShare}
            className="bg-cold-500 hover:bg-cold-600 text-white rounded-xl min-h-[42px] text-sm font-medium flex items-center justify-center gap-2 transition-colors active:bg-cold-700"
          >
            <Share2 className="w-4 h-4" />
            分享回执
          </button>
          <button
            onClick={handleCopyLink}
            className="bg-cold-100 hover:bg-cold-200 text-cold-700 rounded-xl min-h-[42px] text-sm font-medium flex items-center justify-center gap-2 transition-colors active:bg-cold-300"
          >
            {linkCopied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                复制链接
              </>
            )}
          </button>
          <button
            onClick={handleCopyReceipt}
            className="bg-cold-700 hover:bg-cold-800 text-white rounded-xl min-h-[42px] text-sm font-medium flex items-center justify-center gap-2 transition-colors active:bg-cold-900"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                复制回执
              </>
            )}
          </button>
          <button
            onClick={() => alert('请使用系统截图功能保存此回执')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl min-h-[42px] text-sm font-medium flex items-center justify-center gap-2 transition-colors active:bg-slate-300"
          >
            <Camera className="w-4 h-4" />
            截图保存
          </button>
        </div>
      </div>
    </div>
  )
}
