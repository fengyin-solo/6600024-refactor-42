import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OPCUANode, DataValue, AlarmEvent, SubscriptionConfig } from '../types'
import { buildMockNodeTree, simulateNodeUpdate } from '../services/mockDataService'
import {
  evaluateAlarmsForNode,
  addAlarmToList,
  acknowledgeAlarmInList,
  countActiveAlarms,
  countAlarmsBySeverity
} from '../services/alarmService'
import {
  collectAllVariableNodes,
  appendHistoryPoint
} from '../utils/nodeTreeUtils'

export const useOpcuaStore = defineStore('opcua', () => {
  const nodeTree = ref<OPCUANode[]>([])
  const selectedNode = ref<OPCUANode | null>(null)
  const subscriptions = ref<Map<string, SubscriptionConfig>>(new Map())
  const alarms = ref<AlarmEvent[]>([])
  const realTimeData = ref<Map<string, DataValue>>(new Map())
  const isConnected = ref(false)
  const dataHistory = ref<Map<string, Array<{ timestamp: number; value: number }>>>(new Map())

  function initNodeTree() {
    nodeTree.value = buildMockNodeTree()
  }

  function simulateDataUpdate() {
    const nodes = getAllVariableNodes()
    for (const node of nodes) {
      const currentValue = realTimeData.value.get(node.id)?.value ?? node.value
      const { dataValue, newValue } = simulateNodeUpdate(node, currentValue)

      realTimeData.value.set(node.id, dataValue)
      node.value = newValue
      node.quality = dataValue.quality

      const history = dataHistory.value.get(node.id) || []
      dataHistory.value.set(
        node.id,
        appendHistoryPoint(history, dataValue.timestamp, newValue)
      )

      const newAlarms = evaluateAlarmsForNode(node, newValue)
      for (const alarm of newAlarms) {
        alarms.value = addAlarmToList(alarms.value, alarm)
      }
    }
  }

  function getAllVariableNodes(): OPCUANode[] {
    return collectAllVariableNodes(nodeTree.value)
  }

  function selectNode(node: OPCUANode) {
    selectedNode.value = node
  }

  function addSubscription(nodeId: string, config: Partial<SubscriptionConfig> = {}) {
    const subscription: SubscriptionConfig = {
      nodeId,
      publishingInterval: config.publishingInterval || 1000,
      samplingInterval: config.samplingInterval || 500,
      queueSize: config.queueSize || 10,
      discardOldest: config.discardOldest ?? true,
      enabled: true
    }
    subscriptions.value.set(nodeId, subscription)
  }

  function removeSubscription(nodeId: string) {
    subscriptions.value.delete(nodeId)
  }

  function acknowledgeAlarm(alarmId: string) {
    alarms.value = acknowledgeAlarmInList(alarms.value, alarmId)
  }

  function clearAlarms() {
    alarms.value = []
  }

  function connect() {
    isConnected.value = true
    initNodeTree()
  }

  function disconnect() {
    isConnected.value = false
  }

  const activeAlarmsCount = computed(() => countActiveAlarms(alarms.value))
  const criticalAlarmsCount = computed(() => countAlarmsBySeverity(alarms.value, 'Critical'))

  return {
    nodeTree,
    selectedNode,
    subscriptions,
    alarms,
    realTimeData,
    isConnected,
    dataHistory,
    initNodeTree,
    simulateDataUpdate,
    selectNode,
    addSubscription,
    removeSubscription,
    acknowledgeAlarm,
    clearAlarms,
    connect,
    disconnect,
    getAllVariableNodes,
    activeAlarmsCount,
    criticalAlarmsCount
  }
})
