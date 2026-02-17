// app/(admin)/team.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, Mail, Phone, Trash2, Edit, Shield, ShieldCheck, UserX, UserCheck, MapPin, Link, Copy, Send, Clock, RefreshCw, Calendar, Coffee, ChevronRight } from 'lucide-react-native';

import { Typography, Input, Button, Avatar } from '@/src/components/atoms';
import { Modal, Card } from '@/src/components/molecules';
import { ScreenHeader } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { spacing } from '@/src/constants/spacing';
import { User, Invite, DeletionRequest } from '@/src/types';
import { usersCollection, invitesCollection, timeEntriesCollection, deletionRequestsCollection, adminNotificationsCollection, TimeEntry } from '@/src/lib/firestore';
import { isFirebaseConfigured } from '@/src/lib/firebase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuthStore } from '@/src/store/authStore';
import * as Linking from 'expo-linking';

let Clipboard: typeof import('expo-clipboard') | null = null;
try {
  Clipboard = require('expo-clipboard');
} catch {
  console.warn('[Team] expo-clipboard not available (Expo Go?)');
}

type EmployeeStatus = 'active' | 'inactive';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  role: 'employee' | 'admin';
  weeklyTargetHours: string;
}

const initialFormData: EmployeeFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  role: 'employee',
  weeklyTargetHours: '40',
};

export default function TeamManagementScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<User[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null);

  // Form
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);

  // Employee detail view state
  const [employeeTimeEntries, setEmployeeTimeEntries] = useState<TimeEntry[]>([]);
  const [employeeStatsLoading, setEmployeeStatsLoading] = useState(false);
  const [isEditingInDetail, setIsEditingInDetail] = useState(false);
  const [detailEditData, setDetailEditData] = useState<EmployeeFormData>(initialFormData);

  // Load employees and pending invites
  const loadEmployees = useCallback(async () => {
    try {
      const [users, invites] = await Promise.all([
        usersCollection.getAll(),
        invitesCollection.getPending(),
      ]);
      setEmployees(users);
      setPendingInvites(invites);
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert(t('common.error'), t('adminTeam.loadError'));
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

  // Filter employees - exclude deleted users and apply search
  const filteredEmployees = employees
    .filter((e) => e.status !== 'deleted') // Exclude deleted users
    .filter((e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Active employees: status is 'active' or undefined (treat undefined as active)
  const activeEmployees = filteredEmployees.filter((e) => e.status !== 'inactive');
  // Inactive employees: status is explicitly 'inactive'
  const inactiveEmployees = filteredEmployees.filter((e) => e.status === 'inactive');

  // Handlers
  const handleEmployeePress = async (employee: User) => {
    setSelectedEmployee(employee);
    setIsEditingInDetail(false);
    setShowDetailModal(true);
    loadEmployeeTimeEntries(employee.id);
  };

  // Load time entries for selected employee
  const loadEmployeeTimeEntries = async (userId: string) => {
    setEmployeeStatsLoading(true);
    try {
      const now = new Date();
      const start = format(startOfMonth(now), 'yyyy-MM-dd');
      const end = format(endOfMonth(now), 'yyyy-MM-dd');
      const entries = await timeEntriesCollection.getForUserInRange(userId, start, end);
      setEmployeeTimeEntries(entries);
    } catch (error) {
      console.error('Error loading time entries:', error);
      setEmployeeTimeEntries([]);
    } finally {
      setEmployeeStatsLoading(false);
    }
  };

  // Calculate employee stats from time entries
  const calculateEmployeeStats = () => {
    let totalMinutes = 0;
    let breakMinutes = 0;

    employeeTimeEntries.forEach(entry => {
      if (!entry.clockOut) return;
      const clockIn = new Date(entry.clockIn);
      const clockOut = new Date(entry.clockOut);
      const grossMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / (1000 * 60));
      totalMinutes += grossMinutes;
      breakMinutes += entry.breakMinutes || 0;
    });

    const netMinutes = totalMinutes - breakMinutes;
    return {
      grossHours: Math.floor(totalMinutes / 60),
      grossMins: totalMinutes % 60,
      breakHours: Math.floor(breakMinutes / 60),
      breakMins: breakMinutes % 60,
      netHours: Math.floor(netMinutes / 60),
      netMins: netMinutes % 60,
      entriesCount: employeeTimeEntries.length,
    };
  };

  // Format time entry for display
  const formatTimeEntry = (entry: TimeEntry) => {
    const clockIn = new Date(entry.clockIn);
    const clockOut = entry.clockOut ? new Date(entry.clockOut) : null;
    let netHours = 0, netMins = 0;

    if (clockOut) {
      const grossMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / (1000 * 60));
      const netMinutes = grossMinutes - (entry.breakMinutes || 0);
      netHours = Math.floor(netMinutes / 60);
      netMins = netMinutes % 60;
    }

    return {
      date: format(clockIn, 'EEE, d. MMM', { locale: de }),
      clockIn: format(clockIn, 'HH:mm'),
      clockOut: clockOut ? format(clockOut, 'HH:mm') : '--:--',
      netHours,
      netMins,
      breakMins: entry.breakMinutes || 0,
    };
  };

  // Start editing in detail view
  const handleStartDetailEdit = () => {
    if (selectedEmployee) {
      setDetailEditData({
        firstName: selectedEmployee.firstName,
        lastName: selectedEmployee.lastName,
        email: selectedEmployee.email,
        phone: selectedEmployee.phone || '',
        location: selectedEmployee.location || '',
        role: selectedEmployee.role,
        weeklyTargetHours: selectedEmployee.weeklyTargetHours?.toString() || '',
      });
      setIsEditingInDetail(true);
    }
  };

  // Save changes from detail edit
  const handleSaveDetailEdit = async () => {
    if (!selectedEmployee) return;

    setFormLoading(true);
    try {
      const parsedTarget = detailEditData.weeklyTargetHours ? parseFloat(detailEditData.weeklyTargetHours) : undefined;
      await usersCollection.update(selectedEmployee.id, {
        firstName: detailEditData.firstName,
        lastName: detailEditData.lastName,
        phone: detailEditData.phone || undefined,
        location: detailEditData.location || undefined,
        weeklyTargetHours: parsedTarget && !isNaN(parsedTarget) ? parsedTarget : undefined,
      });

      // Update local state
      const updatedEmployee = {
        ...selectedEmployee,
        firstName: detailEditData.firstName,
        lastName: detailEditData.lastName,
        phone: detailEditData.phone || undefined,
        location: detailEditData.location || undefined,
        weeklyTargetHours: parsedTarget && !isNaN(parsedTarget) ? parsedTarget : undefined,
      };
      setSelectedEmployee(updatedEmployee);
      setIsEditingInDetail(false);
      loadEmployees();
      Alert.alert(t('common.success'), t('adminTeam.updated'));
    } catch (error) {
      console.error('Error updating employee:', error);
      Alert.alert(t('common.error'), t('adminTeam.updateError'));
    } finally {
      setFormLoading(false);
    }
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
      weeklyTargetHours: employee.weeklyTargetHours?.toString() || '',
    });
    setSelectedEmployee(employee);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  // Generate invite link
  const getInviteLink = (token: string): string => {
    // Use expo-linking to create a deep link
    return Linking.createURL('invite', { queryParams: { token } });
  };

  const handleCreateEmployee = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      Alert.alert(t('common.error'), t('adminTeam.fillRequired'));
      return;
    }

    if (!currentUser) {
      Alert.alert(t('common.error'), t('adminTeam.notLoggedIn'));
      return;
    }

    setFormLoading(true);
    try {
      if (!isFirebaseConfigured()) {
        Alert.alert(t('common.error'), t('adminTeam.firebaseError'));
        return;
      }

      // Create invite instead of user
      const invite = await invitesCollection.create({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        location: formData.location || undefined,
        role: formData.role,
        createdBy: currentUser.id,
      });

      setShowAddModal(false);
      setFormData(initialFormData);
      setCreatedInvite(invite);
      setShowInviteLinkModal(true);
      loadEmployees();
    } catch (error: any) {
      console.error('Error creating invite:', error);
      Alert.alert(t('common.error'), t('adminTeam.inviteCreateError'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!createdInvite) return;
    const link = getInviteLink(createdInvite.token);
    if (Clipboard) {
      await Clipboard.setStringAsync(link);
      Alert.alert(t('adminTeam.linkCopied'), t('adminTeam.linkCopiedMessage'));
    } else {
      Alert.alert(t('common.error'), t('adminTeam.clipboardError'));
    }
  };

  const handleShareInvite = async () => {
    if (!createdInvite) return;
    const link = getInviteLink(createdInvite.token);
    const message = t('adminTeam.inviteMessageTemplate').replace('{name}', createdInvite.firstName).replace('{link}', link);

    // Try to open mail app or share
    const mailUrl = `mailto:${createdInvite.email}?subject=${encodeURIComponent(t('adminTeam.inviteEmailSubject'))}&body=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(mailUrl);
    if (canOpen) {
      await Linking.openURL(mailUrl);
    } else {
      // Fallback: just copy
      if (Clipboard) {
        await Clipboard.setStringAsync(link);
        Alert.alert(t('adminTeam.linkCopied'), t('adminTeam.linkCopiedFallback'));
      }
    }
  };

  const handleResendInvite = async (invite: Invite) => {
    try {
      const newInvite = await invitesCollection.resend(invite.id);
      setCreatedInvite(newInvite);
      setShowInviteLinkModal(true);
      loadEmployees();
    } catch (error) {
      Alert.alert(t('common.error'), t('adminTeam.resendError'));
    }
  };

  const handleDeleteInvite = (invite: Invite) => {
    Alert.alert(
      t('adminTeam.deleteInvite'),
      t('adminTeam.deleteInviteConfirm').replace('{name}', `${invite.firstName} ${invite.lastName}`),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await invitesCollection.delete(invite.id);
              loadEmployees();
            } catch (error) {
              Alert.alert(t('common.error'), t('adminTeam.deleteInviteError'));
            }
          },
        },
      ]
    );
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

      Alert.alert(t('common.success'), t('adminTeam.updated'));
      setShowEditModal(false);
      loadEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      Alert.alert(t('common.error'), t('adminTeam.updateEmployeeError'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (employee: User) => {
    // Prevent admin from deactivating themselves
    if (employee.id === currentUser?.id) {
      Alert.alert(t('adminTeam.notPossible'), t('adminTeam.cannotDeactivateSelf'));
      return;
    }

    // Treat undefined or 'active' status as active -> toggle to inactive
    // Treat 'inactive' status -> toggle to active
    const currentStatus = employee.status || 'active';
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    const action = newStatus === 'inactive' ? t('adminTeam.toggleDeactivate') : t('adminTeam.toggleActivate');

    Alert.alert(
      t('adminTeam.toggleStatusTitle').replace('{action}', action),
      t('adminTeam.toggleStatusConfirm').replace('{name}', `${employee.firstName} ${employee.lastName}`).replace('{action}', action),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: newStatus === 'inactive' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await usersCollection.update(employee.id, { status: newStatus } as any);
              loadEmployees();
              setShowDetailModal(false);
            } catch (error) {
              Alert.alert(t('common.error'), t('adminTeam.statusError'));
            }
          },
        },
      ]
    );
  };

  const handleToggleRole = async (employee: User) => {
    // Prevent admin from demoting themselves
    if (employee.id === currentUser?.id) {
      Alert.alert(t('adminTeam.notPossible'), t('adminTeam.cannotChangeOwnRole'));
      return;
    }

    const newRole = employee.role === 'admin' ? 'employee' : 'admin';
    const roleText = newRole === 'admin' ? t('adminTeam.administrator') : t('adminTeam.employee');

    Alert.alert(
      t('adminTeam.changeRole'),
      t('adminTeam.changeRoleConfirm').replace('{name}', `${employee.firstName} ${employee.lastName}`).replace('{role}', roleText),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('adminTeam.changeButton'),
          onPress: async () => {
            try {
              await usersCollection.update(employee.id, { role: newRole });
              loadEmployees();
              setShowDetailModal(false);
              Alert.alert(t('common.success'), t('adminTeam.roleChanged').replace('{role}', roleText));
            } catch (error) {
              Alert.alert(t('common.error'), t('adminTeam.roleChangeError'));
            }
          },
        },
      ]
    );
  };

  const handleDeleteEmployee = (employee: User) => {
    Alert.alert(
      t('deletion.deleteAccount'),
      t('deletion.deleteAccountConfirm').replace('{name}', `${employee.firstName} ${employee.lastName}`),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await usersCollection.deleteAccount(employee.id);
              setShowDetailModal(false);
              loadEmployees();
              Alert.alert(t('common.success'), t('deletion.deleteAccountSuccess'));
            } catch (error) {
              Alert.alert(t('common.error'), t('deletion.deleteAccountError'));
            }
          },
        },
      ]
    );
  };

  const handleApproveDeletionRequest = (notification: any) => {
    const userName = notification.userName;
    const userId = notification.userId;
    const entityId = notification.entityId;

    Alert.alert(
      t('deletion.approveRequest'),
      t('deletion.approveConfirm').replace('{name}', userName),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await usersCollection.deleteAccount(userId);
              if (entityId) {
                await deletionRequestsCollection.updateStatus(entityId, 'approved');
              }
              if (currentUser) {
                await adminNotificationsCollection.markAsRead(notification.id, currentUser.id);
              }
              loadEmployees();
              Alert.alert(t('common.success'), t('deletion.approved'));
            } catch (error) {
              Alert.alert(t('common.error'), t('deletion.deleteAccountError'));
            }
          },
        },
      ]
    );
  };

  const handleRejectDeletionRequest = (notification: any) => {
    const userName = notification.userName;
    const entityId = notification.entityId;

    Alert.alert(
      t('deletion.rejectRequest'),
      t('deletion.rejectConfirm').replace('{name}', userName),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              if (entityId) {
                await deletionRequestsCollection.updateStatus(entityId, 'rejected');
              }
              if (currentUser) {
                await adminNotificationsCollection.markAsRead(notification.id, currentUser.id);
              }
              Alert.alert(t('common.success'), t('deletion.rejected'));
            } catch (error) {
              Alert.alert(t('common.error'), t('common.error'));
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
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Typography variant="body" color="muted" style={{ marginTop: spacing.md }}>
          {t('adminTeam.loading')}
        </Typography>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <ScreenHeader overline={t('adminTeam.overline')} title={t('adminTeam.title')} />

        {/* Search & Add */}
        <View style={styles.searchRow}>
          <Input
            icon={Search}
            placeholder={t('adminTeam.searchPlaceholder')}
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
            <Typography variant="h2" style={{ color: theme.primary }}>{filteredEmployees.length}</Typography>
            <Typography variant="caption" color="muted">{t('adminTeam.total')}</Typography>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Typography variant="h2" style={{ color: theme.success }}>{activeEmployees.length}</Typography>
            <Typography variant="caption" color="muted">{t('adminTeam.active')}</Typography>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Typography variant="h2" style={{ color: theme.textMuted }}>{inactiveEmployees.length}</Typography>
            <Typography variant="caption" color="muted">{t('adminTeam.inactive')}</Typography>
          </Card>
        </View>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <>
            <Typography variant="overline" color="muted" style={styles.sectionTitle}>
              {t('adminTeam.pendingInvites')} ({pendingInvites.length})
            </Typography>
            {pendingInvites.map((invite) => (
              <View
                key={invite.id}
                style={[styles.inviteCard, { backgroundColor: theme.cardBackground, borderColor: theme.warning + '40' }]}
              >
                <View style={styles.inviteCardContent}>
                  <Avatar name={`${invite.firstName} ${invite.lastName}`} size="lg" />
                  <View style={styles.inviteCardInfo}>
                    <View style={styles.nameRow}>
                      <Typography variant="body" style={styles.employeeName}>
                        {invite.firstName} {invite.lastName}
                      </Typography>
                      <View style={[styles.pendingBadge, { backgroundColor: theme.warning + '20' }]}>
                        <Clock size={10} color={theme.warning} />
                        <Typography variant="caption" style={{ color: theme.warning, marginLeft: 4, fontSize: 10 }}>
                          {t('adminTeam.invited')}
                        </Typography>
                      </View>
                    </View>
                    <Typography variant="bodySmall" color="muted">{invite.email}</Typography>
                    <Typography variant="caption" color="muted" style={{ marginTop: 2 }}>
                      {t('adminTeam.validUntil').replace('{date}', new Date(invite.expiresAt).toLocaleDateString('de-DE'))}
                    </Typography>
                  </View>
                  <View style={styles.inviteCardActions}>
                    <TouchableOpacity
                      style={[styles.inviteCardButton, { backgroundColor: theme.primary + '20' }]}
                      onPress={() => handleResendInvite(invite)}
                    >
                      <RefreshCw size={16} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inviteCardButton, { backgroundColor: theme.danger + '20' }]}
                      onPress={() => handleDeleteInvite(invite)}
                    >
                      <Trash2 size={16} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Active Employees */}
        {activeEmployees.length > 0 && (
          <>
            <Typography variant="overline" color="muted" style={styles.sectionTitle}>
              {t('adminTeam.activeEmployees')} ({activeEmployees.length})
            </Typography>
            {activeEmployees.map(renderEmployeeCard)}
          </>
        )}

        {/* Inactive Employees */}
        {inactiveEmployees.length > 0 && (
          <>
            <Typography variant="overline" color="muted" style={styles.sectionTitle}>
              {t('adminTeam.inactiveSection')} ({inactiveEmployees.length})
            </Typography>
            {inactiveEmployees.map(renderEmployeeCard)}
          </>
        )}

        {employees.length === 0 && pendingInvites.length === 0 && (
          <View style={styles.emptyState}>
            <Typography variant="body" color="muted">{t('adminTeam.noMembers')}</Typography>
            <Button title={t('adminTeam.inviteFirst')} onPress={handleAddEmployee} style={{ marginTop: spacing.md }} />
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} onClose={() => { setShowDetailModal(false); setIsEditingInDetail(false); }} title={t('adminTeam.employeeDetails')}>
        {selectedEmployee && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header with Avatar and Name */}
            <View style={styles.modalHeader}>
              <Avatar name={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`} size="xl" />
              {!isEditingInDetail ? (
                <>
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
                      {selectedEmployee.role === 'admin' ? t('adminTeam.administrator') : t('adminTeam.employee')}
                    </Typography>
                  </View>
                </>
              ) : (
                <View style={{ width: '100%', marginTop: spacing.md }}>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Typography variant="caption" color="muted">{t('adminTeam.firstName')}</Typography>
                      <Input
                        value={detailEditData.firstName}
                        onChangeText={(text) => setDetailEditData({ ...detailEditData, firstName: text })}
                        containerStyle={{ marginTop: 4 }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="caption" color="muted">{t('adminTeam.lastName')}</Typography>
                      <Input
                        value={detailEditData.lastName}
                        onChangeText={(text) => setDetailEditData({ ...detailEditData, lastName: text })}
                        containerStyle={{ marginTop: 4 }}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Contact Info Card */}
            <Card variant="default" style={styles.detailCard}>
              {!isEditingInDetail ? (
                <>
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
                  <View style={styles.detailRow}>
                    <Clock size={16} color={theme.textMuted} />
                    <Typography variant="body">
                      {selectedEmployee.weeklyTargetHours
                        ? `${selectedEmployee.weeklyTargetHours}h / ${t('empReports.hoursPerWeek')} (${t('adminReports.target')})`
                        : t('adminTeam.noTargetSet')}
                    </Typography>
                  </View>
                </>
              ) : (
                <>
                  <Typography variant="caption" color="muted">{t('adminTeam.emailReadonly')}</Typography>
                  <Input
                    value={selectedEmployee.email}
                    editable={false}
                    containerStyle={{ marginTop: 4, marginBottom: spacing.md, opacity: 0.6 }}
                  />
                  <Typography variant="caption" color="muted">{t('adminTeam.phone')}</Typography>
                  <Input
                    value={detailEditData.phone}
                    onChangeText={(text) => setDetailEditData({ ...detailEditData, phone: text })}
                    placeholder="+49 123 456789"
                    keyboardType="phone-pad"
                    containerStyle={{ marginTop: 4, marginBottom: spacing.md }}
                  />
                  <Typography variant="caption" color="muted">{t('adminTeam.location')}</Typography>
                  <Input
                    value={detailEditData.location}
                    onChangeText={(text) => setDetailEditData({ ...detailEditData, location: text })}
                    placeholder="Berlin"
                    containerStyle={{ marginTop: 4, marginBottom: spacing.md }}
                  />
                  <Typography variant="caption" color="muted">{t('adminTeam.weeklyTargetHours')}</Typography>
                  <Input
                    value={detailEditData.weeklyTargetHours}
                    onChangeText={(text) => setDetailEditData({ ...detailEditData, weeklyTargetHours: text })}
                    placeholder="40"
                    keyboardType="numeric"
                    containerStyle={{ marginTop: 4 }}
                  />
                </>
              )}
            </Card>

            {/* Edit/Save Buttons */}
            <View style={styles.modalActions}>
              {!isEditingInDetail ? (
                <Button
                  title={t('common.edit')}
                  icon={Edit}
                  variant="secondary"
                  onPress={handleStartDetailEdit}
                  style={styles.actionButton}
                />
              ) : (
                <>
                  <Button
                    title={t('common.cancel')}
                    variant="secondary"
                    onPress={() => setIsEditingInDetail(false)}
                    style={styles.actionButton}
                  />
                  <Button
                    title={t('common.save')}
                    variant="primary"
                    onPress={handleSaveDetailEdit}
                    loading={formLoading}
                    style={styles.actionButton}
                  />
                </>
              )}
            </View>

            {/* Hours Stats Section */}
            {!isEditingInDetail && (
              <>
                <Typography variant="overline" color="muted" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
                  {t('adminTeam.hoursThisMonth')}
                </Typography>

                {employeeStatsLoading ? (
                  <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: spacing.md }} />
                ) : (
                  <>
                    <View style={[styles.statsCard, { backgroundColor: theme.pillInfo, borderColor: theme.primary }]}>
                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Clock size={16} color={theme.primary} />
                          <Typography variant="h3" style={{ color: theme.primary }}>
                            {calculateEmployeeStats().netHours}:{calculateEmployeeStats().netMins.toString().padStart(2, '0')}h
                          </Typography>
                          <Typography variant="caption" color="muted">{t('adminTeam.netLabel')}</Typography>
                        </View>
                        <View style={styles.statItem}>
                          <Calendar size={16} color={theme.textSecondary} />
                          <Typography variant="h3">{calculateEmployeeStats().entriesCount}</Typography>
                          <Typography variant="caption" color="muted">{t('adminTeam.entriesLabel')}</Typography>
                        </View>
                        <View style={styles.statItem}>
                          <Coffee size={16} color={theme.textSecondary} />
                          <Typography variant="h3">
                            {calculateEmployeeStats().breakHours}:{calculateEmployeeStats().breakMins.toString().padStart(2, '0')}h
                          </Typography>
                          <Typography variant="caption" color="muted">{t('adminTeam.breakLabel')}</Typography>
                        </View>
                      </View>
                    </View>

                    {/* Recent Time Entries */}
                    {employeeTimeEntries.length > 0 && (
                      <>
                        <Typography variant="overline" color="muted" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
                          {t('adminTeam.recentEntries')}
                        </Typography>
                        {employeeTimeEntries
                          .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
                          .slice(0, 5)
                          .map((entry, index) => {
                            const formatted = formatTimeEntry(entry);
                            return (
                              <View
                                key={entry.id || index}
                                style={[styles.timeEntryRow, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                              >
                                <View style={{ flex: 1 }}>
                                  <Typography variant="label">{formatted.date}</Typography>
                                  <Typography variant="caption" color="muted">
                                    {formatted.clockIn} – {formatted.clockOut}
                                  </Typography>
                                </View>
                                <Typography variant="label" style={{ color: theme.primary }}>
                                  {formatted.netHours}:{formatted.netMins.toString().padStart(2, '0')}h
                                </Typography>
                              </View>
                            );
                          })}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Role & Status Actions */}
            {!isEditingInDetail && selectedEmployee.id !== currentUser?.id && (
              <>
                <Typography variant="overline" color="muted" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
                  {t('adminTeam.management')}
                </Typography>
                <View style={styles.modalActions}>
                  <Button
                    title={selectedEmployee.role === 'admin' ? t('adminTeam.toEmployee') : t('adminTeam.toAdmin')}
                    icon={selectedEmployee.role === 'admin' ? Shield : ShieldCheck}
                    variant="secondary"
                    onPress={() => handleToggleRole(selectedEmployee)}
                    style={styles.actionButton}
                  />
                  <Button
                    title={(selectedEmployee.status || 'active') === 'inactive' ? t('adminTeam.activate') : t('adminTeam.deactivate')}
                    icon={(selectedEmployee.status || 'active') === 'inactive' ? UserCheck : UserX}
                    variant={(selectedEmployee.status || 'active') === 'inactive' ? 'primary' : 'danger'}
                    onPress={() => handleToggleStatus(selectedEmployee)}
                    style={styles.actionButton}
                  />
                </View>
                <Button
                  title={t('deletion.deleteAccount')}
                  icon={Trash2}
                  variant="danger"
                  onPress={() => handleDeleteEmployee(selectedEmployee)}
                  style={{ marginTop: spacing.sm }}
                />
              </>
            )}
          </ScrollView>
        )}
      </Modal>

      {/* Add Employee Modal - Creates Invite */}
      <Modal visible={showAddModal} onClose={() => setShowAddModal(false)} title={t('adminTeam.inviteEmployee')}>
        <Typography variant="bodySmall" color="muted" style={{ marginBottom: spacing.md }}>
          {t('adminTeam.inviteDescription')}
        </Typography>
        <Input
          label={t('adminTeam.firstNameRequired')}
          placeholder={t('adminTeam.firstName')}
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        />
        <Input
          label={t('adminTeam.lastNameRequired')}
          placeholder={t('adminTeam.lastName')}
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label={t('adminTeam.emailRequired')}
          placeholder="name@firma.de"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label={t('adminTeam.phone')}
          placeholder="+49 123 456789"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label={t('adminTeam.location')}
          placeholder="Berlin"
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
          containerStyle={{ marginTop: spacing.md }}
        />

        {/* Role Selection */}
        <Typography variant="label" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
          {t('adminTeam.role')}
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
              {t('adminTeam.employee')}
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
          title={formLoading ? t('adminTeam.creating') : t('adminTeam.createInvite')}
          onPress={handleCreateEmployee}
          disabled={formLoading}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>

      {/* Edit Employee Modal */}
      <Modal visible={showEditModal} onClose={() => setShowEditModal(false)} title={t('adminTeam.editEmployee')}>
        <Input
          label={t('adminTeam.firstName')}
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        />
        <Input
          label={t('adminTeam.lastName')}
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label={t('adminTeam.emailReadonly')}
          value={formData.email}
          editable={false}
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label={t('adminTeam.phone')}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label={t('adminTeam.location')}
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
          containerStyle={{ marginTop: spacing.md }}
        />

        {/* Role Selection */}
        <Typography variant="label" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
          {t('adminTeam.role')}
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
              {t('adminTeam.employee')}
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
          title={formLoading ? t('adminTeam.saving') : t('common.save')}
          onPress={handleUpdateEmployee}
          disabled={formLoading}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>

      {/* Invite Link Modal */}
      <Modal
        visible={showInviteLinkModal}
        onClose={() => {
          setShowInviteLinkModal(false);
          setCreatedInvite(null);
        }}
        title={t('adminTeam.inviteCreated')}
      >
        {createdInvite && (
          <>
            <View style={styles.inviteSuccessHeader}>
              <View style={[styles.inviteIcon, { backgroundColor: theme.success + '20' }]}>
                <Link size={24} color={theme.success} />
              </View>
              <Typography variant="body" style={{ textAlign: 'center', marginTop: spacing.md }}>
                {t('adminTeam.inviteFor').replace('{name}', `${createdInvite.firstName} ${createdInvite.lastName}`)}
              </Typography>
            </View>

            <Card variant="default" style={styles.inviteLinkCard}>
              <Typography variant="caption" color="muted">{t('adminTeam.inviteLink')}</Typography>
              <Typography variant="bodySmall" style={{ marginTop: 4 }} numberOfLines={2}>
                {getInviteLink(createdInvite.token)}
              </Typography>
            </Card>

            <View style={styles.inviteInfo}>
              <Clock size={14} color={theme.textMuted} />
              <Typography variant="caption" color="muted" style={{ marginLeft: 6 }}>
                {t('adminTeam.validUntil').replace('{date}', new Date(createdInvite.expiresAt).toLocaleDateString('de-DE'))}
              </Typography>
            </View>

            <View style={styles.inviteActions}>
              <Button
                title={t('adminTeam.copyLink')}
                icon={Copy}
                variant="secondary"
                onPress={handleCopyInviteLink}
                style={styles.actionButton}
              />
              <Button
                title={t('adminTeam.sendEmail')}
                icon={Send}
                onPress={handleShareInvite}
                style={styles.actionButton}
              />
            </View>

            <Button
              title={t('adminTeam.done')}
              variant="secondary"
              onPress={() => {
                setShowInviteLinkModal(false);
                setCreatedInvite(null);
              }}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}
      </Modal>
    </View>
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
  // Invite styles
  inviteSuccessHeader: { alignItems: 'center', marginBottom: spacing.lg },
  inviteIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  inviteLinkCard: { marginBottom: spacing.sm },
  inviteInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  inviteActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  inviteCard: { borderRadius: 12, borderWidth: 1, padding: spacing.base, marginBottom: spacing.sm },
  inviteCardContent: { flexDirection: 'row', alignItems: 'center' },
  inviteCardInfo: { flex: 1, marginLeft: spacing.md },
  inviteCardActions: { flexDirection: 'row', gap: spacing.xs },
  inviteCardButton: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  // Detail Stats styles
  statsCard: { padding: spacing.base, borderRadius: 12, borderWidth: 1 },
  statItem: { alignItems: 'center', gap: 4 },
  timeEntryRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 10, borderWidth: 1, marginBottom: spacing.xs },
});
