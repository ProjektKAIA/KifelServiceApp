// app/(employee)/vacation.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sun, AlertCircle, Calendar } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAuthStore } from '@/src/store/authStore';
import { vacationRequestsCollection, statsCollection } from '@/src/lib/firestore';
import { VacationRequest } from '@/src/types';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Modal } from '@/src/components/molecules';
import { Typography } from '@/src/components/atoms';
import { toast } from '@/src/utils/toast';

export default function VacationScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [remainingDays, setRemainingDays] = useState(30);
  const [usedDays, setUsedDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New request modal
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<'vacation' | 'sick'>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [userRequests, userStats] = await Promise.all([
        vacationRequestsCollection.getForUser(user.id),
        statsCollection.getUserStats(user.id),
      ]);

      setRequests(userRequests);
      setRemainingDays(userStats.remainingVacationDays);
      setUsedDays(userStats.usedVacationDays);
    } catch (error) {
      toast.loadError(t('empVacation.vacationData'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const getStatusStyle = (status: VacationRequest['status']) => {
    switch (status) {
      case 'approved':
        return { bg: theme.pillSuccess, text: theme.pillSuccessText, label: t('empVacation.approved') };
      case 'rejected':
        return { bg: theme.pillDanger, text: theme.pillDangerText, label: t('empVacation.rejected') };
      case 'pending':
      default:
        return { bg: theme.pillWarning, text: theme.pillWarningText, label: t('empVacation.pendingStatus') };
    }
  };

  const getTypeLabel = (type: VacationRequest['type']) => {
    switch (type) {
      case 'vacation': return t('empVacation.typeVacation');
      case 'sick': return t('empVacation.typeSick');
      case 'other': return t('empVacation.typeOther');
      default: return type;
    }
  };

  const formatDateRange = (start: string, end: string) => {
    try {
      const startD = parseISO(start);
      const endD = parseISO(end);
      if (start === end) {
        return format(startD, 'd. MMMM yyyy', { locale: de });
      }
      return `${format(startD, 'd. MMM', { locale: de })} – ${format(endD, 'd. MMM yyyy', { locale: de })}`;
    } catch {
      return `${start} – ${end}`;
    }
  };

  const resetForm = () => {
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const openNewRequest = (type: 'vacation' | 'sick') => {
    setRequestType(type);
    resetForm();
    setShowNewRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!user?.id || !startDate || !endDate) {
      Alert.alert(t('common.error'), t('empVacation.dateRequired'));
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      Alert.alert(t('common.error'), t('empVacation.dateFormatError'));
      return;
    }

    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      if (end < start) {
        Alert.alert(t('common.error'), t('empVacation.endBeforeStart'));
        return;
      }

      const days = differenceInDays(end, start) + 1;

      setIsSubmitting(true);

      await vacationRequestsCollection.create({
        userId: user.id,
        type: requestType,
        startDate,
        endDate,
        days,
        reason: reason.trim() || undefined,
      });

      setShowNewRequestModal(false);
      resetForm();
      toast.success(t('empVacation.requestSubmitted'));
      loadData();
    } catch (error) {
      toast.error(error, t('empVacation.requestFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
          <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>{t('empVacation.badge')}</Text>
        </View>

        {/* Header */}
        <Text style={[styles.headerSmall, { color: theme.textMuted }]}>{t('empVacation.subtitle')}</Text>
        <Text style={[styles.headerLarge, { color: theme.text }]}>{t('empVacation.title')}</Text>

        {/* Vacation Balance Card */}
        <View style={[styles.balanceCard, {
          backgroundColor: theme.pillInfo,
          borderColor: theme.primary
        }]}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>{t('empVacation.remaining')} {new Date().getFullYear()}</Text>
              <Text style={[styles.balanceValue, { color: theme.primary }]}>{remainingDays} {t('empVacation.days')}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>{t('empVacation.used')}</Text>
              <Text style={[styles.balanceValue, { color: theme.text }]}>{usedDays}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
            onPress={() => openNewRequest('vacation')}
          >
            <Sun size={18} color={theme.textInverse} />
            <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>{t('empVacation.typeVacation')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, borderWidth: 1 }]}
            activeOpacity={0.7}
            onPress={() => openNewRequest('sick')}
          >
            <AlertCircle size={18} color={theme.danger} />
            <Text style={[styles.actionButtonText, { color: theme.danger }]}>{t('empVacation.sick')}</Text>
          </TouchableOpacity>
        </View>

        {/* Requests */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{t('empVacation.myRequests')}</Text>

        {requests.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('empVacation.noRequests')}</Text>
          </View>
        ) : (
          requests.map((request) => {
            const statusStyle = getStatusStyle(request.status);

            return (
              <View
                key={request.id}
                style={[styles.requestCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
              >
                <View style={styles.requestInfo}>
                  <Text style={[styles.requestDate, { color: theme.text }]}>
                    {formatDateRange(request.startDate, request.endDate)}
                  </Text>
                  <Text style={[styles.requestType, { color: theme.textMuted }]}>
                    {getTypeLabel(request.type)} · {request.days} {request.days === 1 ? t('empVacation.day') : t('empVacation.days')}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* New Request Modal */}
      <Modal
        visible={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        title={requestType === 'vacation' ? t('empVacation.requestVacation') : t('empVacation.sickReport')}
      >
        <Typography variant="overline" color="muted" style={styles.modalLabel}>{t('empVacation.periodSection')}</Typography>

        <View style={styles.dateRow}>
          <View style={styles.dateInput}>
            <Typography variant="caption" color="muted">{t('empVacation.from')} ({t('empVacation.dateFormatLabel')})</Typography>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2025-01-15"
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <View style={styles.dateInput}>
            <Typography variant="caption" color="muted">{t('empVacation.to')} ({t('empVacation.dateFormatLabel')})</Typography>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2025-01-20"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        <Typography variant="overline" color="muted" style={{ ...styles.modalLabel, marginTop: spacing.lg }}>{t('empVacation.reasonSection')}</Typography>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          value={reason}
          onChangeText={setReason}
          placeholder="z.B. Familienurlaub"
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary, opacity: isSubmitting ? 0.5 : 1 }]}
          onPress={handleSubmitRequest}
          disabled={isSubmitting}
        >
          <Typography variant="label" style={{ color: theme.textInverse }}>
            {isSubmitting ? t('empVacation.submitting') : t('empVacation.submitRequest')}
          </Typography>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.base,
    paddingTop: 0,
  },
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerSmall: {
    fontSize: 13,
    marginBottom: 4,
  },
  headerLarge: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  balanceCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  balanceRow: {
    flexDirection: 'row',
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: borderRadius.card,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  requestInfo: {
    flex: 1,
  },
  requestDate: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  requestType: {
    fontSize: 13,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalLabel: {
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateInput: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.xs,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
