import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
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

export default function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const [name, setName] = useState('Jackson');
  const [email, setEmail] = useState('jackson@aimhigh.com');
  const [phone, setPhone] = useState('(555) 123-4567');
  const [age, setAge] = useState('25');
  const [weight, setWeight] = useState('180');
  const [height, setHeight] = useState('5\'10"');
  const [goal, setGoal] = useState('Build Muscle');
  
  // Nutrition goals state
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals | null>(null);
  const [showNutritionCalculator, setShowNutritionCalculator] = useState(false);

  const handleSave = () => {
    // Here you would typically save to your backend/database
    console.log('Profile saved:', { 
      name, 
      email, 
      phone, 
      age, 
      weight, 
      height, 
      goal,
      nutritionGoals 
    });
    onClose();
  };

  const handleNutritionCalculated = (goals: NutritionGoals) => {
    setNutritionGoals(goals);
    console.log('Nutrition goals set:', goals);
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
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {/* Profile Photo Section */}
            <View style={styles.photoSection}>
              <View style={styles.photoContainer}>
                <Ionicons name="person-circle" size={100} color="#666" />
                <TouchableOpacity style={styles.photoEditButton}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
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
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
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
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Enter your weight"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Height</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="Enter your height"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fitness Goal</Text>
                <TouchableOpacity style={styles.selectInput}>
                  <Text style={styles.selectInputText}>{goal}</Text>
                  <Ionicons name="chevron-down" size={20} color="#999" />
                </TouchableOpacity>
                <View style={styles.goalOptions}>
                  <TouchableOpacity 
                    style={styles.goalOption}
                    onPress={() => setGoal('Lose Weight')}
                  >
                    <Text style={styles.goalOptionText}>Lose Weight</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.goalOption}
                    onPress={() => setGoal('Build Muscle')}
                  >
                    <Text style={styles.goalOptionText}>Build Muscle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.goalOption}
                    onPress={() => setGoal('Stay Fit')}
                  >
                    <Text style={styles.goalOptionText}>Stay Fit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.goalOption}
                    onPress={() => setGoal('Improve Endurance')}
                  >
                    <Text style={styles.goalOptionText}>Improve Endurance</Text>
                  </TouchableOpacity>
                </View>
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
                  // Navigate back to index.tsx (login screen)
                  // You'll need to use your navigation method here
                  // Example: navigation.navigate('Index') or navigation.reset()
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
        initialAge={age}
        initialWeight={weight}
        initialHeight={height}
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: ORANGE,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  changePhotoText: {
    color: ORANGE,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
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
  selectInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectInputText: {
    fontSize: 16,
    color: '#fff',
  },
  goalOptions: {
    marginTop: 8,
  },
  goalOption: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  goalOptionText: {
    fontSize: 15,
    color: '#fff',
  },
  nutritionGoalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
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
  nutritionGoalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  nutritionGoalLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  noGoalsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  noGoalsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
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
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
});