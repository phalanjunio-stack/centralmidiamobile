// Bottom sheet de configurações da câmera.
// Centraliza tudo que não cabe na tela principal.
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Pressable } from 'react-native';
import { X, Video, Maximize2, Focus, Cloud, Wifi, Trash2, LogOut, Image as ImageIcon } from 'lucide-react-native';
import { colors } from '../../src/theme';

export default function CameraSettingsSheet({
  visible,
  onClose,
  // Toggles
  autoUpload, onToggleAutoUpload,
  wifiOnly, onToggleWifiOnly,
  saveOriginal, onToggleSaveOriginal,
  gridEnabled, onToggleGrid,
  // Info display (não editável em Expo Go)
  quality = '2160p (4K)',
  aspectRatio = '16:9',
  focusMode = 'Automático',
  // Actions
  onClearQueue,
  onDisconnect,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Configurações da câmera</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <X size={22} color={colors.text.secondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
          <Section title="Gravação">
            <InfoRow Icon={Video}      label="Qualidade"     value={quality} hint="Em desenvolvimento dev build" />
            <InfoRow Icon={Maximize2}  label="Proporção"     value={aspectRatio} hint="Em desenvolvimento dev build" />
            <InfoRow Icon={Focus}      label="Modo de foco"  value={focusMode} hint="Foco no toque já ativo" />
          </Section>

          <Section title="Envio">
            <ToggleRow Icon={Cloud} label="Envio automático" sub="Envia em segundo plano após capturar"
                      value={autoUpload} onValueChange={onToggleAutoUpload} />
            <ToggleRow Icon={Wifi} label="Apenas Wi-Fi" sub="Não enviar usando dados móveis"
                      value={wifiOnly} onValueChange={onToggleWifiOnly} />
            <ToggleRow Icon={ImageIcon} label="Salvar original" sub="Manter cópia no celular"
                      value={saveOriginal} onValueChange={onToggleSaveOriginal} />
          </Section>

          <Section title="Interface">
            <ToggleRow Icon={Maximize2} label="Grade na tela" sub="Linhas de 3x3 para enquadrar"
                      value={gridEnabled} onValueChange={onToggleGrid} />
          </Section>

          <Section title="Manutenção">
            <ActionRow Icon={Trash2} label="Limpar fila de envio" onPress={onClearQueue} color={colors.state.warning} />
            <ActionRow Icon={LogOut} label="Desconectar dispositivo" onPress={onDisconnect} color={colors.state.error} />
          </Section>

          <View style={{ height: 16 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function InfoRow({ Icon, label, value, hint }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}><Icon size={16} color={colors.aura.primaryBright} strokeWidth={2} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ToggleRow({ Icon, label, sub, value, onValueChange }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}><Icon size={16} color={colors.aura.primaryBright} strokeWidth={2} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowHint}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.aura.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

function ActionRow({ Icon, label, onPress, color }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
        <Icon size={16} color={color} strokeWidth={2} />
      </View>
      <Text style={[styles.rowLabel, { color, flex: 1 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, marginBottom: 8,
  },
  title: { color: colors.text.primary, fontSize: 17, fontFamily: 'Inter_800ExtraBold' },

  section: { marginBottom: 18 },
  sectionTitle: {
    color: colors.text.muted, fontSize: 10, fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4,
  },
  sectionBody: {
    backgroundColor: colors.bg.glass, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border.glass,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border.glass,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(31,139,255,0.10)', borderWidth: 1, borderColor: 'rgba(31,139,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { color: colors.text.primary, fontSize: 13, fontFamily: 'Inter_700Bold' },
  rowHint:  { color: colors.text.muted, fontSize: 10.5, fontFamily: 'Inter_500Medium', marginTop: 2 },
  rowValue: { color: colors.aura.primaryBright, fontSize: 12, fontFamily: 'Inter_700Bold' },
});
