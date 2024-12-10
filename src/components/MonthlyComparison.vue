<script setup lang="ts">
import { ref, watch } from 'vue'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

const props = defineProps<{
  currentMonth: Date
}>()

const emit = defineEmits(['update:currentMonth'])

const loading = ref(true)
const comparison = ref([])

const requestTypes = [
  'Turista',
  'Trabajo',
  'Estudio',
  'Residencia',
  'Peticion',
  'Reagrupacion familiar'
]

const getMonthRange = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const { start, end } = getMonthRange(props.currentMonth)
    
    const q = query(
      collection(db, "clients"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<=", Timestamp.fromDate(end))
    )

    const snapshot = await getDocs(q)
    const clients = snapshot.docs.map(doc => doc.data())
    
    // Initialize counts for all request types
    const typeCounts = requestTypes.reduce((acc, type) => {
      acc[type] = 0
      return acc
    }, {})

    // Count actual occurrences
    clients.forEach(client => {
      if (client.requestType) {
        typeCounts[client.requestType] = (typeCounts[client.requestType] || 0) + 1
      }
    })

    const total = clients.length
    comparison.value = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        label: `Visas ${label}`,
        count,
        percentage: total > 0 ? Math.round((count as number / total) * 100) : 0
      }))
  } catch (error) {
    console.error('Error fetching comparison data:', error)
  } finally {
    loading.value = false
  }
}

const previousMonth = () => {
  const newDate = new Date(props.currentMonth)
  newDate.setMonth(newDate.getMonth() - 1)
  emit('update:currentMonth', newDate)
}

const nextMonth = () => {
  const newDate = new Date(props.currentMonth)
  newDate.setMonth(newDate.getMonth() + 1)
  emit('update:currentMonth', newDate)
}

const formatMonth = (date: Date) => {
  return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
}

watch(() => props.currentMonth, fetchData, { immediate: true })
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <span>Comparativo mes a mes</span>
      <div class="d-flex align-center">
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          @click="previousMonth"
          :disabled="loading"
        ></v-btn>
        <span class="mx-2">{{ formatMonth(currentMonth) }}</span>
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          @click="nextMonth"
          :disabled="loading"
        ></v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <template v-if="!loading">
        <div v-for="(item, index) in comparison" :key="index" class="mb-4">
          <div class="d-flex justify-space-between mb-1">
            <span class="text-body-2">{{ item.label }}</span>
            <span class="text-body-2 font-weight-medium">
              {{ item.count }} ({{ item.percentage }}%)
            </span>
          </div>
          <v-progress-linear
            :model-value="item.percentage"
            :color="index === 0 ? 'primary' : index === 1 ? 'success' : index === 2 ? 'warning' : 'error'"
            height="8"
            rounded
          ></v-progress-linear>
        </div>
        
        <div v-if="comparison.length === 0" class="text-center py-4">
          <v-icon icon="mdi-alert" color="warning" size="40"></v-icon>
          <div class="text-body-1 mt-2">No hay datos para este mes</div>
        </div>
      </template>
      
      <template v-else>
        <v-skeleton-loader
          v-for="i in 6"
          :key="i"
          type="list-item"
          class="mb-4"
        ></v-skeleton-loader>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-progress-linear {
  border-radius: 4px;
}

.v-card-title {
  background-color: rgba(var(--v-theme-primary), 0.05);
  padding: 16px;
}
</style>