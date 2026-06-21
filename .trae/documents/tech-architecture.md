## 1. 架构设计

```mermaid
flowchart TB
    subgraph Frontend["前端层 - React + TypeScript"]
        A["运单列表页"]
        B["温度详情页"]
        C["交接签收页"]
        D["Zustand 状态管理"]
        E["Mock 数据服务"]
    end
    subgraph Data["数据层"]
        F["Mock 温度数据"]
        G["Mock 运单数据"]
        H["Mock 设备数据"]
    end
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
```

## 2. 技术说明

- 前端：React@18 + TypeScript + Tailwind CSS@3 + Vite
- 初始化工具：vite-init
- 后端：无（纯前端项目，使用 Mock 数据模拟）
- 数据库：无（使用内存 Mock 数据）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 运单列表页，显示所有运单，支持状态筛选 |
| /waybill/:id | 温度详情页，显示运单温度曲线和打点操作 |
| /waybill/:id/handover | 交接签收页，显示全程温度回顾和签收操作 |

## 4. API 定义

无后端 API，使用 Mock 数据服务。核心数据类型定义：

```typescript
interface Waybill {
  id: string
  waybillNo: string
  status: 'pending' | 'in_transit' | 'completed'
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
}

interface TemperatureRecord {
  id: string
  waybillId: string
  timestamp: string
  temperature: number
  isNormal: boolean
}

interface Checkpoint {
  id: string
  waybillId: string
  type: 'photo' | 'note' | 'anomaly' | 'departure' | 'arrival'
  timestamp: string
  location: string
  photo?: string
  note?: string
  anomalyReason?: 'door_open' | 'device_shift' | 'insufficient_precool'
}

interface HandoverRecord {
  waybillId: string
  signedAt: string
  signerName: string
  hasOvershoot: boolean
  overshootNote?: string
}
```

## 5. 服务端架构图

不适用（纯前端项目）

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    Waybill ||--o{ TemperatureRecord : "has"
    Waybill ||--o{ Checkpoint : "has"
    Waybill ||--o| HandoverRecord : "has"
    Waybill {
        string id PK
        string waybillNo
        string status
        string origin
        string destination
        string goodsType
        string vehiclePlate
        string deviceId
        boolean deviceBound
        boolean probeOnline
        number currentTemp
    }
    TemperatureRecord {
        string id PK
        string waybillId FK
        string timestamp
        number temperature
        boolean isNormal
    }
    Checkpoint {
        string id PK
        string waybillId FK
        string type
        string timestamp
        string location
        string note
        string anomalyReason
    }
    HandoverRecord {
        string waybillId FK
        string signedAt
        string signerName
        boolean hasOvershoot
        string overshootNote
    }
```

### 6.2 数据定义语言

使用 TypeScript Mock 数据，无需 DDL。
