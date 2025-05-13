import { ref, uploadBytesResumable, getDownloadURL, deleteObject, type StorageReference } from 'firebase/storage';
import { storage } from './firebase'; // Assuming firebase.ts is in the same directory
import { auth } from './firebase'; // For getting current user UID

interface UploadResult {
  downloadURL?: string;
  error?: string;
  progress?: number; // Percentage 0-100
}

export const uploadFileToStorage = (
  file: File,
  path: string, // e.g., `homework/${userId}/${file.name}`
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const storageRef: StorageReference = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error('Upload failed:', error);
        reject({ error: error.message });
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadURL });
        } catch (error: any) {
          console.error('Failed to get download URL:', error);
          reject({ error: error.message });
        }
      }
    );
  });
};

export const uploadHomeworkImage = async (
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  if (!userId) {
    return { error: 'User not authenticated for upload.' };
  }
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${file.name}`;
  const filePath = `homework/${userId}/${uniqueFileName}`;
  return uploadFileToStorage(file, filePath, onProgress);
};

export const deleteFileFromStorage = async (filePath: string): Promise<{ success?: boolean; error?: string }> => {
  const storageRef = ref(storage, filePath);
  try {
    await deleteObject(storageRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return { error: error.message };
  }
};
