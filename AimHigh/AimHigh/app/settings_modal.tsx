import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';   // <-- Expo Router
import { db } from '../firebase';
import EditProfileModal from './edit_profile_modal';

const ORANGE = '#FF6A00';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const router = useRouter(); // <-- Expo Router

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);

  // ──────────────────────────────────────────────────────────────
  // Dark Mode sync with Firestore
  // ──────────────────────────────────────────────────────────────
  const handleToggleDarkMode = async (value: boolean) => {
    setDarkModeEnabled(value);
    try {
      const uid = getAuth().currentUser?.uid;
      if (!uid) return;
      await setDoc(doc(db, 'users', uid), { darkBackground: value }, { merge: true });
    } catch (e) {
      console.error('Failed to update dark mode:', e);
      setDarkModeEnabled((prev) => !prev); // revert
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const uid = getAuth().currentUser?.uid;
        if (!uid) return;
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          setDarkModeEnabled(Boolean(data.darkBackground));
        }
      } catch (e) {
        console.error('Failed to load dark mode:', e);
      }
    };
    if (visible) load();
  }, [visible]);

  // ──────────────────────────────────────────────────────────────
  // LOG OUT → Go back to index.tsx (login screen)
  // ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      onClose(); // close modal
      router.replace('/'); // <-- Navigate to app/index.tsx (login screen)
    } catch (error: any) {
      Alert.alert('Logout failed', error.message ?? 'Please try again.');
    }
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
            <Text style={styles.headerTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {/* Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => setEditProfileVisible(true)}
              >
                <Ionicons name="person-outline" size={24} color="#fff" />
                <Text style={styles.settingText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Preferences Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>

              <View style={styles.settingItem}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                <Text style={styles.settingText}>Notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#333', true: ORANGE }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingItem}>
                <Ionicons name="moon-outline" size={24} color="#fff" />
                <Text style={styles.settingText}>Dark Mode</Text>
                <Switch
                  value={darkModeEnabled}
                  onValueChange={handleToggleDarkMode}
                  trackColor={{ false: '#333', true: ORANGE }}
                  thumbColor="#fff"
                />
              </View>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="language-outline" size={24} color="#fff" />
                <Text style={styles.settingText}>Language</Text>
                <Text style={styles.settingValue}>English</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="information-circle-outline" size={24} color="#fff" />
                <Text style={styles.settingText}>App Version</Text>
                <Text style={styles.settingValue}>1.0.0</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="document-text-outline" size={24} color="#fff" />
                <Text style={styles.settingText}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
                <Text style={styles.settingText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* LOG OUT BUTTON */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
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
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    paddingTop: 20,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    paddingBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
  settingValue: {
    fontSize: 14,
    color: '#999',
    marginRight: 5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: '#1a0a0a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 10,
  },
});