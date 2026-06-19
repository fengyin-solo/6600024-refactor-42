<template>
  <div class="data-dashboard">
    <!-- 仪表盘区域 -->
    <div class="gauges-section">
      <h3 class="section-title">实时仪表</h3>
      <div class="gauges-grid">
        <!-- 温度仪表 -->
        <div class="gauge-card">
          <div class="gauge-label">温度</div>
          <div class="gauge-value" :class="getTempClass(temperature)">
            {{ temperature.toFixed(1) }}
            <span class="gauge-unit">°C</span>
          </div>
          <el-progress
            :percentage="Math.min((temperature / 50) * 100, 100)"
            :color="getTempColor(temperature)"
            :stroke-width="8"
          />
          <div class="gauge-quality">
            <span class="quality-dot" :class="qualityClassOf('temp_sensor')"></span>
            {{ qualityLabelOf('temp_sensor') }}
          </div>
        </div>

        <!-- 压力表 -->
        <div class="gauge-card">
          <div class="gauge-label">压力</div>
          <div class="gauge-value" :class="getPressureClass(pressure)">
            {{ pressure.toFixed(2) }}
            <span class="gauge-unit">MPa</span>
          </div>
          <el-progress
            :percentage="Math.min((pressure / 6) * 100, 100)"
            :color="getPressureColor(pressure)"
            :stroke-width="8"
          />
          <div class="gauge-quality">
            <span class="quality-dot" :class="qualityClassOf('pressure_transmitter')"></span>
            {{ qualityLabelOf('pressure_transmitter') }}
          </div>
        </div>

        <!-- 流量计 -->
        <div class="gauge-card">
          <div class="gauge-label">流量</div>
          <div class="gauge-value text-blue-400">
            {{ flow.toFixed(1) }}
            <span class="gauge-unit">L/min</span>
          </div>
          <el-progress
            :percentage="Math.min((flow / 300) * 100, 100)"
            color="#60a5fa"
            :stroke-width="8"
          />
          <div class="gauge-quality">
            <span class="quality-dot" :class="qualityClassOf('flow_meter')"></span>
            {{ qualityLabelOf('flow_meter') }}
          </div>
        </div>

        <!-- 阀门开度 -->
        <div class="gauge-card">
          <div class="gauge-label">阀门开度</div>
          <div class="gauge-value text-purple-400">
            {{ valvePosition.toFixed(0) }}
            <span class="gauge-unit">%</span>
          </div>
          <el-progress
            :percentage="valvePosition"
            color="#a78bfa"
            :stroke-width="8"
          />
          <div class="gauge-quality">
            <span class="quality-dot" :class="qualityClassOf('valve_position')"></span>
            {{ qualityLabelOf('valve_position') }}
          </div>
        </div>

        <!-- 电机转速 -->
        <div class="gauge-card">
          <div class="gauge-label">电机转速</div>
          <div class="gauge-value" :class="getSpeedClass(motorSpeed)">
            {{ motorSpeed }}
            <span class="gauge-unit">RPM</span>
          </div>
          <el-progress
            :percentage="Math.min((motorSpeed / 2000) * 100, 100)"
            :color="getSpeedColor(motorSpeed)"
            :stroke-width="8"
          />
          <div class="gauge-quality">
            <span class="quality-dot" :class="qualityClassOf('motor_speed')"></span>
            {{ qualityLabelOf('motor_speed') }}
          </div>
        </div>

        <!-- 泵状态 -->
        <div class="gauge-card">
          <div class="gauge-label">泵运行状态</div>
          <div class="gauge-value" :class="pumpStatus ? 'text-green-400' : 'text-red-400'">
            {{ pumpStatus ? '运行中' : '已停止' }}
          </div>
          <div class="pump-indicator" :class="pumpStatus ? 'pump-on' : 'pump-off'">
            <el-icon :size="32"><CircleCheckFilled v-if="pumpStatus" /><CircleCloseFilled v-else /></el-icon>
          </div>
          <div class="gauge-quality">
            <span class="quality-dot" :class="qualityClassOf('pump_status')"></span>
            {{ qualityLabelOf('pump_status') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 趋势图区域 -->
    <div class="charts-section">
      <h3 class="section-title">数据趋势</h3>
      <div class="charts-grid">
        <div class="chart-card">
          <v-chart :option="tempChartOption" autoresize class="chart" />
        </div>
        <div class="chart-card">
          <v-chart :option="pressureChartOption" autoresize class="chart" />
        </div>
        <div class="chart-card">
          <v-chart :option="flowChartOption" autoresize class="chart" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components'
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useOpcuaStore } from '../store/opcua'
import {
  getNodeCurrentValue,
  getNodeCurrentQuality,
  getQualityClass
} from '../utils/nodeTreeUtils'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, TitleComponent])

const store = useOpcuaStore()

interface ThresholdColorConfig {
  thresholds: Array<{ value: number; textClass: string; barColor: string }>
  defaultTextClass: string
  defaultBarColor: string
}

const THRESHOLD_CONFIGS: Record<string, ThresholdColorConfig> = {
  temp_sensor: {
    thresholds: [
      { value: 30, textClass: 'text-red-400', barColor: '#f56c6c' },
      { value: 28, textClass: 'text-yellow-400', barColor: '#e6a23c' }
    ],
    defaultTextClass: 'text-green-400',
    defaultBarColor: '#67c23a'
  },
  pressure_transmitter: {
    thresholds: [
      { value: 4.5, textClass: 'text-red-400', barColor: '#f56c6c' },
      { value: 4.0, textClass: 'text-yellow-400', barColor: '#e6a23c' }
    ],
    defaultTextClass: 'text-cyan-400',
    defaultBarColor: '#06b6d4'
  },
  motor_speed: {
    thresholds: [
      { value: 1600, textClass: 'text-red-400', barColor: '#f56c6c' },
      { value: 1550, textClass: 'text-yellow-400', barColor: '#e6a23c' }
    ],
    defaultTextClass: 'text-emerald-400',
    defaultBarColor: '#34d399'
  }
}

function resolveValueClass(nodeId: string, val: number): string {
  const config = THRESHOLD_CONFIGS[nodeId]
  if (!config) return ''
  for (const t of config.thresholds) {
    if (val > t.value) return t.textClass
  }
  return config.defaultTextClass
}

function resolveBarColor(nodeId: string, val: number): string {
  const config = THRESHOLD_CONFIGS[nodeId]
  if (!config) return '#64748b'
  for (const t of config.thresholds) {
    if (val > t.value) return t.barColor
  }
  return config.defaultBarColor
}

function readNumericValue(nodeId: string, fallback: number): number {
  const v = getNodeCurrentValue(nodeId, store.nodeTree, store.realTimeData)
  return (typeof v === 'number' ? v : fallback)
}

function readBooleanValue(nodeId: string): boolean {
  const v = getNodeCurrentValue(nodeId, store.nodeTree, store.realTimeData)
  return typeof v === 'boolean' ? v : false
}

function qualityLabelOf(nodeId: string): string {
  return getNodeCurrentQuality(nodeId, store.nodeTree, store.realTimeData)
}

function qualityClassOf(nodeId: string): string {
  return getQualityClass(qualityLabelOf(nodeId))
}

const temperature = computed(() => readNumericValue('temp_sensor', 25))
const pressure = computed(() => readNumericValue('pressure_transmitter', 3.5))
const flow = computed(() => readNumericValue('flow_meter', 150))
const valvePosition = computed(() => readNumericValue('valve_position', 75))
const motorSpeed = computed(() => readNumericValue('motor_speed', 1480))
const pumpStatus = computed(() => readBooleanValue('pump_status'))

function getTempClass(val: number) { return resolveValueClass('temp_sensor', val) }
function getTempColor(val: number) { return resolveBarColor('temp_sensor', val) }
function getPressureClass(val: number) { return resolveValueClass('pressure_transmitter', val) }
function getPressureColor(val: number) { return resolveBarColor('pressure_transmitter', val) }
function getSpeedClass(val: number) { return resolveValueClass('motor_speed', val) }
function getSpeedColor(val: number) { return resolveBarColor('motor_speed', val) }

function buildChartOption(title: string, nodeId: string, color: string, unit: string) {
  const history = store.dataHistory.get(nodeId) || []
  const data = history.map(h => [h.timestamp, h.value])

  return {
    title: { text: title, textStyle: { color: '#e0e0e0', fontSize: 14 }, left: 'center' },
    tooltip: { trigger: 'axis' as const },
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'time' as const,
      axisLabel: { color: '#999', formatter: '{HH}:{mm}:{ss}' },
      axisLine: { lineStyle: { color: '#444' } }
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#999', formatter: `{value} ${unit}` },
      splitLine: { lineStyle: { color: '#333' } }
    },
    series: [{
      type: 'line',
      data,
      smooth: true,
      lineStyle: { color, width: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '40' }, { offset: 1, color: color + '05' }] } },
      symbol: 'none'
    }]
  }
}

const tempChartOption = computed(() => buildChartOption('温度趋势', 'temp_sensor', '#67c23a', '°C'))
const pressureChartOption = computed(() => buildChartOption('压力趋势', 'pressure_transmitter', '#06b6d4', 'MPa'))
const flowChartOption = computed(() => buildChartOption('流量趋势', 'flow_meter', '#60a5fa', 'L/min'))
</script>

<style scoped>
.data-dashboard {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #22d3ee;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #06b6d4;
}

.gauges-section {
  margin-bottom: 20px;
}

.gauges-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.gauge-card {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gauge-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.gauge-value {
  font-size: 28px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.gauge-unit {
  font-size: 14px;
  color: #64748b;
  font-weight: normal;
}

.gauge-quality {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.quality-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.quality-good { background: #67c23a; }
.quality-bad { background: #f56c6c; }
.quality-uncertain { background: #e6a23c; }

.pump-indicator {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.pump-on { color: #67c23a; }
.pump-off { color: #f56c6c; }

.charts-section {
  margin-top: 16px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.chart-card {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 8px;
  padding: 12px;
}

.chart {
  height: 220px;
  width: 100%;
}

@media (max-width: 1200px) {
  .gauges-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
}
</style>
