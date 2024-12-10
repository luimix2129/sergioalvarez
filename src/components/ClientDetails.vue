<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useRoute, useRouter } from 'vue-router'
import PassportPhoto from './PassportPhoto.vue'
import ClientNotes from './ClientNotes.vue'

const route = useRoute()
const router = useRouter()
const client = ref(null)
const appointments = ref([])
const loading = ref(true)
const confirmDialog = ref(false)
const deleteDialog = ref(false)
const newStatus = ref('')
const editMode = ref(false)
const showCredentials = ref(false)
const showPassword = ref(false)
const editedClient = ref(null)

const credentials = ref({
  username: '',
  password: ''
})

const countries = ['USA', 'Canada', 'Schengen']
const requestTypes = ['Turista', 'Trabajo', 'Estudio', 'Residencia', 'Peticion', 'Reagrupacion familiar']
const statuses = ['Solicitud Recibida', 'En Proceso', 'En Revisión', 'Aprobado', 'Rechazado', 'Urgente']

const fetchClient = async () => {
  try {
    const clientDoc = await getDoc(doc(db, "clients", route.params.id as string))
    if (clientDoc.exists()) {
      client.value = {
        id: clientDoc.id,
        ...clientDoc.data(),
        createdAt: clientDoc.data().createdAt?.toDate().toLocaleString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) || 'N/A',
        clientNotes: clientDoc.data().clientNotes || []
      }
      credentials.value = {
        username: client.value.credentials?.username || '',
        password: client.value.credentials?.password || ''
      }
      await fetchAppointments()
    }
  } catch (error) {
    console.error("Error fetching client:", error)
  } finally {
    loading.value = false
  }
}

const fetchAppointments = async () => {
  try {
    const q = query(
      collection(db, "appointments"),
      where("clientId", "==", route.params.id)
    )
    const querySnapshot = await getDocs(q)
    appointments.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) || 'N/A'
    })).sort((a, b) => new Date(a.date) - new Date(b.date))
  } catch (error) {
    console.error("Error fetching appointments:", error)
  }
}

const updateStatus = async () => {
  if (!client.value) return
  
  try {
    const currentUser = localStorage.getItem('currentUser') || 'Unknown User'
    const clientRef = doc(db, "clients", client.value.id)
    
    await updateDoc(clientRef, {
      status: newStatus.value,
      lastModified: new Date(),
      modifications: [
        ...(client.value.modifications || []),
        {
          timestamp: Date.now(),
          type: 'status',
          description: `Estado actualizado a "${newStatus.value}"`,
          modifiedBy: currentUser,
          oldValue: client.value.status,
          newValue: newStatus.value
        }
      ]
    })
    
    confirmDialog.value = false
    await fetchClient()
  } catch (error) {
    console.error("Error updating status:", error)
  }
}

const startEditing = () => {
  if (!client.value) return
  
  editedClient.value = { ...client.value }
  editMode.value = true
}

const cancelEditing = () => {
  editedClient.value = null
  editMode.value = false
}

const saveEdits = async () => {
  if (!client.value) return
  
  try {
    const currentUser = localStorage.getItem('currentUser') || 'Unknown User'
    const clientRef = doc(db, "clients", client.value.id)
    
    const updates = {
      name: editedClient.value.name,
      email: editedClient.value.email,
      phone: editedClient.value.phone,
      country: editedClient.value.country,
      requestType: editedClient.value.requestType,
      status: editedClient.value.status,
      passport: editedClient.value.passport,
      notes: editedClient.value.notes,
      lastModified: new Date(),
      modifications: [
        ...(client.value.modifications || []),
        {
          timestamp: Date.now(),
          type: 'edit',
          description: 'Información del cliente actualizada',
          modifiedBy: currentUser,
          details: {
            name: editedClient.value.name,
            country: editedClient.value.country,
            requestType: editedClient.value.requestType,
            status: editedClient.value.status
          }
        }
      ]
    }
    
    await updateDoc(clientRef, updates)
    editMode.value = false
    await fetchClient()
  } catch (error) {
    console.error("Error updating client:", error)
  }
}

const deleteClient = async () => {
  if (!client.value) return
  
  try {
    // Delete client document
    await deleteDoc(doc(db, "clients", client.value.id))
    
    // Delete related appointments
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("clientId", "==", client.value.id)
    )
    const appointmentsDocs = await getDocs(appointmentsQuery)
    const deletePromises = appointmentsDocs.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
    
    // Navigate back to cases list
    router.push('/cases')
  } catch (error) {
    console.error("Error deleting client:", error)
  }
}

const sendCongratulations = async () => {
  if (!client.value?.phone) return
  
  try {
    const currentUser = localStorage.getItem('currentUser') || 'Unknown User'
    const clientRef = doc(db, "clients", client.value.id)
    
    const phoneNumber = client.value.phone.replace(/\D/g, '')
    const message = encodeURIComponent(
      `¡Felicidades ${client.value.name} por la aprobación de tu visa! ` +
      "Queremos expresarte nuestra más sincera gratitud por haber elegido nuestra oficina para acompañarte en este importante proceso. " +
      "Sabemos lo significativo que es para ti este logro, y estamos muy contentos de haber podido contribuir a hacerlo realidad. " +
      "¡Que este nuevo capítulo en tu vida esté lleno de éxitos y experiencias maravillosas!\n\n" +
      "OFICINA SERGIO ALVAREZ\n" +
      "Consultoria y Servicios Migratorios"
    )
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
    
    await updateDoc(clientRef, {
      lastModified: new Date(),
      modifications: [
        ...(client.value.modifications || []),
        {
          timestamp: Date.now(),
          type: 'notification',
          description: 'Felicitación enviada al cliente por WhatsApp',
          modifiedBy: currentUser
        }
      ]
    })
    
    await fetchClient()
  } catch (error) {
    console.error("Error sending congratulations:", error)
  }
}

const sendRejectionNotification = async () => {
  if (!client.value?.phone) return
  
  try {
    const currentUser = localStorage.getItem('currentUser') || 'Unknown User'
    const clientRef = doc(db, "clients", client.value.id)
    
    const phoneNumber = client.value.phone.replace(/\D/g, '')
    const message = encodeURIComponent(
      "Estimado/a cliente,\n\n" +
      "Lamentamos informarle que su solicitud de visa no ha sido aprobada en esta ocasión. Sin embargo, queremos ofrecerle algunos consejos para su próxima solicitud:\n\n" +
      "Solicitud para Canadá u otro país sin visa: Si Canadá es su objetivo, asegúrese de cumplir con todos los requisitos y documentación necesaria para una nueva solicitud. También puede considerar explorar opciones en países que no requieran visa para ciudadanos de Nuestro país. (Colombia, El Salvador, Guatemala,Venezuela, entre otros)\n\n" +
      "Inscripción en la Universidad: Obtener admisión en una universidad puede ser un factor positivo en su aplicación para una visa, mostrando un propósito claro y compromiso con su educación.\n\n" +
      "Registro de una empresa: Si tiene la capacidad y los recursos, registrar una empresa puede demostrar estabilidad financiera y compromiso con el desarrollo económico.\n\n" +
      "Trabajo en la confianza y las respuestas: Trabaje en aumentar su confianza y prepárese para responder las preguntas de manera clara y convincente en futuras entrevistas o procesos de solicitud de visa.\n\n" +
      "Ofrecemos un descuento del 20% en su próxima solicitud como muestra de nuestro compromiso continuo con usted. Estamos aquí para ayudarlo en cada paso del proceso.\n\n" +
      "Atentamente,\n" +
      "Oficina Sergio Álvarez Consultoría y Servicios Migratorios"
    )
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
    
    await updateDoc(clientRef, {
      lastModified: new Date(),
      modifications: [
        ...(client.value.modifications || []),
        {
          timestamp: Date.now(),
          type: 'notification',
          description: 'Notificación de rechazo enviada al cliente por WhatsApp',
          modifiedBy: currentUser
        }
      ]
    })
    
    await fetchClient()
  } catch (error) {
    console.error("Error sending rejection notification:", error)
  }
}

const saveCredentials = async () => {
  if (!client.value) return
  
  try {
    const currentUser = localStorage.getItem('currentUser') || 'Unknown User'
    const clientRef = doc(db, "clients", client.value.id)
    
    await updateDoc(clientRef, {
      credentials: credentials.value,
      lastModified: new Date(),
      modifications: [
        ...(client.value.modifications || []),
        {
          timestamp: Date.now(),
          type: 'credentials',
          description: 'Credenciales actualizadas',
          modifiedBy: currentUser
        }
      ]
    })
    
    showCredentials.value = false
    await fetchClient()
  } catch (error) {
    console.error("Error saving credentials:", error)
  }
}

const getAppointmentColor = (type: string) => {
  const colors = {
    'Captura de Huella': 'primary',
    'Cita Consular': 'success',
    'Entrega de Documentos': 'warning',
    'Entrevista': 'info',
    'Seguimiento': 'secondary'
  }
  return colors[type] || 'grey'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(fetchClient)
</script>

<template>
  <v-container fluid v-if="!loading && client">
    <v-row>
      <v-col cols="12" md="8">
        <!-- Client Info Card -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            Información del Cliente
            <v-spacer></v-spacer>
            <v-btn
              v-if="!editMode"
              color="error"
              variant="text"
              prepend-icon="mdi-delete"
              class="mr-2"
              @click="deleteDialog = true"
            >
              Eliminar cliente
            </v-btn>
            <v-btn
              v-if="!editMode"
              color="primary"
              variant="text"
              prepend-icon="mdi-pencil"
              @click="startEditing"
            >
              Editar
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-account" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>Nombre</v-list-item-title>
                    <template v-if="editMode">
                      <v-text-field
                        v-model="editedClient.name"
                        density="compact"
                        variant="outlined"
                        autocomplete="off"
                      ></v-text-field>
                    </template>
                    <v-list-item-subtitle v-else>{{ client.name }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-email" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>Email</v-list-item-title>
                    <template v-if="editMode">
                      <v-text-field
                        v-model="editedClient.email"
                        density="compact"
                        variant="outlined"
                        autocomplete="off"
                      ></v-text-field>
                    </template>
                    <v-list-item-subtitle v-else>{{ client.email }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-phone" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>Teléfono</v-list-item-title>
                    <template v-if="editMode">
                      <v-text-field
                        v-model="editedClient.phone"
                        density="compact"
                        variant="outlined"
                        autocomplete="off"
                      ></v-text-field>
                    </template>
                    <v-list-item-subtitle v-else>{{ client.phone }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-clock" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>Fecha y Hora de Solicitud</v-list-item-title>
                    <v-list-item-subtitle>{{ client.createdAt }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>

              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-passport" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>Pasaporte</v-list-item-title>
                    <template v-if="editMode">
                      <v-text-field
                        v-model="editedClient.passport"
                        density="compact"
                        variant="outlined"
                        autocomplete="off"
                      ></v-text-field>
                    </template>
                    <v-list-item-subtitle v-else>{{ client.passport }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-flag" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>País</v-list-item-title>
                    <template v-if="editMode">
                      <v-select
                        v-model="editedClient.country"
                        :items="countries"
                        density="compact"
                        variant="outlined"
                      ></v-select>
                    </template>
                    <v-list-item-subtitle v-else>{{ client.country }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-file-document" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>Tipo de Solicitud</v-list-item-title>
                    <template v-if="editMode">
                      <v-select
                        v-model="editedClient.requestType"
                        :items="requestTypes"
                        density="compact"
                        variant="outlined"
                      ></v-select>
                    </template>
                    <v-list-item-subtitle v-else>{{ client.requestType }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon icon="mdi-tag" class="mr-2"></v-icon>
                    </template>
                    <v-list-item-title>Número de Caso</v-list-item-title>
                    <v-list-item-subtitle>{{ client.caseNumber }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>

            <v-row v-if="editMode">
              <v-col cols="12">
                <v-textarea
                  v-model="editedClient.notes"
                  label="Notas"
                  rows="3"
                  variant="outlined"
                  autocomplete="off"
                ></v-textarea>
              </v-col>
              <v-col cols="12" class="text-right">
                <v-btn
                  color="error"
                  variant="text"
                  class="mr-2"
                  @click="cancelEditing"
                >
                  Cancelar
                </v-btn>
                <v-btn
                  color="primary"
                  @click="saveEdits"
                >
                  Guardar Cambios
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Passport Photo Component -->
        <PassportPhoto />

        <!-- Client Notes Component -->
        <ClientNotes 
          :client-id="client.id"
          :notes="client.clientNotes"
          class="mb-4"
        />

        <!-- Appointments Card -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-calendar-clock" class="mr-2"></v-icon>
            Citas Programadas
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-calendar-plus"
              @click="$router.push('/schedule-appointment')"
              variant="text"
            >
              Agendar Nueva Cita
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-list v-if="appointments.length > 0">
              <v-list-item
                v-for="appointment in appointments"
                :key="appointment.id"
                :class="{'appointment-past': new Date(appointment.date) < new Date()}"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getAppointmentColor(appointment.type)" size="40">
                    <v-icon color="white" size="24">
                      {{ appointment.type === 'Captura de Huella' ? 'mdi-fingerprint' :
                         appointment.type === 'Cita Consular' ? 'mdi-office-building' :
                         appointment.type === 'Entrega de Documentos' ? 'mdi-file-document' :
                         appointment.type === 'Entrevista' ? 'mdi-account-voice' : 'mdi-calendar-check'
                      }}
                    </v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ appointment.type }}
                  <v-chip
                    :color="getAppointmentColor(appointment.type)"
                    size="small"
                    class="ml-2"
                  >
                    {{ appointment.time }}
                  </v-chip>
                </v-list-item-title>

                <v-list-item-subtitle class="mt-1">
                  <div class="d-flex flex-column">
                    <span class="text-primary">{{ formatDate(appointment.date) }}</span>
                    <span v-if="appointment.notes" class="mt-1 text-grey">
                      {{ appointment.notes }}
                    </span>
                    <span class="mt-1 text-caption text-grey">
                      Agendado por {{ appointment.createdBy }} el {{ appointment.createdAt }}
                    </span>
                  </div>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <div v-else class="text-center pa-4">
              <v-icon
                icon="mdi-calendar-blank"
                size="64"
                color="grey-lighten-1"
                class="mb-2"
              ></v-icon>
              <div class="text-body-1 text-grey">No hay citas programadas</div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Credentials Card -->
        <v-card>
          <v-card-title class="d-flex align-center">
            Credenciales
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="text"
              @click="showCredentials = !showCredentials"
            >
              {{ showCredentials ? 'Ocultar' : 'Mostrar' }}
            </v-btn>
          </v-card-title>

          <v-expand-transition>
            <v-card-text v-if="showCredentials">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="credentials.username"
                    label="Usuario"
                    variant="outlined"
                    prepend-inner-icon="mdi-account"
                    autocomplete="off"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="credentials.password"
                    label="Contraseña"
                    variant="outlined"
                    prepend-inner-icon="mdi-lock"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword = !showPassword"
                    autocomplete="new-password"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" class="text-right">
                  <v-btn
                    color="primary"
                    @click="saveCredentials"
                  >
                    Guardar Credenciales
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text >
          </v-expand-transition>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <!-- Status Card -->
        <v-card class="mb-4">
          <v-card-title>Estado del Caso</v-card-title>
          <v-card-text>
            <v-chip
              :color="getAppointmentColor(client.status)"
              class="mb-4"
            >
              {{ client.status }}
            </v-chip>
            
            <v-select
              v-model="newStatus"
              :items="statuses"
              label="Cambiar Estado"
              variant="outlined"
              density="comfortable"
            ></v-select>
            
            <v-btn
              color="primary"
              block
              :disabled="!newStatus || newStatus === client.status"
              @click="confirmDialog = true"
            >
              Actualizar Estado
            </v-btn>

            <!-- Action Buttons -->
            <v-row class="mt-4">
              <v-col cols="12">
                <v-btn
                  v-if="client?.status === 'Aprobado'"
                  color="success"
                  block
                  class="mb-2"
                  prepend-icon="mdi-whatsapp"
                  @click="sendCongratulations"
                >
                  Felicitar por WhatsApp
                </v-btn>
                
                <v-btn
                  v-if="client?.status === 'Rechazado'"
                  color="error"
                  block
                  class="mb-2"
                  prepend-icon="mdi-whatsapp"
                  @click="sendRejectionNotification"
                >
                  Notificar Rechazo
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Activity History -->
        <v-card>
          <v-card-title>Historial de Actividad</v-card-title>
          <v-card-text>
            <v-timeline density="compact">
              <v-timeline-item
                v-for="(mod, index) in client.modifications"
                :key="index"
                :dot-color="mod.type === 'status' ? 'warning' : 'primary'"
                size="x-small"
              >
                <div class="text-caption mb-1">
                  {{ new Date(mod.timestamp).toLocaleString() }}
                </div>
                <div class="text-body-2">{{ mod.description }}</div>
                <div class="text-caption">por {{ mod.modifiedBy }}</div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Status Update Dialog -->
    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title>Confirmar Cambio de Estado</v-card-title>
        <v-card-text>
          ¿Está seguro que desea cambiar el estado del caso a "{{ newStatus }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="confirmDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            @click="updateStatus"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">Eliminar Cliente</v-card-title>
        <v-card-text>
          ¿Está seguro que desea eliminar este cliente y toda su información? Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="deleteDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            @click="deleteClient"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>

  <v-container v-else-if="loading" class="d-flex align-center justify-center" style="height: 400px">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </v-container>
</template>

<style scoped>
.v-timeline {
  max-height: 400px;
  overflow-y: auto;
}

.v-timeline-item {
  margin-bottom: 16px;
}

.v-card {
  border-radius: 8px;
}

.v-list-item {
  padding: 12px;
}

.v-card-title {
  padding: 16px;
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.appointment-past {
  opacity: 0.7;
}

.appointment-past::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.05);
  pointer-events: none;
}
</style>