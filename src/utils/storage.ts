import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

const handleStorageError = (error: any) => {
  console.error('Storage operation failed:', error);
  
  if (error.code === 'storage/unauthorized') {
    throw new Error('No tiene permisos para realizar esta operación');
  }
  
  if (error.code === 'storage/canceled') {
    throw new Error('Operación cancelada');
  }
  
  if (error.code === 'storage/unknown') {
    throw new Error('Error desconocido, por favor intente nuevamente');
  }
  
  throw error;
};

export const uploadFile = async (
  path: string,
  file: File,
  metadata?: { [key: string]: any }
): Promise<string> => {
  try {
    // Create a reference with a timestamp to avoid name conflicts
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const uniquePath = `${path}_${timestamp}.${fileExtension}`;
    const fileRef = storageRef(storage, uniquePath);

    // Prepare metadata with CORS headers
    const uploadMetadata = {
      contentType: file.type,
      customMetadata: {
        ...metadata,
        uploadedAt: new Date().toISOString()
      },
      cacheControl: 'public,max-age=3600'
    };

    // Upload the file
    const snapshot = await uploadBytes(fileRef, file, uploadMetadata);
    
    // Get the download URL with custom token if needed
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    handleStorageError(error);
  }
};

export const deleteFile = async (path: string): Promise<void> => {
  try {
    const fileRef = storageRef(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    handleStorageError(error);
  }
};

export const getFileUrl = async (path: string): Promise<string> => {
  try {
    const fileRef = storageRef(storage, path);
    return await getDownloadURL(fileRef);
  } catch (error) {
    handleStorageError(error);
  }
};