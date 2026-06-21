import type { TemperatureRecord } from '@/types'

export interface OvershootSection {
  start: string
  end: string
  maxTemp: number
  durationMin: number
}

export function detectOvershootSections(records: TemperatureRecord[]): OvershootSection[] {
  const sections: OvershootSection[] = []
  if (records.length === 0) return sections

  let i = 0
  while (i < records.length) {
    if (!records[i].isNormal) {
      const startIdx = i
      let maxTemp = records[i].temperature
      while (i < records.length && !records[i].isNormal) {
        if (records[i].temperature > maxTemp) {
          maxTemp = records[i].temperature
        }
        i++
      }
      const endIdx = i - 1
      const startTs = records[startIdx].timestamp
      const endTs = records[endIdx].timestamp
      const durationMin = Math.round(
        (new Date(endTs).getTime() - new Date(startTs).getTime()) / 60000
      )
      sections.push({
        start: startTs,
        end: endTs,
        maxTemp: Math.round(maxTemp * 10) / 10,
        durationMin,
      })
    } else {
      i++
    }
  }
  return sections
}
