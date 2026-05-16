// Pill de status do upload — "3 na fila / Enviando" (fiel ao SVG 08)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function UploadStatusPill({ queueCount = 0, status = 'idle' }) {
  // status: 'idle' | 'uploading' | 'sent' | 'error'

  const isIdle      = queueCount === 0 && status === 'idle';
  const isUploading = status === 'uploading' || queueCount > 0;
  const isSent      = status === 'sent';
  const isError     = status === 'error';

  const accentColor = isError ? '#FF7A82' : isSent ? '#4ADE80' : '#4EA3FF';
  const borderColor = isError ? 'rgba(239,68,68,0.35)' : isSent ? 'rgba(74,222,128,0.35)' : 'rgba(30,116,232,0.35)';

  const title = isUploading
    ? `${queueCount || 1} na fila`
    : isSent ? 'Tudo certo'
    : isError ? 'Erro'
    : 'Pronto';

  const subtitle = isUploading
    ? 'Enviando'
    : isSent ? 'Enviado'
    : isError ? 'Falhou'
    : 'Aguardando';

  return (
    <View style={[styles.wrap, { borderColor }]}>
      <View style={styles.iconWrap}>
        {/* Ícone de NUVEM com variação por estado */}
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          {isError ? (
            <>
              <Path
                d="M12 3l10 17H2L12 3z"
                stroke={accentColor} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" fill="none"
              />
              <Path
                d="M12 10v4M12 17h.01"
                stroke={accentColor} strokeWidth={2}
                strokeLinecap="round" fill="none"
              />
            </>
          ) : isSent ? (
            <>
              <Path
                d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
                stroke={accentColor} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" fill="none"
              />
              <Path
                d="M9 13l2 2 4-4"
                stroke={accentColor} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" fill="none"
              />
            </>
          ) : isUploading ? (
            <>
              <Path
                d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
                stroke={accentColor} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" fill="none"
              />
              <Path
                d="M12 18v-6M9 15l3-3 3 3"
                stroke={accentColor} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" fill="none"
              />
            </>
          ) : (
            <Path
              d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
              stroke={accentColor} strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" fill="none"
            />
          )}
        </Svg>
      </View>

      <View>
        <Text style={[styles.title, { color: accentColor }]} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(6,27,52,0.82)',
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iconWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.1,
  },
  subtitle: {
    color: '#B9C7DA', fontSize: 10, fontFamily: 'Inter_500Medium',
    marginTop: 1,
  },
});
