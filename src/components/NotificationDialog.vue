<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const notifications = ref([])
const loading = ref(false)

const currentUser = localStorage.getItem('currentUser') || ''

const fetchNotifications = async () => {
  if (!currentUser) return
  
  loading.value = true
  try {
    const q = query(
      collection(db, "notifications"), 
      where("to", "==", currentUser)
    )
    const querySnapshot = await getDocs(q)
    notifications.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
      from: doc.data().from || 'Sistema'
    }))
  } catch (error) {
    console.error("Error fetching notifications:", error)
    notifications.value = []
  }
  loading.value = false
}

onMounted(fetchNotifications)

const formatDate = (date: Date) => {
  if (!date) return ''
  
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getInitial = (name: string) => {
  return name && typeof name === 'string' ? name.charAt(0).toUpperCase() : '?'
}
</script>

<template>
  <v-dialog
    v-model="props.modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    max-width="500"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-bell" class="mr-2"></v-icon>
        Notificaciones
      </v-card-title>
      
      <v-card-text>
        <v-list v-if="notifications.length > 0">
          <v-list-item
            v-for="notification in notifications"
            :key="notification.id"
            :subtitle="formatDate(notification.timestamp)"
          >
            <template v-slot:prepend>
              <v-avatar color="primary" size="40">
                <span class="text-h6 white--text">{{ getInitial(notification.from) }}</span>
              </v-avatar>
            </template>
            
            <v-list-item-title class="font-weight-medium mb-1">
              {{ notification.from }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ notification.message }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
        
        <div v-else-if="loading" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        
        <div v-else class="text-center pa-4 text-body-1 text-grey">
          No tienes notificaciones
        </div>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.v-list {
  max-height: 400px;
  overflow-y: auto;
}

.v-list-item {
  margin-bottom: 8px;
}

.v-avatar {
  background-color: var(--v-theme-primary);
}

.white--text {
  color: white !important;
}
</style>