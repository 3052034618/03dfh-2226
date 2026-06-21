import type { Waybill, TemperatureRecord } from '@/types'

export function generateTempData(
  waybillId: string,
  baseTemp: number,
  minTemp: number,
  maxTemp: number,
  count: number,
  hasAnomaly: boolean
): TemperatureRecord[] {
  const records: TemperatureRecord[] = []
  const now = Date.now()
  const interval = 600000
  const anomalyStart = Math.floor(count * 0.4)
  const anomalyEnd = anomalyStart + Math.floor(count * 0.1)

  for (let i = 0; i < count; i++) {
    let temp: number
    if (hasAnomaly && i >= anomalyStart && i <= anomalyEnd) {
      temp = maxTemp + 2 + Math.random() * 4
    } else {
      temp = baseTemp + (Math.random() - 0.5) * (maxTemp - minTemp) * 0.3
    }
    temp = Math.round(temp * 10) / 10
    records.push({
      id: `temp_${waybillId}_${i}`,
      waybillId,
      timestamp: new Date(now - (count - i) * interval).toISOString(),
      temperature: temp,
      isNormal: temp >= minTemp && temp <= maxTemp,
    })
  }
  return records
}

export function generateTemperatureRecords(waybill: Waybill): TemperatureRecord[] {
  const { id, currentTemp, tempRange, status } = waybill
  const { min: minTemp, max: maxTemp } = tempRange

  if (status === 'pending') {
    return generateTempData(id, currentTemp, minTemp, maxTemp, 30, false)
  }

  if (status === 'in_transit') {
    return generateTempData(id, currentTemp, minTemp, maxTemp, 60, true)
  }

  return generateTempData(id, currentTemp, minTemp, maxTemp, 80, Math.random() > 0.5)
}

export function getOrCreateTempRecords(
  waybill: Waybill,
  existing?: TemperatureRecord[]
): TemperatureRecord[] {
  if (existing && existing.length > 0) {
    return existing
  }
  return generateTemperatureRecords(waybill)
}
