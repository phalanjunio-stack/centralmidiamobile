import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

// Modal de ações rápidas (aberto pelo botão central +)
export default function QuickActionsScreen({ navigation }) {

  function close() { navigation.goBack(); }

  const items = [
    { icon: '📷',  label: 'Tirar foto',     desc: 'Abre a câmera e envia direto pra atividade ativa', color: colors.camera },
    { icon: '🎬',  label: 'Gravar vídeo',   desc: 'Vídeo vai pra pasta correta automaticamente',     color: colors.video },
    { icon: '🖼️',  label: 'Escolher da galeria', desc: 'Selecione fotos antigas pra enviar agora', color: colors.gallery },
    { icon: '📄',  label: 'Enviar documento', desc: 'PDF ou arquivo qualquer',                       color: colors.docs },
    { icon: '⬛',  label: 'Escanear QR',     desc: 'Trocar atividade ativa ou conectar servidor',     color: colors.brand },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Drag handle */}
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ações rápidas</Text>
        <TouchableOpacity onPress={close}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.item}
            activeOpacity={0.85}
            onPress={() => {
              if (item.label === 'Escanear QR') {
                close();
                setTimeout(() => navigation.navigate('QRScanner', { mode: 'event' }), 150);
                return;
              }
              // Outros items ainda não implementados na v1
              close();
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color }]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.footnote}>
          📤 Auto-sync continua rodando em background mesmo sem você fazer nada aqui.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgElevated },

  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginTop: 8,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  title: { color: colors.text, fontSize: 20, fontFamily: 'Inter_800ExtraBold' },
  closeBtn: { color: colors.muted, fontSize: 22, padding: 4 },

  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  itemLabel: { color: colors.text, fontSize: 15, fontFamily: 'Inter_700Bold' },
  itemDesc:  { color: colors.muted, fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },
  chevron: { color: colors.muted, fontSize: 22 },

  footnote: {
    color: colors.faint, fontSize: 12, textAlign: 'center', lineHeight: 18,
    marginTop: 12, fontFamily: 'Inter_400Regular',
  },
});
