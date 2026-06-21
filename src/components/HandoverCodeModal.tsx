import { useState, useEffect } from 'react'
import { X, QrCode, Copy, Share2, Check } from 'lucide-react'
import QRCode from 'qrcode'
import { useStore } from '@/store/useStore'

interface HandoverCodeModalProps {
  waybillId: string
  handoverCode?: string
  onClose: () => void
}

export default function HandoverCodeModal({ waybillId, handoverCode: propHandoverCode, onClose }: HandoverCodeModalProps) {
  const [handoverCode, setHandoverCode] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [copied, setCopied] = useState<'link' | 'code' | false>(false)
  const generateOrGetHandoverCode = useStore((s) => s.generateOrGetHandoverCode)

  useEffect(() => {
    if (propHandoverCode) {
      setHandoverCode(propHandoverCode)
    } else {
      const code = generateOrGetHandoverCode(waybillId)
      setHandoverCode(code)
    }
  }, [waybillId, propHandoverCode, generateOrGetHandoverCode])

  useEffect(() => {
    if (handoverCode && typeof window !== 'undefined') {
      const url = `${window.location.origin}/receive/${handoverCode}`
      QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: { dark: '#0c4a6e', light: '#ffffff' }
      }).then(dataUrl => setQrCode(dataUrl))
    }
  }, [handoverCode])

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/receive/${handoverCode}`
    : `/receive/${handoverCode}`

  const copyToClipboard = async (text: string, type: 'link' | 'code' = 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
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
              <div className="w-56 h-56 bg-white border-4 border-cold-900 rounded-2xl p-3 mx-auto mb-4 shadow-lg">
                {qrCode ? (
                  <img src={qrCode} alt="交接二维码" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-cold-200 border-t-cold-900 rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-cold-900 mb-3">扫码查看温度档案</p>
              <div className="font-mono text-3xl font-bold tracking-widest text-cold-900">
                {handoverCode}
              </div>
              <div className="text-xs text-slate-400 mt-1">6位交接码</div>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={() => copyToClipboard(handoverCode)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition-colors"
              >
                {copied === 'code' ? (
                  <Check size={14} className="text-safe-500" />
                ) : (
                  <Copy size={14} />
                )}
                复制交接码
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 bg-cold-50 hover:bg-cold-100 text-cold-700 rounded-xl text-xs font-medium transition-colors"
              >
                <Share2 size={14} />
                分享
              </button>
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
                  {copied === 'link' ? <Check size={18} className="text-safe-500" /> : <Copy size={18} />}
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
                className="flex-1 bg-cold-900 text-white rounded-xl min-h-[44px] text-sm font-medium active:bg-cold-800 transition-colors"
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
