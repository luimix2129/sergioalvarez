<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { doc, updateDoc, arrayUnion, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

interface Note {
  content: string
  createdBy: string
  timestamp: number | Timestamp
}

const props = defineProps<{
  clientId: string
  notes: Note[]
}>()

const emit = defineEmits(['refresh'])
const newNote = ref('')
const loading = ref(false)
const refreshing = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const clientNotes = ref<Note[]>(props.notes || [])

const addNote = async () => {
  if (!newNote.value.trim()) return
  
  loading.value = true
  try {
    const currentUser = localStorage.getItem('currentUser') || 'Usuario Desconocido'
    const clientRef = doc(db, "clients", props.clientId)
    
    const noteData = {
      content: newNote.value,
      createdBy: currentUser,
      timestamp: Timestamp.now()
    }

    await updateDoc(clientRef, {
      clientNotes: arrayUnion(noteData)
    })

    newNote.value = ''
    snackbarMessage.value = 'Nota agregada exitosamente'
    showSnackbar.value = true
    refreshNotes()
  } catch (error) {
    console.error('Error adding note:', error)
    snackbarMessage.value = 'Error al agregar la nota'
    showSnackbar.value = true
  } finally {
    loading.value = false
  }
}

const refreshNotes = async () => {
  refreshing.value = true
  try {
    const clientRef = doc(db, "clients", props.clientId)
    const clientDoc = await getDoc(clientRef)
    if (clientDoc.exists()) {
      clientNotes.value = clientDoc.data().clientNotes || []
    }
    emit('refresh')
  } catch (error) {
    console.error('Error refreshing notes:', error)
  } finally {
    refreshing.value = false
  }
}

const formatDate = (timestamp: number | Timestamp): string => {
  try {
    let date: Date
    
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate()
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp)
    } else {
      return 'Fecha no disponible'
    }

    if (isNaN(date.getTime())) {
      return 'Fecha no disponible'
    }

    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch {
    return 'Fecha no disponible'
  }
}

onMounted(() => {
  clientNotes.value = props.notes || []
})
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-note-text" class="mr-2"></v-icon>
      Notas del Cliente
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="primary"
        variant="text"
        :loading="refreshing"
        @click="refreshNotes"
        class="mr-2"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-textarea
        v-model="newNote"
        label="Agregar nueva nota"
        rows="3"
        auto-grow
        hide-details
        class="mb-4"
      >
        <template v-slot:append>
          <v-btn
            color="primary"
            :loading="loading"
            :disabled="!newNote.trim()"
            @click="addNote"
            class="mt-2"
          >
            Agregar Nota
          </v-btn>
        </template>
      </v-textarea>

      <v-divider class="my-4"></v-divider>

      <div v-if="clientNotes.length > 0" class="notes-list">
        <v-timeline density="comfortable" align="start">
          <v-timeline-item
            v-for="(note, index) in [...clientNotes].reverse()"
            :key="index"
            dot-color="primary"
            size="small"
          >
            <template v-slot:opposite>
              <div class="text-caption">
                {{ formatDate(note.timestamp) }}
              </div>
            </template>

            <div class="note-content">
              <div class="text-body-1">{{ note.content }}</div>
              <div class="text-caption text-grey mt-1">
                por {{ note.createdBy }}
              </div>
            </div>
          </v-timeline-item>
        </v-timeline>
      </div>
      
      <div v-else class="text-center pa-4">
        <v-icon
          icon="mdi-note-off"
          size="64"
          color="grey-lighten-1"
          class="mb-2"
        ></v-icon>
        <div class="text-body-1 text-grey">No hay notas registradas</div>
      </div>
    </v-card-text>

    <v-snackbar v-model="showSnackbar" :timeout="3000">
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="showSnackbar = false"
        >
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<style scoped>
.notes-list {
  max-height: 400px;
  overflow-y: auto;
}

.note-content {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.v-timeline-item {
  margin-bottom: 16px;
}

.v-btn--icon {
  transition: transform 0.2s ease;
}

.v-btn--icon:hover {
  transform: rotate(180deg);
}
</style>