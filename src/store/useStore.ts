import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Waybill, WaybillStatus, Checkpoint, HandoverRecord, AnomalyReason, TemperatureRecord } from '@/types'
import { mockWaybills, mockCheckpoints, mockHandoverRecords, mockTemperatureRecords } from '@/data/mock'
import { generateTemperatureRecords } from '@/utils/tempGenerator'
import { getInitialCheckpoints } from '@/utils/checkpointInit'

function generateHandoverCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

interface AppState {
  waybills: Waybill[]
  checkpoints: Record<string, Checkpoint[]>
  handoverRecords: Record<string, HandoverRecord>
  temperatureRecords: Record<string, TemperatureRecord[]>
  activeStatusFilter: WaybillStatus | 'all'
  bindingWaybillId: string | null

  setActiveStatusFilter: (filter: WaybillStatus | 'all') => void
  setBindingWaybillId: (id: string | null) => void
  acceptWaybill: (id: string) => void
  bindDevice: (waybillId: string, plate: string, deviceId: string) => void
  startTransit: (waybillId: string) => void
  addCheckpoint: (waybillId: string, checkpoint: Omit<Checkpoint, 'id' | 'waybillId' | 'timestamp'>) => void
  signHandover: (waybillId: string, signerName: string, overshootNote?: string) => void
  getWaybillById: (id: string) => Waybill | undefined
  getWaybillByHandoverCode: (code: string) => Waybill | undefined
  getCheckpointsForWaybill: (id: string) => Checkpoint[]
  getTemperatureRecords: (waybillId: string) => TemperatureRecord[]
  getTemperatureHasOvershoot: (waybillId: string) => boolean
  generateOrGetHandoverCode: (waybillId: string) => string
  getInitialCheckpointsForWaybill: (waybillId: string) => Checkpoint[]
}

const initialWaybills = mockWaybills.map((wb) => {
  if (wb.status === 'in_transit' || wb.status === 'completed') {
    return { ...wb, handoverCode: generateHandoverCode() }
  }
  return wb
})

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      waybills: initialWaybills,
      checkpoints: mockCheckpoints,
      handoverRecords: mockHandoverRecords,
      temperatureRecords: mockTemperatureRecords,
      activeStatusFilter: 'all',
      bindingWaybillId: null,

      setActiveStatusFilter: (filter) => set({ activeStatusFilter: filter }),

      setBindingWaybillId: (id) => set({ bindingWaybillId: id }),

      acceptWaybill: (id) =>
        set((state) => ({
          waybills: state.waybills.map((w) =>
            w.id === id ? { ...w, status: 'pending' as WaybillStatus } : w
          ),
        })),

      bindDevice: (waybillId, plate, deviceId) =>
        set((state) => {
          const wb = state.waybills.find((w) => w.id === waybillId)
          const code = wb?.handoverCode || generateHandoverCode()
          return {
            waybills: state.waybills.map((w) =>
              w.id === waybillId
                ? { ...w, deviceBound: true, vehiclePlate: plate, deviceId, handoverCode: code, updatedAt: new Date().toISOString() }
                : w
            ),
            bindingWaybillId: null,
          }
        }),

      startTransit: (waybillId) =>
        set((state) => {
          const wb = state.waybills.find((w) => w.id === waybillId)
          const code = wb?.handoverCode || generateHandoverCode()
          return {
            waybills: state.waybills.map((w) =>
              w.id === waybillId
                ? { ...w, status: 'in_transit' as WaybillStatus, handoverCode: code, updatedAt: new Date().toISOString() }
                : w
            ),
            checkpoints: {
              ...state.checkpoints,
              [waybillId]: [
                {
                  id: `cp_${Date.now()}`,
                  waybillId,
                  type: 'departure' as const,
                  timestamp: new Date().toISOString(),
                  location: wb?.origin || '',
                  note: '出发，设备已绑定',
                },
                ...(state.checkpoints[waybillId] || []),
              ],
            },
          }
        }),

      addCheckpoint: (waybillId, checkpoint) =>
        set((state) => {
          const newCp: Checkpoint = {
            ...checkpoint,
            id: `cp_${Date.now()}`,
            waybillId,
            timestamp: new Date().toISOString(),
          }
          return {
            checkpoints: {
              ...state.checkpoints,
              [waybillId]: [newCp, ...(state.checkpoints[waybillId] || [])],
            },
          }
        }),

      signHandover: (waybillId, signerName, overshootNote) =>
        set((state) => {
          const hasOvershoot = get().getTemperatureHasOvershoot(waybillId)
          const wb = state.waybills.find((w) => w.id === waybillId)
          const record: HandoverRecord = {
            waybillId,
            signedAt: new Date().toISOString(),
            signerName,
            hasOvershoot,
            overshootNote,
          }
          return {
            handoverRecords: { ...state.handoverRecords, [waybillId]: record },
            waybills: state.waybills.map((w) =>
              w.id === waybillId
                ? { ...w, status: 'completed' as WaybillStatus, updatedAt: new Date().toISOString() }
                : w
            ),
            checkpoints: {
              ...state.checkpoints,
              [waybillId]: [
                {
                  id: `cp_${Date.now()}`,
                  waybillId,
                  type: 'arrival' as const,
                  timestamp: new Date().toISOString(),
                  location: wb?.destination || '',
                  note: '到达目的地，已签收',
                },
                ...(state.checkpoints[waybillId] || []),
              ],
            },
          }
        }),

      getWaybillById: (id) => get().waybills.find((w) => w.id === id),

      getWaybillByHandoverCode: (code) => get().waybills.find((w) => w.handoverCode === code),

      getCheckpointsForWaybill: (id) => {
        const existing = get().checkpoints[id] || []
        if (existing.length > 0) {
          return existing
        }
        return get().getInitialCheckpointsForWaybill(id)
      },

      getTemperatureRecords: (waybillId) => {
        const state = get()
        const existing = state.temperatureRecords[waybillId]
        if (existing && existing.length > 0) {
          return existing
        }
        const waybill = state.getWaybillById(waybillId)
        if (!waybill) {
          return []
        }
        const records = generateTemperatureRecords(waybill)
        set((s) => ({
          temperatureRecords: {
            ...s.temperatureRecords,
            [waybillId]: records,
          },
        }))
        state.getInitialCheckpointsForWaybill(waybillId)
        return records
      },

      getTemperatureHasOvershoot: (waybillId) => {
        const records = get().getTemperatureRecords(waybillId)
        return records.some((r) => !r.isNormal)
      },

      generateOrGetHandoverCode: (waybillId) => {
        const wb = get().waybills.find((w) => w.id === waybillId)
        if (wb?.handoverCode) return wb.handoverCode
        const code = generateHandoverCode()
        set((state) => ({
          waybills: state.waybills.map((w) =>
            w.id === waybillId ? { ...w, handoverCode: code } : w
          ),
        }))
        return code
      },

      getInitialCheckpointsForWaybill: (waybillId) => {
        const state = get()
        const existing = state.checkpoints[waybillId] || []
        if (existing.length > 0) {
          return existing
        }
        const waybill = state.getWaybillById(waybillId)
        if (!waybill) {
          return []
        }
        const initialCheckpoints = getInitialCheckpoints(waybill)
        if (initialCheckpoints.length > 0) {
          set((s) => ({
            checkpoints: {
              ...s.checkpoints,
              [waybillId]: initialCheckpoints,
            },
          }))
        }
        return initialCheckpoints
      },
    }),
    {
      name: 'cold-chain-storage',
      partialize: (state) => ({
        waybills: state.waybills,
        checkpoints: state.checkpoints,
        handoverRecords: state.handoverRecords,
        temperatureRecords: state.temperatureRecords,
      }),
    }
  )
)
