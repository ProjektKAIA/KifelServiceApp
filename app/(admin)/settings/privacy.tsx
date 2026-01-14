// app/(admin)/settings/privacy.tsx - Datenschutz & Sicherheit

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, MapPin, Clock, Database, Lock, Eye, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, borderRadius } from '@/src/theme/spacing';

const LAST_UPDATED = '14. Januar 2026';
const COMPANY_NAME = 'Kifel Service GmbH';
const COMPANY_ADDRESS = 'Musterstraße 1, 12345 Musterstadt';
const DATA_PROTECTION_OFFICER = 'info@kaiashapes.de';

export default function PrivacyScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const sections = [
    {
      icon: Database,
      title: '1. Verantwortlicher',
      content: `Verantwortlich für die Datenverarbeitung im Sinne der DSGVO:

${COMPANY_NAME}
${COMPANY_ADDRESS}

Datenschutzanfragen: ${DATA_PROTECTION_OFFICER}`,
    },
    {
      icon: Eye,
      title: '2. Welche Daten werden erfasst?',
      content: `Im Rahmen der Zeiterfassung werden folgende Daten erhoben:

• Persönliche Daten: Name, E-Mail-Adresse, Mitarbeiter-ID
• Zeiterfassungsdaten: Arbeitsbeginn, Arbeitsende, Pausenzeiten
• Standortdaten: GPS-Koordinaten beim Ein-/Ausstempeln (nur bei aktiver App-Nutzung)
• Gerätedaten: Gerätetyp, Betriebssystem (für technische Funktionalität)

Es werden KEINE Daten erfasst, wenn die App geschlossen oder im Hintergrund ist.`,
    },
    {
      icon: MapPin,
      title: '3. Standorterfassung (GPS)',
      content: `Die Standorterfassung dient ausschließlich der Dokumentation des Arbeitsortes gemäß § 17 MiLoG und betrieblicher Vereinbarungen.

Wichtige Hinweise:
• GPS ist NUR aktiv während Sie die App nutzen
• Kein Tracking im Hintergrund oder bei geschlossener App
• Standort wird nur beim Ein-/Ausstempeln erfasst
• Sie können die Standorterfassung jederzeit ablehnen
• Ohne Standortfreigabe ist Zeiterfassung weiterhin möglich

Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Arbeitsvertrags) sowie berechtigtes Interesse des Arbeitgebers (Art. 6 Abs. 1 lit. f DSGVO).`,
    },
    {
      icon: Clock,
      title: '4. Zweck der Datenverarbeitung',
      content: `Ihre Daten werden ausschließlich für folgende Zwecke verarbeitet:

• Erfassung und Dokumentation der Arbeitszeiten
• Einhaltung gesetzlicher Aufzeichnungspflichten (§ 16 Abs. 2 ArbZG)
• Lohn- und Gehaltsabrechnung
• Nachweis der Einhaltung des Mindestlohngesetzes (MiLoG)
• Urlaubsverwaltung und Abwesenheitsplanung

Eine Weitergabe an Dritte erfolgt nicht, außer zur Lohnabrechnung an beauftragte Dienstleister (unter Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO).`,
    },
    {
      icon: Lock,
      title: '5. Datensicherheit',
      content: `Wir setzen technische und organisatorische Maßnahmen zum Schutz Ihrer Daten ein:

• Verschlüsselte Datenübertragung (TLS 1.3)
• Verschlüsselte Datenspeicherung (AES-256)
• Zugangskontrolle durch persönliche Anmeldedaten
• Regelmäßige Sicherheitsupdates
• Hosting in deutschen/EU-Rechenzentren (DSGVO-konform)
• Keine Weitergabe an Drittländer außerhalb der EU`,
    },
    {
      icon: Trash2,
      title: '6. Speicherdauer & Löschung',
      content: `Ihre Daten werden nur so lange gespeichert, wie gesetzlich erforderlich:

• Zeiterfassungsdaten: 2 Jahre (gemäß § 16 Abs. 2 ArbZG)
• Lohnabrechnungsrelevante Daten: 6 Jahre (steuerliche Aufbewahrungspflicht)
• Standortdaten: Maximal 2 Jahre

Nach Ablauf der Fristen werden die Daten automatisch gelöscht.

Bei Beendigung des Arbeitsverhältnisses werden nicht mehr benötigte Daten unverzüglich, spätestens nach Ablauf gesetzlicher Fristen, gelöscht.`,
    },
    {
      icon: Shield,
      title: '7. Ihre Rechte (DSGVO)',
      content: `Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:

• Auskunftsrecht (Art. 15 DSGVO): Welche Daten sind gespeichert?
• Berichtigungsrecht (Art. 16 DSGVO): Korrektur falscher Daten
• Löschungsrecht (Art. 17 DSGVO): Löschung unter bestimmten Voraussetzungen
• Einschränkung (Art. 18 DSGVO): Einschränkung der Verarbeitung
• Datenübertragbarkeit (Art. 20 DSGVO): Export Ihrer Daten
• Widerspruchsrecht (Art. 21 DSGVO): Widerspruch gegen Verarbeitung
• Beschwerderecht: Bei der zuständigen Aufsichtsbehörde

Zur Ausübung Ihrer Rechte wenden Sie sich an: ${DATA_PROTECTION_OFFICER}`,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerSmall, { color: theme.textMuted }]}>Rechtliches</Text>
            <Text style={[styles.headerLarge, { color: theme.text }]}>Datenschutz & Sicherheit</Text>
          </View>
        </View>

        {/* Last Updated */}
        <View style={[styles.updateBadge, { backgroundColor: theme.pillInfo, borderColor: theme.primary }]}>
          <Text style={[styles.updateText, { color: theme.text }]}>
            Stand: {LAST_UPDATED}
          </Text>
        </View>

        {/* Intro */}
        <Text style={[styles.introText, { color: theme.textSecondary }]}>
          Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Diese Datenschutzerklärung informiert Sie über die Verarbeitung Ihrer Daten in der Kifel Service App gemäß der Datenschutz-Grundverordnung (DSGVO) und dem Bundesdatenschutzgesetz (BDSG).
        </Text>

        {/* Sections */}
        {sections.map((section, index) => (
          <View
            key={index}
            style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: theme.pillInfo }]}>
                <section.icon size={20} color={theme.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            </View>
            <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
              {section.content}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            Bei Fragen zum Datenschutz wenden Sie sich bitte an:{'\n'}
            {DATA_PROTECTION_OFFICER}
          </Text>
          <Text style={[styles.footerVersion, { color: theme.textMuted }]}>
            Version 1.0 | Gültig ab {LAST_UPDATED}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerSmall: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerLarge: {
    fontSize: 22,
    fontWeight: '700',
  },
  updateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  updateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  section: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.md,
    flex: 1,
  },
  sectionContent: {
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  footerVersion: {
    fontSize: 11,
  },
});
