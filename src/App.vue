<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { collection, getDocs, doc, updateDoc, Timestamp, serverTimestamp, query, where } from 'firebase/firestore'
import { db } from './firebase'
import NotificationDialog from './components/NotificationDialog.vue'
import CreateNoteDialog from './components/CreateNoteDialog.vue'

const router = useRouter()
const route = useRoute()
const drawer = ref(true)
const currentDateTime = ref(new Date())
const searchQuery = ref('')
const createMenuOpen = ref(false)
const createNoteDialog = ref(false)
const notificationDialog = ref(false)
const clients = ref([])
const searchMenuOpen = ref(false)

const isAuthenticated = computed(() => {
  return localStorage.getItem('isAuthenticated') === 'true'
})

const filteredClients = computed(() => {
  if (!searchQuery.value) return []
  const search = searchQuery.value.toLowerCase()
  return clients.value.filter(client => 
    client.caseNumber?.toLowerCase().includes(search) ||
    client.name?.toLowerCase().includes(search)
  ).slice(0, 5)
})

onMounted(() => {
  const savedDrawerState = localStorage.getItem('drawerState')
  drawer.value = savedDrawerState ? savedDrawerState === 'true' : true
  fetchClients()
})

watch(drawer, (newValue) => {
  localStorage.setItem('drawerState', newValue.toString())
})

const updateDateTime = () => {
  currentDateTime.value = new Date()
}

let interval: number

onMounted(() => {
  interval = setInterval(updateDateTime, 1000)
})

onUnmounted(() => {
  clearInterval(interval)
})

const fetchClients = async () => {
  if (!isAuthenticated.value) return
  
  const querySnapshot = await getDocs(collection(db, "clients"))
  clients.value = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    activities: doc.data().activities?.map(activity => ({
      ...activity,
      date: activity.date instanceof Timestamp ? activity.date.toDate().toISOString().split('T')[0] : activity.date
    })) || []
  }))
}

const formatDate = (date: Date) => {
  return date.toLocaleString('es-ES', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

const logout = () => {
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('currentUser')
  router.push('/login')
}

const handleCreateNew = (type: string) => {
  createMenuOpen.value = false
  if (type === 'note') {
    createNoteDialog.value = true
  } else if (type === 'appointment') {
    router.push('/schedule-appointment')
  } else {
    router.push('/client-form')
  }
}

const openGoogleCalendar = () => {
  window.open('https://calendar.google.com/calendar', '_blank')
}

const handleSearch = async (client) => {
  if (client && client.id) {
    searchQuery.value = ''
    searchMenuOpen.value = false
    
    // Si estamos en la ruta de detalles del cliente y el ID es diferente
    if (route.name === 'ClientDetails' && route.params.id !== client.id) {
      // Primero navegamos a una ruta intermedia
      await router.push('/')
      // Luego navegamos a los nuevos detalles del cliente
      setTimeout(() => {
        router.push(`/client/${client.id}`)
      }, 0)
    } else {
      router.push(`/client/${client.id}`)
    }
  }
}

const handleSearchKeydown = (e) => {
  if (e.key === 'Enter' && filteredClients.value.length > 0) {
    handleSearch(filteredClients.value[0])
  }
}

// Reset search when route changes
watch(() => router.currentRoute.value.fullPath, () => {
  searchMenuOpen.value = false
}, { immediate: true })

watch(isAuthenticated, (newValue) => {
  if (!newValue) {
    clients.value = []
  } else {
    fetchClients()
  }
})

// Watch for search query changes
watch(searchQuery, (newValue) => {
  searchMenuOpen.value = !!newValue
})
</script>

<template>
  <v-app>
    <template v-if="isAuthenticated">
      <v-app-bar color="#091545" dark>
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-app-bar-title>Sergio Alvarez INM - Servicios Migratorios</v-app-bar-title>
        
        <v-menu v-model="createMenuOpen" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              color="primary"
              v-bind="props"
              prepend-icon="mdi-plus"
              class="ml-4"
              variant="flat"
            >
              Crear Nuevo
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              @click="handleCreateNew('client')"
              prepend-icon="mdi-account-plus"
              title="Crear Nuevo Cliente"
            ></v-list-item>
            <v-list-item
              @click="handleCreateNew('note')"
              prepend-icon="mdi-note-plus"
              title="Dejar Nota"
            ></v-list-item>
            <v-list-item
              @click="handleCreateNew('appointment')"
              prepend-icon="mdi-calendar-plus"
              title="Agendar Cita"
            ></v-list-item>
          </v-list>
        </v-menu>

        <v-spacer></v-spacer>
        
        <v-btn
          icon
          @click="notificationDialog = true"
          class="mr-4 notification-btn"
        >
          <v-badge
            :content="1"
            color="error"
            floating
          >
            <v-icon icon="mdi-bell" size="24"></v-icon>
          </v-badge>
        </v-btn>
        
        <v-menu
          v-model="searchMenuOpen"
          :close-on-content-click="false"
          location="bottom"
          transition="scale-transition"
        >
          <template v-slot:activator="{ props }">
            <v-text-field
              v-model="searchQuery"
              v-bind="props"
              append-icon="mdi-magnify"
              label="Buscar por # caso o nombre"
              single-line
              hide-details
              class="mr-4"
              style="max-width: 300px;"
              @click:append="handleSearchKeydown({ key: 'Enter' })"
              @keydown="handleSearchKeydown"
              @click="searchMenuOpen = true"
              clearable
            ></v-text-field>
          </template>
          
          <v-list v-if="filteredClients.length > 0" class="search-results">
            <v-list-item
              v-for="client in filteredClients"
              :key="client.id"
              @click="handleSearch(client)"
            >
              <v-list-item-title>
                {{ client.caseNumber }} - {{ client.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ client.country }} | {{ client.requestType }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-list v-else-if="searchQuery">
            <v-list-item>
              <v-list-item-title class="text-center text-grey">
                No se encontraron resultados
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-chip class="mr-2">{{ formatDate(currentDateTime) }}</v-chip>
      </v-app-bar>

      <v-navigation-drawer v-model="drawer" permanent>
        <div class="drawer-header">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/telemontv-web.appspot.com/o/WhatsApp%20Image%202024-11-08%20at%2016.49.03.jpeg?alt=media&token=0a175a8b-148a-4c9c-ae13-59947064c83a" 
            alt="Sergio Alvarez Logo"
            class="drawer-logo"
          >
        </div>
        <v-divider></v-divider>
        <v-list>
          <v-list-item to="/" prepend-icon="mdi-view-dashboard" title="Inicio"></v-list-item>
          <v-list-item to="/cases" prepend-icon="mdi-clipboard-list" title="Clientes y Casos"></v-list-item>
          <v-list-item to="/pending-payments" prepend-icon="mdi-currency-usd" title="Clientes pendientes de pago"></v-list-item>
          <v-list-item to="/enlaces" prepend-icon="mdi-link" title="Enlaces"></v-list-item>
          <v-list-item to="/statistics" prepend-icon="mdi-chart-bar" title="Estadísticas"></v-list-item>
          <v-list-item @click="openGoogleCalendar" prepend-icon="mdi-calendar" title="Google Calendar"></v-list-item>
        </v-list>
        <template v-slot:append>
          <v-divider></v-divider>
          <v-list>
            <v-list-item @click="logout" prepend-icon="mdi-logout" title="Cerrar Sesión" color="error"></v-list-item>
          </v-list>
        </template>
      </v-navigation-drawer>

      <v-main>
        <router-view 
          :searchQuery="searchQuery"
          :clients="clients"
          @refresh-clients="fetchClients"
        ></router-view>
      </v-main>

      <NotificationDialog v-model="notificationDialog" />
      <CreateNoteDialog 
        v-model="createNoteDialog"
        :clients="clients"
      />
    </template>
    
    <v-main v-else>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<style>
.v-main {
  background-color: #f5f5f5;
}

.drawer-header {
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #091545;
}

.drawer-logo {
  width: 100%;
  height: auto;
  object-fit: contain;
  padding: 8px;
}

.notification-btn {
  transition: transform 0.2s ease;
}

.notification-btn:hover {
  transform: scale(1.1);
}

.v-badge__badge {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  min-width: 300px;
}

.v-list-item {
  cursor: pointer;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>