// app/(public)/contact.tsx

import React from 'react';
import { ScrollView, View, TouchableOpacity, Linking, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Phone, MapPin, Clock, Send } from 'lucide-react-native';

import { Typography, Button, Input } from '@/src/components/atoms';
import { Card } from '@/src/components/molecules';
import { FeatureCard } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/spacing';
import { activeBrand } from '@/src/config';

export default function ContactScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const contactItems = [
    {
      icon: Phone,
      title: 'Telefon',
      description: activeBrand.contact.phone,
      onPress: () => Linking.openURL(`tel:${activeBrand.contact.phone}`),
    },
    {
      icon: Mail,
      title: 'E-Mail',
      description: activeBrand.contact.email,
      onPress: () => Linking.openURL(`mailto:${activeBrand.contact.email}`),
    },
    {
      icon: MapPin,
      title: 'Adresse',
      description: activeBrand.contact.address,
    },
    {
      icon: Clock,
      title: 'Öffnungszeiten',
      description: 'Mo-Fr: 08:00 - 17:00 Uhr',
    },
  ];

  const handleSubmit = () => {
    Alert.alert('Info', 'Kontaktformular wird in einer zukünftigen Version verfügbar sein.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Nav */}
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Typography variant="label">Kontakt</Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Contact Info */}
        {contactItems.map((item, index) => (
          <FeatureCard
            key={index}
            icon={item.icon}
            title={item.title}
            description={item.description}
            onPress={item.onPress}
          />
        ))}

        {/* Contact Form */}
        <Typography variant="overline" color="muted" style={styles.sectionTitle}>
          NACHRICHT SENDEN
        </Typography>

        <Card style={styles.formCard}>
          <Input placeholder="Ihr Name" containerStyle={styles.inputSpacing} />
          <Input placeholder="E-Mail Adresse" keyboardType="email-address" containerStyle={styles.inputSpacing} />
          <Input placeholder="Ihre Nachricht..." multiline numberOfLines={4} containerStyle={styles.inputSpacing} />
          <Button title="Nachricht senden" icon={Send} onPress={handleSubmit} fullWidth />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  formCard: {
    padding: spacing.lg,
  },
  inputSpacing: {
    marginBottom: spacing.md,
  },
});