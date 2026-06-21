import { useState, useEffect } from 'react'
import { X, QrCode, Copy, Share2, Check } from 'lucide-react'
import { useStore } from '@/store/useStore'

interface HandoverCodeModalProps {
  waybillId: string
  handoverCode?: string
  onClose: () => void
}

function QrCodePattern({ code }: { code: string }) {
  const size = 21
  const cells: boolean[][] = []

  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = ((hash << 5) - hash) + code.charCodeAt(i)
    hash |= 0
  }

  for (let i = 0; i < size; i++) {
    cells[i] = []
    for (let j = 0; j < size; j++) {
      const isCorner =
        (i < 7 && j < 7) ||
        (i < 7 && j >= size - 7) ||
        (i >= size - 7 && j < 7)

      if (isCorner) {
        const ci = i < 7 ? i : size - 1 - i
        const cj = j < 7 ? j : size - 1 - j
        const isOuter = ci === 0 || ci === 6 || cj === 0 || cj === 6
        const isInner = ci >= 2 && ci <= 4 && cj >= 2 && cj <= 4
        cells[i][j] = isOuter || isInner
      } else {
        const pseudo = Math.abs(Math.sin(i * 7.1 + j * 13.3 + hash * 0.001) * 10000)
        cells[i][j] = pseudo % 2 === 0
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      {cells.map((row, i) =>
        row.map((filled, j) =>
          filled ? (
            <rect key={`${i}-${j}`} x={j} y={i} width={1} height={1} fill="#0f172a" />
          ) : null
        )
      )}
    </svg>
  )
}

export default function HandoverCodeModal({ waybillId, handoverCode: propHandoverCode, onClose }: HandoverCodeModalProps) {
  const [handoverCode, setHandoverCode] = useState('')
  const [copied, setCopied] = useState(false)
  const generateOrGetHandoverCode = useStore((s) => s.generateOrGetHandoverCode)

  useEffect(() => {
    if (propHandoverCode) {
      setHandoverCode(propHandoverCode)
    } else {
      const code = generateOrGetHandoverCode(waybillId)
      setHandoverCode(code)
    }
  }, [waybillId, propHandoverCode, generateOrGetHandoverCode])

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/receive/${handoverCode}`
    : `/receive/${handoverCode}`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '冷链运输温度档案',
          text: `请使用交接码 ${handoverCode} 查询冷链运输温度档案`,
          url: fullUrl,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      copyToClipboard(fullUrl)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 animate-fade-in z-40" onClick={onClose} />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md animate-fade-in shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <QrCode size={20} className="text-cold-600" />
              <h3 className="text-lg font-semibold text-slate-800">交接码</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-36 h-36 bg-white border-4 border-cold-100 rounded-2xl p-3 mx-auto mb-4">
                {handoverCode && <QrCodePattern code={handoverCode} />}
              </div>
              <p className="text-sm text-slate-500 mb-2">扫码查看</p>
              <div className="font-mono text-3xl font-bold tracking-widest text-cold-600">
                {handoverCode}
              </div>
              <div className="text-xs text-slate-400 mt-1">6位交接码</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-slate-600 mb-2 flex items-center gap-1">
                <Share2 size={14} />
                链接地址
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 truncate">
                  {fullUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(fullUrl)}
                  className="p-2 text-cold-600 hover:bg-cold-50 rounded-lg transition-colors shrink-0"
                  title="复制链接"
                >
                  {copied ? <Check size={18} className="text-safe-500" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="text-sm text-slate-500 mb-6 leading-relaxed">
              请让收货人扫描二维码或在浏览器打开链接，即可查看全程温度档案并签收。
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 bg-cold-50 text-cold-600 rounded-xl min-h-[44px] text-sm font-medium flex items-center justify-center gap-2 active:bg-cold-100 transition-colors"
              >
                <Share2 size={18} />
                发送给收货人
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-cold-500 text-white rounded-xl min-h-[44px] text-sm font-medium active:bg-cold-600 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
