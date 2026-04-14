import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import Purchases from 'react-native-purchases';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: () => Promise<boolean>;
  onRestore: () => Promise<boolean>;
}

export function PaywallModal({ visible, onClose, onPurchase, onRestore }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [priceString, setPriceString] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    Purchases.getOfferings().then(offerings => {
      const pkg = offerings.current?.availablePackages[0];
      if (pkg) setPriceString(pkg.product.priceString);
    }).catch(() => {});
  }, [visible]);

  async function handlePurchase() {
    setLoading(true);
    const success = await onPurchase();
    setLoading(false);
    if (success) onClose();
  }

  async function handleRestore() {
    setLoading(true);
    const success = await onRestore();
    setLoading(false);
    if (success) onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>Unlock the Full Tree</Text>
          <Text style={styles.subtitle}>PATRIA Premium</Text>

          {/* Features */}
          <View style={styles.featureList}>
            {FEATURES.map(f => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* CTA */}
          {loading ? (
            <ActivityIndicator color="#c8a85a" size="large" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <TouchableOpacity style={styles.purchaseBtn} onPress={handlePurchase} activeOpacity={0.85}>
                <Text style={styles.purchaseBtnText}>Unlock Full Tree</Text>
                {priceString && (
                  <Text style={styles.purchaseBtnPrice}>{priceString} · One-Time Purchase</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
                <Text style={styles.restoreBtnText}>Restore Previous Purchase</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={onClose} style={styles.closeRow} activeOpacity={0.6}>
            <Text style={styles.closeText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const FEATURES = [
  'Complete biblical family tree — 3,000+ figures',
  'Full ancestry from Abraham through the New Testament',
  'Detailed biographies, names & titles',
  'Hebrew & Greek name meanings',
  'Scripture verse lookup',
  'Powerful search across all figures',
];

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,10,5,0.82)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#faf6ee',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 16,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#c8a85a',
  },

  crown:    { fontSize: 40, marginBottom: 8 },
  title:    { color: '#2a1208', fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },
  subtitle: { color: '#8B6914', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginTop: 4, marginBottom: 20 },

  featureList: { alignSelf: 'stretch', gap: 10, marginBottom: 20 },
  featureRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureCheck:{ color: '#8B6914', fontSize: 15, fontWeight: '700', marginTop: 1 },
  featureText: { color: '#3a2010', fontSize: 14, flex: 1, lineHeight: 20 },

  divider: { height: 1, backgroundColor: 'rgba(139,94,60,0.2)', alignSelf: 'stretch', marginBottom: 20 },

  purchaseBtn: {
    backgroundColor: '#c8a85a',
    borderRadius: 12,
    paddingVertical: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseBtnText:  { color: '#2a1208', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  purchaseBtnPrice: { color: '#2a1208', fontSize: 12, fontWeight: '600', opacity: 0.7, marginTop: 2 },

  restoreBtn:     { paddingVertical: 8, alignSelf: 'stretch', alignItems: 'center' },
  restoreBtnText: { color: '#8B5E3C', fontSize: 13, fontWeight: '600' },

  closeRow:  { marginTop: 12, paddingVertical: 8 },
  closeText: { color: '#9a7a5a', fontSize: 13 },
});
