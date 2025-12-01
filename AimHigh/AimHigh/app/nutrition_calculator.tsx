// NutritionCalculator.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const ORANGE = '#FF6A00';

interface NutritionCalculatorProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: (goals: NutritionGoals) => void;
  initialAge?: string;
  initialWeight?: string;
  initialHeight?: string; // e.g. "5'10"
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
}

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Goal = 'cut' | 'maintain' | 'bulk';
type Gender = 'male' | 'female';

export default function NutritionCalculator({
  visible,
  onClose,
  onComplete,
  initialAge = '',
  initialWeight = '',
  initialHeight = '',
}: NutritionCalculatorProps) {
  /* --------------------------------------------------------------- */
  /*  State                                                          */
  /* --------------------------------------------------------------- */
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState(initialAge);
  const [weight, setWeight] = useState(initialWeight);
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [results, setResults] = useState<NutritionGoals | null>(null);

  /* --------------------------------------------------------------- */
/*  Safe Height parsing helper (handles undefined/empty)          */
/* --------------------------------------------------------------- */
const parseHeight = (heightStr?: string): { feet: string; inches: string } => {
  if (!heightStr || typeof heightStr !== 'string') {
    return { feet: '', inches: '' };
  }

  const match = heightStr.match(/(\d+)['\s]+(\d+)/);
  if (match) {
    return { feet: match[1], inches: match[2] };
  }

  // Fallback: maybe it's stored as "5 10" or "5ft10in" – optional extra parsing
  const spaceMatch = heightStr.match(/(\d+)\s*['"]?\s*(\d+)/);
  if (spaceMatch) {
    return { feet: spaceMatch[1], inches: spaceMatch[2] };
  }

  return { feet: '', inches: '' };
};

  /* --------------------------------------------------------------- */
  /*  Pre‑fill when modal opens                                      */
  /* --------------------------------------------------------------- */
  useEffect(() => {
  if (visible) {
    setAge(initialAge ?? '');
    setWeight(initialWeight ?? '');

    const { feet, inches } = parseHeight(initialHeight);
    setHeightFeet(feet);
    setHeightInches(inches);

    // Reset the rest
    setStep(1);
    setGender('male');
    setActivityLevel('moderate');
    setGoal('maintain');
    setResults(null);
  }
}, [visible, initialAge, initialWeight, initialHeight]);

  /* --------------------------------------------------------------- */
  /*  Activity multipliers & labels                                   */
  /* --------------------------------------------------------------- */
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const activityLabels: Record<ActivityLevel, string> = {
    sedentary: 'Sedentary (little to no exercise)',
    light: 'Light (1‑3 days/week)',
    moderate: 'Moderate (3‑5 days/week)',
    active: 'Active (6‑7 days/week)',
    very_active: 'Very Active (athlete / physical job)',
  };

  /* --------------------------------------------------------------- */
  /*  Core calculation                                                */
  /* --------------------------------------------------------------- */
  const calculateNutrition = () => {
    const weightLbs = parseFloat(weight) || 0;
    const weightKg = weightLbs * 0.453592;

    const feet = parseInt(heightFeet) || 0;
    const inches = parseInt(heightInches) || 0;
    const totalInches = feet * 12 + inches;
    const heightCm = totalInches * 2.54;

    const ageNum = parseInt(age) || 0;

    // Mifflin‑St Jeor BMR
    const bmr =
      gender === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161;

    const tdee = bmr * activityMultipliers[activityLevel];

    // Goal adjustment
    let calories = tdee;
    if (goal === 'cut') calories -= 500;
    if (goal === 'bulk') calories += 300;

    // Macros
    const proteinPerLb = goal === 'cut' || goal === 'bulk' ? 1.0 : 0.8;
    const protein = Math.round(weightLbs * proteinPerLb);

    const fatPct = 0.28;
    const fatCals = calories * fatPct;
    const fats = Math.round(fatCals / 9);

    const proteinCals = protein * 4;
    const remainingCals = calories - proteinCals - fatCals;
    const carbs = Math.round(remainingCals / 4);

    const goals: NutritionGoals = {
      calories: Math.round(calories),
      protein,
      fats,
      carbs,
    };

    setResults(goals);
    setStep(5);
  };

  /* --------------------------------------------------------------- */
  /*  Reset helper                                                    */
  /* --------------------------------------------------------------- */
  const resetCalculator = () => {
    setStep(1);
    setGender('male');
    setAge(initialAge);
    setWeight(initialWeight);
    const { feet, inches } = parseHeight(initialHeight);
    setHeightFeet(feet);
    setHeightInches(inches);
    setActivityLevel('moderate');
    setGoal('maintain');
    setResults(null);
  };

  const handleComplete = () => {
    if (results && onComplete) onComplete(results);
    onClose();
    resetCalculator();
  };

  /* --------------------------------------------------------------- */
  /*  Step validation helpers                                         */
  /* --------------------------------------------------------------- */
  const canGoToStep2 = Boolean(age && weight && heightFeet && heightInches);
  const canCalculate = Boolean(activityLevel && goal);

  /* --------------------------------------------------------------- */
  /*  Render each step                                                */
  /* --------------------------------------------------------------- */
  const renderStep = () => {
    switch (step) {
      /* ---------- STEP 1 – Gender ---------- */
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your gender?</Text>
            <Text style={styles.stepSubtitle}>
              This helps us calculate your baseline metabolism
            </Text>

            <TouchableOpacity
              style={[styles.optionButton, gender === 'male' && styles.optionButtonSelected]}
              onPress={() => setGender('male')}
            >
              <Ionicons name="male" size={24} color={gender === 'male' ? '#fff' : '#999'} />
              <Text style={[styles.optionText, gender === 'male' && styles.optionTextSelected]}>
                Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, gender === 'female' && styles.optionButtonSelected]}
              onPress={() => setGender('female')}
            >
              <Ionicons name="female" size={24} color={gender === 'female' ? '#fff' : '#999'} />
              <Text style={[styles.optionText, gender === 'female' && styles.optionTextSelected]}>
                Female
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        );

      /* ---------- STEP 2 – Age / Weight / Height ---------- */
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tell us about yourself</Text>
            <Text style={styles.stepSubtitle}>We need these details to calculate your metabolism</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age (years)</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="e.g., 25"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="e.g., 180"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height</Text>
              <View style={styles.heightInputRow}>
                <View style={styles.heightInputContainer}>
                  <TextInput
                    style={styles.heightInput}
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor="#666"
                    maxLength={1}
                  />
                  <Text style={styles.heightUnit}>ft</Text>
                </View>
                <View style={styles.heightInputContainer}>
                  <TextInput
                    style={styles.heightInput}
                    value={heightInches}
                    onChangeText={setHeightInches}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="#666"
                    maxLength={2}
                  />
                  <Text style={styles.heightUnit}>in</Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextButton, styles.nextButtonFlex]}
                onPress={() => setStep(3)}
                disabled={!canGoToStep2}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      /* ---------- STEP 3 – Activity Level ---------- */
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your activity level?</Text>
            <Text style={styles.stepSubtitle}>Be honest to get accurate results</Text>

            {(Object.keys(activityLabels) as ActivityLevel[]).map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.optionButton, activityLevel === lvl && styles.optionButtonSelected]}
                onPress={() => setActivityLevel(lvl)}
              >
                <Text style={[styles.optionText, activityLevel === lvl && styles.optionTextSelected]}>
                  {activityLabels[lvl]}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextButton, styles.nextButtonFlex]}
                onPress={() => setStep(4)}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      /* ---------- STEP 4 – Goal ---------- */
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your goal?</Text>
            <Text style={styles.stepSubtitle}>This determines your calorie target</Text>

            <TouchableOpacity
              style={[styles.optionButton, goal === 'cut' && styles.optionButtonSelected]}
              onPress={() => setGoal('cut')}
            >
              <Ionicons name="trending-down" size={24} color={goal === 'cut' ? '#fff' : '#999'} />
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionText, goal === 'cut' && styles.optionTextSelected]}>
                  Cut (Lose Fat)
                </Text>
                <Text style={styles.optionDescription}>500 calorie deficit</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, goal === 'maintain' && styles.optionButtonSelected]}
              onPress={() => setGoal('maintain')}
            >
              <Ionicons name="remove" size={24} color={goal === 'maintain' ? '#fff' : '#999'} />
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionText, goal === 'maintain' && styles.optionTextSelected]}>
                  Maintain
                </Text>
                <Text style={styles.optionDescription}>Maintenance calories</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, goal === 'bulk' && styles.optionButtonSelected]}
              onPress={() => setGoal('bulk')}
            >
              <Ionicons name="trending-up" size={24} color={goal === 'bulk' ? '#fff' : '#999'} />
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionText, goal === 'bulk' && styles.optionTextSelected]}>
                  Bulk (Build Muscle)
                </Text>
                <Text style={styles.optionDescription}>300 calorie surplus</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(3)}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextButton, styles.nextButtonFlex]}
                onPress={calculateNutrition}
                disabled={!canCalculate}
              >
                <Text style={styles.nextButtonText}>Calculate</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      /* ---------- STEP 5 – Results ---------- */
      case 5:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.resultsHeader}>
              <Ionicons name="checkmark-circle" size={48} color={ORANGE} />
              <Text style={styles.resultsTitle}>Your Nutrition Goals</Text>
              <Text style={styles.resultsSubtitle}>
                Based on your {goal === 'cut' ? 'cutting' : goal === 'bulk' ? 'bulking' : 'maintenance'} goal
              </Text>
            </View>

            <View style={styles.resultsContainer}>
              <View style={styles.resultCard}>
                <Ionicons name="flame" size={32} color={ORANGE} />
                <Text style={styles.resultValue}>{results?.calories}</Text>
                <Text style={styles.resultLabel}>Calories/day</Text>
              </View>

              <View style={styles.resultCard}>
                <Ionicons name="fish" size={32} color="#3b82f6" />
                <Text style={styles.resultValue}>{results?.protein}g</Text>
                <Text style={styles.resultLabel}>Protein</Text>
              </View>

              <View style={styles.resultCard}>
                <Ionicons name="water" size={32} color="#10b981" />
                <Text style={styles.resultValue}>{results?.fats}g</Text>
                <Text style={styles.resultLabel}>Fats</Text>
              </View>

              <View style={styles.resultCard}>
                <Ionicons name="pizza" size={32} color="#f59e0b" />
                <Text style={styles.resultValue}>{results?.carbs}g</Text>
                <Text style={styles.resultLabel}>Carbs</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={ORANGE} />
              <Text style={styles.infoText}>
                These are daily targets. Track your intake and adjust based on your progress.
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={resetCalculator}>
                <Text style={styles.backButtonText}>Recalculate</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.nextButton, styles.nextButtonFlex]} onPress={handleComplete}>
                <Text style={styles.nextButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  /* --------------------------------------------------------------- */
  /*  Render modal                                                    */
  /* --------------------------------------------------------------- */
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Nutrition Calculator</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Progress dots */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4, 5].map((s) => (
              <View
                key={s}
                style={[styles.progressDot, step >= s && styles.progressDotActive]}
              />
            ))}
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {renderStep()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles (unchanged – only minor tweaks for disabled buttons)       */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
  backgroundColor: '#111',
  borderRadius: 20,
  width: '90%',
  maxHeight: '85%',
  paddingTop: 20,
  // ↓↓↓ ADD THESE TWO LINES ↓↓↓
  flex: 1,                    // <-- crucial
  overflow: 'hidden',         // <-- prevents weird overflow on Android
},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  closeButton: { padding: 4 },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#333' },
  progressDotActive: { backgroundColor: ORANGE },

  scrollView: { flex: 1 },

  stepContainer: { padding: 20 },

  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  stepSubtitle: { fontSize: 14, color: '#999', marginBottom: 24 },

  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  optionButtonSelected: { backgroundColor: '#2a2a2a', borderColor: ORANGE },

  optionText: { fontSize: 16, color: '#999', marginLeft: 12, flex: 1 },
  optionTextSelected: { color: '#fff', fontWeight: '600' },

  optionTextContainer: { flex: 1, marginLeft: 12 },
  optionDescription: { fontSize: 12, color: '#666', marginTop: 2 },

  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },

  heightInputRow: { flexDirection: 'row', gap: 12 },
  heightInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  heightInput: { flex: 1, padding: 16, fontSize: 16, color: '#fff' },
  heightUnit: { fontSize: 14, color: '#999', fontWeight: '600' },

  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  backButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  backButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  nextButton: {
    padding: 16,
    backgroundColor: ORANGE,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonFlex: { flex: 2, marginTop: 0 },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  resultsHeader: { alignItems: 'center', marginBottom: 24 },
  resultsTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 12 },
  resultsSubtitle: { fontSize: 14, color: '#999', marginTop: 4 },

  resultsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  resultCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  resultValue: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  resultLabel: { fontSize: 12, color: '#999', marginTop: 4 },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1a0f00',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: ORANGE + '40',
    marginBottom: 12,
  },
  infoText: { flex: 1, fontSize: 12, color: '#999', marginLeft: 8, lineHeight: 18 },
});