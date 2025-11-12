import React, { useState, useEffect } from 'react';
import {
 View,
 Text,
 TextInput,
 Button,
 FlatList,
 StyleSheet,
 TouchableOpacity,
 Image,
 Alert,
 Modal,
 ScrollView,
 ActivityIndicator,
 Dimensions
} from 'react-native';
import { firebase_auth } from '../utilities/fireBaseConfig';
import { addJournalEntry, getUserJournals } from '../utilities/firestoreHelpers';
import { uploadMultiplePhotos } from '../utilities/storageHelpers';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

const GOOGLE_API_KEY = 'AIzaSyCv__Mhf30glR9x-yu7exu5p1RsP5sntMQ'; 
const { width } = Dimensions.get('window');

export default function JournalScreen() {
 const [title, setTitle] = useState('');
 const [desc, setDesc] = useState('');
 const [startLocation, setStartLocation] = useState('');
 const [endLocation, setEndLocation] = useState('');
 const [calculatedDistance, setCalculatedDistance] = useState('');
 const [startCoords, setStartCoords] = useState(null);
 const [endCoords, setEndCoords] = useState(null);
 const [entries, setEntries] = useState([]);
 const [loading, setLoading] = useState(false);
 const [photos, setPhotos] = useState([]);
 const [showImagePicker, setShowImagePicker] = useState(false);
 const [selectedEntry, setSelectedEntry] = useState(null);
 const [uploadProgress, setUploadProgress] = useState(0);
 const [showLocationPicker, setShowLocationPicker] = useState(false);
 const [currentPickerType, setCurrentPickerType] = useState('start'); // 'start' or 'end'

 const user = firebase_auth.currentUser;

 useEffect(() => {
   const fetchJournals = async () => {
     if (user) {
       const data = await getUserJournals(user.uid);
       setEntries(data);
     }
   };
   fetchJournals();
   requestPermissions();
 }, [user]);

 const requestPermissions = async () => {
   const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
   const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
   if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
     Alert.alert('Permissions Required', 'Camera and gallery permissions are needed to add photos');
   }
 };

 // Geocode location name to coordinates
 const geocodeLocation = async (locationName) => {
   try {
     const response = await fetch(
       `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&key=${GOOGLE_API_KEY}`
     );
     const data = await response.json();
     
     if (data.status === 'OK' && data.results.length > 0) {
       const location = data.results[0].geometry.location;
       return {
         latitude: location.lat,
         longitude: location.lng,
         name: data.results[0].formatted_address
       };
     }
     return null;
   } catch (error) {
     console.error('Geocoding error:', error);
     return null;
   }
 };

 // Calculate distance between two locations
 const calculateDistance = async () => {
   if (!startLocation || !endLocation) {
     Alert.alert('Missing Locations', 'Please enter both start and end locations');
     return;
   }

   setLoading(true);
   try {
     const startCoord = await geocodeLocation(startLocation);
     const endCoord = await geocodeLocation(endLocation);

     if (!startCoord || !endCoord) {
       Alert.alert('Error', 'Could not find one or both locations. Please try different names.');
       setLoading(false);
       return;
     }

     setStartCoords(startCoord);
     setEndCoords(endCoord);

     // Get route distance using Directions API
     const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoord.latitude},${startCoord.longitude}&destination=${endCoord.latitude},${endCoord.longitude}&key=${GOOGLE_API_KEY}`;
     
     const response = await fetch(directionsUrl);
     const data = await response.json();

     if (data.status === 'OK' && data.routes.length > 0) {
       const distance = data.routes[0].legs[0].distance.text;
       const duration = data.routes[0].legs[0].duration.text;
       setCalculatedDistance(`${distance} (${duration})`);
       Alert.alert('Success', `Distance calculated: ${distance}`);
     }
   } catch (error) {
     console.error('Error calculating distance:', error);
     Alert.alert('Error', 'Failed to calculate distance');
   } finally {
     setLoading(false);
   }
 };

 const takePhoto = async () => {
   try {
     const result = await ImagePicker.launchCameraAsync({
       mediaTypes: ImagePicker.MediaTypeOptions.Images,
       allowsEditing: true,
       aspect: [4, 3],
       quality: 0.8,
     });

     if (!result.canceled && result.assets[0]) {
       setPhotos([...photos, result.assets[0].uri]);
       setShowImagePicker(false);
     }
   } catch (error) {
     console.error('Error taking photo:', error);
     Alert.alert('Error', 'Failed to take photo');
   }
 };

 const pickFromGallery = async () => {
   try {
     const result = await ImagePicker.launchImageLibraryAsync({
       mediaTypes: ImagePicker.MediaTypeOptions.Images,
       allowsEditing: true,
       aspect: [4, 3],
       quality: 0.8,
       allowsMultipleSelection: true,
     });

     if (!result.canceled && result.assets) {
       const newPhotos = result.assets.map(asset => asset.uri);
       setPhotos([...photos, ...newPhotos]);
       setShowImagePicker(false);
     }
   } catch (error) {
     console.error('Error picking from gallery:', error);
     Alert.alert('Error', 'Failed to pick image');
   }
 };

 const removePhoto = (index) => {
   const newPhotos = photos.filter((_, i) => i !== index);
   setPhotos(newPhotos);
 };

 const handleAdd = async () => {
   if (user && title && desc) {
     setLoading(true);
     setUploadProgress(0);
     try {
       const tempEntryId = Date.now().toString();
      
       let photoURLs = [];
      
       if (photos.length > 0) {
         setUploadProgress(25);
         photoURLs = await uploadMultiplePhotos(photos, user.uid, tempEntryId);
         setUploadProgress(75);
       }
      
       // Create location data object
       const locationData = startCoords && endCoords ? {
         startLocation: {
           name: startLocation,
           coordinates: startCoords
         },
         endLocation: {
           name: endLocation,
           coordinates: endCoords
         },
         distance: calculatedDistance
       } : null;

       await addJournalEntry(user.uid, title, desc, photoURLs, locationData);
       setUploadProgress(100);
      
       const updated = await getUserJournals(user.uid);
       setEntries(updated);
      
       // Reset form
       setTitle('');
       setDesc('');
       setStartLocation('');
       setEndLocation('');
       setCalculatedDistance('');
       setStartCoords(null);
       setEndCoords(null);
       setPhotos([]);
       setUploadProgress(0);
      
       Alert.alert('Success', 'Journal entry added!');
     } catch (error) {
       console.error('Error adding entry:', error);
       Alert.alert('Error', 'Failed to add journal entry: ' + error.message);
     } finally {
       setLoading(false);
     }
   } else {
     Alert.alert('Missing Information', 'Please add a title and description');
   }
 };

 const viewEntryDetails = (entry) => {
   setSelectedEntry(entry);
 };

 return (
   <View style={styles.container}>
     <Text style={styles.header}>My Travel Journal 📖</Text>

     <ScrollView style={styles.scrollView}>
       <View style={styles.inputCard}>
         <TextInput
           placeholder="Title (e.g., Paris Day 1)"
           value={title}
           onChangeText={setTitle}
           style={styles.input}
         />
         
         <TextInput
           placeholder="Description (e.g., Visited Eiffel Tower...)"
           value={desc}
           onChangeText={setDesc}
           style={[styles.input, styles.textArea]}
           multiline
           numberOfLines={4}
         />

         {/* Location Section */}
         <View style={styles.locationSection}>
           <Text style={styles.sectionLabel}>📍 Add Route (Optional)</Text>
           
           <TextInput
             placeholder="Start Location (e.g., Times Square, NYC)"
             value={startLocation}
             onChangeText={setStartLocation}
             style={styles.input}
           />
           
           <TextInput
             placeholder="End Location (e.g., Central Park, NYC)"
             value={endLocation}
             onChangeText={setEndLocation}
             style={styles.input}
           />

           <TouchableOpacity
             style={styles.calculateButton}
             onPress={calculateDistance}
             disabled={loading || !startLocation || !endLocation}
           >
             <Ionicons name="map" size={20} color="#fff" />
             <Text style={styles.calculateButtonText}>
               {loading ? 'Calculating...' : 'Calculate Distance'}
             </Text>
           </TouchableOpacity>

           {calculatedDistance && (
             <View style={styles.distanceResult}>
               <Ionicons name="location" size={18} color="#4A90E2" />
               <Text style={styles.distanceResultText}>{calculatedDistance}</Text>
             </View>
           )}
         </View>

         {/* Photo Preview Section */}
         {photos.length > 0 && (
           <View style={styles.photoPreviewContainer}>
             <Text style={styles.photoLabel}>Photos ({photos.length})</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false}>
               {photos.map((photo, index) => (
                 <View key={index} style={styles.photoPreview}>
                   <Image source={{ uri: photo }} style={styles.previewImage} />
                   <TouchableOpacity
                     style={styles.removePhotoButton}
                     onPress={() => removePhoto(index)}
                   >
                     <Ionicons name="close-circle" size={24} color="#ff3b30" />
                   </TouchableOpacity>
                 </View>
               ))}
             </ScrollView>
           </View>
         )}

         {/* Add Photo Button */}
         <TouchableOpacity
           style={styles.addPhotoButton}
           onPress={() => setShowImagePicker(true)}
           disabled={loading}
         >
           <Ionicons name="camera" size={24} color={loading ? '#ccc' : '#4A90E2'} />
           <Text style={[styles.addPhotoText, loading && styles.disabledText]}>Add Photos</Text>
         </TouchableOpacity>

         {/* Upload Progress */}
         {loading && uploadProgress > 0 && (
           <View style={styles.progressContainer}>
             <View style={styles.progressBar}>
               <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
             </View>
             <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
           </View>
         )}

         <Button
           title={loading ? "Adding..." : "Add Entry"}
           onPress={handleAdd}
           disabled={loading || !title || !desc}
           color="#4A90E2"
         />
       </View>

       <Text style={styles.sectionTitle}>My Entries ({entries.length})</Text>

       <FlatList
         data={entries}
         keyExtractor={(item) => item.id}
         scrollEnabled={false}
         renderItem={({ item }) => (
           <TouchableOpacity
             style={styles.entryCard}
             onPress={() => viewEntryDetails(item)}
           >
             <View style={styles.entryHeader}>
               <Text style={styles.entryTitle}>{item.title}</Text>
               <View style={styles.badges}>
                 {item.locationData && (
                   <View style={[styles.photoBadge, { backgroundColor: '#FF6B6B' }]}>
                     <Ionicons name="map" size={14} color="#fff" />
                   </View>
                 )}
                 {item.photos && item.photos.length > 0 && (
                   <View style={styles.photoBadge}>
                     <Ionicons name="images" size={16} color="#fff" />
                     <Text style={styles.photoBadgeText}>{item.photos.length}</Text>
                   </View>
                 )}
               </View>
             </View>
             
             <Text style={styles.entryDesc} numberOfLines={2}>
               {item.description}
             </Text>

             {item.locationData && (
               <View style={styles.routeInfo}>
                 <Ionicons name="navigate" size={16} color="#4A90E2" />
                 <Text style={styles.routeText}>
                   {item.locationData.startLocation.name} → {item.locationData.endLocation.name}
                 </Text>
               </View>
             )}

             {item.locationData?.distance && (
               <View style={styles.distanceContainer}>
                 <Ionicons name="location" size={16} color="#4A90E2" />
                 <Text style={styles.distanceText}>{item.locationData.distance}</Text>
               </View>
             )}

             {item.photos && item.photos.length > 0 && (
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.entryPhotos}>
                 {item.photos.slice(0, 3).map((photo, index) => (
                   <Image key={index} source={{ uri: photo }} style={styles.entryThumbnail} />
                 ))}
                 {item.photos.length > 3 && (
                   <View style={styles.moreThumbnail}>
                     <Text style={styles.moreThumbnailText}>+{item.photos.length - 3}</Text>
                   </View>
                 )}
               </ScrollView>
             )}
             <Text style={styles.entryDate}>
               {item.createdAt?.seconds
                 ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                 : 'Just now'}
             </Text>
           </TouchableOpacity>
         )}
         ListEmptyComponent={
           <View style={styles.emptyState}>
             <Ionicons name="book-outline" size={64} color="#ddd" />
             <Text style={styles.emptyText}>No journal entries yet</Text>
             <Text style={styles.emptySubtext}>Start documenting your travels!</Text>
           </View>
         }
       />
     </ScrollView>

     {/* Image Picker Modal */}
     <Modal
       visible={showImagePicker}
       transparent={true}
       animationType="slide"
       onRequestClose={() => setShowImagePicker(false)}
     >
       <View style={styles.modalOverlay}>
         <View style={styles.modalContent}>
           <Text style={styles.modalTitle}>Add Photo</Text>
          
           <TouchableOpacity style={styles.modalButton} onPress={takePhoto}>
             <Ionicons name="camera" size={32} color="#4A90E2" />
             <Text style={styles.modalButtonText}>Take Photo</Text>
           </TouchableOpacity>

           <TouchableOpacity style={styles.modalButton} onPress={pickFromGallery}>
             <Ionicons name="images" size={32} color="#4A90E2" />
             <Text style={styles.modalButtonText}>Choose from Gallery</Text>
           </TouchableOpacity>

           <TouchableOpacity
             style={[styles.modalButton, styles.cancelButton]}
             onPress={() => setShowImagePicker(false)}
           >
             <Text style={styles.cancelButtonText}>Cancel</Text>
           </TouchableOpacity>
         </View>
       </View>
     </Modal>

     {/* Entry Detail Modal with Map */}
     <Modal
       visible={selectedEntry !== null}
       animationType="slide"
       onRequestClose={() => setSelectedEntry(null)}
     >
       <View style={styles.detailContainer}>
         <View style={styles.detailHeader}>
           <Text style={styles.detailTitle}>{selectedEntry?.title}</Text>
           <TouchableOpacity onPress={() => setSelectedEntry(null)}>
             <Ionicons name="close" size={28} color="#333" />
           </TouchableOpacity>
         </View>

         <ScrollView style={styles.detailContent}>
           <Text style={styles.detailDate}>
             {selectedEntry?.createdAt?.seconds
               ? new Date(selectedEntry.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                   weekday: 'long',
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric'
                 })
               : 'Just now'}
           </Text>

           {/* Map View for Route */}
           {selectedEntry?.locationData && (
             <View style={styles.mapContainer}>
               <MapView
                 style={styles.detailMap}
                 initialRegion={{
                   latitude: (selectedEntry.locationData.startLocation.coordinates.latitude + 
                             selectedEntry.locationData.endLocation.coordinates.latitude) / 2,
                   longitude: (selectedEntry.locationData.startLocation.coordinates.longitude + 
                              selectedEntry.locationData.endLocation.coordinates.longitude) / 2,
                   latitudeDelta: 0.5,
                   longitudeDelta: 0.5,
                 }}
               >
                 <Marker
                   coordinate={selectedEntry.locationData.startLocation.coordinates}
                   title="Start"
                   pinColor="green"
                 />
                 <Marker
                   coordinate={selectedEntry.locationData.endLocation.coordinates}
                   title="End"
                   pinColor="red"
                 />
                 <MapViewDirections
                   origin={selectedEntry.locationData.startLocation.coordinates}
                   destination={selectedEntry.locationData.endLocation.coordinates}
                   apikey={GOOGLE_API_KEY}
                   strokeWidth={4}
                   strokeColor="#4A90E2"
                 />
               </MapView>
               
               <View style={styles.mapInfo}>
                 <View style={styles.mapInfoRow}>
                   <Ionicons name="radio-button-on" size={16} color="green" />
                   <Text style={styles.mapInfoText}>{selectedEntry.locationData.startLocation.name}</Text>
                 </View>
                 <View style={styles.mapInfoRow}>
                   <Ionicons name="location" size={16} color="red" />
                   <Text style={styles.mapInfoText}>{selectedEntry.locationData.endLocation.name}</Text>
                 </View>
                 {selectedEntry.locationData.distance && (
                   <View style={styles.mapInfoRow}>
                     <Ionicons name="navigate" size={16} color="#4A90E2" />
                     <Text style={[styles.mapInfoText, { fontWeight: 'bold' }]}>
                       {selectedEntry.locationData.distance}
                     </Text>
                   </View>
                 )}
               </View>
             </View>
           )}

           {selectedEntry?.photos && selectedEntry.photos.length > 0 && (
             <ScrollView
               horizontal
               pagingEnabled
               showsHorizontalScrollIndicator={false}
               style={styles.detailPhotosScroll}
             >
               {selectedEntry.photos.map((photo, index) => (
                 <Image
                   key={index}
                   source={{ uri: photo }}
                   style={styles.detailPhoto}
                   resizeMode="cover"
                 />
               ))}
             </ScrollView>
           )}

           <Text style={styles.detailDescription}>{selectedEntry?.description}</Text>
         </ScrollView>
       </View>
     </Modal>
   </View>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#1E3338',
 },
 scrollView: {
   flex: 1,
   padding: 15,
 },
 header: {
   fontSize: 26,
   fontWeight: 'bold',
   padding: 15,
   paddingTop: 20,
   color: 'white',
 },
 inputCard: {
   backgroundColor: '#f8f8f8',
   padding: 15,
   borderRadius: 10,
   marginBottom: 20,
 },
 input: {
   borderWidth: 1,
   borderColor: '#ddd',
   backgroundColor: '#fff',
   padding: 12,
   marginBottom: 10,
   borderRadius: 8,
   fontSize: 16,
 },
 textArea: {
   height: 100,
   textAlignVertical: 'top',
 },
 locationSection: {
   marginBottom: 15,
   paddingTop: 10,
   borderTopWidth: 1,
   borderTopColor: '#e0e0e0',
 },
 sectionLabel: {
   fontSize: 16,
   fontWeight: '600',
   color: '#333',
   marginBottom: 10,
 },
 calculateButton: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'center',
   backgroundColor: '#4A90E2',
   padding: 12,
   borderRadius: 8,
   gap: 8,
   marginBottom: 10,
 },
 calculateButtonText: {
   color: '#fff',
   fontSize: 16,
   fontWeight: '600',
 },
 distanceResult: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#e8f4ff',
   padding: 10,
   borderRadius: 8,
   gap: 8,
 },
 distanceResultText: {
   fontSize: 16,
   color: '#4A90E2',
   fontWeight: '600',
 },
 addPhotoButton: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'center',
   padding: 12,
   marginBottom: 10,
   borderRadius: 8,
   borderWidth: 1,
   borderColor: '#4A90E2',
   borderStyle: 'dashed',
   gap: 8,
 },
 addPhotoText: {
   color: '#4A90E2',
   fontSize: 16,
   fontWeight: '600',
 },
 disabledText: {
   color: '#ccc',
 },
 photoPreviewContainer: {
   marginBottom: 15,
 },
 photoLabel: {
   fontSize: 14,
   fontWeight: '600',
   color: '#666',
   marginBottom: 8,
 },
 photoPreview: {
   marginRight: 10,
   position: 'relative',
 },
 previewImage: {
   width: 80,
   height: 80,
   borderRadius: 8,
 },
 removePhotoButton: {
   position: 'absolute',
   top: -8,
   right: -8,
   backgroundColor: '#fff',
   borderRadius: 12,
 },
 progressContainer: {
   marginBottom: 10,
 },
 progressBar: {
   height: 8,
   backgroundColor: '#e0e0e0',
   borderRadius: 4,
   overflow: 'hidden',
 },
 progressFill: {
   height: '100%',
   backgroundColor: '#4A90E2',
 },
 progressText: {
   marginTop: 5,
   fontSize: 12,
   color: '#666',
   textAlign: 'center',
 },
 sectionTitle: {
   fontSize: 18,
   fontWeight: '600',
   marginBottom: 10,
   color: '#666',
 },
 entryCard: {
   backgroundColor: '#f8f8f8',
   padding: 15,
   borderRadius: 10,
   marginBottom: 10,
   borderLeftWidth: 4,
   borderLeftColor: '#4A90E2',
 },
 entryHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   marginBottom: 8,
 },
 entryTitle: {
   fontWeight: 'bold',
   fontSize: 18,
   color: '#333',
   flex: 1,
 },
 badges: {
   flexDirection: 'row',
   gap: 6,
 },
 photoBadge: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#4A90E2',
   paddingHorizontal: 8,
   paddingVertical: 4,
   borderRadius: 12,
   gap: 4,
 },
 photoBadgeText: {
   color: '#fff',
   fontSize: 12,
   fontWeight: 'bold',
 },
 entryDesc: {
   fontSize: 14,
   marginBottom: 8,
   color: '#666',
   lineHeight: 20,
 },
 routeInfo: {
   flexDirection: 'row',
   alignItems: 'center',
   marginBottom: 6,
   gap: 6,
 },
 routeText: {
   fontSize: 13,
   color: '#666',
   flex: 1,
 },
 distanceContainer: {
   flexDirection: 'row',
   alignItems: 'center',
   marginBottom: 8,
   gap: 4,
 },
 distanceText: {
   fontSize: 14,
   color: '#4A90E2',
   fontWeight: '600',
 },
 entryPhotos: {
   marginVertical: 8,
 },
 entryThumbnail: {
   width: 60,
   height: 60,
   borderRadius: 8,
   marginRight: 8,
 },
 moreThumbnail: {
   width: 60,
   height: 60,
   borderRadius: 8,
   backgroundColor: 'rgba(0,0,0,0.5)',
   justifyContent: 'center',
   alignItems: 'center',
 },
 moreThumbnailText: {
   color: '#fff',
   fontSize: 16,
   fontWeight: 'bold',
 },
 entryDate: {
   fontSize: 12,
   color: '#999',
   marginTop: 4,
 },
 emptyState: {
   alignItems: 'center',
   marginTop: 50,
 },
 emptyText: {
   fontSize: 18,
   color: '#999',
   marginTop: 10,
   marginBottom: 5,
 },
 emptySubtext: {
   fontSize: 14,
   color: '#ccc',
 },
 modalOverlay: {
   flex: 1,
   backgroundColor: 'rgba(0, 0, 0, 0.5)',
   justifyContent: 'flex-end',
 },
 modalContent: {
   backgroundColor: '#fff',
   borderTopLeftRadius: 20,
   borderTopRightRadius: 20,
   padding: 20,
   paddingBottom: 40,
 },
 modalTitle: {
   fontSize: 20,
   fontWeight: 'bold',
   marginBottom: 20,
   textAlign: 'center',
 },
 modalButton: {
   flexDirection: 'row',
   alignItems: 'center',
   padding: 15,
   backgroundColor: '#f8f8f8',
   borderRadius: 10,
   marginBottom: 10,
   gap: 15,
 },
 modalButtonText: {
   fontSize: 16,
   fontWeight: '600',
   color: '#333',
 },
 cancelButton: {
   backgroundColor: '#fff',
   borderWidth: 1,
   borderColor: '#ddd',
   justifyContent: 'center',
 },
 cancelButtonText: {
   fontSize: 16,
   fontWeight: '600',
   color: '#666',
   textAlign: 'center',
 },
 detailContainer: {
   flex: 1,
   backgroundColor: '#fff',
 },
 detailHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   padding: 15,
   paddingTop: 60,
   borderBottomWidth: 1,
   borderBottomColor: '#eee',
 },
 detailTitle: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#333',
   flex: 1,
 },
 detailContent: {
   flex: 1,
   padding: 15,
 },
 detailDate: {
   fontSize: 14,
   color: '#999',
   marginBottom: 15,
 },
 mapContainer: {
   marginBottom: 20,
   borderRadius: 12,
   overflow: 'hidden',
   borderWidth: 1,
   borderColor: '#e0e0e0',
 },
 detailMap: {
   width: '100%',
   height: 250,
 },
 mapInfo: {
   backgroundColor: '#f8f8f8',
   padding: 12,
 },
 mapInfoRow: {
   flexDirection: 'row',
   alignItems: 'center',
   marginBottom: 6,
   gap: 8,
 },
 mapInfoText: {
   fontSize: 14,
   color: '#333',
   flex: 1,
 },
 detailPhotosScroll: {
   marginBottom: 20,
 },
 detailPhoto: {
   width: width - 30,
   height: 300,
   borderRadius: 10,
   marginRight: 10,
 },
 detailDescription: {
   fontSize: 16,
   color: '#333',
   lineHeight: 24,
 },
});