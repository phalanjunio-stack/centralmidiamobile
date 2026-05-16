// Menu lateral (bottom sheet) acessado pelo ⚙ na câmera
// Permite sair da câmera, acessar outras telas, desconectar
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Easing, Pressable, Image,
} from 'react-native';
import {
  Calendar, Images, Upload, User, LogOut, X,
  Zap, Cpu, Settings as SettingsIcon, Home,
} from 'lucide-react-native';

export default function CameraMenu({
  visible, onClose,
  event, profile, queueCount = 0,
  onChangeEvent, onOpenGallery, onOpenUploads, onOpenProfile, onDisconnect,
  onOpenHome,
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  const overlayOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.65],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]} />
      </Pressable>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handleBar} />

        {/* Header com perfil */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {profile?.photoUri
              ? <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
              : <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {(profile?.name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
            }
            <View style={styles.onlineDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile?.name || 'Sem perfil'}</Text>
            <View style={styles.eventBadge}>
              <View style={styles.eventDot} />
              <Text style={styles.eventName} numberOfLines={1}>
                {event?.name || 'Sem atividade ativa'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color="#94a3b8" strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* Fila */}
        {queueCount > 0 && (
          <View style={styles.queueBanner}>
            <Upload size={16} color="#4EA3FF" strokeWidth={2} />
            <Text style={styles.queueText}>{queueCount} arquivo{queueCount > 1 ? 's' : ''} na fila</Text>
          </View>
        )}

        {/* Ações */}
        <View style={styles.actions}>
          <MenuItem
            Icon={Home}
            iconBg="rgba(43,131,255,0.18)" iconColor="#4EA3FF"
            label="Tela inicial"
            sub="Ver agenda, uploads e estatísticas"
            onPress={() => { onClose(); setTimeout(() => onOpenHome?.(), 200); }}
          />
          <MenuItem
            Icon={Calendar}
            iconBg="rgba(59,130,246,0.15)" iconColor="#4EA3FF"
            label="Trocar atividade"
            sub={event?.name || 'Nenhum selecionado'}
            onPress={() => { onClose(); setTimeout(() => onChangeEvent?.(), 200); }}
          />
          <MenuItem
            Icon={Images}
            iconBg="rgba(13,139,154,0.15)" iconColor="#22D3EE"
            label="Galeria"
            sub="Ver fotos e vídeos enviados"
            onPress={() => { onClose(); setTimeout(() => onOpenGallery?.(), 200); }}
          />
          <MenuItem
            Icon={Upload}
            iconBg="rgba(245,158,11,0.15)" iconColor="#F59E0B"
            label="Fila de envio"
            sub="Status dos uploads"
            onPress={() => { onClose(); setTimeout(() => onOpenUploads?.(), 200); }}
          />
          <MenuItem
            Icon={User}
            iconBg="rgba(124,58,237,0.15)" iconColor="#A78BFA"
            label="Perfil"
            sub="Editar dados do videomaker"
            onPress={() => { onClose(); setTimeout(() => onOpenProfile?.(), 200); }}
          />
        </View>

        <View style={styles.divider} />

        <MenuItem
          Icon={LogOut}
          iconBg="rgba(239,68,68,0.15)" iconColor="#EF4444"
          label="Desconectar celular"
          sub="Sai do servidor (precisa parear de novo)"
          danger
          onPress={() => { onClose(); setTimeout(() => onDisconnect?.(), 200); }}
        />

        <View style={{ height: 32 }} />
      </Animated.View>
    </Modal>
  );
}

function MenuItem({ Icon, iconBg, iconColor, label, sub, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Icon size={20} color={iconColor} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: '#EF4444' }]}>{label}</Text>
        <Text style={styles.menuSub} numberOfLines={1}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#0a1428',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  handleBar: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 16,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingBottom: 16,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: '#2B83FF',
  },
  avatarPlaceholder: {
    backgroundColor: '#1e3a8a',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  onlineDot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2, borderColor: '#0a1428',
  },
  profileName: {
    color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold',
  },
  eventBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4,
  },
  eventDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  eventName: {
    color: '#94a3b8', fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  queueBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.30)',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    marginBottom: 16,
  },
  queueText: { color: '#4EA3FF', fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  actions: { gap: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12,
  },
  menuIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  menuSub:   { color: '#94a3b8', fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },

  divider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
});
