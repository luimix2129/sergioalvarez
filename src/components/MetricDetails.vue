<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const route = useRoute()
const metricType = computed(() => route.params.type as string)
const clients = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCountry = ref('all')
const selectedRequestType = ref('all')

const countries = ['USA', 'Canada', 'Schengen']
const requestTypes = ['Turista', 'Trabajo', 'Estudio', 'Residencia', 'Peticion', 'Reagrupacion familiar']

const headers = [
  { title: 'Número de Caso', key: 'caseNumber', align: 'start', sortable: true },
  { title: 'Cliente', key: 'name', align: 'start', sortable: true },
  { title: 'País', key: 'country', align: 'start', sortable: true },
  { title: 'Tipo', key: 'requestType', align: 'start', sortable: true },
  { title: 'Estado', key: 'status', align: 'start', sortable: true },
  { title: 'Fecha', key: 'createdAt', align: 'start', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' }
]

const metricTitles = {
  'total': 'Total Clientes',
  'pending': 'Casos Pendientes',
  'approved': 'Casos Aprobados',
  'alerts': 'Alertas'
}

const getStatusColor = (status: string) => {
  const colors = {
    'Solicitud Recibida': 'info',
    'En Proceso': 'warning',
    'En Revisión': 'primary',
    'Aprobado': 'success',
    'Rechazado': 'error',
    'Urgente': 'red'
  }
  return colors[status] || 'grey'
}

const fetchClients = async () => {
  loading.value = true
  try {
    let q = collection(db, 'clients')
    
    // Apply metric-specific filters
    switch (metricType.value) {
      case 'pending':
        q = query(q, where('status', '==', 'En Proceso'))
        break
      case 'approved':
        q = query(q, where('status', '==', 'Aprobado'))
        break
      case 'alerts':
        q = query(q, where('status', '==', 'Urgente'))
        break
    }

    const snapshot = await getDocs(q)
    clients.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) || 'N/A'
    }))
  } catch (error) {
    console.error('Error fetching clients:', error)
  } finally {
    loading.value = false
  }
}

const filteredClients = computed(() => {
  return clients.value.filter(client => {
    const matchesSearch = searchQuery.value === '' || 
      client.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      client.caseNumber?.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesCountry = selectedCountry.value === 'all' || client.country === selectedCountry.value
    const matchesType = selectedRequestType.value === 'all' || client.requestType === selectedRequestType.value
    
    return matchesSearch && matchesCountry && matchesType
  })
})

const clearFilters = () => {
  searchQuery.value = ''
  selectedCountry.value = 'all'
  selectedRequestType.value = 'all'
}

onMounted(fetchClients)
</script>

<template>
  <v-container fluid>
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center">
          <v-btn
            icon
            class="mr-4"
            @click="$router.push('/')"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h1 class="text-h4">{{ metricTitles[metricType] }}</h1>
        </div>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              label="Buscar por nombre o número de caso"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              density="comfortable"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="selectedCountry"
              :items="['all', ...countries]"
              label="País"
              hide-details
              density="comfortable"
              :item-title="item => item === 'all' ? 'Todos' : item"
              :item-value="item => item"
            ></v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="selectedRequestType"
              :items="['all', ...requestTypes]"
              label="Tipo de Solicitud"
              hide-details
              density="comfortable"
              :item-title="item => item === 'all' ? 'Todos' : item"
              :item-value="item => item"
            ></v-select>
          </v-col>

          <v-col cols="12" md="2" class="d-flex align-center">
            <v-btn
              color="primary"
              variant="text"
              @click="clearFilters"
              prepend-icon="mdi-filter-off"
            >
              Limpiar Filtros
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredClients"
        :loading="loading"
        hover
      >
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            class="text-uppercase"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="primary"
            @click="$router.push(`/client/${item.id}`)"
          >
            <v-icon>mdi-eye</v-icon>
          </v-btn>
        </template>

        <template v-slot:no-data>
          <div class="d-flex flex-column align-center pa-4">
            <v-icon
              icon="mdi-alert-circle-outline"
              size="48"
              color="grey-lighten-1"
              class="mb-2"
            ></v-icon>
            <span class="text-grey">No se encontraron clientes</span>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<style scoped>
.v-data-table {
  border-radius: 8px;
}

.v-chip {
  font-weight: 600;
}
</style>