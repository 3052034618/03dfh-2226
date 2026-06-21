import { Truck, MapPin, AlertTriangle, Camera, FileText, Circle, CheckCircle } from 'lucide-react'
import type { Checkpoint, CheckpointType, AnomalyReason } from '@/types'
import { checkpointTypeLabels, anomalyReasonLabels } from '@/data/mock'

const dotColorMap: Record<CheckpointType, string> = {
  departure: 'bg-cold-500',
  arrival: 'bg-safe-500',
  anomaly: 'bg-warn-500',
  photo: 'bg-cold-400',
  note: 'bg-slate-400',
  processing: 'bg-safe-400',
}

const iconMap: Record<CheckpointType, React.ReactNode> = {
  departure: <Truck size={14} />,
  arrival: <MapPin size={14} />,
  anomaly: <AlertTriangle size={14} />,
  photo: <Camera size={14} />,
  note: <FileText size={14} />,
  processing: <CheckCircle size={14} />,
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function AnomalyBadge({ reason }: { reason: AnomalyReason }) {
  return (
    <span className="inline-block bg-warn-50 text-warn-500 text-xs px-2 py-0.5 rounded-full">
      {anomalyReasonLabels[reason] || reason}
    </span>
  )
}

interface CheckpointTimelineProps {
  checkpoints: Checkpoint[]
}

export default function CheckpointTimeline({ checkpoints }: CheckpointTimelineProps) {
  if (checkpoints.length === 0) return null

  const sorted = [...checkpoints].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-cold-200" />

      {sorted.map((cp) => (
        <div key={cp.id} className="relative pb-4 last:pb-0">
          <div
            className={`absolute left-[-18px] top-1 w-3.5 h-3.5 rounded-full flex items-center justify-center ${dotColorMap[cp.type]}`}
          >
            <Circle size={4} className="text-white fill-white" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400">{iconMap[cp.type]}</span>
              <span className="text-sm font-medium text-slate-700">
                {checkpointTypeLabels[cp.type] || cp.type}
              </span>
              <span className="text-xs text-slate-400 ml-auto">{formatTime(cp.timestamp)}</span>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
              <MapPin size={10} />
              {cp.location}
            </div>

            {cp.note && (
              <p className="text-xs text-slate-600 mt-1">{cp.note}</p>
            )}

            {cp.type === 'anomaly' && cp.anomalyReason && (
              <div className="mt-2">
                <AnomalyBadge reason={cp.anomalyReason} />
              </div>
            )}

            {cp.type === 'photo' && (
              <div className="mt-2">
                {cp.photo ? (
                  <img
                    src={cp.photo}
                    alt="现场照片"
                    className="w-full h-28 object-cover rounded-xl opacity-0 animate-fade-in"
                    onLoad={(e) => {
                      e.currentTarget.classList.remove('opacity-0')
                    }}
                  />
                ) : (
                  <div className="h-28 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Camera size={24} className="text-slate-300" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
