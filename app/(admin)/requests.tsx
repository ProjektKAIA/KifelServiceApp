// app/(admin)/requests.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '@/src/components/atoms';
import { FilterTabs } from '@/src/components/molecules';
import { ScreenHeader, RequestCard } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { spacing } from '@/src/constants/spacing';
import { vacationRequestsCollection, usersCollection } from '@/src/lib/firestore';
import { useAuthStore } from '@/src/store/authStore';
import type { VacationRequest, User } from '@/src/types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type RequestType = 'vacation' | 'sick';
type FilterType = 'all' | RequestType;

// Map VacationRequest type to RequestCard type (other -> sick as fallback)
const mapRequestType = (type: 'vacation' | 'sick' | 'other'): RequestType => {
  return type === 'other' ? 'sick' : type;
};

interface EnrichedRequest extends VacationRequest {
  employeeName: string;
  dateRange: string;
}

export default function RequestsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [requests, setRequests] = useState<EnrichedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filterOptions = [
    { key: 'all', label: t('adminRequests.all') },
    { key: 'vacation', label: t('adminRequests.filterVacation') },
    { key: 'sick', label: t('adminRequests.filterSick') },
  ];

  // Load requests from Firestore
  const loadRequests = useCallback(async () => {
    try {
      const allRequests = await vacationRequestsCollection.getAll();
      const users = await usersCollection.getAll();

      const userMap = new Map<string, User>();
      users.forEach(u => userMap.set(u.id, u));

      const enriched: EnrichedRequest[] = allRequests.map(req => {
        const reqUser = userMap.get(req.userId);
        const employeeName = reqUser
          ? `${reqUser.firstName} ${reqUser.lastName}`
          : t('adminRequests.unknown');

        const startDate = format(new Date(req.startDate), 'dd.MM.', { locale: de });
        const endDate = format(new Date(req.endDate), 'dd.MM.yyyy', { locale: de });
        const dateRange = req.startDate === req.endDate
          ? format(new Date(req.startDate), 'dd.MM.yyyy', { locale: de })
          : `${startDate} - ${endDate}`;

        return {
          ...req,
          employeeName,
          dateRange,
        };
      });

      setRequests(enriched);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert(t('common.error'), t('adminRequests.loadError'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = requests.filter((r) => filter === 'all' || r.type === filter);
  const pendingRequests = filteredRequests.filter((r) => r.status === 'pending');
  const processedRequests = filteredRequests.filter((r) => r.status !== 'pending');

  const handleApprove = async (id: string) => {
    if (!user?.id) return;

    try {
      await vacationRequestsCollection.updateStatus(id, 'approved', user.id);
      setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
      Alert.alert(t('adminRequests.approvedAlert'), t('adminRequests.approvedMessage'));
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert(t('common.error'), t('adminRequests.approveError'));
    }
  };

  const handleReject = async (id: string) => {
    if (!user?.id) return;

    try {
      await vacationRequestsCollection.updateStatus(id, 'rejected', user.id);
      setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
      Alert.alert(t('adminRequests.rejectedAlert'), t('adminRequests.rejectedMessage'));
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert(t('common.error'), t('adminRequests.rejectError'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <ScreenHeader overline={t('adminRequests.overline')} title={t('adminRequests.title')} />

        <FilterTabs
          options={filterOptions}
          selected={filter}
          onSelect={(key) => setFilter(key as FilterType)}
          style={styles.filterTabs}
        />

        {/* Pending */}
        {pendingRequests.length > 0 && (
          <>
            <Typography variant="overline" color="muted" style={styles.sectionTitle}>
              {t('adminRequests.pendingSection')} ({pendingRequests.length})
            </Typography>
            {pendingRequests.map((r) => (
              <RequestCard
                key={r.id}
                type={mapRequestType(r.type)}
                employeeName={r.employeeName}
                dateRange={r.dateRange}
                reason={r.reason}
                status={r.status}
                showActions
                onApprove={() => handleApprove(r.id)}
                onReject={() => handleReject(r.id)}
              />
            ))}
          </>
        )}

        {/* Processed */}
        {processedRequests.length > 0 && (
          <>
            <Typography variant="overline" color="muted" style={styles.sectionTitle}>
              {t('adminRequests.processedSection')}
            </Typography>
            {processedRequests.map((r) => (
              <RequestCard
                key={r.id}
                type={mapRequestType(r.type)}
                employeeName={r.employeeName}
                dateRange={r.dateRange}
                reason={r.reason}
                status={r.status}
              />
            ))}
          </>
        )}

        {/* Empty State */}
        {!isLoading && requests.length === 0 && (
          <Typography variant="body" color="muted" style={styles.emptyText}>
            {t('adminRequests.noRequestsMessage')}
          </Typography>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
  },
  filterTabs: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
