<template>
  <v-container fluid>
    <!-- Saludo al usuario -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h2 class="text-h4 font-weight-medium">
          Hola, {{ userFirstName }}
        </h2>
      </v-col>
    </v-row>

    <!-- Métricas principales -->
    <v-row>
      <v-col cols="12" md="3">
        <v-card color="primary" dark class="metric-card" @click="navigateToMetric('total')">
          <v-card-text class="metric-content">
            <div class="text-subtitle-1">Total Clientes</div>
            <div class="text-h4 white--text">{{ totalClients }}</div>
            <div class="text-caption">+15% respecto al mes anterior</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="warning" dark class="metric-card" @click="navigateToMetric('pending')">
          <v-card-text class="metric-content">
            <div class="text-subtitle-1">Casos Pendientes</div>
            <div class="text-h4 white--text">{{ pendingCases }}</div>
            <div class="text-caption">Requieren atención</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="success" dark class="metric-card" @click="navigateToMetric('approved')">
          <v-card-text class="metric-content">
            <div class="text-subtitle-1">Casos Aprobados</div>
            <div class="text-h4 white--text">{{ approvedCases }}</div>
            <div class="text-caption">Este mes</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="error" dark class="metric-card" @click="navigateToMetric('alerts')">
          <v-card-text class="metric-content">
            <div class="text-subtitle-1">Alertas</div>
            <div class="text-h4 white--text">{{ alerts }}</div>
            <div class="text-caption">Casos urgentes</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Gráfico y Comparativo -->
    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>
            Flujo de casos mensual
            <v-spacer></v-spacer>
            <v-chip color="success">+15%</v-chip>
          </v-card-title>
          <v-card-text>
            <div style="height: 300px">
              <Line :data="monthlyData" :options="chartOptions" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Comparativo mes a mes</span>
            <div>
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                @click="previousMonth"
              ></v-btn>
              <span class="mx-2">{{ formatMonth(currentMonth) }}</span>
              <v-btn
                icon="mdi-chevron-right"
                variant="text"
                @click="nextMonth"
              ></v-btn>
            </div>
          </v-card-title>
          <v-card-text>
            <div v-for="(item, index) in monthlyComparison" :key="index" class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <span>{{ item.label }}</span>
                <span>{{ item.count }} ({{ item.percentage }}%)</span>
              </div>
              <v-progress-linear
                :model-value="item.percentage"
                :color="index === 0 ? 'primary' : index === 1 ? 'success' : index === 2 ? 'warning' : 'error'"
                height="8"
              ></v-progress-linear>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Calendar Section -->
    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <Calendar :clients="clients" />
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-history" class="mr-2"></v-icon>
            Últimas Modificaciones
          </v-card-title>
          <v-card-text>
            <v-timeline density="compact" align="start">
              <v-timeline-item
                v-for="mod in recentModifications"
                :key="mod.timestamp"
                :dot-color="mod.type === 'status' ? 'warning' : 'primary'"
                size="small"
              >
                <template v-slot:opposite>
                  <div class="text-caption">{{ getTimeAgo(mod.timestamp) }}</div>
                </template>
                <div class="d-flex flex-column">
                  <div class="text-subtitle-2">{{ mod.clientName }}</div>
                  <div class="text-body-2">
                    {{ mod.description }}
                    <v-chip
                      v-if="mod.type === 'status'"
                      size="x-small"
                      :color="getActivityColor(mod.newValue)"
                      class="ml-2"
                    >
                      {{ mod.newValue }}
                    </v-chip>
                  </div>
                  <div class="text-caption text-grey">
                    {{ formatDateTime(mod.timestamp) }} por {{ mod.modifiedBy }}
                  </div>
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import Calendar from './Calendar.vue'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps(['searchQuery', 'clients'])
const router = useRouter()

const totalClients = ref(0)
const pendingCases = ref(0)
const approvedCases = ref(0)
const alerts = ref(0)
const currentMonth = ref(new Date())
const monthlyComparison = ref([])

const userFirstName = computed(() => {
  const fullName = localStorage.getItem('currentUser') || ''
  return fullName.split(' ')[0]
})

// Sample data for the monthly flow chart
const sampleMonthlyData = {
  labels: ['1 Mar', '5 Mar', '10 Mar', '15 Mar', '20 Mar', '25 Mar', '30 Mar'],
  data: [3, 5, 4, 6, 8, 7, 9]
}

const monthlyData = ref({
  labels: sampleMonthlyData.labels,
  datasets: [{
    label: 'Casos Procesados',
    data: sampleMonthlyData.data,
    fill: true,
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    tension: 0.4,
    pointRadius: 4,
    pointBackgroundColor: '#4CAF50'
  }]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      },
      suggestedMax: 10,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    }
  }
}

const recentModifications = computed(() => {
  if (!props.clients) return []
  
  const modifications = props.clients.reduce((acc, client) => {
    const clientMods = client.modifications?.map(mod => ({
      ...mod,
      clientName: client.name,
      clientId: client.id
    })) || []
    return [...acc, ...clientMods]
  }, [])
  
  return modifications.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
})

const navigateToMetric = (type: string) => {
  router.push(`/metric/${type}`)
}

const previousMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1)
  updateMonthlyStats()
}

const nextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1)
  updateMonthlyStats()
}

const formatMonth = (date: Date) => {
  return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
}

const updateMonthlyStats = async () => {
  // Sample data for monthly comparison
  monthlyComparison.value = [
    { label: 'Visas Residencia', count: 2, percentage: 50 },
    { label: 'Visas Peticion', count: 1, percentage: 25 },
    { label: 'Visas Reagrupacion familiar', count: 1, percentage: 25 },
    { label: 'Visas Turista', count: 0, percentage: 0 },
    { label: 'Visas Trabajo', count: 0, percentage: 0 },
    { label: 'Visas Estudio', count: 0, percentage: 0 }
  ]
}

const updateMetrics = async () => {
  if (props.clients) {
    totalClients.value = props.clients.length
    pendingCases.value = props.clients.filter(client => client.status === 'En Proceso').length
    approvedCases.value = props.clients.filter(client => client.status === 'Aprobado').length
    alerts.value = props.clients.filter(client => client.status === 'Urgente').length
  }
}

const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((new Date() - timestamp) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' años'
  
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' meses'
  
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' días'
  
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' horas'
  
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' minutos'
  
  return Math.floor(seconds) + ' segundos'
}

const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getActivityColor = (type: string) => {
  const colors = {
    'Captura de Huella': '#1976D2',
    'Cita Consular': '#4CAF50',
    'Entrega de Documentos': '#FFA000',
    'Entrevista': '#E91E63'
  }
  return colors[type] || '#757575'
}

onMounted(() => {
  updateMetrics()
  updateMonthlyStats()
})

watch(() => props.clients, () => {
  updateMetrics()
  updateMonthlyStats()
}, { deep: true })
</script>

<style scoped>
.metric-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
}

.metric-content {
  color: white !important;
}

.metric-content .text-h4 {
  color: white !important;
  font-size: 2.5rem !important;
  font-weight: 500;
}

.metric-content .text-subtitle-1,
.metric-content .text-caption {
  color: rgba(255, 255, 255, 0.9) !important;
}

.v-card-text {
  padding: 16px;
}

.progress-label {
  font-size: 0.875rem;
}

.v-timeline-item {
  margin-bottom: 8px;
}

.v-timeline-item .text-caption {
  min-width: 80px;
}

.text-h4 {
  color: #091545;
  margin-bottom: 0;
}
</style>