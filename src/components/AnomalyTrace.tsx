import {
  AlertTriangle,
  Thermometer,
  Camera,
  FileCheck,
  CheckCircle,
  Clock,
  MapPin,
  Info,
  ClipboardList,
} from 'lucide-react'
import type { TemperatureRecord, Checkpoint, HandoverRecord } from '@/types'
import { detectOvershootSections } from '@/utils/anomalyUtils'
import { anomalyReasonLabels } from '@/data/mock'

interface AnomalyTraceProps {
  waybillId: string
  temperatureRecords: TemperatureRecord[]
  checkpoints: Checkpoint[]
  handoverRecord?: HandoverRecord
}

type TraceEventType =
  | 'overshoot_start'
  | 'overshoot_end'
  | 'anomaly'
  | 'photo'
  | 'signoff'
  | 'processing'

interface TraceEvent {
  id: string
  type: TraceEventType
  timestamp: string
  location?: string
  description?: string
  maxTemp?: number
  durationMin?: number
  photo?: string
  anomalyReason?: string
  signerName?: string
  processingNote?: string
  anomalyRef?: string
}

function formatDateTime(ts: string) {
  const d = new Date(ts)
  const date = `${d.getMonth() + 1}月${d.getDate()}日`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return { date, time }
}

const iconMap: Record<TraceEventType, React.ReactNode> = {
  overshoot_start: <Thermometer size={14} />,
  overshoot_end: <Thermometer size={14} />,
  anomaly: <AlertTriangle size={14} />,
  photo: <Camera size={14} />,
  signoff: <FileCheck size={14} />,
  processing: <ClipboardList size={14} />,
}

const dotColorMap: Record<TraceEventType, string> = {
  overshoot_start: 'bg-red-500',
  overshoot_end: 'bg-safe-500',
  anomaly: 'bg-warn-500',
  photo: 'bg-cold-500',
  signoff: 'bg-slate-500',
  processing: 'bg-cold-500',
}

const labelMap: Record<TraceEventType, string> = {
  overshoot_start: '超温开始',
  overshoot_end: '超温结束',
  anomaly: '异常上报',
  photo: '现场留证',
  signoff: '签收说明',
  processing: '处理记录',
}

export default function AnomalyTrace(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { waybillId, temperatureRecords, checkpoints, handoverRecord }: AnomalyTraceProps
) {
  const overshootSections = detectOvershootSections(temperatureRecords)
  const anomalyCheckpoints = checkpoints.filter((cp) => cp.type === 'anomaly')
  const photoCheckpoints = checkpoints.filter((cp) => cp.type === 'photo')
  const processingCheckpoints = checkpoints.filter((cp) => cp.type === 'processing')

  const hasAnyAnomaly =
    overshootSections.length > 0 || anomalyCheckpoints.length > 0 || processingCheckpoints.length > 0

  const events: TraceEvent[] = []

  overshootSections.forEach((section, idx) => {
    events.push({
      id: `overshoot_start_${idx}`,
      type: 'overshoot_start',
      timestamp: section.start,
      maxTemp: section.maxTemp,
      durationMin: section.durationMin,
      description: '温度超出正常范围',
    })
    events.push({
      id: `overshoot_end_${idx}`,
      type: 'overshoot_end',
      timestamp: section.end,
      maxTemp: section.maxTemp,
      durationMin: section.durationMin,
      description: '温度恢复正常范围',
    })
  })

  anomalyCheckpoints.forEach((cp) => {
    events.push({
      id: cp.id,
      type: 'anomaly',
      timestamp: cp.timestamp,
      location: cp.location,
      description: cp.note,
      anomalyReason: cp.anomalyReason,
    })
  })

  if (hasAnyAnomaly) {
    photoCheckpoints.forEach((cp) => {
      events.push({
        id: cp.id,
        type: 'photo',
        timestamp: cp.timestamp,
        location: cp.location,
        description: cp.note,
        photo: cp.photo,
      })
    })
  }

  processingCheckpoints.forEach((cp) => {
    events.push({
      id: cp.id,
      type: 'processing',
      timestamp: cp.timestamp,
      location: cp.location,
      processingNote: cp.processingNote,
      photo: cp.photo,
      anomalyRef: cp.anomalyRef,
    })
  })

  if (handoverRecord && handoverRecord.hasOvershoot && handoverRecord.overshootNote) {
    events.push({
      id: 'signoff',
      type: 'signoff',
      timestamp: handoverRecord.signedAt,
      description: handoverRecord.overshootNote,
      signerName: handoverRecord.signerName,
    })
  }

  events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  if (!hasAnyAnomaly) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-warn-500" />
          异常追溯记录
        </h2>
        <div className="flex items-center gap-3 bg-safe-50 rounded-xl px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-safe-100 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-safe-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-safe-700">全程温度正常，无异常记录</p>
            <p className="text-xs text-safe-500 mt-0.5">运输过程符合冷链要求</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 text-warn-500" />
        异常追溯记录
      </h2>

      {!handoverRecord && (
        <div className="flex items-start gap-2.5 bg-warn-50 rounded-xl px-3 py-2.5 mb-4">
          <Info className="w-4 h-4 text-warn-500 shrink-0 mt-0.5" />
          <p className="text-xs text-warn-600 leading-relaxed">
            收货人签收时需补充说明
          </p>
        </div>
      )}

      <div className="relative pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />

        {events.map((event, index) => {
          const { date, time } = formatDateTime(event.timestamp)
          const isLast = index === events.length - 1
          const isProcessingWithRef = event.type === 'processing' && event.anomalyRef

          return (
            <div key={event.id} className={`relative ${isLast ? '' : 'pb-4'} ${isProcessingWithRef ? 'ml-2' : ''}`}>
              <div
                className={`absolute left-[-18px] top-1 w-3.5 h-3.5 rounded-full flex items-center justify-center ${dotColorMap[event.type]}`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              <div className={`rounded-xl p-3 ${event.type === 'processing' ? 'bg-cold-50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`${dotColorMap[event.type]} text-white p-1 rounded-md`}>
                    {iconMap[event.type]}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {labelMap[event.type]}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">{time}</span>
                </div>

                <p className="text-xs text-slate-400 mb-1.5">{date}</p>

                {event.location && (
                  <div className="text-xs text-slate-500 flex items-center gap-1 mb-1.5">
                    <MapPin size={10} />
                    {event.location}
                  </div>
                )}

                {event.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {event.description}
                  </p>
                )}

                {event.processingNote && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {event.processingNote}
                  </p>
                )}

                {event.type === 'overshoot_start' && event.maxTemp !== undefined && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Thermometer size={12} className="text-red-500" />
                      <span className="text-xs text-red-600 font-medium">
                        最高 {event.maxTemp}°C
                      </span>
                    </div>
                    {event.durationMin !== undefined && event.durationMin > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500">
                          持续 {event.durationMin} 分钟
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {event.type === 'overshoot_end' && event.durationMin !== undefined && event.durationMin > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <Clock size={12} className="text-safe-500" />
                    <span className="text-xs text-safe-600">
                      持续 {event.durationMin} 分钟后恢复
                    </span>
                  </div>
                )}

                {event.type === 'anomaly' && event.anomalyReason && (
                  <div className="mt-2">
                    <span className="inline-block bg-warn-100 text-warn-600 text-xs px-2 py-0.5 rounded-full font-medium">
                      {anomalyReasonLabels[event.anomalyReason] || event.anomalyReason}
                    </span>
                  </div>
                )}

                {(event.type === 'photo' || event.type === 'processing') && event.photo && (
                  <div className="mt-2">
                    <img
                      src={event.photo}
                      alt={event.type === 'processing' ? '处理照片' : '现场留证'}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}

                {event.type === 'signoff' && event.signerName && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <FileCheck size={12} className="text-slate-500" />
                    <span className="text-xs text-slate-500">
                      签收人：{event.signerName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
