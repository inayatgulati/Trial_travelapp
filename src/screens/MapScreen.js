import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const GOOGLE_API_KEY = 'AIzaSyCv__Mhf30glR9x-yu7exu5p1RsP5sntMQ'; 
const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [region, setRegion] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const mapRef = useRef(null);

  // Get user's current location on mount
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Allow location access to use map directions');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const userRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(userRegion);
        setUserLocation(userRegion);
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    })();
  }, []);

  // Search for places using Google Places API
  const searchPlaces = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        setSearchResults(data.results.slice(0, 5)); // Show top 5 results
        setShowResults(true);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search locations');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle place selection
  const handlePlaceSelect = (place) => {
    const location = place.geometry.location;
    const dest = {
      latitude: location.lat,
      longitude: location.lng,
      name: place.name,
    };
    setDestination(dest);
    setSearchQuery(place.name);
    setShowResults(false);

    // Move map view to show destination
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...dest,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000
      );
    }
  };

  // Clear destination
  const clearDestination = () => {
    setDestination(null);
    setSearchQuery('');
    setDistance(null);
    setDuration(null);
    setSearchResults([]);
  };

  // Center on user location
  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={false}
        initialRegion={region}
        region={region}
        showsCompass={true}
        showsScale={true}
      >
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerDot} />
            </View>
          </Marker>
        )}
        
        {destination && (
          <Marker
            coordinate={destination}
            title={destination.name}
          >
            <View style={styles.destinationMarker}>
              <Ionicons name="location" size={40} color="#EA4335" />
            </View>
          </Marker>
        )}

        {/* Show Directions */}
        {userLocation && destination && (
          <MapViewDirections
            origin={userLocation}
            destination={destination}
            apikey={GOOGLE_API_KEY}
            strokeWidth={5}
            strokeColor="#4285F4"
            onReady={(result) => {
              setDistance(result.distance);
              setDuration(result.duration);
              mapRef.current.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                animated: true,
              });
            }}
            onError={(errorMessage) => {
              console.error('Directions error: ', errorMessage);
              Alert.alert('Error', 'Unable to fetch route. Try another destination.');
            }}
          />
        )}
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#5F6368" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a place"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchPlaces(text);
            }}
            onFocus={() => setShowResults(true)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearDestination}>
              <Ionicons name="close-circle" size={20} color="#5F6368" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <ScrollView style={styles.resultsList}>
              {searchResults.map((place, index) => (
                <TouchableOpacity
                  key={place.place_id}
                  style={styles.resultItem}
                  onPress={() => handlePlaceSelect(place)}
                >
                  <Ionicons name="location-outline" size={20} color="#5F6368" />
                  <View style={styles.resultText}>
                    <Text style={styles.resultName}>{place.name}</Text>
                    <Text style={styles.resultAddress} numberOfLines={1}>
                      {place.formatted_address}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Location Button */}
      <TouchableOpacity style={styles.locationButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color="#5F6368" />
      </TouchableOpacity>

      {/* Route Info Card */}
      {distance && duration && (
        <View style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <Ionicons name="navigate" size={24} color="#4285F4" />
            <Text style={styles.routeTitle}>Route Details</Text>
          </View>
          
          <View style={styles.routeDetails}>
            <View style={styles.routeDetailItem}>
              <Ionicons name="time-outline" size={20} color="#5F6368" />
              <Text style={styles.routeDetailText}>{Math.round(duration)} min</Text>
            </View>
            
            <View style={styles.routeDivider} />
            
            <View style={styles.routeDetailItem}>
              <Ionicons name="car-outline" size={20} color="#5F6368" />
              <Text style={styles.routeDetailText}>{distance.toFixed(1)} km</Text>
            </View>
          </View>

          <View style={styles.routeLocations}>
            <View style={styles.locationRow}>
              <View style={styles.greenDot} />
              <Text style={styles.locationText} numberOfLines={1}>Your Location</Text>
            </View>
            <View style={styles.locationRow}>
              <View style={styles.redDot} />
              <Text style={styles.locationText} numberOfLines={1}>{destination?.name}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Navigation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 15,
    right: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#202124',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  resultsList: {
    padding: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
  },
  resultText: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 14,
    color: '#5F6368',
  },
  locationButton: {
    position: 'absolute',
    right: 15,
    bottom: 200,
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  userMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 3,
    left: 3,
  },
  destinationMarker: {
    alignItems: 'center',
  },
  routeCard: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
    marginLeft: 10,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  routeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeDivider: {
    width: 1,
    backgroundColor: '#DADCE0',
  },
  routeDetailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
  },
  routeLocations: {
    marginBottom: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34A853',
    marginRight: 12,
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EA4335',
    marginRight: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#5F6368',
    flex: 1,
  },
  startButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});