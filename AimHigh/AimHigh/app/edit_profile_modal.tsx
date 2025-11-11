import { Ionicons } from '@expo/vector-icons';
import { getAuth, updateEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { db } from '../firebase';
import NutritionCalculator from './nutrition_calculator';

const ORANGE = "#FF6A00";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

interface NutritionGoals {
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  age: string;
  weight: string;
  height: string;
  nutritionGoals?: NutritionGoals | null;
}

export default function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    age: '',
    weight: '',
    height: '',
  });
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals | null>(null);
  const [showNutritionCalculator, setShowNutritionCalculator] = useState(false);
  const [saving, setSaving] = useState(false);

  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  // Load profile from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      if (!visible || !uid) return;

      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setProfile({
            name: data.name ?? '',
            email: data.email ?? auth.currentUser?.email ?? '',
            phone: data.phone ?? '',
            age: data.age ?? '',
            weight: data.weight ?? '',
            height: data.height ?? '',
          });
          setNutritionGoals(data.nutritionGoals ?? null);
        } else {
          const user = auth.currentUser!;
          setProfile((p) => ({
            ...p,
            name: user.displayName ?? '',
            email: user.email ?? '',
          }));
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    };

    loadProfile();
  }, [visible, uid, auth]);

  // Save handler
  const handleSave = async () => {
    if (!uid) {
      Alert.alert('Error', 'You must be signed in to save a profile.');
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser!;

      if (user.displayName !== profile.name || user.email !== profile.email) {
        await updateProfile(user, { displayName: profile.name });
        if (user.email !== profile.email) {
          await updateEmail(user, profile.email);
        }
      }

      await setDoc(
        doc(db, 'users', uid),
        {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          age: profile.age,
          weight: profile.weight,
          height: profile.height,
          nutritionGoals: nutritionGoals ?? null,
        },
        { merge: true }
      );

      Alert.alert('Success', 'Profile saved successfully!');
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Save failed', err.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNutritionCalculated = (goals: NutritionGoals) => {
    setNutritionGoals(goals);
    setShowNutritionCalculator(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={profile.name}
                  onChangeText={(t) => setProfile((p) => ({ ...p, name: t }))}
                  placeholder="Enter your name"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={profile.email}
                  onChangeText={(t) => setProfile((p) => ({ ...p, email: t }))}
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={profile.phone}
                  onChangeText={(t) => setProfile((p) => ({ ...p, phone: t }))}
                  placeholder="Enter your phone"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={profile.age}
                  onChangeText={(t) => setProfile((p) => ({ ...p, age: t }))}
                  placeholder="Enter your age"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Fitness Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fitness Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Weight (lbs)</Text>
                <TextInput
                  style={styles.input}
                  value={profile.weight}
                  onChangeText={(t) => setProfile((p) => ({ ...p, weight: t }))}
                  placeholder="Enter your weight"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Height</Text>
                <TextInput
                  style={styles.input}
                  value={profile.height}
                  onChangeText={(t) => setProfile((p) => ({ ...p, height: t }))}
                  placeholder="Enter your height"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            {/* Nutrition Goals Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nutrition Goals</Text>
                <TouchableOpacity
                  style={styles.calculateButton}
                  onPress={() => setShowNutritionCalculator(true)}
                >
                  <Ionicons name="calculator-outline" size={18} color="#fff" />
                  <Text style={styles.calculateButtonText}>
                    {nutritionGoals ? 'Recalculate' : 'Calculate'}
                  </Text>
                </TouchableOpacity>
              </View>

              {nutritionGoals ? (
                <View style={styles.nutritionGoalsContainer}>
                  <View style={styles.nutritionGoalCard}>
                    <Ionicons name="flame" size={24} color={ORANGE} />
                    <Text style={styles.nutritionGoalValue}>{nutritionGoals.calories}</Text>
                    <Text style={styles.nutritionGoalLabel}>Calories/day</Text>
                  </View>

                  <View style={styles.nutritionGoalCard}>
                    <Ionicons name="fish" size={24} color="#3b82f6" />
                    <Text style={styles.nutritionGoalValue}>{nutritionGoals.protein}g</Text>
                    <Text style={styles.nutritionGoalLabel}>Protein</Text>
                  </View>

                  <View style={styles.nutritionGoalCard}>
                    <Ionicons name="water" size={24} color="#10b981" />
                    <Text style={styles.nutritionGoalValue}>{nutritionGoals.fats}g</Text>
                    <Text style={styles.nutritionGoalLabel}>Fats</Text>
                  </View>

                  <View style={styles.nutritionGoalCard}>
                    <Ionicons name="pizza" size={24} color="#f59e0b" />
                    <Text style={styles.nutritionGoalValue}>{nutritionGoals.carbs}g</Text>
                    <Text style={styles.nutritionGoalLabel}>Carbs</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.noGoalsContainer}>
                  <Ionicons name="restaurant-outline" size={48} color="#333" />
                  <Text style={styles.noGoalsText}>No nutrition goals set</Text>
                  <Text style={styles.noGoalsSubtext}>
                    Calculate your personalized nutrition goals based on your fitness objectives
                  </Text>
                </View>
              )}
            </View>

            {/* Sign Out Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  console.log('Signing out...');
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={styles.deleteButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Nutrition Calculator Modal */}
      <NutritionCalculator
        visible={showNutritionCalculator}
        onClose={() => setShowNutritionCalculator(false)}
        onComplete={handleNutritionCalculated}
        initialAge={profile.age}
        initialWeight={profile.weight}
        initialHeight={profile.height}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '95%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  saveButton: {
    backgroundColor: ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  calculateButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 8 },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  nutritionGoalsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nutritionGoalCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  nutritionGoalValue: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  nutritionGoalLabel: { fontSize: 11, color: '#999', marginTop: 4 },
  noGoalsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  noGoalsText: { fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 12 },
  noGoalsSubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#1a0a0a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginTop: 8,
  },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#ef4444', marginLeft: 8 },
});