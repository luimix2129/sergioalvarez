<script setup lang="ts">
import { ref } from 'vue'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const selectedUser = ref(null)
const noteMessage = ref('')
const loading = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')

const users = [
  { name: 'Admin', email: 'admin@sergioalvarez.com' },
  { name: 'Franny Sanchez', email: 'franny_sanchez@sergioalvarez.com' }
]

const saveNote = async () => {
  if (!selectedUser.value || !noteMessage.value.trim()) return
  
  loading.value = true
  try {
    const currentUser = localStorage.getItem('currentUser')
    await addDoc(collection(db, "notifications"), {
      from: currentUser,
      to: selectedUser.value.name,
      message: noteMessage.value,
      timestamp: serverTimestamp(),
      read: false,
      type: 'internal'
    })
    
    snackbarMessage.value = 'Nota enviada exitosamente'
    snackbar.value = true
    emit('update:modelValue', false)
    selectedUser.value = null
    noteMessage.value = ''
  } catch (error) {
    console.error("Error saving note:", error)
    snackbarMessage.value = 'Error al enviar la nota'
    snackbar.value = true
  }
  loading.value = false
}
</script>

<template>
  <v-dialog
    v-model="props.modelValue"
    @update:modelValue="emit('update:modelValue', false)"
    max-width="500"
  >
    <v-card>
      <v-card-title>Dejar Nota Interna</v-card-title>
      
      <v-card-text>
        <v-select
          v-model="selectedUser"
          :items="users"
          item-title="name"
          item-value="email"
          label="Seleccionar Usuario"
          return-object
          class="mb-4"
        ></v-select>
        
        <v-textarea
          v-model="noteMessage"
          label="Mensaje"
          rows="4"
          auto-grow
          counter
          maxlength="500"
          placeholder="Escribe una nota interna para otro usuario del dashboard..."
        ></v-textarea>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="error"
          variant="text"
          @click="emit('update:modelValue', false)"
          :disabled="loading"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          @click="saveNote"
          :loading="loading"
          :disabled="!selectedUser || !noteMessage.trim()"
        >
          Enviar Nota
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  
  <v-snackbar v-model="snackbar" :timeout="3000">
    {{ snackbarMessage }}
  </v-snackbar>
</template>