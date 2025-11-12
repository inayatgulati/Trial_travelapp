import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './fireBaseConfig';


/**
* Upload a photo to Firebase Storage
*/
export const uploadPhoto = async (uri, userId, entryId) => {
 try {
  const response = await fetch(uri.startsWith('file://') ? uri : `file://${uri}`);
   const blob = await response.blob();
  
   const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
   const storageRef = ref(storage, `users/${userId}/journals/${entryId}/${filename}`);
  
   await uploadBytes(storageRef, blob);
   const downloadURL = await getDownloadURL(storageRef);
   return downloadURL;
 } catch (error) {
 console.error('Error uploading photo:', JSON.stringify(error, null, 2));
   throw error;
 }
};


/**
* Upload multiple photos
*/
export const uploadMultiplePhotos = async (photoUris, userId, entryId) => {
 try {
   const uploadPromises = photoUris.map(uri => uploadPhoto(uri, userId, entryId));
   const downloadURLs = await Promise.all(uploadPromises);
   return downloadURLs;
 } catch (error) {
   console.error('Error uploading multiple photos:', error);
   throw error;
 }
};
