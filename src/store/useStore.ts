import { create } from 'zustand'
import type { Waybill, WaybillStatus, Checkpoint, HandoverRecord } from '@/types'
import { mockWaybills, mockCheckpoints, mockHandoverRecords, mockTemperatureRecords } from '@/data/mock'

interface AppState {
  waybills: Waybill[]
  checkpoints: Record<string, Checkpoint[]>
  handoverRecords: Record<string, HandoverRecord>
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
  getCheckpointsForWaybill: (id: string) => Checkpoint[]
  getTemperatureHasOvershoot: (waybillId: string) => boolean
}

export const useStore = create<AppState>((set, get) => ({
  waybills: mockWaybills,
  checkpoints: mockCheckpoints,
  handoverRecords: mockHandoverRecords,
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
    set((state) => ({
      waybills: state.waybills.map((w) =>
        w.id === waybillId
          ? { ...w, deviceBound: true, vehiclePlate: plate, deviceId }
          : w
      ),
      bindingWaybillId: null,
    })),

  startTransit: (waybillId) =>
    set((state) => {
      const wb = state.waybills.find((w) => w.id === waybillId)
      return {
        waybills: state.waybills.map((w) =>
          w.id === waybillId
            ? { ...w, status: 'in_transit' as WaybillStatus, updatedAt: new Date().toISOString() }
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

  getCheckpointsForWaybill: (id) => get().checkpoints[id] || [],

  getTemperatureHasOvershoot: (waybillId) => {
    const records = mockTemperatureRecords[waybillId] || []
    return records.some((r) => !r.isNormal)
  },
}))
