<script setup lang="ts">
import { ref, computed } from 'vue'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const selectedClient = ref(null)
const appointmentDate = ref('')
const appointmentTime = ref('')
const appointmentType = ref('')
const notes = ref('')
const loading = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')

const props = defineProps(['clients'])

const appointmentTypes = [
  'Captura de Huella',
  'Cita Consular',
  'Entrega de Documentos',
  'Entrevista',
  'Seguimiento'
]

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const timeSlots = computed(() => {
  const slots = []
  for (let hour = 9; hour <= 17; hour++) {
    for (let minute of ['00', '30']) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute}`)
    }
  }
  return slots
})

const saveAppointment = async () => {
  if (!selectedClient.value || !appointmentDate.value || !appointmentTime.value || !appointmentType.value) {
    snackbarMessage.value = 'Por favor complete todos los campos requeridos'
    snackbar.value = true
    return
  }

  loading.value = true
  try {
    const currentUser = localStorage.getItem('currentUser')
    const appointment = {
      clientId: selectedClient.value.id,
      clientName: selectedClient.value.name,
      date: appointmentDate.value,
      time: appointmentTime.value,
      type: appointmentType.value,
      notes: notes.value,
      createdBy: currentUser,
      createdAt: serverTimestamp(),
      status: 'Programada'
    }

    await addDoc(collection(db, 'appointments'), appointment)
    
    snackbarMessage.value = 'Cita agendada exitosamente'
    snackbar.value = true
    
    // Reset form
    selectedClient.value = null
    appointmentDate.value = ''
    appointmentTime.value = ''
    appointmentType.value = ''
    notes.value = ''
  } catch (error) {
    console.error('Error saving appointment:', error)
    snackbarMessage.value = 'Error al agendar la cita'
    snackbar.value = true
  }
  loading.value = false
}
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
          <h1 class="text-h4">Agendar Cita</h1>
        </div>
      </v-col>
    </v-row>

    <v-card>
      <v-card-text>
        <v-form @submit.prevent="saveAppointment">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="selectedClient"
                :items="props.clients"
                item-title="name"
                item-value="id"
                label="Cliente"
                return-object
                required
                :rules="[v => !!v || 'Cliente es requerido']"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:title>
                      {{ item?.raw?.name }}
                    </template>
                    <template v-slot:subtitle>
                      Caso: {{ item?.raw?.caseNumber }}
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="appointmentType"
                :items="appointmentTypes"
                label="Tipo de Cita"
                required
                :rules="[v => !!v || 'Tipo de cita es requerido']"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="appointmentDate"
                label="Fecha"
                type="date"
                required
                :min="minDate"
                :rules="[v => !!v || 'Fecha es requerida']"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="appointmentTime"
                :items="timeSlots"
                label="Hora"
                required
                :rules="[v => !!v || 'Hora es requerida']"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="notes"
                label="Notas"
                rows="3"
                placeholder="Agregar notas o instrucciones especiales..."
              ></v-textarea>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" class="text-right">
              <v-btn
                color="primary"
                type="submit"
                :loading="loading"
                :disabled="loading"
              >
                Agendar Cita
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>

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
.v-card {
  border-radius: 8px;
}
</style>