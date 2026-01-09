// app/(admin)/team.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Mail, Phone, Trash2, Edit, Shield, ShieldCheck, UserX, UserCheck, MapPin } from 'lucide-react-native';

import { Typography, Input, Button, Avatar } from '@/src/components/atoms';
import { Modal, Card } from '@/src/components/molecules';
import { ScreenHeader } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';
import { User } from '@/src/types';
import { usersCollection } from '@/src/lib/firestore';
import { firebaseAuth, isFirebaseConfigured } from '@/src/lib/firebase';

type EmployeeStatus = 'active' | 'inactive';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  role: 'employee' | 'admin';
  password?: string;
}

const initialFormData: EmployeeFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  role: 'employee',
  password: '',
};

export default function TeamManagementScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);

  // Load employees
  const loadEmployees = useCallback(async () => {
    try {
      const users = await usersCollection.getAll();
      setEmployees(users);
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Fehler', 'Mitarbeiter konnten nicht geladen werden.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees();
  };

  // Filter employees
  const filteredEmployees = employees.filter((e) =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeEmployees = filteredEmployees.filter((e) => e.status !== 'inactive');
  const inactiveEmployees = filteredEmployees.filter((e) => e.status === 'inactive');

  // Handlers
  const handleEmployeePress = (employee: User) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  const handleAddEmployee = () => {
    setFormData(initialFormData);
    setShowAddModal(true);
  };

  const handleEditEmployee = (employee: User) => {
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      location: employee.location || '',
      role: employee.role,
    });
    setSelectedEmployee(employee);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleCreateEmployee = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Fehler', 'Bitte fülle alle Pflichtfelder aus.');
      return;
    }

    setFormLoading(true);
    try {
      if (!isFirebaseConfigured()) {
        Alert.alert('Fehler', 'Firebase nicht konfiguriert.');
        return;
      }

      // Create Firebase Auth user
      const userCredential = await firebaseAuth.signUp(formData.email, formData.password);
      const uid = userCredential.user.uid;

      // Create Firestore profile
      await usersCollection.create(uid, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        location: formData.location || undefined,
        role: formData.role,
      });

      Alert.alert('Erfolg', `${formData.firstName} ${formData.lastName} wurde angelegt.`);
      setShowAddModal(false);
      setFormData(initialFormData);
      loadEmployees();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      let message = 'Mitarbeiter konnte nicht angelegt werden.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Diese E-Mail-Adresse wird bereits verwendet.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Das Passwort muss mindestens 6 Zeichen haben.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Ungültige E-Mail-Adresse.';
      }
      Alert.alert('Fehler', message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    setFormLoading(true);
    try {
      await usersCollection.update(selectedEmployee.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        location: formData.location || undefined,
        role: formData.role,
      });

      Alert.alert('Erfolg', 'Mitarbeiter wurde aktualisiert.');
      setShowEditModal(false);
      loadEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      Alert.alert('Fehler', 'Mitarbeiter konnte nicht aktualisiert werden.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (employee: User) => {
    const newStatus = employee.status === 'inactive' ? 'active' : 'inactive';
    const action = newStatus === 'inactive' ? 'deaktivieren' : 'aktivieren';

    Alert.alert(
      `Mitarbeiter ${action}`,
      `Möchtest du ${employee.firstName} ${employee.lastName} ${action}?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: newStatus === 'inactive' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await usersCollection.update(employee.id, { status: newStatus } as any);
              loadEmployees();
              setShowDetailModal(false);
            } catch (error) {
              Alert.alert('Fehler', 'Status konnte nicht geändert werden.');
            }
          },
        },
      ]
    );
  };

  const handleToggleRole = async (employee: User) => {
    const newRole = employee.role === 'admin' ? 'employee' : 'admin';
    const roleText = newRole === 'admin' ? 'Administrator' : 'Mitarbeiter';

    Alert.alert(
      'Rolle ändern',
      `${employee.firstName} ${employee.lastName} zum ${roleText} machen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Ändern',
          onPress: async () => {
            try {
              await usersCollection.update(employee.id, { role: newRole });
              loadEmployees();
              setShowDetailModal(false);
              Alert.alert('Erfolg', `Rolle wurde auf ${roleText} geändert.`);
            } catch (error) {
              Alert.alert('Fehler', 'Rolle konnte nicht geändert werden.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteEmployee = (employee: User) => {
    Alert.alert(
      'Mitarbeiter löschen',
      `${employee.firstName} ${employee.lastName} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            // Note: This only deletes the Firestore profile, not the Auth user
            // For full deletion, you'd need a Cloud Function
            try {
              await usersCollection.update(employee.id, { status: 'deleted' } as any);
              setShowDetailModal(false);
              loadEmployees();
            } catch (error) {
              Alert.alert('Fehler', 'Mitarbeiter konnte nicht gelöscht werden.');
            }
          },
        },
      ]
    );
  };

  // Render employee card
  const renderEmployeeCard = (employee: User) => (
    <TouchableOpacity
      key={employee.id}
      style={[styles.employeeCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
      onPress={() => handleEmployeePress(employee)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Avatar name={`${employee.firstName} ${employee.lastName}`} size="lg" />
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Typography variant="body" style={styles.employeeName}>
              {employee.firstName} {employee.lastName}
            </Typography>
            {employee.role === 'admin' && (
              <View style={[styles.roleBadge, { backgroundColor: theme.secondary + '20' }]}>
                <ShieldCheck size={12} color={theme.secondary} />
                <Typography variant="caption" style={{ color: theme.secondary, marginLeft: 4 }}>
                  Admin
                </Typography>
              </View>
            )}
          </View>
          <Typography variant="bodySmall" color="muted">{employee.email}</Typography>
          {employee.location && (
            <View style={styles.locationRow}>
              <MapPin size={12} color={theme.textMuted} />
              <Typography variant="caption" color="muted" style={{ marginLeft: 4 }}>
                {employee.location}
              </Typography>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Typography variant="body" color="muted" style={{ marginTop: spacing.md }}>
          Lade Mitarbeiter...
        </Typography>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <ScreenHeader overline="VERWALTUNG" title="Team" />

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
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={handleAddEmployee}
          >
            <Plus size={22} color={theme.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card variant="default" style={styles.statCard}>
            <Typography variant="h2" style={{ color: theme.primary }}>{employees.length}</Typography>
            <Typography variant="caption" color="muted">Gesamt</Typography>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Typography variant="h2" style={{ color: theme.success }}>{activeEmployees.length}</Typography>
            <Typography variant="caption" color="muted">Aktiv</Typography>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Typography variant="h2" style={{ color: theme.textMuted }}>{inactiveEmployees.length}</Typography>
            <Typography variant="caption" color="muted">Inaktiv</Typography>
          </Card>
        </View>

        {/* Active Employees */}
        {activeEmployees.length > 0 && (
          <>
            <Typography variant="overline" color="muted" style={styles.sectionTitle}>
              AKTIVE MITARBEITER ({activeEmployees.length})
            </Typography>
            {activeEmployees.map(renderEmployeeCard)}
          </>
        )}

        {/* Inactive Employees */}
        {inactiveEmployees.length > 0 && (
          <>
            <Typography variant="overline" color="muted" style={styles.sectionTitle}>
              INAKTIV ({inactiveEmployees.length})
            </Typography>
            {inactiveEmployees.map(renderEmployeeCard)}
          </>
        )}

        {employees.length === 0 && (
          <View style={styles.emptyState}>
            <Typography variant="body" color="muted">Noch keine Mitarbeiter vorhanden.</Typography>
            <Button title="Ersten Mitarbeiter anlegen" onPress={handleAddEmployee} style={{ marginTop: spacing.md }} />
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} onClose={() => setShowDetailModal(false)} title="Mitarbeiter Details">
        {selectedEmployee && (
          <>
            <View style={styles.modalHeader}>
              <Avatar name={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`} size="xl" />
              <Typography variant="h3" style={styles.modalName}>
                {selectedEmployee.firstName} {selectedEmployee.lastName}
              </Typography>
              <View style={[styles.roleBadge, { backgroundColor: selectedEmployee.role === 'admin' ? theme.secondary + '20' : theme.primary + '20' }]}>
                {selectedEmployee.role === 'admin' ? (
                  <ShieldCheck size={14} color={theme.secondary} />
                ) : (
                  <Shield size={14} color={theme.primary} />
                )}
                <Typography variant="bodySmall" style={{ color: selectedEmployee.role === 'admin' ? theme.secondary : theme.primary, marginLeft: 4 }}>
                  {selectedEmployee.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                </Typography>
              </View>
            </View>

            <Card variant="default" style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Mail size={16} color={theme.textMuted} />
                <Typography variant="body">{selectedEmployee.email}</Typography>
              </View>
              {selectedEmployee.phone && (
                <View style={styles.detailRow}>
                  <Phone size={16} color={theme.textMuted} />
                  <Typography variant="body">{selectedEmployee.phone}</Typography>
                </View>
              )}
              {selectedEmployee.location && (
                <View style={styles.detailRow}>
                  <MapPin size={16} color={theme.textMuted} />
                  <Typography variant="body">{selectedEmployee.location}</Typography>
                </View>
              )}
            </Card>

            <View style={styles.modalActions}>
              <Button
                title="Bearbeiten"
                icon={Edit}
                variant="secondary"
                onPress={() => handleEditEmployee(selectedEmployee)}
                style={styles.actionButton}
              />
              <Button
                title={selectedEmployee.role === 'admin' ? 'Zu Mitarbeiter' : 'Zu Admin'}
                icon={selectedEmployee.role === 'admin' ? Shield : ShieldCheck}
                variant="secondary"
                onPress={() => handleToggleRole(selectedEmployee)}
                style={styles.actionButton}
              />
            </View>
            <View style={styles.modalActions}>
              <Button
                title={selectedEmployee.status === 'inactive' ? 'Aktivieren' : 'Deaktivieren'}
                icon={selectedEmployee.status === 'inactive' ? UserCheck : UserX}
                variant={selectedEmployee.status === 'inactive' ? 'primary' : 'danger'}
                onPress={() => handleToggleStatus(selectedEmployee)}
                style={styles.actionButton}
              />
            </View>
          </>
        )}
      </Modal>

      {/* Add Employee Modal */}
      <Modal visible={showAddModal} onClose={() => setShowAddModal(false)} title="Neuer Mitarbeiter">
        <Input
          label="Vorname *"
          placeholder="Max"
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        />
        <Input
          label="Nachname *"
          placeholder="Mustermann"
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label="E-Mail *"
          placeholder="max@kifel.de"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label="Passwort *"
          placeholder="Mindestens 6 Zeichen"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label="Telefon"
          placeholder="+49 123 456789"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label="Standort"
          placeholder="Berlin"
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
          containerStyle={{ marginTop: spacing.md }}
        />

        {/* Role Selection */}
        <Typography variant="label" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
          Rolle
        </Typography>
        <View style={styles.roleSelection}>
          <TouchableOpacity
            style={[
              styles.roleOption,
              { backgroundColor: formData.role === 'employee' ? theme.primary : theme.surface, borderColor: theme.border }
            ]}
            onPress={() => setFormData({ ...formData, role: 'employee' })}
          >
            <Shield size={18} color={formData.role === 'employee' ? theme.textInverse : theme.textSecondary} />
            <Typography
              variant="body"
              style={{ color: formData.role === 'employee' ? theme.textInverse : theme.textSecondary, marginLeft: 8 }}
            >
              Mitarbeiter
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleOption,
              { backgroundColor: formData.role === 'admin' ? theme.secondary : theme.surface, borderColor: theme.border }
            ]}
            onPress={() => setFormData({ ...formData, role: 'admin' })}
          >
            <ShieldCheck size={18} color={formData.role === 'admin' ? theme.textInverse : theme.textSecondary} />
            <Typography
              variant="body"
              style={{ color: formData.role === 'admin' ? theme.textInverse : theme.textSecondary, marginLeft: 8 }}
            >
              Admin
            </Typography>
          </TouchableOpacity>
        </View>

        <Button
          title={formLoading ? 'Wird angelegt...' : 'Mitarbeiter anlegen'}
          onPress={handleCreateEmployee}
          disabled={formLoading}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>

      {/* Edit Employee Modal */}
      <Modal visible={showEditModal} onClose={() => setShowEditModal(false)} title="Mitarbeiter bearbeiten">
        <Input
          label="Vorname"
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        />
        <Input
          label="Nachname"
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label="E-Mail"
          value={formData.email}
          editable={false}
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label="Telefon"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label="Standort"
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
          containerStyle={{ marginTop: spacing.md }}
        />

        {/* Role Selection */}
        <Typography variant="label" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
          Rolle
        </Typography>
        <View style={styles.roleSelection}>
          <TouchableOpacity
            style={[
              styles.roleOption,
              { backgroundColor: formData.role === 'employee' ? theme.primary : theme.surface, borderColor: theme.border }
            ]}
            onPress={() => setFormData({ ...formData, role: 'employee' })}
          >
            <Shield size={18} color={formData.role === 'employee' ? theme.textInverse : theme.textSecondary} />
            <Typography
              variant="body"
              style={{ color: formData.role === 'employee' ? theme.textInverse : theme.textSecondary, marginLeft: 8 }}
            >
              Mitarbeiter
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleOption,
              { backgroundColor: formData.role === 'admin' ? theme.secondary : theme.surface, borderColor: theme.border }
            ]}
            onPress={() => setFormData({ ...formData, role: 'admin' })}
          >
            <ShieldCheck size={18} color={formData.role === 'admin' ? theme.textInverse : theme.textSecondary} />
            <Typography
              variant="body"
              style={{ color: formData.role === 'admin' ? theme.textInverse : theme.textSecondary, marginLeft: 8 }}
            >
              Admin
            </Typography>
          </TouchableOpacity>
        </View>

        <Button
          title={formLoading ? 'Wird gespeichert...' : 'Speichern'}
          onPress={handleUpdateEmployee}
          disabled={formLoading}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  searchInput: { flex: 1 },
  addButton: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  sectionTitle: { marginBottom: spacing.md, marginTop: spacing.sm },
  employeeCard: { borderRadius: 12, borderWidth: 1, padding: spacing.base, marginBottom: spacing.sm },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  employeeName: { fontWeight: '600' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  modalHeader: { alignItems: 'center', marginBottom: spacing.lg },
  modalName: { marginTop: spacing.sm, marginBottom: spacing.xs },
  detailCard: { marginBottom: spacing.lg },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  actionButton: { flex: 1 },
  roleSelection: { flexDirection: 'row', gap: spacing.sm },
  roleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: 10, borderWidth: 1 },
});
