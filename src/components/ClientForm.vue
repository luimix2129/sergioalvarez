<script setup lang="ts">
import { ref, watch } from 'vue'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useRouter } from 'vue-router';

const router = useRouter();
const client = ref({
  name: '',
  email: '',
  phone: '',
  country: '',
  requestType: '',
  status: 'Solicitud Recibida',
  passport: '',
  notes: '',
  caseNumber: ''
})

const countries = ['USA', 'Canada', 'Schengen']
const requestTypes = ['Turista', 'Trabajo', 'Estudio', 'Residencia', 'Peticion', 'Reagrupacion familiar']
const statuses = ['Solicitud Recibida', 'En Proceso', 'En Revisión', 'Aprobado', 'Rechazado', 'Urgente']

const dialogVisible = ref(false)
const dialogMessage = ref('')

const generateCaseNumber = () => {
  const name = client.value.name.trim()
  const passport = client.value.passport.trim()
  
  if (name && passport && passport.length >= 4) {
    const namePrefix = name.substring(0, 2).toUpperCase()
    const passportSuffix = passport.slice(-4)
    client.value.caseNumber = `${namePrefix}${passportSuffix}`
  } else {
    client.value.caseNumber = ''
  }
}

watch(() => [client.value.name, client.value.passport], () => {
  generateCaseNumber()
}, { deep: true })

const submitForm = async () => {
  try {
    if (!client.value.caseNumber) {
      dialogMessage.value = 'Por favor, complete el nombre y número de pasaporte para generar el número de caso.';
      dialogVisible.value = true;
      return;
    }

    const currentUser = localStorage.getItem('currentUser') || 'Unknown User';
    
    const clientData = {
      ...client.value,
      createdAt: serverTimestamp(),
      lastModified: serverTimestamp(),
      modifications: [{
        timestamp: Date.now(),
        type: 'creation',
        description: 'Cliente creado',
        modifiedBy: currentUser,
        details: {
          name: client.value.name,
          country: client.value.country,
          requestType: client.value.requestType,
          status: client.value.status,
          caseNumber: client.value.caseNumber
        }
      }]
    };

    const docRef = await addDoc(collection(db, "clients"), clientData);
    console.log("Cliente agregado con ID: ", docRef.id);
    
    client.value = { 
      name: '', 
      email: '', 
      phone: '', 
      country: '',
      requestType: '', 
      status: 'Solicitud Recibida', 
      passport: '', 
      notes: '',
      caseNumber: ''
    }
    dialogMessage.value = 'Cliente agregado exitosamente';
    dialogVisible.value = true;
  } catch (e) {
    console.error("Error al agregar el cliente: ", e);
    dialogMessage.value = 'Error al agregar el cliente. Por favor, intente de nuevo.';
    dialogVisible.value = true;
  }
}

const closeDialog = () => {
  dialogVisible.value = false;
  router.push('/cases');
}
</script>

<template>
  <v-card>
    <v-card-title>Agregar Nuevo Cliente</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="submitForm">
        <v-text-field 
          v-model="client.name" 
          label="Nombre Completo" 
          required
          autocomplete="off"
        ></v-text-field>
        <v-text-field 
          v-model="client.email" 
          label="Correo Electrónico" 
          type="email" 
          required
          autocomplete="off"
        ></v-text-field>
        <v-text-field 
          v-model="client.phone" 
          label="Teléfono" 
          required
          autocomplete="off"
        ></v-text-field>
        <v-select 
          v-model="client.country" 
          :items="countries" 
          label="País de Solicitud" 
          required
        ></v-select>
        <v-select 
          v-model="client.requestType" 
          :items="requestTypes" 
          label="Tipo de Solicitud" 
          required
        ></v-select>
        <v-select 
          v-model="client.status" 
          :items="statuses" 
          label="Estado" 
          required
        ></v-select>
        <v-text-field 
          v-model="client.passport" 
          label="Número de Pasaporte" 
          required
          autocomplete="off"
        ></v-text-field>
        
        <v-text-field
          v-model="client.caseNumber"
          label="Número de Caso"
          readonly
          :hint="client.caseNumber ? 'Número de caso generado automáticamente' : 'Complete el nombre y número de pasaporte'"
          persistent-hint
          class="mb-4"
        ></v-text-field>
        
        <v-textarea 
          v-model="client.notes" 
          label="Notas"
          autocomplete="off"
        ></v-textarea>

        <v-btn 
          type="submit" 
          color="primary"
          :disabled="!client.caseNumber"
        >
          Agregar Cliente
        </v-btn>
      </v-form>
    </v-card-text>

    <v-dialog v-model="dialogVisible" max-width="300">
      <v-card>
        <v-card-title class="headline">Notificación</v-card-title>
        <v-card-text>{{ dialogMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="closeDialog">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>