import { View, Text, Button, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { firebase_auth } from '../utilities/fireBaseConfig';

export default function ProfileScreen() {
  const handleSignOut = async () => {
    try {
      await signOut(firebase_auth);
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{firebase_auth.currentUser?.email}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Member since:</Text>
        <Text style={styles.value}>
          {firebase_auth.currentUser?.metadata?.creationTime 
            ? new Date(firebase_auth.currentUser.metadata.creationTime).toLocaleDateString()
            : 'N/A'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="Sign Out" 
          onPress={handleSignOut}
          color="#ff4444"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1E3338',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: 'white',
    marginleft: 5,
  },
  infoCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    marginTop: 30,
  },
});