// app/(admin)/requests.tsx

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography } from '@/src/components/atoms';
import { FilterTabs } from '@/src/components/molecules';
import { ScreenHeader, RequestCard } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { spacing } from '@/src/constants/spacing';

type RequestType = 'vacation' | 'sick';
type RequestStatus = 'pending' | 'approved' | 'rejected';

interface Request {
  id: string;
  type: RequestType;
  employeeName: string;
  dateRange: string;
  reason?: string;
  status: RequestStatus;
}

const mockRequests: Request[] = [
  { id: '1', type: 'vacation', employeeName: 'Thomas Müller', dateRange: '23.12. - 27.12.2024', reason: 'Weihnachtsurlaub', status: 'pending' },
  { id: '2', type: 'sick', employeeName: 'Sandra Klein', dateRange: '20.12.2024', status: 'pending' },
  { id: '3', type: 'vacation', employeeName: 'Peter Schmidt', dateRange: '02.01. - 05.01.2025', status: 'approved' },
  { id: '4', type: 'sick', employeeName: 'Anna Weber', dateRange: '18.12. - 19.12.2024', status: 'rejected' },
];

export default function RequestsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | RequestType>('all');
  const [requests, setRequests] = useState(mockRequests);

  const filterOptions = [
    { key: 'all', label: t('adminRequests.all') },
    { key: 'vacation', label: 'Urlaub' },
    { key: 'sick', label: 'Krank' },
  ];

  const filteredRequests = requests.filter((r) => filter === 'all' || r.type === filter);
  const pendingRequests = filteredRequests.filter((r) => r.status === 'pending');
  const processedRequests = filteredRequests.filter((r) => r.status !== 'pending');

  const handleApprove = (id: string) => {
    Alert.alert('Genehmigt', 'Der Antrag wurde genehmigt.');
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
  };

  const handleReject = (id: string) => {
    Alert.alert('Abgelehnt', 'Der Antrag wurde abgelehnt.');
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader overline="VERWALTUNG" title={t('adminRequests.title')} />

        <FilterTabs
          options={filterOptions}
          selected={filter}
          onSelect={(key) => setFilter(key as 'all' | RequestType)}
          style={styles.filterTabs}
        />

        {/* Pending */}
        {pendingRequests.length > 0 && (
          <>
            <Typography variant="overline" color="muted" style={styles.sectionTitle}>
              AUSSTEHEND ({pendingRequests.length})
            </Typography>
            {pendingRequests.map((r) => (
              <RequestCard
                key={r.id}
                type={r.type}
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
              BEARBEITET
            </Typography>
            {processedRequests.map((r) => (
              <RequestCard
                key={r.id}
                type={r.type}
                employeeName={r.employeeName}
                dateRange={r.dateRange}
                reason={r.reason}
                status={r.status}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
});