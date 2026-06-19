import type { OPCUANode, DataValue } from '../types'

export function buildMockNodeTree(): OPCUANode[] {
  return [
    {
      id: 'server',
      name: 'Server',
      nodeId: 'ns=0;i=2253',
      type: 'Object',
      description: 'OPC-UA 服务器根节点',
      children: [
        {
          id: 'objects',
          name: 'Objects',
          nodeId: 'ns=0;i=85',
          type: 'Object',
          description: '对象文件夹',
          children: [
            {
              id: 'plc_area1',
              name: 'PLC_Area1',
              nodeId: 'ns=2;i=1001',
              type: 'Object',
              description: '1号生产区域 PLC',
              children: [
                {
                  id: 'temp_sensor',
                  name: 'Temperature_Sensor',
                  nodeId: 'ns=2;i=1002',
                  type: 'Variable',
                  dataType: 'Double',
                  value: 25.6,
                  unit: '°C',
                  quality: 'Good',
                  description: '温度传感器'
                },
                {
                  id: 'pressure_transmitter',
                  name: 'Pressure_Transmitter',
                  nodeId: 'ns=2;i=1003',
                  type: 'Variable',
                  dataType: 'Double',
                  value: 3.45,
                  unit: 'MPa',
                  quality: 'Good',
                  description: '压力变送器'
                },
                {
                  id: 'pump_status',
                  name: 'Pump_Status',
                  nodeId: 'ns=2;i=1004',
                  type: 'Variable',
                  dataType: 'Boolean',
                  value: true,
                  quality: 'Good',
                  description: '泵运行状态'
                }
              ]
            },
            {
              id: 'plc_area2',
              name: 'PLC_Area2',
              nodeId: 'ns=2;i=2001',
              type: 'Object',
              description: '2号生产区域 PLC',
              children: [
                {
                  id: 'flow_meter',
                  name: 'Flow_Meter',
                  nodeId: 'ns=2;i=2002',
                  type: 'Variable',
                  dataType: 'Double',
                  value: 156.7,
                  unit: 'L/min',
                  quality: 'Good',
                  description: '流量计'
                },
                {
                  id: 'valve_position',
                  name: 'Valve_Position',
                  nodeId: 'ns=2;i=2003',
                  type: 'Variable',
                  dataType: 'Double',
                  value: 75,
                  unit: '%',
                  quality: 'Good',
                  description: '阀门开度'
                },
                {
                  id: 'motor_speed',
                  name: 'Motor_Speed',
                  nodeId: 'ns=2;i=2004',
                  type: 'Variable',
                  dataType: 'Int32',
                  value: 1480,
                  unit: 'RPM',
                  quality: 'Good',
                  description: '电机转速'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

export function generateNextValue(
  node: OPCUANode,
  currentValue: number | boolean | string
): number | boolean | string {
  switch (node.dataType) {
    case 'Double': {
      const numVal = typeof currentValue === 'number' ? currentValue : parseFloat(String(currentValue))
      const variation = (Math.random() - 0.5) * 2
      return Math.round((numVal + variation) * 100) / 100
    }
    case 'Int32': {
      const numVal = typeof currentValue === 'number' ? currentValue : parseInt(String(currentValue))
      const variation = Math.floor((Math.random() - 0.5) * 10)
      return numVal + variation
    }
    case 'Boolean':
      return Math.random() > 0.95 ? !currentValue : currentValue
    default:
      return currentValue
  }
}

export function generateQuality(): 'Good' | 'Bad' | 'Uncertain' {
  return Math.random() > 0.98 ? 'Uncertain' : 'Good'
}

export function buildDataValue(
  node: OPCUANode,
  value: number | boolean | string,
  quality: 'Good' | 'Bad' | 'Uncertain'
): DataValue {
  const now = Date.now()
  return {
    nodeId: node.nodeId,
    value,
    quality,
    timestamp: now,
    sourceTimestamp: now,
    serverTimestamp: now
  }
}

export function simulateNodeUpdate(
  node: OPCUANode,
  currentValue: number | boolean | string
): { dataValue: DataValue; newValue: number | boolean | string } {
  const newValue = generateNextValue(node, currentValue)
  const quality = generateQuality()
  const dataValue = buildDataValue(node, newValue, quality)
  return { dataValue, newValue }
}
