import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ADMOB_CONFIG } from '../config/ads';

interface GoogleAdBannerProps {
  placement?: 'home' | 'results' | 'catalog' | 'modal';
  style?: any;
}

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = ({ placement = 'home', style }) => {
  if (!ADMOB_CONFIG.enabled) return null;

  return (
    <View style={[styles.adContainer, style]}>
      {/* Top Banner Tag */}
      <View style={styles.adHeader}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        <Text style={styles.adMetaText}>
          Google AdMob • Test Unit (320x50)
        </Text>
      </View>

      {/* Ad Graphic & Headline Banner Box */}
      <TouchableOpacity
        style={styles.adContentBox}
        activeOpacity={0.85}
        onPress={() => {
          Linking.openURL('https://google.com/admob').catch(() => {});
        }}
      >
        <View style={styles.adIconBox}>
          <Text style={{ fontSize: 20 }}>📢</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.adHeadline} numberOfLines={1}>
            Jhankar Mobile Spare Parts & Tools
          </Text>
          <Text style={styles.adDescription} numberOfLines={1}>
            Best prices on OCA glass, combos & technician toolkits
          </Text>
        </View>
        <View style={styles.adActionPill}>
          <Text style={styles.adActionText}>Install / Open</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    marginVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  adBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 6,
  },
  adBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  adMetaText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  adContentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 56,
  },
  adIconBox: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  adHeadline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  adDescription: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  adActionPill: {
    backgroundColor: '#1E40AF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 6,
  },
  adActionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
