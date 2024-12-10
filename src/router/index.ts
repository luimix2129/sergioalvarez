import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import Login from '../components/Login.vue'
import ClientForm from '../components/ClientForm.vue'
import CaseStatus from '../components/CaseStatus.vue'
import ClientDetails from '../components/ClientDetails.vue'
import Enlaces from '../components/Enlaces.vue'
import Statistics from '../components/Statistics.vue'
import MetricDetails from '../components/MetricDetails.vue'
import ScheduleAppointment from '../components/ScheduleAppointment.vue'
import PendingPayments from '../components/PendingPayments.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/client-form',
    name: 'ClientForm',
    component: ClientForm,
    meta: { requiresAuth: true }
  },
  {
    path: '/cases',
    name: 'Cases',
    component: CaseStatus,
    meta: { requiresAuth: true }
  },
  {
    path: '/client/:id',
    name: 'ClientDetails',
    component: ClientDetails,
    meta: { requiresAuth: true }
  },
  {
    path: '/enlaces',
    name: 'Enlaces',
    component: Enlaces,
    meta: { requiresAuth: true }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics,
    meta: { requiresAuth: true }
  },
  {
    path: '/metric/:type',
    name: 'MetricDetails',
    component: MetricDetails,
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule-appointment',
    name: 'ScheduleAppointment',
    component: ScheduleAppointment,
    meta: { requiresAuth: true }
  },
  {
    path: '/pending-payments',
    name: 'PendingPayments',
    component: PendingPayments,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router