import type { Waybill, Checkpoint } from '@/types'

export function getInitialCheckpoints(waybill: Waybill): Checkpoint[] {
  if (waybill.status !== 'pending') {
    return []
  }

  if (waybill.deviceBound) {
    return [
      {
        id: `cp_init_${waybill.id}`,
        waybillId: waybill.id,
        type: 'note',
        timestamp: waybill.createdAt,
        location: waybill.origin,
        note: '设备已绑定，装车中，温度正常',
      },
    ]
  }

  return [
    {
      id: `cp_init_${waybill.id}`,
      waybillId: waybill.id,
      type: 'note',
      timestamp: waybill.createdAt,
      location: waybill.origin,
      note: '运单已创建，等待司机绑定温度设备',
    },
  ]
}
