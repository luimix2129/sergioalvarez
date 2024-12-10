<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadFile, deleteFile, getFileUrl } from '../utils/storage';

const props = defineProps<{
  initialPhoto?: string;
}>();

const route = useRoute();
const clientId = route.params.id as string;
const passportPhoto = ref(props.initialPhoto || '');
const showDeleteDialog = ref(false);
const loading = ref(false);
const snackbar = ref(false);
const snackbarMessage = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const DEFAULT_PHOTO = 'https://firebasestorage.googleapis.com/v0/b/sergioalvarezinm-352ad.appspot.com/o/passport-example.jpg?alt=media&token=5b68ec34-197d-43e3-ad50-3bb07b5a6d2f';

onMounted(async () => {
  if (clientId) {
    try {
      const url = await getFileUrl(`passport-photos/${clientId}`);
      passportPhoto.value = url;
    } catch (error) {
      console.error('Error loading passport photo:', error);
      passportPhoto.value = DEFAULT_PHOTO;
    }
  }
});

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input?.files?.[0];
  
  if (!file || !clientId) return;

  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    snackbarMessage.value = 'Por favor, seleccione un archivo de imagen válido';
    snackbar.value = true;
    return;
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    snackbarMessage.value = 'La imagen no debe superar los 5MB';
    snackbar.value = true;
    return;
  }

  loading.value = true;
  try {
    const currentUser = localStorage.getItem('currentUser') || 'Unknown User';
    const metadata = {
      uploadedBy: currentUser,
      clientId: clientId,
      contentType: file.type
    };

    // Create a unique path for the passport photo
    const photoPath = `passport-photos/${clientId}/${Date.now()}_${file.name}`;
    const downloadURL = await uploadFile(photoPath, file, metadata);

    await updateDoc(doc(db, 'clients', clientId), {
      passportPhotoURL: downloadURL,
      lastModified: new Date(),
      modifications: [{
        timestamp: Date.now(),
        type: 'photo',
        description: 'Foto de pasaporte actualizada',
        modifiedBy: currentUser
      }]
    });

    passportPhoto.value = downloadURL;
    snackbarMessage.value = 'Foto subida exitosamente';
    snackbar.value = true;

    // Clear the file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  } catch (error) {
    console.error('Error uploading photo:', error);
    snackbarMessage.value = error.message || 'Error al subir la foto. Por favor, intente nuevamente.';
    snackbar.value = true;
  } finally {
    loading.value = false;
  }
};

const deletePhoto = async () => {
  if (!clientId) return;

  loading.value = true;
  try {
    await deleteFile(`passport-photos/${clientId}`);

    const currentUser = localStorage.getItem('currentUser') || 'Unknown User';
    await updateDoc(doc(db, 'clients', clientId), {
      passportPhotoURL: null,
      lastModified: new Date(),
      modifications: [{
        timestamp: Date.now(),
        type: 'photo',
        description: 'Foto de pasaporte eliminada',
        modifiedBy: currentUser
      }]
    });

    passportPhoto.value = DEFAULT_PHOTO;
    showDeleteDialog.value = false;
    snackbarMessage.value = 'Foto eliminada exitosamente';
    snackbar.value = true;
  } catch (error) {
    console.error('Error deleting photo:', error);
    snackbarMessage.value = error.message || 'Error al eliminar la foto';
    snackbar.value = true;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-passport" class="mr-2"></v-icon>
      Foto del Pasaporte
      <v-spacer></v-spacer>
      <v-btn
        color="error"
        variant="text"
        prepend-icon="mdi-delete"
        @click="showDeleteDialog = true"
        :disabled="!passportPhoto || loading || passportPhoto === DEFAULT_PHOTO"
      >
        Eliminar
      </v-btn>
      <v-btn
        color="primary"
        variant="text"
        prepend-icon="mdi-upload"
        class="ml-2"
        @click="fileInput?.click()"
        :loading="loading"
        :disabled="loading"
      >
        Subir Foto
      </v-btn>
    </v-card-title>

    <v-card-text>
      <div v-if="passportPhoto" class="passport-photo-container">
        <v-img
          :src="passportPhoto"
          alt="Passport Photo"
          class="passport-photo"
          :aspect-ratio="4/3"
          cover
        >
          <template v-slot:placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
          </template>
        </v-img>
      </div>
      <div v-else class="no-photo-container">
        <v-icon icon="mdi-image-off" size="64" color="grey-lighten-1"></v-icon>
        <div class="text-body-1 text-grey mt-2">No hay foto del pasaporte</div>
      </div>

      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        style="display: none"
        @change="handleFileUpload"
      >
    </v-card-text>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Confirmar Eliminación</v-card-title>
        <v-card-text>
          ¿Está seguro que desea eliminar la foto del pasaporte?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showDeleteDialog = false"
            :disabled="loading"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            @click="deletePhoto"
            :loading="loading"
            :disabled="loading"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
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
  </v-card>
</template>

<style scoped>
.passport-photo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  min-height: 300px;
}

.passport-photo {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
}

.no-photo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background-color: #f5f5f5;
  border-radius: 8px;
  min-height: 300px;
}

.v-btn {
  text-transform: none;
}
</style>