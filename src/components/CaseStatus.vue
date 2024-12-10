<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps(['clients', 'searchQuery'])
const router = useRouter()

const filteredClients = ref([])
const loading = ref(true)
const selectedStatus = ref('all')

const headers = [
  { title: 'Número de Caso', key: 'caseNumber', align: 'start', sortable: true },
  { title: 'Cliente', key: 'name', align: 'start', sortable: true },
  { title: 'País', key: 'country', align: 'start', sortable: true },
  { title: 'Tipo', key: 'requestType', align: 'start', sortable: true },
  { title: 'Estado', key: 'status', align: 'start', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' }
]

const statuses = [
  { title: 'Todos', value: 'all' },
  { title: 'Solicitud Recibida', value: 'Solicitud Recibida' },
  { title: 'En Proceso', value: 'En Proceso' },
  { title: 'En Revisión', value: 'En Revisión' },
  { title: 'Aprobado', value: 'Aprobado' },
  { title: 'Rechazado', value: 'Rechazado' },
  { title: 'Urgente', value: 'Urgente' }
]

const filterClients = () => {
  if (!props.clients) {
    filteredClients.value = []
    return
  }

  filteredClients.value = props.clients.filter(client => {
    const searchLower = (props.searchQuery || '').toLowerCase()
    const matchesSearch = 
      client.name?.toLowerCase().includes(searchLower) ||
      client.caseNumber?.toLowerCase().includes(searchLower) ||
      client.country?.toLowerCase().includes(searchLower) ||
      client.requestType?.toLowerCase().includes(searchLower) ||
      client.status?.toLowerCase().includes(searchLower)
    
    const matchesStatus = selectedStatus.value === 'all' || client.status === selectedStatus.value
    
    return matchesSearch && matchesStatus
  })
  loading.value = false
}

watch(() => props.searchQuery, filterClients)
watch(() => props.clients, filterClients, { immediate: true })
watch(selectedStatus, filterClients)

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

const viewClientDetails = (client) => {
  router.push(`/client/${client.id}`)
}

const emit = defineEmits(['refresh-clients'])

const refreshClients = () => {
  emit('refresh-clients')
}
</script>

<template>
  <v-container fluid class="pa-6">
    <v-row class="mb-6" align="center" justify="space-between">
      <v-col cols="12" sm="4">
        <h2 class="text-h5">Clientes y Casos</h2>
      </v-col>
      <v-col cols="auto" class="d-flex gap-4">
        <v-btn
          color="primary"
          variant="text"
          prepend-icon="mdi-refresh"
          @click="refreshClients"
          :loading="loading"
        >
          Actualizar
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="$router.push('/client-form')"
        >
          Agregar Nuevo Cliente
        </v-btn>
      </v-col>
    </v-row>

    <v-card>
      <!-- Filters Section -->
      <v-card-text class="py-4">
        <v-row align="center">
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              :model-value="props.searchQuery"
              @update:model-value="$emit('update:searchQuery', $event)"
              label="Buscar por # caso, nombre, país o tipo"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="selectedStatus"
              :items="statuses"
              item-title="title"
              item-value="value"
              label="Filtrar por Estado"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              prepend-inner-icon="mdi-filter"
            >
              <template v-slot:item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                  <template v-slot:prepend>
                    <v-chip
                      v-if="item.raw.value !== 'all'"
                      :color="getStatusColor(item.raw.value)"
                      size="small"
                      class="mr-2"
                    >
                      {{ item.raw.title }}
                    </v-chip>
                  </template>
                  <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

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
            @click="viewClientDetails(item)"
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

        <template v-slot:loading>
          <v-skeleton-loader
            v-for="n in 5"
            :key="n"
            type="list-item-avatar-three-line"
            class="mb-2"
          ></v-skeleton-loader>
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

.v-card-text {
  padding-bottom: 0;
}
</style>