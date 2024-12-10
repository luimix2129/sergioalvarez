<script setup lang="ts">
import { ref } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const chartData = ref({
  labels: ['Aprobadas', 'Rechazadas', 'En Proceso'],
  datasets: [{
    backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
    data: [65, 10, 25]
  }]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
}
</script>

<template>
  <v-card>
    <v-card-title>Estadísticas de Aprobación</v-card-title>
    <v-card-text>
      <div style="height: 300px">
        <Pie :data="chartData" :options="chartOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>