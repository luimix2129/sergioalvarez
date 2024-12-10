<script setup lang="ts">
import { ref } from 'vue'
import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const clients = ref([])
const loading = ref(true)
const dialog = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')
const isEditing = ref(false)
const editingId = ref(null)

const newClient = ref({
  name: '',
  type: '',
  total: '',
  status: ''
})

const types = ['Individual', 'Pareja']
const statuses = [
  'Pendiente de pago',
  'En espera de algun documento',
  'pasaporte vencido',
  'Pago realizado',
  'Otro'
]

const headers = [
  { title: 'Nombre', key: 'name', align: 'start', sortable: true },
  { title: 'Tipo', key: 'type', align: 'start', sortable: true },
  { title: 'Total', key: 'total', align: 'start', sortable: true },
  { title: 'Estatus', key: 'status', align: 'start', sortable: true },
  { title: 'Fecha', key: 'createdAt', align: 'start', sortable: true },
  { title: 'Acciones', key: 'actions', align: 'end', sortable: false }
]

const fetchClients = async () => {
  loading.value = true
  try {
    const querySnapshot = await getDocs(collection(db, "pendingPayments"))
    clients.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) || 'N/A'
    }))
  } catch (error) {
    console.error('Error fetching clients:', error)
  } finally {
    loading.value = false
  }
}

const addClient = async () => {
  try {
    const clientData = {
      ...newClient.value,
      createdAt: serverTimestamp(),
      total: parseFloat(newClient.value.total)
    }

    await addDoc(collection(db, "pendingPayments"), clientData)
    dialog.value = false
    snackbarMessage.value = 'Cliente agregado exitosamente'
    snackbar.value = true
    newClient.value = { name: '', type: '', total: '', status: '' }
    await fetchClients()
  } catch (error) {
    console.error('Error adding client:', error)
    snackbarMessage.value = 'Error al agregar el cliente'
    snackbar.value = true
  }
}

const editClient = (client) => {
  isEditing.value = true
  editingId.value = client.id
  newClient.value = {
    name: client.name,
    type: client.type,
    total: client.total.toString(),
    status: client.status
  }
  dialog.value = true
}

const updateClient = async () => {
  try {
    const clientData = {
      ...newClient.value,
      total: parseFloat(newClient.value.total),
      lastModified: serverTimestamp()
    }

    const clientRef = doc(db, "pendingPayments", editingId.value)
    await updateDoc(clientRef, clientData)

    dialog.value = false
    isEditing.value = false
    editingId.value = null
    snackbarMessage.value = 'Cliente actualizado exitosamente'
    snackbar.value = true
    newClient.value = { name: '', type: '', total: '', status: '' }
    await fetchClients()
  } catch (error) {
    console.error('Error updating client:', error)
    snackbarMessage.value = 'Error al actualizar el cliente'
    snackbar.value = true
  }
}

const closeDialog = () => {
  dialog.value = false
  isEditing.value = false
  editingId.value = null
  newClient.value = { name: '', type: '', total: '', status: '' }
}

const getStatusColor = (status: string) => {
  const colors = {
    'Pendiente de pago': 'warning',
    'En espera de algun documento': 'info',
    'pasaporte vencido': 'error',
    'Pago realizado': 'success',
    'Otro': 'grey'
  }
  return colors[status] || 'grey'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP'
  }).format(value)
}

fetchClients()
</script>

<template>
  <v-container fluid>
    <v-row class="mb-6" align="center" justify="space-between">
      <v-col cols="12" sm="4">
        <h2 class="text-h5">Clientes pendientes de pago</h2>
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="dialog = true"
        >
          Agregar Cliente
        </v-btn>
      </v-col>
    </v-row>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="clients"
        :loading="loading"
        hover
      >
        <template v-slot:item.total="{ item }">
          {{ formatCurrency(item.total) }}
        </template>

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
            @click="editClient(item)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>

        <template v-slot:no-data>
          <div class="d-flex flex-column align-center pa-4">
            <v-icon
              icon="mdi-currency-usd-off"
              size="48"
              color="grey-lighten-1"
              class="mb-2"
            ></v-icon>
            <span class="text-grey">No hay clientes pendientes de pago</span>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Client Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>{{ isEditing ? 'Editar Cliente' : 'Agregar Nuevo Cliente' }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="isEditing ? updateClient() : addClient()">
            <v-text-field
              v-model="newClient.name"
              label="Nombre del Cliente"
              required
            ></v-text-field>

            <v-select
              v-model="newClient.type"
              :items="types"
              label="Tipo"
              required
            ></v-select>

            <v-text-field
              v-model="newClient.total"
              label="Total"
              type="number"
              prefix="RD$"
              required
            ></v-text-field>

            <v-select
              v-model="newClient.status"
              :items="statuses"
              label="Estatus"
              required
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="closeDialog"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            @click="isEditing ? updateClient() : addClient()"
            :disabled="!newClient.name || !newClient.type || !newClient.total || !newClient.status"
          >
            {{ isEditing ? 'Actualizar' : 'Guardar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="3000">
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar = false"
        >
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.v-data-table {
  border-radius: 8px;
}

.v-chip {
  font-weight: 600;
}

.v-btn--icon {
  margin: 0 4px;
}
</style>