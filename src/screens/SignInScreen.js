import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';
import { useState } from 'react';
import { firebase_auth } from '../utilities/fireBaseConfig';
import { Alert, View, TextInput, TouchableOpacity, StyleSheet, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SignInScreen(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert("Missing Fields", "Please enter both email and password");
            return;
        }
        try {
            setLoading(true);
            await createUserWithEmailAndPassword(firebase_auth, email.trim(), password);
            Alert.alert("Success", "Account created successfully!");
        } catch(e) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert("Missing Fields", "Please enter both email and password");
            return;
        }
        try {
            setLoading(true);
            await signInWithEmailAndPassword(firebase_auth, email.trim(), password);
        } catch(e) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Decorative Background Elements */}
            <View style={styles.backgroundDecorations}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
                <View style={[styles.circle, styles.circle3]} />
                <View style={[styles.circle, styles.circle4]} />
                <View style={[styles.circle, styles.circle5]} />
                <View style={[styles.circle, styles.circle6]} />
            </View>

            {/* Floating Icons */}
            <View style={styles.floatingIcons}>
                <Ionicons name="airplane" size={40} color="rgba(255,255,255,0.3)" style={styles.icon1} />
                <Ionicons name="location" size={35} color="rgba(255,255,255,0.3)" style={styles.icon2} />
                <Ionicons name="map" size={30} color="rgba(255,255,255,0.3)" style={styles.icon3} />
                <Ionicons name="compass" size={32} color="rgba(255,255,255,0.3)" style={styles.icon4} />
                <Ionicons name="globe" size={28} color="rgba(255,255,255,0.3)" style={styles.icon5} />
                <Ionicons name="camera" size={26} color="rgba(255,255,255,0.3)" style={styles.icon6} />
                <Ionicons name="close" size={50} color="rgba(255,255,255,0.3)" style={styles.iconX} />
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Logo/Title Section */}
                <View style={styles.header}>
                    <Text style={styles.logo}>Chemtrails</Text>
                    <Text style={styles.tagline}>Map your memories. Plan your adventures.</Text>
                </View>

                {/* Form Card */}
                <View style={styles.formCard}>
                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#8B9DAF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#8B9DAF"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#8B9DAF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#8B9DAF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Main Action Button */}
                    <TouchableOpacity 
                        style={[styles.button, styles.primaryButton]}
                        onPress={isSignUp ? handleSignUp : handleSignIn}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
                        </Text>
                    </TouchableOpacity>

                    {/* Toggle Sign In/Sign Up */}
                    <View style={styles.toggleContainer}>
                        <Text style={styles.toggleText}>
                            {isSignUp ? "Already have an account?" : "Don't have an account?"}
                        </Text>
                        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                            <Text style={styles.toggleButton}>
                                {isSignUp ? "Sign In" : "Sign Up"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.footerText}>Your data is secure with us</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#27474D',
    },
    backgroundDecorations: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    circle: {
        position: 'absolute',
        borderRadius: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    circle1: {
        width: 150,
        height: 150,
        top: -50,
        left: -30,
    },
    circle2: {
        width: 200,
        height: 200,
        top: 80,
        right: -80,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    circle3: {
        width: 80,
        height: 80,
        top: 120,
        left: 50,
    },
    circle4: {
        width: 60,
        height: 60,
        top: 50,
        right: 100,
    },
    circle5: {
        width: 180,
        height: 180,
        bottom: -60,
        left: -50,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    circle6: {
        width: 100,
        height: 100,
        bottom: 150,
        right: 40,
    },
    floatingIcons: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    icon1: {
        position: 'absolute',
        top: 120,
        left: 40,
        transform: [{ rotate: '-15deg' }],
    },
    icon2: {
        position: 'absolute',
        top: 200,
        right: 50,
    },
    icon3: {
        position: 'absolute',
        bottom: 250,
        left: 60,
    },
    icon4: {
        position: 'absolute',
        top: height * 0.4,
        right: 30,
        transform: [{ rotate: '25deg' }],
    },
    icon5: {
        position: 'absolute',
        bottom: 180,
        right: 70,
    },
    icon6: {
        position: 'absolute',
        bottom: 320,
        left: 30,
        transform: [{ rotate: '-10deg' }],
    },
    iconX: {
        position: 'absolute',
        top: 60,
        right: 30,
        transform: [{ rotate: '15deg' }],
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        zIndex: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logo: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    formCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        padding: 25,
        backdropFilter: 'blur(10px)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        height: 55,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2C3E50',
    },
    button: {
        borderRadius: 12,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    primaryButton: {
        backgroundColor: 'black',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    toggleText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
        marginRight: 5,
    },
    toggleButton: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        gap: 8,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
    },
});