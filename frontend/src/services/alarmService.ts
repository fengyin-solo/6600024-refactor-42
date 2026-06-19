import type { OPCUANode, AlarmEvent } from '../types'

export type AlarmSeverity = AlarmEvent['severity']

export interface AlarmRule {
  nodeId: string
  threshold: number
  operator: '>' | '<' | '>=' | '<=' | '==' | '!='
  severity: AlarmSeverity
  messageTemplate: (value: number, threshold: number, unit?: string) => string
}

export const defaultAlarmRules: AlarmRule[] = [
  {
    nodeId: 'temp_sensor',
    threshold: 28,
    operator: '>',
    severity: 'High',
    messageTemplate: (value, threshold, unit) =>
      `温度过高: ${value}${unit || ''} (阈值: ${threshold}${unit || ''})`
  },
  {
    nodeId: 'pressure_transmitter',
    threshold: 4.0,
    operator: '>',
    severity: 'Critical',
    messageTemplate: (value, threshold, unit) =>
      `压力超限: ${value} ${unit || ''} (阈值: ${threshold} ${unit || ''})`
  },
  {
    nodeId: 'motor_speed',
    threshold: 1550,
    operator: '>',
    severity: 'Medium',
    messageTemplate: (value, threshold, unit) =>
      `电机转速偏高: ${value} ${unit || ''} (阈值: ${threshold} ${unit || ''})`
  }
]

export function evaluateRule(
  value: number | boolean | string,
  rule: AlarmRule
): boolean {
  if (typeof value !== 'number') return false
  switch (rule.operator) {
    case '>': return value > rule.threshold
    case '<': return value < rule.threshold
    case '>=': return value >= rule.threshold
    case '<=': return value <= rule.threshold
    case '==': return value === rule.threshold
    case '!=': return value !== rule.threshold
    default: return false
  }
}

export function findMatchingRules(
  node: OPCUANode,
  value: number | boolean | string,
  rules: AlarmRule[] = defaultAlarmRules
): Array<{ rule: AlarmRule; numericValue: number }> {
  const matches: Array<{ rule: AlarmRule; numericValue: number }> = []
  for (const rule of rules) {
    if (rule.nodeId !== node.id) continue
    if (typeof value !== 'number') continue
    if (evaluateRule(value, rule)) {
      matches.push({ rule, numericValue: value })
    }
  }
  return matches
}

export function createAlarmFromRule(
  node: OPCUANode,
  rule: AlarmRule,
  value: number
): Omit<AlarmEvent, 'id' | 'timestamp' | 'acknowledged'> {
  return {
    nodeId: node.nodeId,
    nodeName: node.name,
    severity: rule.severity,
    message: rule.messageTemplate(value, rule.threshold, node.unit),
    value,
    threshold: rule.threshold
  }
}

export function buildAlarm(
  partial: Omit<AlarmEvent, 'id' | 'timestamp' | 'acknowledged'>
): AlarmEvent {
  return {
    ...partial,
    id: `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    acknowledged: false
  }
}

export function evaluateAlarmsForNode(
  node: OPCUANode,
  value: number | boolean | string,
  rules: AlarmRule[] = defaultAlarmRules
): AlarmEvent[] {
  const matches = findMatchingRules(node, value, rules)
  return matches.map(({ rule, numericValue }) =>
    buildAlarm(createAlarmFromRule(node, rule, numericValue))
  )
}

export function addAlarmToList(alarms: AlarmEvent[], alarm: AlarmEvent, maxSize = 50): AlarmEvent[] {
  const newList = [alarm, ...alarms]
  if (newList.length > maxSize) newList.pop()
  return newList
}

export function acknowledgeAlarmInList(alarms: AlarmEvent[], alarmId: string): AlarmEvent[] {
  return alarms.map(a => (a.id === alarmId ? { ...a, acknowledged: true } : a))
}

export function countActiveAlarms(alarms: AlarmEvent[]): number {
  return alarms.filter(a => !a.acknowledged).length
}

export function countAlarmsBySeverity(alarms: AlarmEvent[], severity: AlarmSeverity): number {
  return alarms.filter(a => a.severity === severity && !a.acknowledged).length
}
