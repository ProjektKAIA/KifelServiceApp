// src/screens/admin/TeamManagementScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin,
  X,
  Edit2,
  Trash2,
  UserX,
  CheckCircle,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'employee' | 'admin';
  status: 'active' | 'inactive';
  location: string;
}

const mockEmployees: Employee[] = [
  { id: '1', firstName: 'Max', lastName: 'Mustermann', email: 'max@kifel.de', phone: '0151 1234567', role: 'employee', status: 'active', location: 'Forst' },
  { id: '2', firstName: 'Sandra', lastName: 'Koch', email: 'sandra@kifel.de', phone: '0152 2345678', role: 'employee', status: 'active', location: 'Cottbus' },
  { id: '3', firstName: 'Thomas', lastName: 'Müller', email: 'thomas@kifel.de', phone: '0153 3456789', role: 'employee', status: 'active', location: 'Forst' },
  { id: '4', firstName: 'Lisa', lastName: 'Weber', email: 'lisa@kifel.de', phone: '0154 4567890', role: 'employee', status: 'inactive', location: 'Berlin' },
  { id: '5', firstName: 'Admin', lastName: 'User', email: 'admin@kifel.de', phone: '0155 5678901', role: 'admin', status: 'active', location: 'Forst' },
];

export default function TeamManagementScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const [employees, setEmployees] = useState(mockEmployees);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || emp.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeCount = employees.filter((e) => e.status === 'active').length;
  const inactiveCount = employees.filter((e) => e.status === 'inactive').length;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const handleToggleStatus = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' } : emp
      )
    );
    setShowDetailModal(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Mitarbeiter löschen',
      'Möchten Sie diesen Mitarbeiter wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            setEmployees((prev) => prev.filter((emp) => emp.id !== id));
            setShowDetailModal(false);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Verwaltung</Text>
          <Text style={[styles.headerLarge, { color: theme.text }]}>Team</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.pillSuccess }]}>
            <Text style={[styles.statValue, { color: theme.pillSuccessText }]}>{activeCount}</Text>
            <Text style={[styles.statLabel, { color: theme.pillSuccessText }]}>Aktiv</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.statValue, { color: theme.textMuted }]}>{inactiveCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Inaktiv</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.pillInfo }]}>
            <Text style={[styles.statValue, { color: theme.pillInfoText }]}>{employees.length}</Text>
            <Text style={[styles.statLabel, { color: theme.pillInfoText }]}>Gesamt</Text>
          </View>
        </View>

        {/* Search & Add */}
        <View style={styles.actionRow}>
          <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
            <Search size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Suchen..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.addButtonSmall}
            onPress={() => Alert.alert('Hinzufügen', 'Mitarbeiter hinzufügen wird in einer zukünftigen Version verfügbar.')}
          >
            <UserPlus size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Employee List */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
          MITARBEITER ({filteredEmployees.length})
        </Text>

        {filteredEmployees.map((emp) => (
          <TouchableOpacity
            key={emp.id}
            style={[styles.employeeCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            onPress={() => { setSelectedEmployee(emp); setShowDetailModal(true); }}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: emp.status === 'active' ? '#3b82f6' : theme.surface }]}>
              <Text style={[styles.avatarText, { color: emp.status === 'active' ? '#fff' : theme.textMuted }]}>
                {getInitials(emp.firstName, emp.lastName)}
              </Text>
            </View>
            <View style={styles.employeeInfo}>
              <View style={styles.employeeNameRow}>
                <Text style={[styles.employeeName, { color: theme.text }]}>
                  {emp.firstName} {emp.lastName}
                </Text>
                {emp.role === 'admin' && (
                  <View style={[styles.adminBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.employeeEmail, { color: theme.textMuted }]}>{emp.email}</Text>
              <View style={styles.employeeMeta}>
                <MapPin size={10} color={theme.textMuted} />
                <Text style={[styles.employeeLocation, { color: theme.textMuted }]}>{emp.location}</Text>
                <View style={[styles.statusDot, { backgroundColor: emp.status === 'active' ? '#4ade80' : '#f87171' }]} />
                <Text style={[styles.statusLabel, { color: emp.status === 'active' ? '#4ade80' : '#f87171' }]}>
                  {emp.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </Text>
              </View>
            </View>
            <MoreVertical size={18} color={theme.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Employee Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Mitarbeiter-Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <X size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedEmployee && (
              <>
                <View style={styles.detailHeader}>
                  <View style={[styles.avatarLarge, { backgroundColor: '#3b82f6' }]}>
                    <Text style={styles.avatarLargeText}>
                      {getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}
                    </Text>
                  </View>
                  <Text style={[styles.detailName, { color: theme.text }]}>
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </Text>
                  <Text style={[styles.detailRole, { color: theme.textMuted }]}>
                    {selectedEmployee.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                  </Text>
                </View>

                <View style={[styles.detailCard, { backgroundColor: theme.surface }]}>
                  <View style={styles.detailRow}>
                    <Mail size={16} color={theme.textMuted} />
                    <Text style={[styles.detailText, { color: theme.text }]}>{selectedEmployee.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Phone size={16} color={theme.textMuted} />
                    <Text style={[styles.detailText, { color: theme.text }]}>{selectedEmployee.phone}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MapPin size={16} color={theme.textMuted} />
                    <Text style={[styles.detailText, { color: theme.text }]}>{selectedEmployee.location}</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: selectedEmployee.status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }]}
                    onPress={() => handleToggleStatus(selectedEmployee.id)}
                  >
                    {selectedEmployee.status === 'active' ? <UserX size={18} color="#f87171" /> : <CheckCircle size={18} color="#4ade80" />}
                    <Text style={{ color: selectedEmployee.status === 'active' ? '#f87171' : '#4ade80', fontWeight: '600' }}>
                      {selectedEmployee.status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                    onPress={() => handleDelete(selectedEmployee.id)}
                  >
                    <Trash2 size={18} color="#f87171" />
                    <Text style={{ color: '#f87171', fontWeight: '600' }}>Löschen</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  header: { marginBottom: spacing.lg },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.input, borderWidth: 1, gap: spacing.sm },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  addButtonSmall: { width: 44, height: 44, borderRadius: borderRadius.button, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.md },
  employeeCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, borderRadius: borderRadius.card, borderWidth: 1, marginBottom: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { fontSize: 14, fontWeight: '600' },
  employeeInfo: { flex: 1 },
  employeeNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  employeeName: { fontSize: 14, fontWeight: '600' },
  adminBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminBadgeText: { fontSize: 9, fontWeight: '600', color: '#8b5cf6' },
  employeeEmail: { fontSize: 12, marginTop: 1 },
  employeeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  employeeLocation: { fontSize: 10, marginRight: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 10, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  detailHeader: { alignItems: 'center', marginBottom: spacing.lg },
  avatarLarge: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarLargeText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  detailName: { fontSize: 18, fontWeight: '700' },
  detailRole: { fontSize: 13 },
  detailCard: { padding: spacing.base, borderRadius: borderRadius.card, marginBottom: spacing.lg },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  detailText: { fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: 12, borderRadius: borderRadius.button },
});