import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { userApi } from './src/api/client';
import { colors, spacing, typography } from './src/theme';
import {
  CompatibilityResult,
  ModelSearchItem,
  AppConfigResponse,
} from '@mobimatch/api-contracts';

type Screen =
  | 'home'
  | 'search'
  | 'browse_brands'
  | 'brand_models'
  | 'browse_categories'
  | 'compatibility_result'
  | 'no_compatibility'
  | 'report_issue'
  | 'request_model'
  | 'profile';

function UserAppContent() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [appConfig, setAppConfig] = useState<AppConfigResponse | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  // Auth & Profile Form States
  const [authEmailInput, setAuthEmailInput] = useState('technician@example.com');
  const [phoneInput, setPhoneInput] = useState('');
  const [shopNameInput, setShopNameInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Search & Browse States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModelSearchItem[]>([]);
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

  // Initial Config
  useEffect(() => {
    userApi
      .getAppConfig()
      .then(setAppConfig)
      .catch((e) => console.log('Config note:', e.message));
  }, []);

  // Debounced Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await userApi.searchModels(searchQuery);
        setSearchResults(results);
      } catch (err: any) {
        console.warn('Search error:', err.message);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auth Handler
  const handleSignIn = async () => {
    setLoading(true);
    try {
      const mockToken = `mock-:${authEmailInput.trim()}:sub-user-${Date.now()}:Technician User`;
      const res = await userApi.googleAuth(mockToken);
      setCurrentUser(res.user);
    } catch (err: any) {
      Alert.alert('Sign In Error', err.message || 'Failed to sign in');
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
  const handleCopyList = () => {
    if (!compatResult) return;
    const textLines = [
      `MobiMatch Compatibility: ${compatResult.categoryName}`,
      `Total Compatible Models: ${compatResult.totalCount}`,
      '----------------------------------------',
      ...compatResult.models.map((m) => `${m.brandName} — ${m.modelName}`),
    ];
    const fullText = textLines.join('\n');

    // Display temporary success notice
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
    Alert.alert('List Copied', `Compatible models list ready to copy:\n\n${fullText}`);
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
  // Render: Sign-In Screen
  // ==========================================
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerCard}>
          <Text style={[typography.h1, { color: colors.primary, marginBottom: 8 }]}>
            MobiMatch
          </Text>
          <Text style={[typography.bodySecondary, { textAlign: 'center', marginBottom: 24 }]}>
            Find mobile spare-part compatibility groups for phone repairs
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Google Email</Text>
            <TextInput
              style={styles.input}
              value={authEmailInput}
              onChangeText={setAuthEmailInput}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[typography.button, { color: '#fff' }]}>
                Continue with Google
              </Text>
            )}
          </TouchableOpacity>
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
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setCurrentScreen('home');
            setSearchQuery('');
          }}
        >
          <Text style={[typography.h2, { color: colors.primary }]}>MobiMatch</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => setCurrentScreen('profile')}
        >
          <Text style={{ fontWeight: '600', color: colors.textSecondary }}>Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Screen 1: Home & Global Search */}
        {currentScreen === 'home' && (
          <View>
            {/* Global Search Bar */}
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search phone model (e.g. Redmi Note 10, A52)..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <View style={styles.suggestionsBox}>
                <Text style={[typography.caption, { marginBottom: 6 }]}>
                  Search Suggestions:
                </Text>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSelectedModel(item);
                      loadCategories();
                      setCurrentScreen('browse_categories');
                    }}
                  >
                    <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                      {item.brandName} {item.name}
                    </Text>
                    {item.modelNumber && (
                      <Text style={typography.caption}>({item.modelNumber})</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Browse Options */}
            <Text style={[typography.h3, { marginTop: 24, marginBottom: 12 }]}>
              Browse Spare-Parts
            </Text>

            <TouchableOpacity
              style={styles.browseCard}
              onPress={() => {
                loadBrands();
                setCurrentScreen('browse_brands');
              }}
            >
              <Text style={typography.h3}>Browse by Brand (A–Z)</Text>
              <Text style={typography.bodySecondary}>
                Select mobile phone brand, then choose model
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.browseCard}
              onPress={() => {
                loadCategories();
                setCurrentScreen('browse_categories');
              }}
            >
              <Text style={typography.h3}>Browse by Category (A–Z)</Text>
              <Text style={typography.bodySecondary}>
                Select spare part category first (e.g. Display, Battery, Charging Flex)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.browseCard, { marginTop: 12, backgroundColor: colors.background }]}
              onPress={() => setCurrentScreen('request_model')}
            >
              <Text style={[typography.h3, { color: colors.primary }]}>
                + Can't find a model? Request it
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Screen 2: Browse Brands (A-Z) */}
        {currentScreen === 'browse_brands' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary }}>← Back to Home</Text>
            </TouchableOpacity>
            <Text style={[typography.h2, { marginBottom: 16 }]}>Brands (A–Z)</Text>
            {brands.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.listItem}
                onPress={() => handleSelectBrand(b)}
              >
                <Text style={[typography.h3, { fontSize: 16 }]}>{b.name}</Text>
                <Text style={{ color: colors.textMuted }}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Screen 3: Brand Models */}
        {currentScreen === 'brand_models' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('browse_brands')}
            >
              <Text style={{ color: colors.primary }}>← Back to Brands</Text>
            </TouchableOpacity>
            <Text style={[typography.h2, { marginBottom: 16 }]}>
              {selectedBrand?.name} Models
            </Text>
            {brandModels.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.listItem}
                onPress={() => {
                  setSelectedModel(m);
                  loadCategories();
                  setCurrentScreen('browse_categories');
                }}
              >
                <View>
                  <Text style={[typography.h3, { fontSize: 16 }]}>{m.name}</Text>
                  {m.modelNumber && (
                    <Text style={typography.caption}>Model No: {m.modelNumber}</Text>
                  )}
                </View>
                <Text style={{ color: colors.textMuted }}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Screen 4: Browse Categories */}
        {currentScreen === 'browse_categories' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary }}>← Back</Text>
            </TouchableOpacity>
            <Text style={[typography.h2, { marginBottom: 8 }]}>
              {selectedModel
                ? `Select Category for ${selectedModel.name || selectedModel.brandName}`
                : 'Select Spare-Part Category'}
            </Text>
            <Text style={[typography.bodySecondary, { marginBottom: 16 }]}>
              All categories are alphabetical A–Z
            </Text>

            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.listItem}
                onPress={() => {
                  if (selectedModel) {
                    checkCompatibility(selectedModel, c);
                  } else {
                    setSelectedCategory(c);
                    loadBrands();
                    setCurrentScreen('browse_brands');
                  }
                }}
              >
                <Text style={[typography.h3, { fontSize: 16 }]}>{c.name}</Text>
                <Text style={{ color: colors.textMuted }}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Screen 5: Compatibility Result */}
        {currentScreen === 'compatibility_result' && compatResult && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary }}>← Search Again</Text>
            </TouchableOpacity>

            <View style={styles.resultCard}>
              <Text style={typography.caption}>CATEGORY</Text>
              <Text style={[typography.h2, { color: colors.primary, marginBottom: 8 }]}>
                {compatResult.categoryName}
              </Text>

              <Text style={typography.caption}>SEARCHED MODEL</Text>
              <Text style={[typography.h3, { marginBottom: 16 }]}>
                {compatResult.selectedModel.brandName}{' '}
                {compatResult.selectedModel.modelName}
              </Text>

              <View style={styles.badge}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  {compatResult.totalCount} Models Share This Part
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary, marginVertical: 16 }]}
                onPress={handleCopyList}
              >
                <Text style={[typography.button, { color: '#fff' }]}>
                  {copiedNotice ? '✓ Copied to Clipboard!' : 'Copy List'}
                </Text>
              </TouchableOpacity>

              <Text style={[typography.h3, { marginBottom: 8 }]}>Compatible Models:</Text>
              {compatResult.models.map((m) => (
                <View key={m.modelId} style={styles.modelRow}>
                  <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                    {m.brandName} — {m.modelName}
                  </Text>
                  {m.modelNumber && (
                    <Text style={typography.caption}>{m.modelNumber}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Screen 6: No Compatibility Found */}
        {currentScreen === 'no_compatibility' && (
          <View style={styles.centerCard}>
            <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: 8 }]}>
              No compatibility information found.
            </Text>
            <Text style={[typography.bodySecondary, { textAlign: 'center', marginBottom: 20 }]}>
              Our administrators have not listed a compatibility group for this model in{' '}
              {selectedCategory?.name || 'this category'} yet.
            </Text>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.warning, marginBottom: 12 }]}
              onPress={() => setCurrentScreen('report_issue')}
            >
              <Text style={[typography.button, { color: '#fff' }]}>
                Report Issue / Missing Data
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

        {/* Screen 7: Report Issue */}
        {currentScreen === 'report_issue' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary }}>← Cancel</Text>
            </TouchableOpacity>

            <Text style={[typography.h2, { marginBottom: 8 }]}>Report Compatibility Issue</Text>
            <Text style={[typography.bodySecondary, { marginBottom: 16 }]}>
              Let our team know if something is wrong or missing.
            </Text>

            <Text style={styles.label}>Issue Type</Text>
            {[
              { key: 'incorrect_compatibility', label: 'Incorrect Compatibility' },
              { key: 'wrong_mobile_model', label: 'Wrong Mobile Model' },
              { key: 'missing_compatible_model', label: 'Missing Compatible Model' },
              { key: 'other', label: 'Other' },
            ].map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.listItem, reportType === t.key && styles.chipActive]}
                onPress={() => setReportType(t.key as any)}
              >
                <Text
                  style={{
                    color: reportType === t.key ? colors.primary : colors.textPrimary,
                    fontWeight: reportType === t.key ? '700' : '400',
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { marginTop: 12 }]}>
              Description (Optional)
            </Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              multiline
              placeholder="Describe the issue in detail..."
              value={reportDescription}
              onChangeText={setReportDescription}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 16 }]}
              onPress={async () => {
                await userApi.submitReport({
                  type: reportType,
                  categoryId: selectedCategory?.id,
                  modelId: selectedModel?.id || selectedModel?.modelId,
                  description: reportDescription,
                });
                Alert.alert('Report Submitted', 'Thank you! Your report has been submitted to administrators.');
                setCurrentScreen('home');
              }}
            >
              <Text style={[typography.button, { color: '#fff' }]}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Screen 8: Request Missing Model */}
        {currentScreen === 'request_model' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary }}>← Back</Text>
            </TouchableOpacity>

            <Text style={[typography.h2, { marginBottom: 8 }]}>
              Request Missing Model
            </Text>
            <Text style={[typography.bodySecondary, { marginBottom: 16 }]}>
              Can't find a model in the catalog? Submit details for review.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brand Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Poco, Realme, Infinix"
                value={reqBrandName}
                onChangeText={setReqBrandName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Narzo 50 Pro 5G"
                value={reqModelName}
                onChangeText={setReqModelName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. RMX3395"
                value={reqModelNumber}
                onChangeText={setReqModelNumber}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Additional details..."
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
                await userApi.submitModelRequest({
                  brandName: reqBrandName.trim(),
                  modelName: reqModelName.trim(),
                  modelNumber: reqModelNumber.trim() || undefined,
                  notes: reqNotes.trim() || undefined,
                });
                Alert.alert('Submitted', 'Model request submitted for administrator review.');
                setReqBrandName('');
                setReqModelName('');
                setCurrentScreen('home');
              }}
            >
              <Text style={[typography.button, { color: '#fff' }]}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Screen 9: Profile & Settings */}
        {currentScreen === 'profile' && (
          <View>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentScreen('home')}
            >
              <Text style={{ color: colors.primary }}>← Back to Search</Text>
            </TouchableOpacity>

            <Text style={[typography.h2, { marginBottom: 16 }]}>Account & Profile</Text>

            <View style={styles.card}>
              <Text style={typography.caption}>GOOGLE ACCOUNT</Text>
              <Text style={[typography.h3, { marginBottom: 4 }]}>{currentUser.name}</Text>
              <Text style={typography.bodySecondary}>{currentUser.email}</Text>
            </View>

            <View style={styles.card}>
              <Text style={typography.caption}>PHONE NUMBER</Text>
              <Text style={[typography.body, { marginBottom: 8 }]}>
                {currentUser.phone || 'N/A'}
              </Text>

              <Text style={typography.caption}>SHOP NAME</Text>
              <Text style={[typography.body, { marginBottom: 8 }]}>
                {currentUser.shopName || 'N/A'}
              </Text>

              <Text style={typography.caption}>CITY</Text>
              <Text style={typography.body}>{currentUser.city || 'N/A'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.border, marginBottom: 12 }]}
              onPress={async () => {
                await userApi.logout();
                setCurrentUser(null);
                setCurrentScreen('home');
              }}
            >
              <Text style={[typography.button, { color: colors.textPrimary }]}>
                Sign Out Current Device
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.border, marginBottom: 20 }]}
              onPress={async () => {
                await userApi.logoutAll();
                setCurrentUser(null);
                setCurrentScreen('home');
              }}
            >
              <Text style={[typography.button, { color: colors.textPrimary }]}>
                Sign Out All Devices
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.errorBg }]}
              onPress={handleDeleteAccount}
            >
              <Text style={[typography.button, { color: colors.error }]}>
                Delete MobiMatch Account
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileBtn: {
    padding: spacing.xs,
  },
  scrollContent: {
    padding: spacing.md,
  },
  searchBar: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  searchInput: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  suggestionsBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 16,
  },
  suggestionItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  browseCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  backBtn: {
    marginBottom: 12,
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
    marginBottom: 16,
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
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  modelRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
});

