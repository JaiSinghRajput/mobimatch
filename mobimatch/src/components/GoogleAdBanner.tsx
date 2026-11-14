import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { ADMOB_CONFIG } from '../config/ads';
import { userApi } from '../api/client';

interface GoogleAdBannerProps {
  placement?: 'home' | 'results' | 'catalog' | 'modal';
  style?: any;
}

// Module-level in-memory cache for ads configuration
let cachedAdConfig: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = ({ placement = 'home', style }) => {
  const [adConfig, setAdConfig] = useState<any>(cachedAdConfig);

  useEffect(() => {
    const now = Date.now();
    if (cachedAdConfig && now - lastFetchTime < CACHE_TTL_MS) {
      setAdConfig(cachedAdConfig);
      return;
    }

    userApi
      .getAdConfig()
      .then((config) => {
        if (config) {
          cachedAdConfig = config;
          lastFetchTime = Date.now();
          setAdConfig(config);
        }
      })
      .catch(() => {
        // Fallback to local default config if offline
        if (!cachedAdConfig) {
          setAdConfig({
            adsEnabled: ADMOB_CONFIG.enabled,
            showOnHome: true,
            showOnResults: true,
            showOnCatalog: true,
            admobBannerId: ADMOB_CONFIG.bannerAdUnitId,
            customBanners: [],
          });
        }
      });
  }, []);

  // 1. Check Global Ads Switch
  const isEnabled = adConfig ? adConfig.adsEnabled !== false : ADMOB_CONFIG.enabled;
  if (!isEnabled) return null;

  // 2. Check Placement Rules
  if (adConfig) {
    if (placement === 'home' && adConfig.showOnHome === false) return null;
    if (placement === 'results' && adConfig.showOnResults === false) return null;
    if (placement === 'catalog' && adConfig.showOnCatalog === false) return null;
  }

  // 3. Check for Active House Banner for this placement
  const activeCustomBanners: any[] = adConfig?.customBanners || [];
  const matchingCustomBanner = activeCustomBanners.find(
    (b: any) => b.isActive && (b.placement === 'all' || b.placement === placement)
  );

  if (matchingCustomBanner) {
    return (
      <View style={[styles.adContainer, styles.customBannerBorder, style]}>
        <View style={styles.adHeader}>
          <View style={[styles.adBadge, { backgroundColor: '#10B981' }]}>
            <Text style={styles.adBadgeText}>PROMO</Text>
          </View>
          <Text style={styles.adMetaText}>Jhankar Mobile Official Partner</Text>
        </View>

        <TouchableOpacity
          style={styles.adContentBox}
          activeOpacity={0.85}
          onPress={() => {
            userApi.recordBannerClick(matchingCustomBanner.id).catch(() => {});
            if (matchingCustomBanner.targetUrl) {
              Linking.openURL(matchingCustomBanner.targetUrl).catch(() => {});
            }
          }}
        >
          {matchingCustomBanner.imageUrl ? (
            <Image
              source={{ uri: matchingCustomBanner.imageUrl }}
              style={styles.customBannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.adIconBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Text style={{ fontSize: 20 }}>⭐</Text>
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.adHeadline} numberOfLines={1}>
              {matchingCustomBanner.title}
            </Text>
            <Text style={styles.adDescription} numberOfLines={1}>
              {matchingCustomBanner.description}
            </Text>
          </View>

          <View style={[styles.adActionPill, { backgroundColor: '#059669' }]}>
            <Text style={styles.adActionText}>Explore</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // 4. Default Google AdMob Banner View
  const bannerId = adConfig?.admobBannerId || ADMOB_CONFIG.bannerAdUnitId;

  return (
    <View style={[styles.adContainer, style]}>
      {/* Top Banner Tag */}
      <View style={styles.adHeader}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        <Text style={styles.adMetaText}>
          Google AdMob • {bannerId?.includes('3940256099942544') ? 'Test Unit (320x50)' : 'Sponsored'}
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
            Best wholesale rates on OCA glass, combos & technician toolkits
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
  customBannerBorder: {
    borderColor: '#A7F3D0',
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
  customBannerImage: {
    width: 38,
    height: 38,
    borderRadius: 6,
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
