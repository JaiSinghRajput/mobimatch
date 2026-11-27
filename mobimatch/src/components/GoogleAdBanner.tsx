import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { ADMOB_CONFIG } from '../config/ads';
import { userApi } from '../api/client';
import { colors, fontWeights, borderRadius } from '../theme';

interface GoogleAdBannerProps {
  placement?: 'home' | 'results' | 'catalog' | 'modal';
  style?: any;
}

// Module-level in-memory cache for ads configuration
let cachedAdConfig: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export const GoogleAdBanner: React.FC<GoogleAdBannerProps> = React.memo(({ placement = 'home', style }) => {
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
          <View style={[styles.adBadge, { backgroundColor: colors.promoBadgeBg }]}>
            <Text style={[styles.adBadgeText, { color: colors.promoBadgeText }]}>PROMO</Text>
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
            <View style={[styles.adIconBox, { backgroundColor: colors.promoBg, borderColor: colors.promoBorder }]}>
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

          <View style={[styles.adActionPill, { backgroundColor: colors.promoActionBg }]}>
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
        <View style={[styles.adBadge, { backgroundColor: colors.adBadgeBg }]}>
          <Text style={[styles.adBadgeText, { color: colors.adBadgeText }]}>Ad</Text>
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
});

const styles = StyleSheet.create({
  adContainer: {
    marginVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  customBannerBorder: {
    borderColor: colors.promoBorder,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  adBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
    marginRight: 6,
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.heavy,
    letterSpacing: 0.5,
  },
  adMetaText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
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
    borderRadius: borderRadius.md,
  },
  adIconBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  adHeadline: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  adDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  adActionPill: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
    marginLeft: 6,
  },
  adActionText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
});
