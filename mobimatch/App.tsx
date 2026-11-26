import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Alert,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { userApi } from './src/api/client';
import { colors, spacing, typography } from './src/theme';
import { GoogleAdBanner } from './src/components/GoogleAdBanner';
import {
  CompatibilityResult,
  ModelSearchItem,
  AppConfigResponse,
} from '@mobimatch/api-contracts';

type Screen =
  | 'home'
  | 'browse_brands'
  | 'brand_models'
  | 'browse_categories'
  | 'compatibility_result'
  | 'no_compatibility'
  | 'report_issue'
  | 'request_model'
  | 'profile';

const APP_VERSION = '1.0.0';

function isVersionOlder(current: string, minimum: string): boolean {
  const c = current.split('.').map((n) => parseInt(n, 10) || 0);
  const m = minimum.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(c.length, m.length); i++) {
    const cv = c[i] || 0;
    const mv = m[i] || 0;
    if (cv < mv) return true;
    if (cv > mv) return false;
  }
  return false;
}

function UserAppContent() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [restoringSession, setRestoringSession] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [appConfig, setAppConfig] = useState<AppConfigResponse | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  // Profile Form States
  const [phoneInput, setPhoneInput] = useState('');
  const [shopNameInput, setShopNameInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Profile Edit Modal / Inline States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editShopName, setEditShopName] = useState('');
  const [editCity, setEditCity] = useState('');

  // Global Home Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModelSearchItem[]>([]);
  const [categorySearchResults, setCategorySearchResults] = useState<any[]>([]);

  // In-Screen Live Filter Search States
  const [brandSearch, setBrandSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  // Catalog Data
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<any | null>(null);
  const [brandModels, setBrandModels] = useState<any[]>([]);

  // Compatibility Selection States
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [compatResult, setCompatResult] = useState<CompatibilityResult | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Issue Report Form States
  const [reportType, setReportType] = useState<
    'incorrect_compatibility' | 'wrong_mobile_model' | 'missing_compatible_model' | 'other'
  >('incorrect_compatibility');
  const [reportDescription, setReportDescription] = useState('');

  // Missing Model Request Form States
  const [reqBrandName, setReqBrandName] = useState('');
  const [reqModelName, setReqModelName] = useState('');
  const [reqModelNumber, setReqModelNumber] = useState('');
  const [reqNotes, setReqNotes] = useState('');

  // Initial Config & Session Restoration
  useEffect(() => {
    userApi
      .getAppConfig()
      .then(setAppConfig)
      .catch((e) => console.log('Config note:', e.message));

    userApi
      .restoreSession()
      .then((user) => {
        if (user) setCurrentUser(user);
      })
      .finally(() => setRestoringSession(false));
  }, []);

  // When user is authenticated, preload brands & categories so search & browsing are instant
  useEffect(() => {
    if (currentUser) {
      loadBrands();
      loadCategories();
      // Initialize edit fields
      setEditPhone(currentUser.phone || '');
      setEditShopName(currentUser.shopName || '');
      setEditCity(currentUser.city || '');
    }
  }, [currentUser]);

  // Global Home Search Effect: Handles both Model Search and Category Search
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setCategorySearchResults([]);
      return;
    }

    // 1. Filter local categories immediately (zero latency)
    if (categories.length > 0) {
      const matchedCats = categories.filter((c) =>
        c.name.toLowerCase().includes(q)
      );
      setCategorySearchResults(matchedCats);
    }

    // 2. Debounce backend models search (280ms)
    const timer = setTimeout(async () => {
      try {
        const results = await userApi.searchModels(q);
        setSearchResults(results);
      } catch (err: any) {
        console.warn('Search error:', err.message);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, categories]);

  // Configure Google Sign-In on mount
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
      offlineAccess: false,
    });
  }, []);

  // Auth Handler (Native Google Sign-In)
  const handleSignIn = async () => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!webClientId) {
      Alert.alert(
        'Google Sign-In Not Configured',
        'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing. Add your Google Web Client ID in .env and rebuild the APK.'
      );
      return;
    }

    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        Alert.alert('Sign In Error', 'Google did not return an ID token. Check your Web Client ID.');
        return;
      }

      const res = await userApi.googleAuth(idToken);
      setCurrentUser(res.user);
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          return;
        }
        if (err.code === statusCodes.IN_PROGRESS) {
          Alert.alert('Sign In', 'Google Sign-In is already in progress.');
          return;
        }
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert('Play Services Required', 'Google Play Services is not available or needs an update.');
          return;
        }
      }
      Alert.alert('Sign In Error', err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  // Complete Profile Handler
  const handleCompleteProfile = async () => {
    if (!phoneInput.trim() || !shopNameInput.trim() || !cityInput.trim()) {
      Alert.alert('Incomplete Profile', 'Please fill in all profile fields');
      return;
    }
    if (!termsAccepted || !privacyAccepted) {
      Alert.alert('Legal Acceptance Required', 'Please accept both Terms & Conditions and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      const updated = await userApi.completeProfile({
        phone: phoneInput.trim(),
        shopName: shopNameInput.trim(),
        city: cityInput.trim(),
        termsAccepted: true,
        privacyAccepted: true,
      });
      setCurrentUser(updated);
    } catch (err: any) {
      Alert.alert('Profile Error', err.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  // Update Profile Handler (From Profile Screen)
  const handleSaveProfile = async () => {
    if (!editPhone.trim() || !editShopName.trim() || !editCity.trim()) {
      Alert.alert('Required Fields', 'Please fill in phone, shop name, and city');
      return;
    }

    setLoading(true);
    try {
      const updated = await userApi.updateProfile({
        phone: editPhone.trim(),
        shopName: editShopName.trim(),
        city: editCity.trim(),
      });
      setCurrentUser(updated);
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile details updated successfully');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  // Data Fetchers
  const loadBrands = async () => {
    try {
      const data = await userApi.getBrands();
      setBrands(data);
    } catch (err: any) {
      console.warn(err.message);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await userApi.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.warn(err.message);
    }
  };

  const handleSelectBrand = async (brand: any) => {
    setSelectedBrand(brand);
    setModelSearch('');
    setLoading(true);
    try {
      const data = await userApi.getBrandModels(brand.id);
      setBrandModels(data);
      setCurrentScreen('brand_models');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compatibility Check
  const checkCompatibility = async (model: any, category: any) => {
    setSelectedModel(model);
    setSelectedCategory(category);
    setLoading(true);

    try {
      const res = await userApi.getCompatibility(model.id || model.modelId, category.id);
      setCompatResult(res);
      setCurrentScreen('compatibility_result');
    } catch (err: any) {
      if (err.code === 'NO_COMPATIBILITY_FOUND' || err.status === 404) {
        setCompatResult(null);
        setCurrentScreen('no_compatibility');
      } else {
        Alert.alert('Notice', err.message || 'Could not fetch compatibility');
      }
    } finally {
      setLoading(false);
    }
  };

  // Copy List Action
  const handleCopyList = async () => {
    if (!compatResult) return;
    const textLines = [
      `MobiMatch Compatibility: ${compatResult.categoryName}`,
      `Target Model: ${compatResult.selectedModel.brandName} ${compatResult.selectedModel.modelName}`,
      `Total Compatible Models: ${compatResult.totalCount}`,
      '----------------------------------------',
      ...compatResult.models.map((m) => `${m.brandName} — ${m.modelName}${m.modelNumber ? ` (${m.modelNumber})` : ''}`),
      '----------------------------------------',
      'Shared via MobiMatch by Jhankar Mobile',
    ];
    const fullText = textLines.join('\n');

    try {
      await Clipboard.setStringAsync(fullText);
    } catch (err: any) {
      console.warn('Clipboard write error:', err.message);
    }

    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
    Alert.alert(
      'Copied to Clipboard ✓',
      `Compatible models list has been copied to your clipboard.\n\nYou can now paste it into WhatsApp, messages, or notes.`
    );
  };

  // Account Deletion
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your MobiMatch account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await userApi.deleteAccount();
              Alert.alert('Account Deleted', 'Your account and personal session data have been deleted.');
              setCurrentUser(null);
              setCurrentScreen('home');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Filtered lists for in-screen searches
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.trim().toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.trim().toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const filteredBrandModels = useMemo(() => {
    if (!modelSearch.trim()) return brandModels;
    const q = modelSearch.trim().toLowerCase();
    return brandModels.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.modelNumber && m.modelNumber.toLowerCase().includes(q))
    );
  }, [brandModels, modelSearch]);

  // ==========================================
  // Render: Maintenance Screen
  // ==========================================
  if (appConfig?.isMaintenanceMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerCard}>
          <Text style={[typography.h1, { color: colors.warning, marginBottom: 12 }]}>
            Under Maintenance
          </Text>
          <Text style={[typography.body, { textAlign: 'center' }]}>
            {appConfig.maintenanceMessage}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // Render: Force Update Required Screen
  // ==========================================
  if (appConfig?.minUserAppVersion && isVersionOlder(APP_VERSION, appConfig.minUserAppVersion)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerCard}>
          <Text style={[typography.h1, { color: colors.primary, marginBottom: 12 }]}>
            Update Required
          </Text>
          <Text style={[typography.bodySecondary, { textAlign: 'center', marginBottom: 24 }]}>
            A newer version ({appConfig.latestUserAppVersion}) of MobiMatch is required to continue. Please update your app.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (appConfig.userAppUpdateUrl) {
                Linking.openURL(appConfig.userAppUpdateUrl).catch(() => {});
              }
            }}
          >
            <Text style={[typography.button, { color: '#fff' }]}>Update App</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // Render: Restoring Session Splash
  // ==========================================
  if (restoringSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerCard}>
          <Text style={[typography.h1, { color: colors.primary, marginBottom: 8 }]}>
            MobiMatch
          </Text>
          <Text style={[styles.brandingSubtitle, { marginBottom: 20 }]}>
            Mobimatch by jhankar mobile
          </Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // Render: Sign-In Screen
  // ==========================================
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerCard}>
          <Text style={[typography.h1, { color: colors.primary, marginBottom: 4 }]}>
            MobiMatch
          </Text>
          <Text style={styles.brandingSubtitle}>
            Mobimatch by jhankar mobile
          </Text>
          <Text style={[typography.bodySecondary, { textAlign: 'center', marginBottom: 28 }]}>
            Find mobile spare-part compatibility groups for phone repairs
          </Text>

          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.85}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Image
                  source={require('./assets/google-g.png')}
                  style={styles.googleBtnIcon}
                  resizeMode="contain"
                />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Branding */}
        <View style={styles.appFooter}>
          <Text style={styles.footerText}>
            crafted by{' '}
            <Text
              style={styles.footerLink}
              onPress={() => Linking.openURL('https://laughingdev.com')}
            >
              laughingdev
            </Text>
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // Render: Mandatory Profile Completion Screen
  // ==========================================
  if (!currentUser.isProfileComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={{ padding: spacing.md }}>
          <Text style={[typography.h2, { color: colors.primary, marginBottom: 8 }]}>
            Complete Your Profile
          </Text>
          <Text style={[typography.bodySecondary, { marginBottom: 20 }]}>
            Please fill in your workshop details before accessing compatibility search.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 9876543210"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Repair Shop / Business Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Star Mobile Care"
              value={shopNameInput}
              onChangeText={setShopNameInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mumbai"
              value={cityInput}
              onChangeText={setCityInput}
            />
          </View>

          {/* Legal Checkboxes */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]} />
            <Text style={typography.bodySecondary}>
              I accept the <Text style={{ color: colors.primary }}>Terms & Conditions</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setPrivacyAccepted(!privacyAccepted)}
          >
            <View style={[styles.checkbox, privacyAccepted && styles.checkboxActive]} />
            <Text style={typography.bodySecondary}>
              I accept the <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, marginTop: 16 }]}
            onPress={handleCompleteProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[typography.button, { color: '#fff' }]}>
                Complete Registration
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // Render: Main App Navigation & Screens
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => {
            setCurrentScreen('home');
            setSearchQuery('');
          }}
        >
          <Text style={[typography.h2, { color: colors.primary, fontWeight: '800' }]}>
            MobiMatch
          </Text>
        </TouchableOpacity>

        {currentScreen !== 'home' ? (
          <TouchableOpacity
            style={styles.headerHomeBtn}
            onPress={() => {
              setCurrentScreen('home');
              setSearchQuery('');
            }}
          >
            <Text style={styles.headerHomeBtnText}>← Home</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.profileHeaderBtn}
            onPress={() => setCurrentScreen('profile')}
          >
            <View style={styles.profileHeaderAvatar}>
              <Text style={styles.profileHeaderAvatarText}>
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <Text style={styles.profileHeaderName}>
              {currentUser.name?.split(' ')[0] || 'Profile'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Screen 1: Home Screen with Unified Search */}
        {currentScreen === 'home' && (
          <View>
            {/* Global Search Bar */}
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search phone model or spare-part category..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Subtitle Branding right below search bar */}
            <Text style={styles.brandingSubtitle}>
              Mobimatch by jhankar mobile
            </Text>

            {/* Google AdMob Banner on Home Screen */}
            <GoogleAdBanner placement="home" />

            {/* Combined Search Suggestions Dropdown */}
            {(categorySearchResults.length > 0 || searchResults.length > 0) && (
              <View style={styles.suggestionsBox}>
                {/* 1. Category Suggestions */}
                {categorySearchResults.length > 0 && (
                  <View style={styles.suggestionSection}>
                    <Text style={styles.suggestionSectionTitle}>
                      📂 Spare-Part Categories ({categorySearchResults.length}):
                    </Text>
                    {categorySearchResults.map((cat) => (
                      <TouchableOpacity
                        key={`cat-${cat.id}`}
                        style={styles.suggestionCategoryItem}
                        onPress={() => {
                          setSelectedCategory(cat);
                          setSearchQuery('');
                          loadBrands();
                          setCurrentScreen('browse_brands');
                        }}
                      >
                        <Text style={styles.suggestionCategoryIcon}>📦</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.suggestionCategoryText}>{cat.name}</Text>
                          <Text style={styles.suggestionSubtext}>
                            Tap to browse phone brands for this part
                          </Text>
                        </View>
                        <Text style={styles.suggestionArrow}>→</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Divider between Categories and Models */}
                {categorySearchResults.length > 0 && searchResults.length > 0 && (
                  <View style={styles.suggestionDivider} />
                )}

                {/* 2. Model Suggestions */}
                {searchResults.length > 0 && (
                  <View style={styles.suggestionSection}>
                    <Text style={styles.suggestionSectionTitle}>
                      📱 Mobile Models ({searchResults.length}):
                    </Text>
                    {searchResults.map((item) => (
                      <TouchableOpacity
                        key={`model-${item.id}`}
                        style={styles.suggestionModelItem}
                        onPress={() => {
                          setSelectedModel(item);
                          setSearchQuery('');
                          loadCategories();
                          setCategorySearch('');
                          setCurrentScreen('browse_categories');
                        }}
                      >
                        <Text style={styles.suggestionModelIcon}>📱</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.suggestionModelTitle}>
                            {item.brandName} {item.name}
                          </Text>
                          {item.modelNumber ? (
                            <Text style={styles.suggestionSubtext}>
                              Model No: {item.modelNumber}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.suggestionArrow}>→</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Empty search notice */}
            {searchQuery.trim().length > 1 &&
              categorySearchResults.length === 0 &&
              searchResults.length === 0 && (
                <View style={styles.noSearchBox}>
                  <Text style={styles.noSearchText}>
                    No models or categories found for "{searchQuery}".
                  </Text>
                  <TouchableOpacity
                    style={styles.noSearchBtn}
                    onPress={() => {
                      setReqModelName(searchQuery);
                      setCurrentScreen('request_model');
                    }}
                  >
                    <Text style={styles.noSearchBtnText}>+ Request This Model</Text>
                  </TouchableOpacity>
                </View>
              )}

            {/* Browse Catalog Options */}
            <Text style={[typography.h3, { marginTop: 18, marginBottom: 12 }]}>
              Browse Spare-Parts
            </Text>

            <TouchableOpacity
              style={styles.browseCard}
              onPress={() => {
                loadBrands();
                setBrandSearch('');
                setCurrentScreen('browse_brands');
              }}
            >
              <View style={styles.browseCardHeader}>
                <Text style={styles.browseCardEmoji}>🏷️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>Browse by Brand (A–Z)</Text>
                  <Text style={typography.bodySecondary}>
                    Select mobile phone brand, then choose model
                  </Text>
                </View>
                <Text style={styles.browseChevron}>›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.browseCard}
              onPress={() => {
                loadCategories();
                setCategorySearch('');
                setSelectedModel(null);
                setCurrentScreen('browse_categories');
              }}
            >
              <View style={styles.browseCardHeader}>
                <Text style={styles.browseCardEmoji}>📂</Text>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h3}>Browse by Category (A–Z)</Text>
                  <Text style={typography.bodySecondary}>
                    Select spare part category first (Display, Battery, Charging Flex...)
                  </Text>
                </View>
                <Text style={styles.browseChevron}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Technician Quick Actions Card */}
            <Text style={[typography.h3, { marginTop: 18, marginBottom: 12 }]}>
              Technician Tools & Feedback
            </Text>

            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => setCurrentScreen('request_model')}
              >
                <Text style={styles.quickActionEmoji}>📱</Text>
                <Text style={styles.quickActionTitle}>Request Model</Text>
                <Text style={styles.quickActionSub}>Can't find a phone?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => setCurrentScreen('report_issue')}
              >
                <Text style={styles.quickActionEmoji}>⚠️</Text>
                <Text style={styles.quickActionTitle}>Report Issue</Text>
                <Text style={styles.quickActionSub}>Report wrong part info</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Screen 2: Browse Brands (with In-Screen Live Filter) */}
        {currentScreen === 'browse_brands' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>← Back to Home</Text>
            </TouchableOpacity>

            <Text style={[typography.h2, { marginBottom: 4 }]}>Brands (A–Z)</Text>
            <Text style={[typography.bodySecondary, { marginBottom: 12 }]}>
              {selectedCategory
                ? `Choose a brand for ${selectedCategory.name}`
                : 'Select your mobile phone brand to explore compatible models'}
            </Text>

            {/* In-Screen Search Bar for Brands */}
            <View style={styles.subSearchBar}>
              <Text style={styles.subSearchIcon}>🔍</Text>
              <TextInput
                style={styles.subSearchInput}
                placeholder="Filter brands (e.g. Samsung, Xiaomi, Vivo)..."
                placeholderTextColor={colors.textMuted}
                value={brandSearch}
                onChangeText={setBrandSearch}
              />
              {brandSearch.length > 0 && (
                <TouchableOpacity onPress={() => setBrandSearch('')} style={styles.subClearBtn}>
                  <Text style={styles.subClearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.filterCountText}>
              Showing {filteredBrands.length} of {brands.length} brands
            </Text>

            {filteredBrands.length === 0 ? (
              <View style={styles.noFilterBox}>
                <Text style={styles.noFilterText}>No brands match "{brandSearch}".</Text>
              </View>
            ) : (
              filteredBrands.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.listItem}
                  onPress={() => handleSelectBrand(b)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.itemAvatar}>
                      <Text style={styles.itemAvatarText}>
                        {b.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[typography.h3, { fontSize: 16, marginLeft: 12 }]}>
                      {b.name}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 18 }}>→</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Screen 3: Brand Models (with In-Screen Live Filter & Catalog Ad) */}
        {currentScreen === 'brand_models' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('browse_brands')}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>← Back to Brands</Text>
            </TouchableOpacity>

            <Text style={[typography.h2, { marginBottom: 4 }]}>
              {selectedBrand?.name} Models
            </Text>
            <Text style={[typography.bodySecondary, { marginBottom: 12 }]}>
              Select a model to view its spare-part compatibility
            </Text>

            {/* In-Screen Search Bar for Models */}
            <View style={styles.subSearchBar}>
              <Text style={styles.subSearchIcon}>🔍</Text>
              <TextInput
                style={styles.subSearchInput}
                placeholder="Filter models (e.g. Note 10, A52, RMX)..."
                placeholderTextColor={colors.textMuted}
                value={modelSearch}
                onChangeText={setModelSearch}
              />
              {modelSearch.length > 0 && (
                <TouchableOpacity onPress={() => setModelSearch('')} style={styles.subClearBtn}>
                  <Text style={styles.subClearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Catalog Google Ad Banner */}
            <GoogleAdBanner placement="catalog" />

            <Text style={styles.filterCountText}>
              Showing {filteredBrandModels.length} of {brandModels.length} models
            </Text>

            {filteredBrandModels.length === 0 ? (
              <View style={styles.noFilterBox}>
                <Text style={styles.noFilterText}>No models match "{modelSearch}".</Text>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary, marginTop: 12 }]}
                  onPress={() => {
                    setReqBrandName(selectedBrand?.name || '');
                    setReqModelName(modelSearch);
                    setCurrentScreen('request_model');
                  }}
                >
                  <Text style={[typography.button, { color: '#fff' }]}>
                    + Request Missing Model
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredBrandModels.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.listItem}
                  onPress={() => {
                    setSelectedModel(m);
                    if (selectedCategory) {
                      checkCompatibility(m, selectedCategory);
                    } else {
                      loadCategories();
                      setCategorySearch('');
                      setCurrentScreen('browse_categories');
                    }
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h3, { fontSize: 16 }]}>{m.name}</Text>
                    {m.modelNumber ? (
                      <Text style={typography.caption}>Model No: {m.modelNumber}</Text>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 18 }}>→</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Screen 4: Browse Categories (with In-Screen Live Filter) */}
        {currentScreen === 'browse_categories' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>← Back</Text>
            </TouchableOpacity>

            <Text style={[typography.h2, { marginBottom: 4 }]}>
              {selectedModel
                ? `Part Category for ${selectedModel.brandName || selectedBrand?.name || ''} ${selectedModel.name}`
                : 'Select Spare-Part Category'}
            </Text>
            <Text style={[typography.bodySecondary, { marginBottom: 12 }]}>
              Alphabetical A–Z list of spare-part categories
            </Text>

            {/* In-Screen Search Bar for Categories */}
            <View style={styles.subSearchBar}>
              <Text style={styles.subSearchIcon}>🔍</Text>
              <TextInput
                style={styles.subSearchInput}
                placeholder="Filter categories (e.g. Display, Battery, Charging)..."
                placeholderTextColor={colors.textMuted}
                value={categorySearch}
                onChangeText={setCategorySearch}
              />
              {categorySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCategorySearch('')} style={styles.subClearBtn}>
                  <Text style={styles.subClearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.filterCountText}>
              Showing {filteredCategories.length} of {categories.length} categories
            </Text>

            {filteredCategories.length === 0 ? (
              <View style={styles.noFilterBox}>
                <Text style={styles.noFilterText}>No categories match "{categorySearch}".</Text>
              </View>
            ) : (
              filteredCategories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.listItem}
                  onPress={() => {
                    if (selectedModel) {
                      checkCompatibility(selectedModel, c);
                    } else {
                      setSelectedCategory(c);
                      loadBrands();
                      setBrandSearch('');
                      setCurrentScreen('browse_brands');
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, marginRight: 12 }}>📦</Text>
                    <Text style={[typography.h3, { fontSize: 16 }]}>{c.name}</Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 18 }}>→</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Screen 5: Compatibility Result */}
        {currentScreen === 'compatibility_result' && compatResult && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>← Search Again</Text>
            </TouchableOpacity>

            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View>
                  <Text style={styles.resultBadgeCategory}>
                    {compatResult.categoryName.toUpperCase()}
                  </Text>
                  <Text style={styles.resultTargetModel}>
                    {compatResult.selectedModel.brandName}{' '}
                    {compatResult.selectedModel.modelName}
                  </Text>
                </View>
                <View style={styles.totalCountBadge}>
                  <Text style={styles.totalCountNumber}>{compatResult.totalCount}</Text>
                  <Text style={styles.totalCountLabel}>Compatible</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary, marginVertical: 14 }]}
                onPress={handleCopyList}
              >
                <Text style={[typography.button, { color: '#fff' }]}>
                  {copiedNotice ? '✓ Copied to Clipboard!' : '📋 Copy Compatible Models List'}
                </Text>
              </TouchableOpacity>

              {/* Google Ad on Results Screen */}
              <GoogleAdBanner placement="results" />

              <Text style={[typography.h3, { marginTop: 14, marginBottom: 8 }]}>
                Compatible Models ({compatResult.totalCount}):
              </Text>

              {compatResult.models.map((m) => (
                <View key={m.modelId} style={styles.modelRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.textPrimary, fontSize: 15 }}>
                      {m.brandName} — {m.modelName}
                    </Text>
                    {m.modelNumber ? (
                      <Text style={typography.caption}>Model No: {m.modelNumber}</Text>
                    ) : null}
                  </View>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>Match ✓</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.outlineBtn, { marginTop: 18 }]}
                onPress={() => setCurrentScreen('report_issue')}
              >
                <Text style={styles.outlineBtnText}>⚠️ Report Inaccurate Information</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Screen 6: No Compatibility Found */}
        {currentScreen === 'no_compatibility' && (
          <View style={styles.centerCard}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🔍</Text>
            <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }]}>
              No Compatibility Found
            </Text>
            <Text style={[typography.bodySecondary, { textAlign: 'center', marginBottom: 20 }]}>
              Our administrators have not listed a compatibility group for{' '}
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                {selectedModel?.name}
              </Text>{' '}
              in {selectedCategory?.name || 'this category'} yet.
            </Text>

            {/* Google Ad Banner */}
            <GoogleAdBanner placement="results" />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.warning, marginTop: 16, marginBottom: 10 }]}
              onPress={() => setCurrentScreen('report_issue')}
            >
              <Text style={[typography.button, { color: '#fff' }]}>
                ⚠️ Report Issue / Missing Compatibility
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.border }]}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={[typography.button, { color: colors.textPrimary }]}>
                Search Another Model
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Screen 7: Report Issue Screen */}
        {currentScreen === 'report_issue' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>← Cancel</Text>
            </TouchableOpacity>

            <Text style={[typography.h2, { marginBottom: 6 }]}>Report Issue</Text>
            <Text style={[typography.bodySecondary, { marginBottom: 16 }]}>
              Help us improve accuracy by reporting incorrect or missing compatibility data.
            </Text>

            <Text style={styles.label}>Issue Type</Text>
            {[
              { key: 'incorrect_compatibility', label: 'Incorrect Compatibility Pair' },
              { key: 'wrong_mobile_model', label: 'Wrong Mobile Model Details' },
              { key: 'missing_compatible_model', label: 'Missing Compatible Model' },
              { key: 'other', label: 'Other Inaccuracy' },
            ].map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.listItem, reportType === t.key && styles.chipActive]}
                onPress={() => setReportType(t.key as any)}
              >
                <Text
                  style={{
                    color: reportType === t.key ? colors.primary : colors.textPrimary,
                    fontWeight: reportType === t.key ? '700' : '500',
                  }}
                >
                  {t.label}
                </Text>
                {reportType === t.key && <Text style={{ color: colors.primary }}>✓</Text>}
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { marginTop: 14 }]}>
              Description / Notes (Optional)
            </Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              multiline
              placeholder="Provide exact phone models or details about the issue..."
              value={reportDescription}
              onChangeText={setReportDescription}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 18 }]}
              onPress={async () => {
                try {
                  await userApi.submitReport({
                    type: reportType,
                    categoryId: selectedCategory?.id,
                    modelId: selectedModel?.id || selectedModel?.modelId,
                    description: reportDescription,
                  });
                  Alert.alert('Report Submitted', 'Thank you! Our admins will review this report.');
                  setCurrentScreen('home');
                } catch (err: any) {
                  Alert.alert('Submission Error', err.message || 'Could not submit report');
                }
              }}
            >
              <Text style={[typography.button, { color: '#fff' }]}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Screen 8: Request Missing Model Screen */}
        {currentScreen === 'request_model' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>← Cancel</Text>
            </TouchableOpacity>

            <Text style={[typography.h2, { marginBottom: 6 }]}>
              Request Missing Model
            </Text>
            <Text style={[typography.bodySecondary, { marginBottom: 16 }]}>
              Can't find a model in the catalog? Submit details for administrator review.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brand Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Poco, Realme, Infinix, OnePlus"
                value={reqBrandName}
                onChangeText={setReqBrandName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Narzo 50 Pro 5G, GT 2 Neo"
                value={reqModelName}
                onChangeText={setReqModelName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. RMX3395, 2109119DI"
                value={reqModelNumber}
                onChangeText={setReqModelNumber}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Known compatible parts, release year, etc."
                value={reqNotes}
                onChangeText={setReqNotes}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 12 }]}
              onPress={async () => {
                if (!reqBrandName.trim() || !reqModelName.trim()) {
                  Alert.alert('Required Fields', 'Brand name and model name are required.');
                  return;
                }
                try {
                  await userApi.submitModelRequest({
                    brandName: reqBrandName.trim(),
                    modelName: reqModelName.trim(),
                    modelNumber: reqModelNumber.trim() || undefined,
                    notes: reqNotes.trim() || undefined,
                  });
                  Alert.alert('Request Submitted', 'Model request submitted for administrator review.');
                  setReqBrandName('');
                  setReqModelName('');
                  setReqModelNumber('');
                  setReqNotes('');
                  setCurrentScreen('home');
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Failed to submit request');
                }
              }}
            >
              <Text style={[typography.button, { color: '#fff' }]}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Screen 9: Redesigned Profile Screen */}
        {currentScreen === 'profile' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>← Back to Home</Text>
            </TouchableOpacity>

            {/* Profile Hero Card */}
            <View style={styles.profileHeroCard}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarLargeText}>
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.profileHeroName}>{currentUser.name}</Text>
                <Text style={styles.profileHeroEmail}>{currentUser.email}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓ Verified Repair Partner</Text>
                </View>
              </View>
            </View>

            {/* Workshop & Contact Details Card */}
            <View style={styles.profileSectionCard}>
              <View style={styles.profileSectionHeader}>
                <Text style={styles.profileSectionTitle}>🛠️ Workshop Details</Text>
                <TouchableOpacity
                  style={styles.profileEditToggleBtn}
                  onPress={() => setIsEditingProfile(!isEditingProfile)}
                >
                  <Text style={styles.profileEditToggleText}>
                    {isEditingProfile ? 'Cancel' : 'Edit ✏️'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isEditingProfile ? (
                /* Inline Edit Form */
                <View style={{ marginTop: 10 }}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Shop / Business Name</Text>
                    <TextInput
                      style={styles.input}
                      value={editShopName}
                      onChangeText={setEditShopName}
                      placeholder="e.g. Star Mobile Care"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                      style={styles.input}
                      value={editPhone}
                      onChangeText={setEditPhone}
                      keyboardType="phone-pad"
                      placeholder="+91 9876543210"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={editCity}
                      onChangeText={setEditCity}
                      placeholder="e.g. Mumbai"
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary, marginTop: 4 }]}
                    onPress={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={[typography.button, { color: '#fff' }]}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Read-Only Details Rows */
                <View style={{ marginTop: 8 }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>🏪 Business / Shop</Text>
                    <Text style={styles.infoValue}>{currentUser.shopName || 'Not Set'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>📞 Phone Number</Text>
                    <Text style={styles.infoValue}>{currentUser.phone || 'Not Set'}</Text>
                  </View>
                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.infoLabel}>📍 City / Location</Text>
                    <Text style={styles.infoValue}>{currentUser.city || 'Not Set'}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Technician Support & Feedback Card */}
            <View style={styles.profileSectionCard}>
              <Text style={styles.profileSectionTitle}>🤝 Support & Contributions</Text>
              <TouchableOpacity
                style={styles.actionRowItem}
                onPress={() => setCurrentScreen('report_issue')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.actionRowEmoji}>⚠️</Text>
                  <Text style={styles.actionRowLabel}>Report Compatibility Inaccuracy</Text>
                </View>
                <Text style={styles.actionRowChevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionRowItem}
                onPress={() => setCurrentScreen('request_model')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.actionRowEmoji}>📱</Text>
                  <Text style={styles.actionRowLabel}>Request Missing Mobile Model</Text>
                </View>
                <Text style={styles.actionRowChevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionRowItem, { borderBottomWidth: 0 }]}
                onPress={() => {
                  loadBrands();
                  loadCategories();
                  Alert.alert('Refreshed', 'Brands and categories cache reloaded successfully.');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.actionRowEmoji}>🔄</Text>
                  <Text style={styles.actionRowLabel}>Refresh Database Cache</Text>
                </View>
                <Text style={styles.actionRowChevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Legal & App Details Card */}
            <View style={styles.profileSectionCard}>
              <Text style={styles.profileSectionTitle}>📄 About MobiMatch</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>App Version</Text>
                <Text style={styles.infoValue}>1.0.0 (Android 10+)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service Publisher</Text>
                <Text style={styles.infoValue}>Jhankar Mobile</Text>
              </View>
              <TouchableOpacity
                style={styles.actionRowItem}
                onPress={() => Linking.openURL('https://laughingdev.com')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.actionRowEmoji}>🚀</Text>
                  <Text style={styles.actionRowLabel}>Crafted by laughingdev</Text>
                </View>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Visit ↗</Text>
              </TouchableOpacity>
            </View>

            {/* Session Management & Danger Zone */}
            <View style={styles.profileSectionCard}>
              <Text style={[styles.profileSectionTitle, { color: colors.textPrimary }]}>
                🔐 Account & Session
              </Text>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.border, marginBottom: 10 }]}
                onPress={async () => {
                  await userApi.logout();
                  await GoogleSignin.signOut().catch(() => {});
                  setCurrentUser(null);
                  setCurrentScreen('home');
                }}
              >
                <Text style={[typography.button, { color: colors.textPrimary }]}>
                  Sign Out Current Device
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.border, marginBottom: 14 }]}
                onPress={async () => {
                  await userApi.logoutAll();
                  await GoogleSignin.signOut().catch(() => {});
                  setCurrentUser(null);
                  setCurrentScreen('home');
                }}
              >
                <Text style={[typography.button, { color: colors.textPrimary }]}>
                  Sign Out All Devices
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' }]}
                onPress={handleDeleteAccount}
              >
                <Text style={[typography.button, { color: '#DC2626' }]}>
                  Permanently Delete MobiMatch Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Footer Branding with Clickable laughingdev URL */}
      <View style={styles.appFooter}>
        <Text style={styles.footerText}>
          crafted by{' '}
          <Text
            style={styles.footerLink}
            onPress={() => Linking.openURL('https://laughingdev.com')}
          >
            laughingdev
          </Text>
        </Text>
      </View>

      {/* Clean 2-Tab Bottom Navigation Bar (Home & Profile) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.bottomNavItem, currentScreen !== 'profile' && styles.bottomNavItemActive]}
          onPress={() => {
            setCurrentScreen('home');
            setSearchQuery('');
          }}
        >
          <Text style={[styles.bottomNavIcon, currentScreen !== 'profile' && styles.bottomNavIconActive]}>
            🏠
          </Text>
          <Text style={[styles.bottomNavLabel, currentScreen !== 'profile' && styles.bottomNavLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomNavItem, currentScreen === 'profile' && styles.bottomNavItemActive]}
          onPress={() => setCurrentScreen('profile')}
        >
          <Text style={[styles.bottomNavIcon, currentScreen === 'profile' && styles.bottomNavIconActive]}>
            👤
          </Text>
          <Text style={[styles.bottomNavLabel, currentScreen === 'profile' && styles.bottomNavLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserAppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  profileHeaderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  profileHeaderAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  profileHeaderName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    padding: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 4,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  brandingSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: 10,
  },
  suggestionsBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  suggestionSection: {
    marginBottom: 6,
  },
  suggestionSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  suggestionCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  suggestionCategoryIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  suggestionCategoryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  suggestionModelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionModelIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  suggestionModelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  suggestionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  suggestionArrow: {
    fontSize: 18,
    color: colors.textMuted,
    marginLeft: 8,
  },
  suggestionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  noSearchBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  noSearchText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  noSearchBtn: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  noSearchBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  browseCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  browseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  browseCardEmoji: {
    fontSize: 26,
    marginRight: 14,
  },
  browseChevron: {
    fontSize: 24,
    color: colors.textMuted,
    marginLeft: 10,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActionItem: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  quickActionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  subSearchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  subSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 2,
  },
  subClearBtn: {
    padding: 4,
  },
  subClearBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  filterCountText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
    fontWeight: '500',
  },
  noFilterBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noFilterText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.primaryLighter,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  headerHomeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.primaryLighter,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  headerHomeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  appFooter: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  bottomNavItemActive: {
    backgroundColor: colors.primaryLighter,
  },
  bottomNavIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  bottomNavIconActive: {
    opacity: 1,
  },
  bottomNavLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bottomNavLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
  },
  button: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  googleBtnIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  outlineBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surface,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  itemAvatarText: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  resultBadgeCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  resultTargetModel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  totalCountBadge: {
    backgroundColor: colors.primaryLighter,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  totalCountNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  totalCountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  modelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  matchBadge: {
    backgroundColor: colors.successBg,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.successText,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  // Redesigned Profile Styles
  profileHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarLargeText: {
    color: colors.textInverse,
    fontSize: 26,
    fontWeight: '800',
  },
  profileHeroName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  profileHeroEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successBg,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginTop: 6,
  },
  verifiedBadgeText: {
    color: colors.successText,
    fontSize: 11,
    fontWeight: '700',
  },
  profileSectionCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  profileSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  profileEditToggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.primaryLighter,
  },
  profileEditToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  actionRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionRowEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  actionRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionRowChevron: {
    fontSize: 18,
    color: colors.textMuted,
  },
});
