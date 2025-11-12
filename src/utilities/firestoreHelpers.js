import { firebase_db } from './fireBaseConfig';
import {
 collection,
 addDoc,
 query,
 where,
 getDocs,
 orderBy,
 serverTimestamp
} from 'firebase/firestore';
import { firestore } from './fireBaseConfig';


export const addJournalEntry = async (userId, title, description, photos = [], locationData = null) => {
 try {
   const journalRef = collection(firestore, 'journals');
   const entryData = {
     userId,
     title,
     description,
     photos,
     createdAt: serverTimestamp(),
   };

   // Only add locationData if it exists
   if (locationData) {
     entryData.locationData = locationData;
   }

   await addDoc(journalRef, entryData);
   console.log('Journal entry added successfully');
 } catch (error) {
   console.error('Error adding journal entry:', error);
   throw error;
 }
};


// Retrieve all journals for a specific user
export const getUserJournals = async (userId) => {
 try {
   const journalRef = collection(firestore, 'journals');
   const q = query(
     journalRef,
     where('userId', '==', userId),
     orderBy('createdAt', 'desc')
   );
   const querySnapshot = await getDocs(q);
  
   const journals = [];
   querySnapshot.forEach((doc) => {
     journals.push({ id: doc.id, ...doc.data() });
   });
  
   // Sort by date (newest first)
   journals.sort((a, b) => {
     const dateA = a.createdAt?.seconds || 0;
     const dateB = b.createdAt?.seconds || 0;
     return dateB - dateA;
   });
  
   return journals;
 } catch (error) {
   console.error('Error getting user journals:', error);
   return [];
 }
};
