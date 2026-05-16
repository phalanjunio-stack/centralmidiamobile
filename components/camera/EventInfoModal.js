// Modal de informações do evento ativo — aberto pelo logo Contourline
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Image, ScrollView,
} from 'react-native';
import { X, Calendar, MapPin, Tag, User, FolderOpen } from 'lucide-react-native';

export default function EventInfoModal({ visible, event, onClose, onChange }) {
  if (!event) return null;

  const dayNum = calcDay(event);
  const totalDays = calcTotalDays(event);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.tag}>ATIVIDADE ATIVA</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.eventName}>{event.name || 'Sem nome'}</Text>

            {dayNum && totalDays && (
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>Dia {dayNum} de {totalDays}</Text>
              </View>
            )}

            <View style={styles.infoList}>
              {(event.startDate || event.endDate) && (
                <InfoRow Icon={Calendar} label="Datas" value={formatRange(event.startDate, event.endDate)} />
              )}
              {event.location && (
                <InfoRow Icon={MapPin} label="Local" value={event.location} />
              )}
              {event.type && (
                <InfoRow Icon={Tag} label="Tipo" value={event.type} />
              )}
              {event.owner && (
                <InfoRow Icon={User} label="Responsável" value={event.owner} />
              )}
              {event.folder && (
                <InfoRow Icon={FolderOpen} label="Pasta no servidor" value={event.folder} mono />
              )}
            </View>

            {/* Botão trocar evento */}
            <TouchableOpacity style={styles.changeBtn} onPress={() => { onClose(); setTimeout(() => onChange?.(), 250); }}>
              <Text style={styles.changeBtnText}>Trocar atividade ativa</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function InfoRow({ Icon, label, value, mono = false }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon size={16} color="#4EA3FF" strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, mono && styles.mono]} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

function formatRange(start, end) {
  if (!start) return '—';
  const fmt = (d) => {
    const dd = new Date(d);
    return `${String(dd.getDate()).padStart(2, '0')}/${String(dd.getMonth() + 1).padStart(2, '0')}/${dd.getFullYear()}`;
  };
  if (!end || start === end) return fmt(start);
  return `${fmt(start)} → ${fmt(end)}`;
}

function calcDay(event) {
  if (!event?.startDate) return null;
  const start = new Date(event.startDate); start.setHours(0,0,0,0);
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : null;
}

function calcTotalDays(event) {
  if (!event?.startDate || !event?.endDate) return null;
  const s = new Date(event.startDate);
  const e = new Date(event.endDate);
  return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#081424',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32,
    maxHeight: '85%',
    borderTopWidth: 1, borderTopColor: 'rgba(43,131,255,0.30)',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 16, marginBottom: 8,
  },
  tag: {
    color: '#10b981', fontSize: 11, letterSpacing: 0.8,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  content: {},
  eventName: {
    color: '#fff', fontSize: 24, fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.5, lineHeight: 30,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(43,131,255,0.12)',
    borderColor: 'rgba(43,131,255,0.45)', borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
    marginTop: 8,
  },
  dayBadgeText: { color: '#4EA3FF', fontSize: 12, fontFamily: 'Inter_700Bold' },

  infoList: { gap: 12, marginTop: 20 },
  row: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  rowIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(43,131,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { color: '#94a3b8', fontSize: 11, fontFamily: 'Inter_500Medium' },
  rowValue: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  mono: { fontFamily: 'Inter_400Regular', fontSize: 12 },

  changeBtn: {
    backgroundColor: 'rgba(43,131,255,0.12)',
    borderColor: 'rgba(43,131,255,0.55)', borderWidth: 1,
    paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', marginTop: 20,
  },
  changeBtnText: { color: '#4EA3FF', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
