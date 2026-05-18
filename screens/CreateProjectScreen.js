// Tela "Criar pasta rápida" — mockup oficial
// Permite criar uma nova pasta no Drive com tipo definido (Treinamento/Visita/Demanda/Conteúdo)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Switch, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme';
import { IC } from '../src/theme/icons';
import { setActiveEvent } from '../services/storage';

const PROJECT_TYPES = [
  { id: 'treinamento',  label: 'Treinamento',    icon: IC.treinamento },
  { id: 'visita',       label: 'Visita',         icon: IC.visita },
  { id: 'demanda',      label: 'Demanda',        icon: IC.demanda },
  { id: 'interno',      label: 'Conteúdo interno', icon: IC.conteudoInterno },
];

const EQUIPMENT_OPTIONS = [
  'UNYQUE PRO',
  'XERF',
  'HIPRO',
  'SUPREME',
  'BODY ON TOP',
  'Outro',
];

export default function CreateProjectScreen({ navigation }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('treinamento');
  const [equipment, setEquipment] = useState('UNYQUE PRO');
  const [showEquipDropdown, setShowEquipDropdown] = useState(false);
  const [setActive, setSetActive] = useState(true);

  function buildDestination() {
    const typeFolder = {
      treinamento: 'Treinamentos',
      visita:      'Visitas',
      demanda:     'Demandas',
      interno:     'Conteúdo Interno',
    }[type] || 'Diversos';
    return `/${typeFolder}/${equipment}`;
  }

  async function handleCreate(activate) {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Dê um nome pra pasta.');
      return;
    }
    const project = {
      id: `proj_${Date.now()}`,
      name: name.trim(),
      type,
      equipment,
      folder: buildDestination(),
      createdAt: new Date().toISOString(),
    };
    try {
      if (activate) {
        await setActiveEvent({
          id: project.id,
          name: project.name,
          folder: project.folder,
          type: project.type,
          equipment: project.equipment,
          startDate: project.createdAt,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', e?.message || 'Falha ao criar pasta');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Image source={IC.fechar} style={styles.closeIcon} />
          </TouchableOpacity>
          <Text style={styles.title}>Criar pasta rápida</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Nome */}
          <View style={styles.field}>
            <Text style={styles.label}>Nome da pasta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Treinamento UNYQUE PRO"
              placeholderTextColor={colors.faint || '#5A7090'}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          {/* Tipo */}
          <View style={styles.field}>
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.typeGrid}>
              {PROJECT_TYPES.map((t) => {
                const active = type === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeCard, active && styles.typeCardActive]}
                    onPress={() => setType(t.id)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={t.icon}
                      style={[
                        styles.typeIcon,
                        { tintColor: active ? colors.brand : '#B8C3D1' },
                      ]}
                    />
                    <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Equipamento */}
          <View style={styles.field}>
            <Text style={styles.label}>Equipamento relacionado (opcional)</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowEquipDropdown(v => !v)}
              activeOpacity={0.85}
            >
              <Text style={styles.dropdownValue}>{equipment}</Text>
              <Image
                source={IC.chevronBaixo}
                style={[
                  styles.dropdownChev,
                  showEquipDropdown && { transform: [{ rotate: '180deg' }] },
                ]}
              />
            </TouchableOpacity>
            {showEquipDropdown && (
              <View style={styles.dropdownList}>
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.dropdownItem,
                      equipment === opt && { backgroundColor: 'rgba(31,139,255,0.08)' },
                    ]}
                    onPress={() => {
                      setEquipment(opt);
                      setShowEquipDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      equipment === opt && { color: colors.brand },
                    ]}>{opt}</Text>
                    {equipment === opt && (
                      <Image source={IC.check} style={{ width: 16, height: 16, tintColor: colors.brand }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Destino no Drive */}
          <View style={styles.field}>
            <Text style={styles.label}>Destino no Drive</Text>
            <View style={styles.driveBox}>
              <Image source={IC.drive} style={styles.driveIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.driveTitle}>Drive Contourline</Text>
                <Text style={styles.drivePath} numberOfLines={1}>{buildDestination()}</Text>
              </View>
              <Image source={IC.chevronDir} style={styles.driveChev} />
            </View>
          </View>

          {/* Ativar como projeto */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>Definir como projeto ativo</Text>
            <Switch
              value={setActive}
              onValueChange={setSetActive}
              trackColor={{ false: '#1e293b', true: colors.brand }}
              thumbColor="#fff"
            />
          </View>

          {/* Ações */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => handleCreate(setActive)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {setActive ? 'Criar e ativar' : 'Criar pasta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => handleCreate(false)}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Criar apenas</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { width: 14, height: 14, tintColor: '#fff', resizeMode: 'contain' },
  title: { color: '#fff', fontSize: 17, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.3 },

  content: { padding: 16, gap: 18, paddingBottom: 48 },

  field: { gap: 8 },
  label: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  input: {
    backgroundColor: 'rgba(8,14,26,0.85)',
    borderWidth: 1, borderColor: 'rgba(31,139,255,0.20)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold',
  },

  /* TYPE GRID */
  typeGrid: { flexDirection: 'row', gap: 8 },
  typeCard: {
    flex: 1,
    backgroundColor: 'rgba(8,14,26,0.85)',
    borderWidth: 1, borderColor: 'rgba(31,139,255,0.20)',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 6,
    alignItems: 'center', gap: 6,
  },
  typeCardActive: {
    borderColor: colors.brand,
    backgroundColor: 'rgba(31,139,255,0.10)',
  },
  typeIcon: { width: 24, height: 24, resizeMode: 'contain' },
  typeLabel: { color: '#B8C3D1', fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  typeLabelActive: { color: '#fff' },

  /* DROPDOWN */
  dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(8,14,26,0.85)',
    borderWidth: 1, borderColor: 'rgba(31,139,255,0.20)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  dropdownValue: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  dropdownChev: { width: 14, height: 14, tintColor: '#B8C3D1', resizeMode: 'contain' },
  dropdownList: {
    backgroundColor: 'rgba(8,14,26,0.95)',
    borderWidth: 1, borderColor: 'rgba(31,139,255,0.20)',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dropdownItemText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_500Medium' },

  /* DRIVE BOX */
  driveBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(8,14,26,0.85)',
    borderWidth: 1, borderColor: 'rgba(31,139,255,0.20)',
    borderRadius: 14, padding: 12,
  },
  driveIcon: { width: 32, height: 32, resizeMode: 'contain' },
  driveTitle: { color: '#fff', fontSize: 13.5, fontFamily: 'Inter_700Bold' },
  drivePath: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5, fontFamily: 'Inter_500Medium', marginTop: 2 },
  driveChev: { width: 14, height: 14, tintColor: '#B8C3D1', resizeMode: 'contain' },

  /* TOGGLE */
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(8,14,26,0.85)',
    borderWidth: 1, borderColor: 'rgba(31,139,255,0.20)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
  },
  toggleText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  /* BUTTONS */
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_800ExtraBold' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 12 },
  secondaryBtnText: { color: colors.brand, fontSize: 14, fontFamily: 'Inter_700Bold' },
});
