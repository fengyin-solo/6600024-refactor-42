import type { OPCUANode, DataValue } from '../types'

export function findNodeById(nodes: OPCUANode[], id: string): OPCUANode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

export function collectAllVariableNodes(nodes: OPCUANode[]): OPCUANode[] {
  const variables: OPCUANode[] = []
  function traverse(list: OPCUANode[]) {
    for (const node of list) {
      if (node.type === 'Variable') {
        variables.push(node)
      }
      if (node.children) {
        traverse(node.children)
      }
    }
  }
  traverse(nodes)
  return variables
}

export function collectAllNodes(nodes: OPCUANode[]): OPCUANode[] {
  const all: OPCUANode[] = []
  function traverse(list: OPCUANode[]) {
    for (const node of list) {
      all.push(node)
      if (node.children) {
        traverse(node.children)
      }
    }
  }
  traverse(nodes)
  return all
}

export function getNodeCurrentValue(
  nodeId: string,
  nodeTree: OPCUANode[],
  realTimeData: Map<string, DataValue>
): number | boolean | string | undefined {
  const data = realTimeData.get(nodeId)
  if (data) return data.value
  const node = findNodeById(nodeTree, nodeId)
  return node?.value
}

export function getNodeCurrentQuality(
  nodeId: string,
  nodeTree: OPCUANode[],
  realTimeData: Map<string, DataValue>
): 'Good' | 'Bad' | 'Uncertain' | 'Unknown' {
  const data = realTimeData.get(nodeId)
  if (data) return data.quality
  const node = findNodeById(nodeTree, nodeId)
  return node?.quality ?? 'Unknown'
}

export function getQualityClass(quality: string): string {
  if (quality === 'Good') return 'quality-good'
  if (quality === 'Bad') return 'quality-bad'
  return 'quality-uncertain'
}

export function appendHistoryPoint(
  history: Array<{ timestamp: number; value: number }>,
  timestamp: number,
  value: number | boolean | string,
  maxSize = 100
): Array<{ timestamp: number; value: number }> {
  const numericValue = typeof value === 'number' ? value : 0
  const next = [...history, { timestamp, value: numericValue }]
  if (next.length > maxSize) next.shift()
  return next
}
