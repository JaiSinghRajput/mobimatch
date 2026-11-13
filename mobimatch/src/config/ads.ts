// Google AdMob Configuration for MobiMatch
// Google Official Test IDs are used by default to prevent policy violations during development.
export const ADMOB_CONFIG = {
  // Google Official Android Sample App ID
  androidAppId: process.env.EXPO_PUBLIC_ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713',
  
  // Google Official Android Test Banner Unit ID (320x50 / Adaptive)
  bannerAdUnitId: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111',
  
  // Google Official Android Test Interstitial Unit ID
  interstitialAdUnitId: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712',

  // Google Official Android Test Rewarded Unit ID
  rewardedAdUnitId: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917',

  // Enable/disable ads globally
  enabled: true,
};
