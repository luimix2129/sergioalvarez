<script setup lang="ts">
import { ref, computed } from 'vue'
import { collection, query, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useRouter } from 'vue-router'

const router = useRouter()
const props = defineProps({
  clients: {
    type: Array,
    default: () => []
  }
})

const selectedDate = ref(new Date())
const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const appointments = ref([])

const currentMonth = computed(() => {
  return selectedDate.value.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
})

const fetchAppointments = async () => {
  try {
    const q = query(collection(db, "appointments"))
    const querySnapshot = await getDocs(q)
    appointments.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      clientName: doc.data().clientName,
      clientId: doc.data().clientId,
      type: doc.data().type,
      time: doc.data().time
    }))
  } catch (error) {
    console.error('Error fetching appointments:', error)
  }
}

fetchAppointments()

const calendarDays = computed(() => {
  const year = selectedDate.value.getFullYear()
  const month = selectedDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []
  
  // Previous month days
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: null, isCurrentMonth: false })
  }
  
  // Current month days
  for (let date = 1; date <= lastDay.getDate(); date++) {
    const currentDate = new Date(year, month, date)
    const formattedDate = currentDate.toISOString().split('T')[0]
    
    // Get appointments for this day
    const dayAppointments = appointments.value.filter(apt => 
      apt.date === formattedDate
    ).map(apt => ({
      ...apt,
      color: getActivityColor(apt.type)
    }))
    
    days.push({
      date: currentDate,
      isCurrentMonth: true,
      isToday: isToday(currentDate),
      activities: dayAppointments
    })
  }
  
  // Next month days
  const remainingDays = 42 - days.length
  for (let i = 0; i < remainingDays; i++) {
    days.push({ date: null, isCurrentMonth: false })
  }
  
  return days
})

const isToday = (date: Date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

const changeMonth = (increment: number) => {
  const newDate = new Date(selectedDate.value)
  newDate.setMonth(newDate.getMonth() + increment)
  selectedDate.value = newDate
}

const getActivityColor = (type: string) => {
  const colors = {
    'Captura de Huella': '#1976D2',
    'Cita Consular': '#4CAF50',
    'Entrega de Documentos': '#FFA000',
    'Entrevista': '#E91E63',
    'Seguimiento': '#9C27B0'
  }
  return colors[type] || '#757575'
}

const formatTime = (time: string) => {
  return time || ''
}

const navigateToClient = (clientId: string) => {
  if (clientId) {
    router.push(`/client/${clientId}`)
  }
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center px-4 py-3 bg-primary">
      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        color="white"
        density="comfortable"
        @click="changeMonth(-1)"
      ></v-btn>
      <span class="text-h6 white--text mx-4">{{ currentMonth }}</span>
      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        color="white"
        density="comfortable"
        @click="changeMonth(1)"
      ></v-btn>
    </v-card-title>

    <v-card-text class="pa-2">
      <div class="calendar">
        <div class="calendar-header">
          <div
            v-for="day in weekDays"
            :key="day"
            class="calendar-header-day"
          >
            {{ day }}
          </div>
        </div>

        <div class="calendar-body">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="calendar-day"
            :class="{
              'is-today': day.isToday,
              'is-current-month': day.isCurrentMonth,
              'has-events': day.activities?.length > 0
            }"
          >
            <div class="day-content">
              <span v-if="day.date" class="day-number">
                {{ day.date.getDate() }}
              </span>
              
              <div v-if="day.activities?.length > 0" class="events-container">
                <v-menu location="bottom">
                  <template v-slot:activator="{ props }">
                    <div 
                      class="event-dots"
                      v-bind="props"
                    >
                      <div
                        v-for="(activity, i) in day.activities.slice(0, 3)"
                        :key="i"
                        class="event-dot"
                        :style="{ backgroundColor: activity.color }"
                      ></div>
                      <span v-if="day.activities.length > 3" class="more-events">
                        +{{ day.activities.length - 3 }}
                      </span>
                    </div>
                  </template>
                  
                  <v-list width="300">
                    <v-list-item
                      v-for="activity in day.activities"
                      :key="activity.id"
                      :subtitle="formatTime(activity.time)"
                      @click="navigateToClient(activity.clientId)"
                      class="appointment-item"
                    >
                      <template v-slot:prepend>
                        <v-avatar :color="getActivityColor(activity.type)" size="32">
                          <v-icon color="white" size="16">
                            {{ activity.type === 'Captura de Huella' ? 'mdi-fingerprint' :
                               activity.type === 'Cita Consular' ? 'mdi-office-building' :
                               activity.type === 'Entrega de Documentos' ? 'mdi-file-document' :
                               activity.type === 'Entrevista' ? 'mdi-account-voice' : 'mdi-calendar-check'
                            }}
                          </v-icon>
                        </v-avatar>
                      </template>
                      
                      <v-list-item-title>{{ activity.clientName }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ activity.type }} - {{ formatTime(activity.time) }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.calendar {
  display: flex;
  flex-direction: column;
  user-select: none;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.12);
}

.calendar-header-day {
  font-weight: 600;
  color: rgba(0,0,0,0.6);
  font-size: 0.875rem;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
}

.calendar-day {
  aspect-ratio: 1;
  padding: 4px;
  border: 1px solid rgba(0,0,0,0.12);
  background: white;
}

.calendar-day:not(.is-current-month) {
  background: #f5f5f5;
}

.day-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.day-number {
  font-size: 0.875rem;
  margin-bottom: 4px;
  color: rgba(0,0,0,0.87);
}

.is-today {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.is-today .day-number {
  color: var(--v-theme-primary);
  font-weight: 600;
}

.events-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px;
}

.event-dots {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 12px;
  transition: background-color 0.2s ease;
}

.event-dots:hover {
  background-color: rgba(0,0,0,0.04);
}

.event-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.event-dots:hover .event-dot {
  transform: scale(1.2);
}

.more-events {
  font-size: 0.75rem;
  color: rgba(0,0,0,0.6);
  margin-left: 2px;
}

.has-events {
  cursor: pointer;
}

.has-events:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.appointment-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.appointment-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>