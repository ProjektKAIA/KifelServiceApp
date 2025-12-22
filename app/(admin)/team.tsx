// app/(admin)/team.tsx

import React, { useState } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Mail, Phone, Trash2, Edit } from 'lucide-react-native';

import { Typography, Input, Button, Avatar } from '@/src/components/atoms';
import { Modal, Card } from '@/src/components/molecules';
import { ScreenHeader, EmployeeCard } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'employee' | 'admin';
  status: 'active' | 'inactive';
  location?: string;
}

const mockEmployees: Employee[] = [
  { id: '1', name: 'Max Mustermann', email: 'max@kifel.de', phone: '+49 123 456789', role: 'admin', status: 'active', location: 'Berlin' },
  { id: '2', name: 'Thomas Müller', email: 'thomas@kifel.de', phone: '+49 123 456780', role: 'employee', status: 'active', location: 'Berlin' },
  { id: '3', name: 'Sandra Klein', email: 'sandra@kifel.de', phone: '+49 123 456781', role: 'employee', status: 'inactive', location: 'Hamburg' },
];

export default function TeamManagementScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredEmployees = mockEmployees.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeEmployees = filteredEmployees.filter((e) => e.status === 'active');
  const inactiveEmployees = filteredEmployees.filter((e) => e.status === 'inactive');

  const handleEmployeePress = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  const handleDelete = () => {
    Alert.alert('Mitarbeiter entfernen', 'Möchten Sie diesen Mitarbeiter wirklich entfernen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Entfernen', style: 'destructive', onPress: () => setShowDetailModal(false) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader overline="VERWALTUNG" title="Mitarbeiter" />

        {/* Search & Add */}
        <View style={styles.searchRow}>
          <Input
            icon={Search}
            placeholder="Mitarbeiter suchen..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={styles.searchInput}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => Alert.alert('Info', 'Mitarbeiter hinzufügen wird implementiert.')}
          >
            <Plus size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Active Employees */}
        {activeEmployees.length > 0 && (
          <>
            <Typography variant="overline" color="muted" style={styles.sectionTitle}>
              AKTIV ({activeEmployees.length})
            </Typography>
            {activeEmployees.map((e) => (
              <EmployeeCard key={e.id} employee={e} onPress={() => handleEmployeePress(e)} />
            ))}
          </>
        )}

        {/* Inactive Employees */}
        {inactiveEmployees.length > 0 && (
          <>
            <Typography variant="overline" color="muted" style={styles.sectionTitle}>
              INAKTIV ({inactiveEmployees.length})
            </Typography>
            {inactiveEmployees.map((e) => (
              <EmployeeCard key={e.id} employee={e} onPress={() => handleEmployeePress(e)} />
            ))}
          </>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} onClose={() => setShowDetailModal(false)} title="Mitarbeiter Details">
        {selectedEmployee && (
          <>
            <View style={styles.modalHeader}>
              <Avatar name={selectedEmployee.name} size="xl" />
              <Typography variant="h3" style={styles.modalName}>{selectedEmployee.name}</Typography>
              <Typography variant="bodySmall" color="muted">
                {selectedEmployee.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
              </Typography>
            </View>

            <Card variant="default" style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Mail size={16} color={theme.textMuted} />
                <Typography variant="body">{selectedEmployee.email}</Typography>
              </View>
              <View style={styles.detailRow}>
                <Phone size={16} color={theme.textMuted} />
                <Typography variant="body">{selectedEmployee.phone}</Typography>
              </View>
            </Card>

            <View style={styles.modalActions}>
              <Button title="Bearbeiten" icon={Edit} variant="secondary" onPress={() => Alert.alert('Info', 'Bearbeiten wird implementiert.')} style={styles.actionButton} />
              <Button title="Entfernen" icon={Trash2} variant="danger" onPress={handleDelete} style={styles.actionButton} />
            </View>
          </>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  searchInput: { flex: 1 },
  addButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { marginBottom: spacing.md },
  modalHeader: { alignItems: 'center', marginBottom: spacing.lg },
  modalName: { marginTop: spacing.sm, marginBottom: 4 },
  detailCard: { marginBottom: spacing.lg },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
});