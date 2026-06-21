export type WaybillStatus = 'pending' | 'in_transit' | 'completed'

export type CheckpointType = 'photo' | 'note' | 'anomaly' | 'departure' | 'arrival' | 'processing'

export type AnomalyReason = 'door_open' | 'device_shift' | 'insufficient_precool'

export interface Waybill {
  id: string
  waybillNo: string
  status: WaybillStatus
  origin: string
  destination: string
  goodsType: string
  vehiclePlate: string
  deviceId: string
  deviceBound: boolean
  probeOnline: boolean
  currentTemp: number
  tempRange: { min: number; max: number }
  createdAt: string
  updatedAt: string
  handoverCode?: string
}

export interface TemperatureRecord {
  id: string
  waybillId: string
  timestamp: string
  temperature: number
  isNormal: boolean
}

export interface Checkpoint {
  id: string
  waybillId: string
  type: CheckpointType
  timestamp: string
  location: string
  photo?: string
  note?: string
  anomalyReason?: AnomalyReason
  processingNote?: string
  anomalyRef?: string
}

export interface HandoverRecord {
  waybillId: string
  signedAt: string
  signerName: string
  hasOvershoot: boolean
  overshootNote?: string
}
