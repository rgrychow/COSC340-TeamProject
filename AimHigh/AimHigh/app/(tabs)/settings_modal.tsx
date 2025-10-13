import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

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
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {/* Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="person-outline" size={24} color="#666" />
                <Text style={styles.settingText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="lock-closed-outline" size={24} color="#666" />
                <Text style={styles.settingText}>Change Password</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Preferences Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              
              <View style={styles.settingItem}>
                <Ionicons name="notifications-outline" size={24} color="#666" />
                <Text style={styles.settingText}>Notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingItem}>
                <Ionicons name="moon-outline" size={24} color="#666" />
                <Text style={styles.settingText}>Dark Mode</Text>
                <Switch
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.settingItem}>
                <Ionicons name="volume-high-outline" size={24} color="#666" />
                <Text style={styles.settingText}>Sound Effects</Text>
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="language-outline" size={24} color="#666" />
                <Text style={styles.settingText}>Language</Text>
                <Text style={styles.settingValue}>English</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Fitness Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fitness</Text>
              
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="fitness-outline" size={24} color="#666" />
                <Text style={styles.settingText}>Units</Text>
                <Text style={styles.settingValue}>Metric</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="calendar-outline" size={24} color="#666" />
                <Text style={styles.settingText}>Weekly Goal</Text>
                <Text style={styles.settingValue}>5 days</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="information-circle-outline" size={24} color="#666" />
                <Text style={styles.settingText}>App Version</Text>
                <Text style={styles.settingValue}>1.0.0</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="document-text-outline" size={24} color="#666" />
                <Text style={styles.settingText}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
                <Text style={styles.settingText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
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
    color: '#666',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 10,
  },
});