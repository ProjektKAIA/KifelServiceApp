// app/(admin)/settings/workinghours.tsx - Arbeitszeit-Regeln

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Scale,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Gavel,
  Building2,
  Users,
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { spacing, borderRadius } from '@/src/theme/spacing';

const LAST_UPDATED = '14. Januar 2026';

export default function WorkingHoursScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const legalSources = [
    {
      title: 'EuGH-Urteil (Stechuhr-Urteil)',
      date: '14. Mai 2019',
      reference: 'Rs. C-55/18 (CCOO)',
      url: 'https://curia.europa.eu/juris/liste.jsf?num=C-55/18',
    },
    {
      title: 'BAG-Beschluss',
      date: '13. September 2022',
      reference: 'Az. 1 ABR 22/21',
      url: 'https://www.bundesarbeitsgericht.de/entscheidung/1-abr-22-21/',
    },
    {
      title: 'BMAS FAQ Arbeitszeiterfassung',
      date: 'Aktuell',
      reference: 'Bundesministerium für Arbeit und Soziales',
      url: 'https://www.bmas.de/DE/Arbeit/Arbeitsrecht/Arbeitnehmerrechte/Arbeitszeitschutz/Fragen-und-Antworten/faq-arbeitszeiterfassung.html',
    },
  ];

  const sections = [
    {
      icon: Gavel,
      title: 'Rechtliche Grundlage',
      content: `Das Bundesarbeitsgericht (BAG) hat am 13. September 2022 entschieden, dass Arbeitgeber in Deutschland verpflichtet sind, die gesamte Arbeitszeit ihrer Arbeitnehmer zu erfassen.

Diese Pflicht ergibt sich aus:
• § 3 Abs. 2 Nr. 1 Arbeitsschutzgesetz (ArbSchG)
• Europarechtskonformer Auslegung des EuGH-Urteils vom 14.05.2019

Die Erfassungspflicht gilt bereits jetzt – unabhängig von einer ausstehenden Gesetzesreform.`,
    },
    {
      icon: Scale,
      title: 'EuGH-Stechuhr-Urteil (2019)',
      content: `Der Europäische Gerichtshof entschied am 14. Mai 2019 (Rs. C-55/18), dass die EU-Mitgliedstaaten Arbeitgeber verpflichten müssen, ein System zur Erfassung der täglichen Arbeitszeit einzurichten.

Anforderungen an das System:
• Objektiv – nachprüfbare Dokumentation
• Verlässlich – manipulationssicher
• Zugänglich – für Arbeitnehmer und Behörden

Ziel: Schutz der Arbeitnehmerrechte und Einhaltung der EU-Arbeitszeitrichtlinie (2003/88/EG).`,
    },
    {
      icon: FileText,
      title: 'Was muss erfasst werden?',
      content: `Laut BAG und BMAS müssen folgende Zeiten dokumentiert werden:

• Beginn der täglichen Arbeitszeit
• Ende der täglichen Arbeitszeit
• Dauer der täglichen Arbeitszeit
• Überstunden über 8 Stunden hinaus (§ 16 Abs. 2 ArbZG)

Die Erfassung muss für jeden Arbeitnehmer individuell erfolgen.

Hinweis: Pausenzeiten sollten zur Nachweisführung ebenfalls dokumentiert werden.`,
    },
    {
      icon: Clock,
      title: 'Arbeitszeitgrenzen (ArbZG)',
      content: `Das Arbeitszeitgesetz definiert folgende Grenzen:

Tägliche Arbeitszeit:
• Maximal 8 Stunden werktäglich
• Verlängerung auf 10 Stunden möglich, wenn innerhalb von 6 Monaten/24 Wochen im Durchschnitt 8 Stunden nicht überschritten werden

Ruhepausen (§ 4 ArbZG):
• Ab 6 Stunden: mind. 30 Minuten Pause
• Ab 9 Stunden: mind. 45 Minuten Pause

Ruhezeit (§ 5 ArbZG):
• Mind. 11 Stunden ununterbrochene Ruhezeit zwischen Arbeitsenden

Sonn- und Feiertage (§ 9 ArbZG):
• Grundsätzlich Beschäftigungsverbot (Ausnahmen geregelt)`,
    },
    {
      icon: Building2,
      title: 'Pflichten des Arbeitgebers',
      content: `Der Arbeitgeber ist verantwortlich für:

1. Systemeinführung
Ein System zur Arbeitszeiterfassung muss bereitgestellt werden – digital oder analog.

2. Dokumentation
Die erfassten Zeiten müssen 2 Jahre aufbewahrt werden (§ 16 Abs. 2 ArbZG).

3. Kontrolle
Der Arbeitgeber muss die Einhaltung der Arbeitszeitvorschriften überwachen.

4. Delegation möglich
Die Erfassung kann an Arbeitnehmer delegiert werden, die Verantwortung bleibt beim Arbeitgeber.`,
    },
    {
      icon: Users,
      title: 'Übergangsfristen (geplant)',
      content: `Der Koalitionsvertrag 2025 sieht gestaffelte Übergangsfristen für die elektronische Zeiterfassung vor:

• Alle Unternehmen: 1 Jahr nach Inkrafttreten
• Unter 250 Beschäftigte: 2 Jahre
• Unter 50 Beschäftigte: 5 Jahre
• Unter 10 Beschäftigte: Ausnahme von elektronischer Pflicht

Bis zur Gesetzesreform gilt: Jede Form der Erfassung (auch handschriftlich) ist zulässig.`,
    },
    {
      icon: AlertTriangle,
      title: 'Sanktionen & Bußgelder',
      content: `Aktuelle Rechtslage:

Keine direkten Bußgelder für fehlende Zeiterfassung – die BAG-Entscheidung sieht derzeit keine Sanktionen vor.

Aber: Bußgelder möglich bei:
• Verstoß gegen Höchstarbeitszeiten (bis 30.000 €)
• Verstoß gegen Aufzeichnungspflicht bei Überstunden (§ 16 Abs. 2 ArbZG)
• Missachtung behördlicher Anordnungen

Mit der geplanten Gesetzesreform werden konkrete Sanktionen erwartet.`,
    },
    {
      icon: CheckCircle,
      title: 'Vertrauensarbeitszeit',
      content: `Vertrauensarbeitszeit bleibt möglich!

Das BAG hat klargestellt, dass Vertrauensarbeitszeit weiterhin zulässig ist – die Arbeitszeit muss dennoch erfasst werden.

Voraussetzungen:
• Einhaltung der Höchstarbeitszeiten
• Einhaltung der Ruhezeiten (11 Stunden)
• Dokumentation von Beginn, Ende und Dauer

Die Erfassung kann durch den Arbeitnehmer selbst erfolgen.`,
    },
  ];

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerSmall, { color: theme.textMuted }]}>{t('settingsHours.legal')}</Text>
            <Text style={[styles.headerLarge, { color: theme.text }]}>{t('settingsHours.title')}</Text>
          </View>
        </View>

        {/* Last Updated */}
        <View style={[styles.updateBadge, { backgroundColor: theme.pillInfo, borderColor: theme.primary }]}>
          <Text style={[styles.updateText, { color: theme.text }]}>
            {t('settingsHours.asOf')}: {LAST_UPDATED}
          </Text>
        </View>

        {/* Intro */}
        <Text style={[styles.introText, { color: theme.textSecondary }]}>
          Diese Übersicht fasst die aktuellen gesetzlichen Regelungen zur Arbeitszeiterfassung in Deutschland zusammen, basierend auf dem EuGH-Urteil, dem BAG-Beschluss und dem Arbeitszeitgesetz (ArbZG).
        </Text>

        {/* Legal Sources */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>RECHTSQUELLEN</Text>
        <View style={[styles.sourcesCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          {legalSources.map((source, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.sourceItem,
                index < legalSources.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
              ]}
              onPress={() => openLink(source.url)}
              activeOpacity={0.7}
            >
              <View style={styles.sourceInfo}>
                <Text style={[styles.sourceTitle, { color: theme.text }]}>{source.title}</Text>
                <Text style={[styles.sourceRef, { color: theme.textMuted }]}>
                  {source.reference} • {source.date}
                </Text>
              </View>
              <ExternalLink size={18} color={theme.primary} />
            </TouchableOpacity>
          ))}
        </View>

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

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: theme.pillWarning, borderColor: theme.warning }]}>
          <AlertTriangle size={18} color={theme.warning} />
          <Text style={[styles.disclaimerText, { color: theme.text }]}>
            Hinweis: Diese Zusammenfassung dient der Information und ersetzt keine Rechtsberatung. Bei konkreten arbeitsrechtlichen Fragen wenden Sie sich bitte an einen Fachanwalt.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            Quellen: Bundesarbeitsgericht, BMAS, EUR-Lex{'\n'}
            Letzte Aktualisierung: {LAST_UPDATED}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sourcesCard: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sourceRef: {
    fontSize: 12,
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
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
