import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const GOOGLE_PLACES_API_KEY = 'AIzaSyAuHyfoSh4TpZwfLjNjSS2xhWM_OTCtcc0';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const searchPlaces = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a location to search');
      return;
    }

    setLoading(true);
    setSearched(true);
    setErrorMessage(null);

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/textsearch/json',
        {
          params: {
            query: `things to do in ${searchQuery}`,
            key: GOOGLE_PLACES_API_KEY,
          },
        }
      );

      console.log(
        'Places API raw response:',
        JSON.stringify(response.data, null, 2)
      );

      const status = response.data.status;
      const apiErrorMessage = response.data.error_message;

      if (status === 'OK') {
        setPlaces(response.data.results || []);
      } else if (status === 'ZERO_RESULTS') {
        setPlaces([]);
        setErrorMessage('No places found for this location.');
      } else {
        setPlaces([]);
        setErrorMessage(apiErrorMessage || `Places API error: ${status}`);
      }
    } catch (error) {
      console.log('Network / axios error:', error);
      setPlaces([]);
      setErrorMessage(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed place information including reviews
  const fetchPlaceDetails = async (placeId) => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            fields: 'name,rating,reviews,formatted_address,formatted_phone_number,opening_hours,website,photos,user_ratings_total',
            key: GOOGLE_PLACES_API_KEY,
          },
        }
      );

      if (response.data.status === 'OK') {
        setPlaceDetails(response.data.result);
      } else {
        alert('Could not fetch place details');
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      alert('Failed to load reviews');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePlacePress = (place) => {
    setSelectedPlace(place);
    fetchPlaceDetails(place.place_id);
  };

  const closeModal = () => {
    setSelectedPlace(null);
    setPlaceDetails(null);
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`full-${i}`} name="star" size={16} color="#FFC107" />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={16} color="#FFC107" />);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFC107" />);
    }
    return stars;
  };

  const renderPlace = ({ item }) => (
    <TouchableOpacity 
      style={styles.placeCard}
      onPress={() => handlePlacePress(item)}
    >
      {item.photos && item.photos[0] && (
        <Image
          source={{
            uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${item.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
          }}
          style={styles.placeImage}
        />
      )}
      <View style={styles.placeInfo}>
        <Text style={styles.placeName}>{item.name}</Text>
        {item.rating && (
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(item.rating)}
            </View>
            <Text style={styles.placeRating}>
              {item.rating} {item.user_ratings_total ? `(${item.user_ratings_total})` : ''}
            </Text>
          </View>
        )}
        {item.formatted_address && (
          <Text style={styles.placeAddress} numberOfLines={2}>
            📍 {item.formatted_address}
          </Text>
        )}
        {item.types && item.types[0] && (
          <Text style={styles.placeType}>
            🏷️ {item.types[0].replace(/_/g, ' ')}
          </Text>
        )}
        <View style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details & Reviews</Text>
          <Ionicons name="chevron-forward" size={16} color="#4A90E2" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Explore Places 🔍</Text>

      <View style={styles.searchCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter a city or location (e.g., Paris, Tokyo)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchPlaces}
        />
        <Button
          title={loading ? 'Searching...' : 'Search'}
          onPress={searchPlaces}
          disabled={loading}
        />
      </View>

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Finding amazing places...</Text>
        </View>
      )}

      {!loading && searched && places.length === 0 && !errorMessage && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No places found</Text>
          <Text style={styles.emptySubtext}>Try a different location</Text>
        </View>
      )}

      {!loading && !searched && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyText}>Search for a destination</Text>
          <Text style={styles.emptySubtext}>
            Discover attractions, restaurants, and landmarks
          </Text>
        </View>
      )}

      {!loading && places.length > 0 && (
        <FlatList
          data={places}
          keyExtractor={(item, index) => item.place_id || String(index)}
          renderItem={renderPlace}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Place Details Modal with Reviews */}
      <Modal
        visible={selectedPlace !== null}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Place Details</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {loadingDetails ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.loadingText}>Loading details...</Text>
            </View>
          ) : placeDetails ? (
            <ScrollView style={styles.modalContent}>
              {/* Place Photos */}
              {placeDetails.photos && placeDetails.photos[0] && (
                <Image
                  source={{
                    uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${placeDetails.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
                  }}
                  style={styles.modalImage}
                />
              )}

              {/* Place Info */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsName}>{placeDetails.name}</Text>
                
                {placeDetails.rating && (
                  <View style={styles.detailsRating}>
                    <View style={styles.starsContainer}>
                      {renderStars(placeDetails.rating)}
                    </View>
                    <Text style={styles.ratingText}>
                      {placeDetails.rating} 
                      {placeDetails.user_ratings_total && ` (${placeDetails.user_ratings_total} reviews)`}
                    </Text>
                  </View>
                )}

                {placeDetails.formatted_address && (
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={20} color="#4A90E2" />
                    <Text style={styles.detailText}>{placeDetails.formatted_address}</Text>
                  </View>
                )}

                {placeDetails.formatted_phone_number && (
                  <View style={styles.detailRow}>
                    <Ionicons name="call" size={20} color="#4A90E2" />
                    <Text style={styles.detailText}>{placeDetails.formatted_phone_number}</Text>
                  </View>
                )}

                {placeDetails.website && (
                  <View style={styles.detailRow}>
                    <Ionicons name="globe" size={20} color="#4A90E2" />
                    <Text style={styles.detailText} numberOfLines={1}>{placeDetails.website}</Text>
                  </View>
                )}

                {placeDetails.opening_hours && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={20} color="#4A90E2" />
                    <Text style={styles.detailText}>
                      {placeDetails.opening_hours.open_now ? '🟢 Open now' : '🔴 Closed'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Reviews Section */}
              {placeDetails.reviews && placeDetails.reviews.length > 0 && (
                <View style={styles.reviewsSection}>
                  <Text style={styles.reviewsTitle}>
                    Reviews ({placeDetails.reviews.length})
                  </Text>
                  
                  {placeDetails.reviews.map((review, index) => (
                    <View key={index} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Image
                          source={{ uri: review.profile_photo_url }}
                          style={styles.reviewerPhoto}
                        />
                        <View style={styles.reviewerInfo}>
                          <Text style={styles.reviewerName}>{review.author_name}</Text>
                          <View style={styles.reviewRating}>
                            <View style={styles.starsContainer}>
                              {renderStars(review.rating)}
                            </View>
                            <Text style={styles.reviewTime}>{review.relative_time_description}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.reviewText}>{review.text}</Text>
                    </View>
                  ))}
                </View>
              )}

              {(!placeDetails.reviews || placeDetails.reviews.length === 0) && (
                <View style={styles.noReviews}>
                  <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                  <Text style={styles.noReviewsText}>No reviews yet</Text>
                </View>
              )}
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3338',
    padding: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    color: 'white',
  },
  searchCard: {
    backgroundColor: '#576a6fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#555',
  },
  errorBox: {
    backgroundColor: '#ffe5e5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#b00020',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 10,
  },
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#ddd',
  },
  placeInfo: {
    padding: 15,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  placeRating: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  placeAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  placeType: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
    marginBottom: 10,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  viewDetailsText: {
    color: '#4A90E2',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#ddd',
  },
  detailsSection: {
    padding: 15,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  detailsName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  reviewsSection: {
    padding: 15,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  reviewCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  reviewerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewTime: {
    fontSize: 12,
    color: '#999',
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noReviews: {
    alignItems: 'center',
    padding: 40,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});