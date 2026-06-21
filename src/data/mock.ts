import type { Waybill, TemperatureRecord, Checkpoint, HandoverRecord } from '@/types'

export const mockWaybills: Waybill[] = [
  {
    id: 'wb001',
    waybillNo: 'LD-2026-0601',
    status: 'pending',
    origin: '上海浦东冷库',
    destination: '南京江宁配送中心',
    goodsType: '冷冻肉类',
    vehiclePlate: '沪A·88562',
    deviceId: 'TP-3201',
    deviceBound: false,
    probeOnline: true,
    currentTemp: -18.2,
    tempRange: { min: -22, max: -15 },
    createdAt: '2026-06-21T06:00:00Z',
    updatedAt: '2026-06-21T06:00:00Z',
  },
  {
    id: 'wb002',
    waybillNo: 'LD-2026-0602',
    status: 'pending',
    origin: '苏州工业园区冷库',
    destination: '杭州余杭物流园',
    goodsType: '冷藏乳制品',
    vehiclePlate: '苏E·33147',
    deviceId: 'TP-4407',
    deviceBound: false,
    probeOnline: true,
    currentTemp: 3.1,
    tempRange: { min: 0, max: 8 },
    createdAt: '2026-06-21T07:30:00Z',
    updatedAt: '2026-06-21T07:30:00Z',
  },
  {
    id: 'wb003',
    waybillNo: 'LD-2026-0598',
    status: 'in_transit',
    origin: '北京大兴冷库',
    destination: '天津武清配送站',
    goodsType: '速冻食品',
    vehiclePlate: '京B·77230',
    deviceId: 'TP-2189',
    deviceBound: true,
    probeOnline: true,
    currentTemp: -20.5,
    tempRange: { min: -25, max: -18 },
    createdAt: '2026-06-20T22:00:00Z',
    updatedAt: '2026-06-21T08:15:00Z',
  },
  {
    id: 'wb004',
    waybillNo: 'LD-2026-0595',
    status: 'in_transit',
    origin: '广州白云冷库',
    destination: '深圳宝安物流港',
    goodsType: '冷藏蔬果',
    vehiclePlate: '粤B·55981',
    deviceId: 'TP-5512',
    deviceBound: true,
    probeOnline: false,
    currentTemp: 6.8,
    tempRange: { min: 2, max: 8 },
    createdAt: '2026-06-20T20:00:00Z',
    updatedAt: '2026-06-21T07:50:00Z',
  },
  {
    id: 'wb005',
    waybillNo: 'LD-2026-0590',
    status: 'completed',
    origin: '成都青白江冷库',
    destination: '重庆渝北配送中心',
    goodsType: '冷冻水产',
    vehiclePlate: '川A·66291',
    deviceId: 'TP-1204',
    deviceBound: true,
    probeOnline: true,
    currentTemp: -19.0,
    tempRange: { min: -22, max: -15 },
    createdAt: '2026-06-19T18:00:00Z',
    updatedAt: '2026-06-20T06:00:00Z',
  },
  {
    id: 'wb006',
    waybillNo: 'LD-2026-0588',
    status: 'completed',
    origin: '武汉东西湖冷库',
    destination: '长沙望城物流园',
    goodsType: '冷藏药品',
    vehiclePlate: '鄂A·44028',
    deviceId: 'TP-6678',
    deviceBound: true,
    probeOnline: true,
    currentTemp: 4.5,
    tempRange: { min: 2, max: 8 },
    createdAt: '2026-06-19T14:00:00Z',
    updatedAt: '2026-06-19T23:30:00Z',
  },
]

function generateTempData(
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

export const mockTemperatureRecords: Record<string, TemperatureRecord[]> = {
  wb003: generateTempData('wb003', -20.5, -25, -18, 60, true),
  wb004: generateTempData('wb004', 6.8, 2, 8, 60, true),
  wb005: generateTempData('wb005', -19.0, -22, -15, 50, false),
  wb006: generateTempData('wb006', 4.5, 2, 8, 40, true),
}

export const mockCheckpoints: Record<string, Checkpoint[]> = {
  wb003: [
    {
      id: 'cp001',
      waybillId: 'wb003',
      type: 'departure',
      timestamp: '2026-06-20T22:10:00Z',
      location: '北京大兴冷库 出口',
      note: '装车完成，车厢预冷达标',
    },
    {
      id: 'cp002',
      waybillId: 'wb003',
      type: 'anomaly',
      timestamp: '2026-06-21T01:30:00Z',
      location: '京津高速 武清服务区',
      note: '服务区短暂停车检查',
      anomalyReason: 'door_open',
    },
    {
      id: 'cp003',
      waybillId: 'wb003',
      type: 'photo',
      timestamp: '2026-06-21T03:00:00Z',
      location: '京津高速 廊坊段',
      note: '温度正常，继续行驶',
    },
    {
      id: 'cp004',
      waybillId: 'wb003',
      type: 'note',
      timestamp: '2026-06-21T06:45:00Z',
      location: '天津武清区',
      note: '距离目的地约30公里',
    },
  ],
  wb004: [
    {
      id: 'cp005',
      waybillId: 'wb004',
      type: 'departure',
      timestamp: '2026-06-20T20:15:00Z',
      location: '广州白云冷库 出口',
      note: '装车完成',
    },
    {
      id: 'cp006',
      waybillId: 'wb004',
      type: 'anomaly',
      timestamp: '2026-06-21T00:00:00Z',
      location: '广深高速 东莞段',
      note: '温度记录仪显示异常，设备可能移位',
      anomalyReason: 'device_shift',
    },
  ],
  wb005: [
    {
      id: 'cp007',
      waybillId: 'wb005',
      type: 'departure',
      timestamp: '2026-06-19T18:10:00Z',
      location: '成都青白江冷库 出口',
      note: '装车完成，温度正常',
    },
    {
      id: 'cp008',
      waybillId: 'wb005',
      type: 'arrival',
      timestamp: '2026-06-20T05:50:00Z',
      location: '重庆渝北配送中心',
      note: '安全到达，温度全程达标',
    },
  ],
  wb006: [
    {
      id: 'cp009',
      waybillId: 'wb006',
      type: 'departure',
      timestamp: '2026-06-19T14:10:00Z',
      location: '武汉东西湖冷库 出口',
      note: '药品装车完成，预冷达标',
    },
    {
      id: 'cp010',
      waybillId: 'wb006',
      type: 'anomaly',
      timestamp: '2026-06-19T18:30:00Z',
      location: '京港澳高速 咸宁段',
      note: '短时开门补充冰袋',
      anomalyReason: 'door_open',
    },
    {
      id: 'cp011',
      waybillId: 'wb006',
      type: 'arrival',
      timestamp: '2026-06-19T23:20:00Z',
      location: '长沙望城物流园',
      note: '到达目的地',
    },
  ],
}

export const mockHandoverRecords: Record<string, HandoverRecord> = {
  wb005: {
    waybillId: 'wb005',
    signedAt: '2026-06-20T06:00:00Z',
    signerName: '李明（收货）',
    hasOvershoot: false,
  },
  wb006: {
    waybillId: 'wb006',
    signedAt: '2026-06-19T23:30:00Z',
    signerName: '王芳（收货）',
    hasOvershoot: true,
    overshootNote: '短时开门补充冰袋导致温度短暂升高，已恢复正常，货物品质未受影响。',
  },
}

export const anomalyReasonLabels: Record<string, string> = {
  door_open: '短时开门',
  device_shift: '设备移位',
  insufficient_precool: '车厢预冷不足',
}

export const checkpointTypeLabels: Record<string, string> = {
  departure: '出发',
  arrival: '到达',
  photo: '照片记录',
  note: '备注',
  anomaly: '异常上报',
  processing: '处理记录',
}

export const statusLabels: Record<string, string> = {
  pending: '待执行',
  in_transit: '在途',
  completed: '已完成',
}
