// app/index.tsx
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase'; // Adjust path to your firebaseConfig.js


const LoginScreen: React.FC = () => {
  // Fixes

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [name, setName] = useState<string>('');
  const [height, setHeight] = useState<string>(''); // Deprecated direct inches input; using feet+inches, total computed on submit
  const [heightFeet, setHeightFeet] = useState<string>('');
  const [heightInches, setHeightInches] = useState<string>('');
  const [weightLb, setWeightLb] = useState<string>(''); // In pounds
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [targetKcal, setTargetKcal] = useState<string>('');
  const [targetProtein, setTargetProtein] = useState<string>('');
  const [targetFats, setTargetFats] = useState<string>('');
  const [targetCarbs, setTargetCarbs] = useState<string>('');
  const [step, setStep] = useState(0);

  const [profileStep, setProfileStep] = useState<number>(0);

  const isStepValid = (s: number) => {
    if (s === 0) {
      return name.trim().length > 0 && age.trim().length > 0 && gender.trim().length > 0;
    }
    if (s === 1) {
      return heightFeet.trim().length > 0 && heightInches.trim().length > 0 && weightLb.trim().length > 0;
    }
    if (s === 2) {
      return (
        targetKcal.trim().length > 0 &&
        targetProtein.trim().length > 0 &&
        targetFats.trim().length > 0 &&
        targetCarbs.trim().length > 0
      );
    }
    return false;
  };

  const steps = [
    { title : "Welcome to the Home Tab!", description: "Your dashboard for an overview of your fitness journey." },
    { title : "Fitness Tab", description: "Your dashboard for an overview of your fitness journey." },
    { title : "Nutrition Tab", description: "Your dashboard for an overview of your fitness journey." },
    { title : "Progress tab", description: "Your dashboard for an overview of your fitness journey." },
    ];

  const router = useRouter();
  const [newUserId, setNewUserId] = useState<string | null>(null);

  // Fixes
  // const [busy, setBusy] = useState<boolean>(true);
  // const auth = initializeAuth(app, { persistence: getReactNativePersistance(ReactNativeAsyncStorage) });

  const handleLoginOrSignUp = async () => {
    if (isSignUp) {
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        setNewUserId(user.uid);
        setShowProfileModal(true);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to create account');
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Logged in!');
        router.replace('/(tabs)/home');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to log in');
      }
    }
  };

  const handleProfileSubmit = async () => {
    if (!name.trim() || !heightFeet || !heightInches || !weightLb || !age || !gender || !targetKcal || !targetProtein || !targetFats || !targetCarbs) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (
      isNaN(parseInt(heightFeet)) ||
      isNaN(parseInt(heightInches)) ||
      isNaN(parseFloat(weightLb)) ||
      isNaN(parseInt(age)) ||
      isNaN(parseFloat(targetKcal)) ||
      isNaN(parseFloat(targetProtein)) ||
      isNaN(parseFloat(targetFats)) ||
      isNaN(parseFloat(targetCarbs))
    ) {
      Alert.alert('Error', 'Please enter valid numbers for height, weight, age, and nutrition targets');
      return;
    }
    const feet = parseInt(heightFeet, 10);
    const inches = parseInt(heightInches, 10);
    if (inches < 0 || inches > 11 || feet < 0) {
      Alert.alert('Error', 'Inches must be between 0 and 11, and feet must be 0 or greater.');
      return;
    }
    const totalInches = feet * 12 + inches;
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== newUserId) {
        Alert.alert('Error', 'Authentication error. Please try signing up again.');
        return;
      }
      await setDoc(doc(db, 'users', newUserId!), {
        name: name.trim(),
        email: email,
        height: totalInches,
        weightLb: parseFloat(weightLb),
        age: parseInt(age),
        gender: gender,
        nutrition: {
          target: {
            kcal: parseFloat(targetKcal),
            protein: parseFloat(targetProtein),
            fats: parseFloat(targetFats),
            carbs: parseFloat(targetCarbs),
          },
          current: {
            kcal: 0,
            protein: 0,
            fats: 0,
            carbs: 0,
          },
        },
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Profile saved! Please log in.');
      setShowProfileModal(false);
      setIsSignUp(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setHeight('');
      setHeightFeet('');
      setHeightInches('');
      setWeightLb('');
      setAge('');
      setGender('');
      setTargetKcal('');
      setTargetProtein('');
      setTargetFats('');
      setTargetCarbs('');
      setNewUserId(null);
      setProfileStep(0);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
      console.error('Firestore Error:', error); // Log for debugging
    }
  };

  const handleSkip = () => setShowOnboarding(true);
  const handleNext = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else {
      setShowOnboarding(false);
      router.replace("/(tabs)/home");
    }
  };

  /*
  if (busy) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>Checking session…</Text>
      </View>
    );
  }
  */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AimHigh</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#4B4B4B"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#4B4B4B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#4B4B4B"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        )}
        <TouchableOpacity style={styles.button} onPress={handleLoginOrSignUp}>
          <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Log In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toggleButton} onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.toggleButtonText}>
            {isSignUp ? "Already have an account? Log In" : "No account? Sign Up"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showProfileModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Your Profile</Text>

            {profileStep === 0 && (
              <View style={{ width: '100%' }}>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor="#4B4B4B"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  placeholderTextColor="#4B4B4B"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Gender (e.g., Male/Female/Other)"
                  placeholderTextColor="#4B4B4B"
                  value={gender}
                  onChangeText={setGender}
                  autoCapitalize="words"
                />
              </View>
            )}

            {profileStep === 1 && (
              <View style={{ width: '100%' }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Height (feet)"
                    placeholderTextColor="#4B4B4B"
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Height (inches)"
                    placeholderTextColor="#4B4B4B"
                    value={heightInches}
                    onChangeText={setHeightInches}
                    keyboardType="numeric"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Weight (pounds)"
                  placeholderTextColor="#4B4B4B"
                  value={weightLb}
                  onChangeText={setWeightLb}
                  keyboardType="numeric"
                />
              </View>
            )}

            {profileStep === 2 && (
              <View style={{ width: '100%' }}>
                <TextInput
                  style={styles.input}
                  placeholder="Target Calories (kcal)"
                  placeholderTextColor="#4B4B4B"
                  value={targetKcal}
                  onChangeText={setTargetKcal}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Target Protein (grams)"
                  placeholderTextColor="#4B4B4B"
                  value={targetProtein}
                  onChangeText={setTargetProtein}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Target Fats (grams)"
                  placeholderTextColor="#4B4B4B"
                  value={targetFats}
                  onChangeText={setTargetFats}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Target Carbs (grams)"
                  placeholderTextColor="#4B4B4B"
                  value={targetCarbs}
                  onChangeText={setTargetCarbs}
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.navRow}>
              {profileStep > 0 ? (
                <TouchableOpacity style={[styles.navBtn, styles.secondaryBtn]} onPress={() => setProfileStep((s) => s - 1)}>
                  <Text style={styles.secondaryText}>Previous</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: '48%' }} />
              )}

              {profileStep < 2 ? (
                <TouchableOpacity
                  onPress={() => setProfileStep((s) => s + 1)}
                  disabled={!isStepValid(profileStep)}
                  style={[styles.navBtn, !isStepValid(profileStep) && styles.disabledBtn]}
                >
                  <Text style={styles.navText}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.navBtn, { backgroundColor: '#22C55E' }]} onPress={handleProfileSubmit}>
                  <Text style={styles.navText}>Submit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showOnboarding} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.stepTitle}>{steps[step].title}</Text>
            <Text style={styles.description}>{steps[step].description}</Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>{step < steps.length - 1 ? "Next" : "Done"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 20 },
  title: { fontSize: 30, fontWeight: 'bold', marginBottom: 32, color: '#000000' },
  inputContainer: { width: '80%' },
  input: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: { backgroundColor: '#F97316', borderRadius: 8, padding: 12, width: '100%', alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  toggleButton: { alignItems: 'center', marginBottom: 16 },
  toggleButtonText: { color: '#F97316', fontSize: 14, fontWeight: '500' },
  skipButton: { alignItems: 'center' },
  skipButtonText: { color: '#F97316', fontSize: 16, fontWeight: '500' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', paddingHorizontal: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '86%', maxWidth: 520, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', color: '#000000' },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#000000' },
  description: { fontSize: 16, textAlign: 'center', marginBottom: 24, color: '#4B4B4B' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, width: '100%', marginTop: 8 },
  navBtn: { flexGrow: 1, flexBasis: '48%', borderRadius: 8, padding: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F97316' },
  navText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#F97316' },
  secondaryText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
  disabledBtn: { opacity: 0.5 },
});

export default LoginScreen;
