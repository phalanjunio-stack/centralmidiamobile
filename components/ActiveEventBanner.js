import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { getEventDay, getTotalEventDays } from '../services/storage';

// Banner mostrando o evento ativo (ou aviso se não tiver)
export default function ActiveEventBanner({ event, onChange }) {
  if (!event) {
    return (
      <TouchableOpacity style={[styles.banner, styles.bannerEmpty]} onPress={onChange} activeOpacity={0.85}>
        <View style={styles.dotEmpty} />
        <View style={{ flex: 1 }}>
          <Text style={styles.tagEmpty}>NENHUMA ATIVIDADE ATIVA</Text>
          <Text style={styles.eventNameEmpty}>Toque para escanear QR</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  if (event.expired) {
    return (
      <TouchableOpacity style={[styles.banner, styles.bannerExpired]} onPress={onChange} activeOpacity={0.85}>
        <View style={styles.dotExpired} />
        <View style={{ flex: 1 }}>
          <Text style={styles.tagExpired}>ATIVIDADE ENCERRADA</Text>
          <Text style={styles.eventName}>{event.name}</Text>
          <Text style={styles.eventInfo}>Toque para escolher outro</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  const day   = getEventDay(event);
  const total = getTotalEventDays(event);
  const range = formatDateRange(event.startDate, event.endDate);

  return (
    <TouchableOpacity style={styles.banner} onPress={onChange} activeOpacity={0.85}>
      <View style={styles.dot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.tag}>ATIVIDADE ATIVA</Text>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.eventInfo}>
          {day && total ? `Dia ${day} de ${total} · ` : ''}{range}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function formatDateRange(start, end) {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  if (!e || s.toDateString() === e.toDateString()) return fmt(s);
  return `${fmt(s)} - ${fmt(e)}`;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerEmpty: {
    borderColor: colors.warning,
    backgroundColor: colors.warningBg,
  },
  bannerExpired: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.active,
    shadowColor: colors.active, shadowOpacity: 0.6, shadowRadius: 4,
  },
  dotEmpty:   { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.warning },
  dotExpired: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error },

  tag: {
    fontSize: 10, color: colors.active,
    fontFamily: 'Inter_700Bold', letterSpacing: 0.8,
  },
  tagEmpty: {
    fontSize: 10, color: colors.warning,
    fontFamily: 'Inter_700Bold', letterSpacing: 0.8,
  },
  tagExpired: {
    fontSize: 10, color: colors.error,
    fontFamily: 'Inter_700Bold', letterSpacing: 0.8,
  },
  eventName: {
    fontSize: 16, color: colors.text, marginTop: 2,
    fontFamily: 'Inter_700Bold',
  },
  eventNameEmpty: {
    fontSize: 14, color: colors.text, marginTop: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  eventInfo: {
    fontSize: 12, color: colors.muted, marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  chevron: {
    fontSize: 26, color: colors.muted, fontFamily: 'Inter_400Regular',
  },
});
