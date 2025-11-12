import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { firebase_auth } from '../utilities/fireBaseConfig';

export default function HomeScreen({ navigation }) {
  const user = firebase_auth.currentUser;
  const firstName = user?.email?.split('@')[0] || 'Traveler';

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient colors={['#27474D', '#1E3338']} style={styles.header}>
        <Text style={styles.appTitle}>Chemtrails</Text>
        <Text style={styles.tagline}>Map your memories. Plan your adventures.</Text>
      </LinearGradient>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome, {firstName}! 👋</Text>
        <Text style={styles.aboutTitle}>About Us</Text>
        <Text style={styles.aboutText}>
          Chemtrails is your all-in-one travel planner — helping you explore destinations, 
          calculate routes, and record your memories. Whether you're traveling the world or discovering your city, 
          Chemtrails helps you turn journeys into stories.
        </Text>
      </View>

      {/* Feature Grid */}
      <View style={styles.featureGrid}>
        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Explore')}>
          <Ionicons name="search" size={40} color="#f5f5f5" />
          <Text style={styles.featureLabel}>Explore</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Map')}>
          <Ionicons name="map" size={40} color="#f5f5f5" />
          <Text style={styles.featureLabel}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Journal')}>
          <Ionicons name="book" size={40} color="#f5f5f5" />
          <Text style={styles.featureLabel}>Journal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle" size={40} color="#f5f5f5" />
          <Text style={styles.featureLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3338', 
  },
  header: {
    padding: 20,
    backgroundColor: '#1E3338',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  welcomeSection: {
    paddingHorizontal: 25,
    paddingBottom: 10,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  aboutTitle: {
    fontSize: 16,
    color: '#A7D1D1',
    fontWeight: '600',
    marginBottom: 0,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#DDE8E8',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 30,
    paddingHorizontal: 15,
  },
  featureCard: {
    width: '42%',
    backgroundColor: '#2F4B50',
    borderRadius: 18,
    paddingVertical: 25,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
});
