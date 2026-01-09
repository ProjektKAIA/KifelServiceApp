// app/(admin)/employees.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks';
import { spacing, borderRadius } from '@/src/theme/spacing';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  role: 'employee' | 'admin';
  status: 'active' | 'inactive';
  hoursThisMonth: number;
}

export default function EmployeesScreen() {
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Mock-Daten
  const employees: Employee[] = [
    { id: '1', firstName: 'Max', lastName: 'Müller', email: 'max@kifel.de', phone: '+49 123 456789', location: 'Forst', role: 'employee', status: 'active', hoursThisMonth: 156 },
    { id: '2', firstName: 'Anna', lastName: 'Schmidt', email: 'anna@kifel.de', phone: '+49 123 456790', location: 'Mitte', role: 'employee', status: 'active', hoursThisMonth: 142 },
    { id: '3', firstName: 'Tom', lastName: 'Weber', email: 'tom@kifel.de', phone: '+49 123 456791', location: 'Nord', role: 'employee', status: 'active', hoursThisMonth: 168 },
    { id: '4', firstName: 'Lisa', lastName: 'Fischer', email: 'lisa@kifel.de', phone: '+49 123 456792', location: 'Forst', role: 'admin', status: 'active', hoursThisMonth: 160 },
    { id: '5', firstName: 'Jan', lastName: 'Koch', email: 'jan@kifel.de', phone: '+49 123 456793', location: 'Mitte', role: 'employee', status: 'inactive', hoursThisMonth: 0 },
  ];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || emp.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleEmployeeAction = (employee: Employee) => {
    Alert.alert(
      `${employee.firstName} ${employee.lastName}`,
      'Aktion wählen',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Bearbeiten', onPress: () => {} },
        {
          text: employee.status === 'active' ? 'Deaktivieren' : 'Aktivieren',
          style: employee.status === 'active' ? 'destructive' : 'default',
          onPress: () => {},
        },
      ]
    );
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Verwaltung</Text>
            <Text style={[styles.headerLarge, { color: theme.text }]}>Mitarbeiter</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => Alert.alert('Hinzufügen', 'Neuen Mitarbeiter anlegen')}
          >
            <Plus size={20} color={theme.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Name oder E-Mail suchen..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter */}
        <View style={styles.filterRow}>
          {(['all', 'active', 'inactive'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filter === type ? theme.primary : theme.surface,
                  borderColor: filter === type ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setFilter(type)}
            >
              <Text style={[styles.filterText, { color: filter === type ? theme.textInverse : theme.textSecondary }]}>
                {type === 'all' ? 'Alle' : type === 'active' ? 'Aktiv' : 'Inaktiv'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Employee Count */}
        <Text style={[styles.countText, { color: theme.textMuted }]}>
          {filteredEmployees.length} Mitarbeiter
        </Text>

        {/* Employee List */}
        {filteredEmployees.map((employee) => (
          <View
            key={employee.id}
            style={[styles.employeeCard, {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
              opacity: employee.status === 'inactive' ? 0.6 : 1,
            }]}
          >
            <View style={styles.employeeHeader}>
              <View style={styles.employeeInfo}>
                <View style={[styles.avatar, { backgroundColor: employee.role === 'admin' ? theme.secondary : theme.primary }]}>
                  <Text style={[styles.avatarText, { color: theme.textInverse }]}>{getInitials(employee.firstName, employee.lastName)}</Text>
                </View>
                <View>
                  <View style={styles.nameRow}>
                    <Text style={[styles.employeeName, { color: theme.text }]}>
                      {employee.firstName} {employee.lastName}
                    </Text>
                    {employee.role === 'admin' && (
                      <View style={[styles.adminBadge, { backgroundColor: theme.pillSecondary }]}>
                        <Text style={[styles.adminBadgeText, { color: theme.pillSecondaryText }]}>Admin</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.statusRow}>
                    {employee.status === 'active' ? (
                      <CheckCircle size={12} color={theme.statusActive} />
                    ) : (
                      <XCircle size={12} color={theme.statusInactive} />
                    )}
                    <Text style={[styles.statusText, { color: employee.status === 'active' ? theme.statusActive : theme.statusInactive }]}>
                      {employee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleEmployeeAction(employee)}>
                <MoreVertical size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.employeeDetails, { borderTopColor: theme.borderLight }]}>
              <View style={styles.detailRow}>
                <Mail size={14} color={theme.textMuted} />
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>{employee.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Phone size={14} color={theme.textMuted} />
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>{employee.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <MapPin size={14} color={theme.textMuted} />
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>Standort {employee.location}</Text>
              </View>
            </View>

            <View style={[styles.employeeStats, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statsLabel, { color: theme.textMuted }]}>Stunden diesen Monat:</Text>
              <Text style={[styles.statsValue, { color: theme.text }]}>{employee.hoursThisMonth}h</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  headerSmall: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  headerLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  addButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.button, borderWidth: 1, marginBottom: spacing.md },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '500' },
  countText: { fontSize: 13, marginBottom: spacing.md },
  employeeCard: { borderRadius: borderRadius.card, borderWidth: 1, marginBottom: spacing.md, overflow: 'hidden' },
  employeeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: spacing.base },
  employeeInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  employeeName: { fontSize: 16, fontWeight: '600' },
  adminBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8 },
  adminBadgeText: { fontSize: 10, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusText: { fontSize: 12, fontWeight: '500' },
  employeeDetails: { padding: spacing.base, paddingTop: spacing.sm, borderTopWidth: 1, gap: spacing.xs },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { fontSize: 13 },
  employeeStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.base },
  statsLabel: { fontSize: 13 },
  statsValue: { fontSize: 16, fontWeight: '700' },
});