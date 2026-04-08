import * as echarts from 'echarts/core'
import {
  BarChart,
  CandlestickChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  SankeyChart,
} from 'echarts/charts'
import {
  DataZoomComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  SankeyChart,
  HeatmapChart,
  CandlestickChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  MarkLineComponent,
  DatasetComponent,
  CanvasRenderer,
  LabelLayout,
  UniversalTransition,
])

export { echarts }
