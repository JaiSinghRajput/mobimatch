import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { adminApi } from './src/api/client';
import { colors, spacing, typography } from './src/theme';
import {
  ParsePreviewResponse,
  ConflictAction,
  AppConfigResponse,
} from '@mobimatch/api-contracts';

type AdminTab =
  | 'compatibility'
  | 'brands'
  | 'categories'
  | 'models'
  | 'users'
  | 'reports'
  | 'requests'
  | 'allowlist';

function AdminAppContent() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAllowlisted, setIsAllowlisted] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [appConfig, setAppConfig] = useState<AppConfigResponse | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('compatibility');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Tab Title Helpers
  const getTabLabel = (tab: AdminTab) => {
    switch (tab) {
      case 'compatibility': return 'Bulk Compatibility Parser';
      case 'brands': return 'Brands Catalog';
      case 'categories': return 'Spare Part Categories';
      case 'models': return 'Mobile Models';
      case 'users': return 'Technician Accounts';
      case 'reports': return 'Issue Reports';
      case 'requests': return 'Missing Model Requests';
      case 'allowlist': return 'Admin Allowlist';
      default: return 'Admin Dashboard';
    }
  };

  const getTabIcon = (tab: AdminTab) => {
    switch (tab) {
      case 'compatibility': return '⚡';
      case 'brands': return '🏷️';
      case 'categories': return '📂';
      case 'models': return '📱';
      case 'users': return '👥';
      case 'reports': return '⚠️';
      case 'requests': return '❓';
      case 'allowlist': return '🛡️';
      default: return '⚙️';
    }
  };

  // Input States
  const [authEmailInput, setAuthEmailInput] = useState('admin@mobimatch.local');

  // Bulk & Manual Compatibility States
  const [compatMode, setCompatMode] = useState<'parser' | 'manual'>('parser');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [preview, setPreview] = useState<ParsePreviewResponse | null>(null);
  const [conflictResolutions, setConflictResolutions] = useState<
    Record<string, ConflictAction>
  >({});
  const [manualSelectedModels, setManualSelectedModels] = useState<any[]>([]);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualBrandFilter, setManualBrandFilter] = useState<string>('all');

  // Catalog Data States
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [adminsList, setAdminsList] = useState<any[]>([]);

  // Form Modals / New Entry States
  const [newBrandName, setNewBrandName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newModelBrandId, setNewModelBrandId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [newModelNumber, setNewModelNumber] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Initial Config Check
  useEffect(() => {
    adminApi
      .getAppConfig()
      .then(setAppConfig)
      .catch((err) => console.log('Config fetch note:', err.message));
  }, []);

  // Fetch Tab Data
  useEffect(() => {
    if (!currentUser) return;

    if (activeTab === 'compatibility' || activeTab === 'categories') {
      loadCategories();
    }
    if (activeTab === 'compatibility' || activeTab === 'brands' || activeTab === 'models') {
      loadBrands();
      loadModels();
    }
    if (activeTab === 'users') {
      loadUsers();
    }
    if (activeTab === 'reports') {
      loadReports();
    }
    if (activeTab === 'requests') {
      loadRequests();
    }
    if (activeTab === 'allowlist') {
      loadAdmins();
    }
  }, [currentUser, activeTab]);

  // Auth Handler
  const handleSignIn = async () => {
    setLoading(true);
    try {
      // Mock Google Token format for testing/development
      const token = `mock-:${authEmailInput.trim()}:sub-admin-${Date.now()}:Administrator`;
      const res = await adminApi.googleAuth(token);
      setCurrentUser(res.user);
      setIsAllowlisted(true);
    } catch (err: any) {
      if (err.code === 'ADMIN_ACCESS_DENIED') {
        setIsAllowlisted(false);
      } else {
        Alert.alert('Sign In Error', err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await adminApi.logout();
    setCurrentUser(null);
    setPreview(null);
  };

  // Data Loaders
  const loadCategories = async () => {
    try {
      const data = await adminApi.getCategories();
      setCategories(data);
      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id);
      }
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const loadBrands = async () => {
    try {
      const data = await adminApi.getBrands();
      setBrands(data);
      if (data.length > 0 && !newModelBrandId) {
        setNewModelBrandId(data[0].id);
      }
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const loadModels = async () => {
    try {
      const data = await adminApi.getModels();
      setModels(data);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminApi.getUsers();
      setUsersList(data);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const loadReports = async () => {
    try {
      const data = await adminApi.getReports();
      setReportsList(data);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const loadRequests = async () => {
    try {
      const data = await adminApi.getModelRequests();
      setRequestsList(data);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const loadAdmins = async () => {
    try {
      const data = await adminApi.getAdmins();
      setAdminsList(data);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  // Compatibility Parser Preview
  const handleParsePreview = async () => {
    if (!selectedCategoryId) {
      Alert.alert('Category Required', 'Please select a category first.');
      return;
    }
    if (!bulkTextInput.trim()) {
      Alert.alert('Input Required', 'Please enter compatibility text.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminApi.parsePreview(selectedCategoryId, bulkTextInput);
      setPreview(res);
      // Pre-populate merge choices for conflicts
      const initialChoices: Record<string, ConflictAction> = {};
      res.conflicts.forEach((c) => {
        initialChoices[c.modelId] = 'merge';
      });
      setConflictResolutions(initialChoices);
    } catch (err: any) {
      Alert.alert('Preview Error', err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  // Compatibility Publish
  const handlePublish = async () => {
    if (!preview) return;

    // Check if unresolved conflicts remain
    for (const conflict of preview.conflicts) {
      if (!conflictResolutions[conflict.modelId]) {
        Alert.alert(
          'Unresolved Conflict',
          `Please choose 'Merge' or 'Cancel' for conflicting model ${conflict.modelName}.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      const publishLines = preview.lines.map((line) => ({
        models: line.models.map((m) => ({
          brandName: m.suggestedBrandName || m.matchedModel?.brandName || '',
          modelName: m.suggestedModelName || m.matchedModel?.name || m.rawInput,
          modelNumber: m.matchedModel?.modelNumber || null,
          createIfMissing: m.status !== 'matched',
          resolvedModelId: m.matchedModel?.id,
        })),
      }));

      await adminApi.publishCompatibility({
        previewId: preview.previewId,
        categoryId: preview.categoryId,
        lines: publishLines,
        conflictResolutions,
      });

      Alert.alert('Success', 'Compatibility groups published successfully in one atomic transaction!');
      setPreview(null);
      setBulkTextInput('');
    } catch (err: any) {
      Alert.alert('Publish Error', err.message || 'Failed to publish compatibility group');
    } finally {
      setLoading(false);
    }
  };

  // Auto-suggestion for compatibility text input
  const getCurrentTypingToken = (text: string): string => {
    const segments = text.split(/[\n=]/);
    const last = segments[segments.length - 1] || '';
    return last.trim();
  };

  const typingQuery = getCurrentTypingToken(bulkTextInput).toLowerCase();
  const typingSuggestions =
    typingQuery && typingQuery.length >= 1
      ? models
          .filter(
            (m) =>
              m.isActive &&
              (m.name.toLowerCase().includes(typingQuery) ||
                (m.brandName && m.brandName.toLowerCase().includes(typingQuery)) ||
                (m.modelNumber && m.modelNumber.toLowerCase().includes(typingQuery)))
          )
          .slice(0, 8)
      : [];

  const insertSuggestionIntoText = (modelName: string) => {
    const lines = bulkTextInput.split('\n');
    const currentLine = lines[lines.length - 1] || '';
    const tokens = currentLine.split('=');
    tokens[tokens.length - 1] = ' ' + modelName + ' ';
    lines[lines.length - 1] = tokens.join('=');
    setBulkTextInput(lines.join('\n'));
  };

  // Manual Pairing Handlers
  const handleToggleManualModel = (model: any) => {
    if (manualSelectedModels.some((m) => m.id === model.id)) {
      setManualSelectedModels(manualSelectedModels.filter((m) => m.id !== model.id));
    } else {
      setManualSelectedModels([...manualSelectedModels, model]);
    }
  };

  const handlePublishManualPairing = async () => {
    if (!selectedCategoryId) {
      Alert.alert('Category Required', 'Please select a spare part category first.');
      return;
    }
    if (manualSelectedModels.length < 2) {
      Alert.alert(
        'At Least 2 Models Required',
        'Please select at least 2 compatible models to create a pairing group.'
      );
      return;
    }

    setLoading(true);
    try {
      const lineText = manualSelectedModels.map((m) => m.name).join(' = ');
      const prev = await adminApi.parsePreview(selectedCategoryId, lineText);

      if (prev.conflicts && prev.conflicts.length > 0) {
        setPreview(prev);
        setCompatMode('parser');
        Alert.alert(
          'Conflict Detected',
          'One or more of the selected models is already linked in an active group. Review conflict cards below.'
        );
        return;
      }

      const publishLines = prev.lines.map((line) => ({
        models: line.models.map((m) => ({
          brandName: m.suggestedBrandName || m.matchedModel?.brandName || '',
          modelName: m.suggestedModelName || m.matchedModel?.name || m.rawInput,
          modelNumber: m.matchedModel?.modelNumber || null,
          createIfMissing: m.status !== 'matched',
          resolvedModelId: m.matchedModel?.id,
        })),
      }));

      await adminApi.publishCompatibility({
        previewId: prev.previewId,
        categoryId: prev.categoryId,
        lines: publishLines,
        conflictResolutions: {},
      });

      Alert.alert(
        'Success',
        `Successfully linked ${manualSelectedModels.length} models as compatible for this category!`
      );
      setManualSelectedModels([]);
    } catch (err: any) {
      Alert.alert('Publish Error', err.message || 'Failed to publish compatibility group');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Render: Access Denied Screen
  // ==========================================
  if (!isAllowlisted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerCard}>
          <Text style={[typography.h1, { color: colors.error, marginBottom: 12 }]}>
            Access Denied
          </Text>
          <Text style={[typography.body, { textAlign: 'center', marginBottom: 20 }]}>
            Your Google account ({authEmailInput}) is not listed on the MobiMatch
            administrator allowlist. Only authorized administrators can access this app.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => setIsAllowlisted(true)}
          >
            <Text style={[typography.button, { color: '#fff' }]}>
              Try Different Account
            </Text>
          </TouchableOpacity>
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
            MobiMatch Admin
          </Text>
          <Text style={[typography.bodySecondary, { textAlign: 'center', marginBottom: 24 }]}>
            Administrator Portal for Spare-Parts Compatibility & Catalog Management
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Administrator Google Email</Text>
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
                Sign In with Google
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // Render: Main Admin Dashboard
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header with Single Prominent Drawer Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.bigHamburgerBtn}
            onPress={() => setSidebarOpen(true)}
            accessibilityLabel="Open Navigation Menu"
          >
            <View style={styles.bigHamburgerBar} />
            <View style={styles.bigHamburgerBar} />
            <View style={styles.bigHamburgerBar} />
          </TouchableOpacity>
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.headerTitle}>MobiMatch Admin</Text>
            <Text style={styles.headerSubtitle}>
              {getTabIcon(activeTab)} {getTabLabel(activeTab)}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.headerRightEmail} numberOfLines={1}>
            {currentUser.email?.split('@')[0]}
          </Text>
        </View>
      </View>

      {/* Collapsible Sidebar Overlay */}
      {sidebarOpen && (
        <View style={styles.sidebarOverlay}>
          {/* Backdrop Tap-to-Close */}
          <TouchableOpacity
            style={styles.sidebarBackdrop}
            activeOpacity={1}
            onPress={() => setSidebarOpen(false)}
          />

          {/* Drawer Container */}
          <View style={styles.sidebarDrawer}>
            {/* Drawer Header */}
            <View style={styles.sidebarHeader}>
              <View>
                <Text style={styles.sidebarAppTitle}>MobiMatch Admin</Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Authorized Admin</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSidebarOpen(false)}
                accessibilityLabel="Close Navigation"
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Admin Profile Card */}
            <View style={styles.sidebarUserCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(currentUser.email?.[0] || 'A').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sidebarUserEmail} numberOfLines={1}>
                  {currentUser.email}
                </Text>
                <Text style={styles.sidebarUserRole}>Super Administrator</Text>
              </View>
            </View>

            {/* Navigation Drawer Items */}
            <ScrollView style={styles.sidebarNavScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.navSectionHeader}>CORE ENGINE</Text>
              <TouchableOpacity
                style={[styles.navItem, activeTab === 'compatibility' && styles.navItemActive]}
                onPress={() => {
                  setActiveTab('compatibility');
                  setPreview(null);
                  setSidebarOpen(false);
                }}
              >
                <Text style={styles.navItemIcon}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.navItemText, activeTab === 'compatibility' && styles.navItemTextActive]}>
                    Compatibility Parser
                  </Text>
                  <Text style={styles.navItemDesc}>Bulk multiline '=' publish</Text>
                </View>
                {activeTab === 'compatibility' && <View style={styles.activePill} />}
              </TouchableOpacity>

              <Text style={styles.navSectionHeader}>CATALOG MANAGEMENT</Text>
              {[
                { key: 'brands', label: 'Brands', icon: '🏷️', desc: 'Device manufacturers' },
                { key: 'categories', label: 'Categories', icon: '📂', desc: 'Spare part types' },
                { key: 'models', label: 'Mobile Models', icon: '📱', desc: 'Models & model numbers' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.navItem, activeTab === item.key && styles.navItemActive]}
                  onPress={() => {
                    setActiveTab(item.key as AdminTab);
                    setPreview(null);
                    setSidebarOpen(false);
                  }}
                >
                  <Text style={styles.navItemIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.navItemText, activeTab === item.key && styles.navItemTextActive]}>
                      {item.label}
                    </Text>
                    <Text style={styles.navItemDesc}>{item.desc}</Text>
                  </View>
                  {activeTab === item.key && <View style={styles.activePill} />}
                </TouchableOpacity>
              ))}

              <Text style={styles.navSectionHeader}>MODERATION & AUDIT</Text>
              {[
                { key: 'users', label: 'Technician Users', icon: '👥', desc: 'User accounts & profiles' },
                { key: 'reports', label: 'Issue Reports', icon: '⚠️', desc: 'Compatibility bug reports' },
                { key: 'requests', label: 'Missing Models', icon: '❓', desc: 'Technician model requests' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.navItem, activeTab === item.key && styles.navItemActive]}
                  onPress={() => {
                    setActiveTab(item.key as AdminTab);
                    setPreview(null);
                    setSidebarOpen(false);
                  }}
                >
                  <Text style={styles.navItemIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.navItemText, activeTab === item.key && styles.navItemTextActive]}>
                      {item.label}
                    </Text>
                    <Text style={styles.navItemDesc}>{item.desc}</Text>
                  </View>
                  {activeTab === item.key && <View style={styles.activePill} />}
                </TouchableOpacity>
              ))}

              <Text style={styles.navSectionHeader}>SECURITY & ACCESS</Text>
              <TouchableOpacity
                style={[styles.navItem, activeTab === 'allowlist' && styles.navItemActive]}
                onPress={() => {
                  setActiveTab('allowlist');
                  setPreview(null);
                  setSidebarOpen(false);
                }}
              >
                <Text style={styles.navItemIcon}>🛡️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.navItemText, activeTab === 'allowlist' && styles.navItemTextActive]}>
                    Admin Allowlist
                  </Text>
                  <Text style={styles.navItemDesc}>Manage authorized admins</Text>
                </View>
                {activeTab === 'allowlist' && <View style={styles.activePill} />}
              </TouchableOpacity>
            </ScrollView>

            {/* Drawer Footer */}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity
                style={styles.sidebarLogoutBtn}
                onPress={() => {
                  setSidebarOpen(false);
                  handleSignOut();
                }}
              >
                <Text style={styles.sidebarLogoutText}>🚪 Sign Out</Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>MobiMatch Admin • SDK 58</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tab Contents */}
      <ScrollView style={styles.scrollContent}>
        {/* 1. Compatibility Tab */}
        {activeTab === 'compatibility' && (
          <View>
            {/* Mode Switcher */}
            <View style={styles.compatModeSwitcher}>
              <TouchableOpacity
                style={[
                  styles.compatModeBtn,
                  compatMode === 'parser' && styles.compatModeBtnActive,
                ]}
                onPress={() => setCompatMode('parser')}
              >
                <Text
                  style={[
                    styles.compatModeBtnText,
                    compatMode === 'parser' && styles.compatModeBtnTextActive,
                  ]}
                >
                  ⚡ Bulk Text Parser
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.compatModeBtn,
                  compatMode === 'manual' && styles.compatModeBtnActive,
                ]}
                onPress={() => setCompatMode('manual')}
              >
                <Text
                  style={[
                    styles.compatModeBtnText,
                    compatMode === 'manual' && styles.compatModeBtnTextActive,
                  ]}
                >
                  🔗 Manual Group Pairing
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mode A: Bulk Text Parser */}
            {compatMode === 'parser' && (
              <View>
                <Text style={[typography.h3, { marginBottom: 6 }]}>
                  Bulk Compatibility Text Parser
                </Text>
                <Text style={[typography.bodySecondary, { marginBottom: 14 }]}>
                  Select category, then paste lines with '=' separating models (e.g.{' '}
                  <Text style={{ fontWeight: 'bold' }}>
                    Redmi Note 10 = Redmi Note 10S = Redmi Note 11
                  </Text>
                  ).
                </Text>

                {/* Category Selector */}
                <Text style={styles.label}>Select Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.chip,
                        selectedCategoryId === c.id && styles.chipActive,
                      ]}
                      onPress={() => setSelectedCategoryId(c.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedCategoryId === c.id && styles.chipTextActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.label}>Compatibility Input Text</Text>
                <TextInput
                  style={[styles.input, { height: 110, textAlignVertical: 'top' }]}
                  multiline
                  numberOfLines={4}
                  placeholder="Redmi Note 10 = Redmi Note 10S&#10;Samsung A52 = Samsung A52s"
                  value={bulkTextInput}
                  onChangeText={setBulkTextInput}
                />

                {/* Live Model Suggestions Box */}
                {typingSuggestions.length > 0 && (
                  <View style={styles.suggestionsBox}>
                    <Text style={styles.suggestionsTitle}>
                      💡 Database Suggestions for "{typingQuery}" (tap to insert):
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {typingSuggestions.map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={styles.suggestionChip}
                          onPress={() => insertSuggestionIntoText(m.name)}
                        >
                          <Text style={styles.suggestionBrand}>{m.brandName || 'Brand'}</Text>
                          <Text style={styles.suggestionName}>{m.name}</Text>
                          {m.modelNumber ? (
                            <Text style={styles.suggestionNumber}>({m.modelNumber})</Text>
                          ) : null}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary, marginTop: 12 }]}
                  onPress={handleParsePreview}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[typography.button, { color: '#fff' }]}>
                      Preview & Validate
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Preview Section */}
                {preview && (
                  <View style={styles.previewBox}>
                    <Text style={[typography.h3, { marginBottom: 8 }]}>
                      Parser Preview ({preview.categoryName})
                    </Text>
                    <Text style={typography.bodySecondary}>
                      Total Valid Groups: {preview.totalGroups}
                    </Text>

                    {preview.missingBrands.length > 0 && (
                      <View style={[styles.alertBadge, { backgroundColor: colors.warningBg }]}>
                        <Text style={{ color: colors.warning, fontWeight: '600' }}>
                          New Brands to Create: {preview.missingBrands.join(', ')}
                        </Text>
                      </View>
                    )}

                    {preview.conflicts.length > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={[typography.h3, { color: colors.error, marginBottom: 8 }]}>
                          Conflicts Detected ({preview.conflicts.length})
                        </Text>
                        {preview.conflicts.map((conflict) => (
                          <View key={conflict.modelId} style={styles.conflictCard}>
                            <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                              {conflict.brandName} {conflict.modelName}
                            </Text>
                            <Text style={typography.caption}>
                              Already belongs to an active group with{' '}
                              {conflict.existingGroupMemberCount} models.
                            </Text>
                            <View style={styles.conflictActions}>
                              <TouchableOpacity
                                style={[
                                  styles.smallBtn,
                                  conflictResolutions[conflict.modelId] === 'merge'
                                    ? { backgroundColor: colors.primary }
                                    : { backgroundColor: colors.border },
                                ]}
                                onPress={() =>
                                  setConflictResolutions((prev) => ({
                                    ...prev,
                                    [conflict.modelId]: 'merge',
                                  }))
                                }
                              >
                                <Text
                                  style={{
                                    color:
                                      conflictResolutions[conflict.modelId] === 'merge'
                                        ? '#fff'
                                        : colors.textPrimary,
                                    fontSize: 12,
                                    fontWeight: '600',
                                  }}
                                >
                                  Merge (Move to New Group)
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.smallBtn,
                                  conflictResolutions[conflict.modelId] === 'cancel'
                                    ? { backgroundColor: colors.error }
                                    : { backgroundColor: colors.border },
                                ]}
                                onPress={() =>
                                  setConflictResolutions((prev) => ({
                                    ...prev,
                                    [conflict.modelId]: 'cancel',
                                  }))
                                }
                              >
                                <Text
                                  style={{
                                    color:
                                      conflictResolutions[conflict.modelId] === 'cancel'
                                        ? '#fff'
                                        : colors.textPrimary,
                                    fontSize: 12,
                                    fontWeight: '600',
                                  }}
                                >
                                  Cancel (Keep in Old)
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.button,
                        {
                          backgroundColor: colors.success,
                          marginTop: 16,
                        },
                      ]}
                      onPress={handlePublish}
                      disabled={loading}
                    >
                      <Text style={[typography.button, { color: '#fff' }]}>
                        Confirm & Publish Compatibility Group
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Mode B: Manual Group Pairing */}
            {compatMode === 'manual' && (
              <View>
                <Text style={[typography.h3, { marginBottom: 6 }]}>
                  Manual Group & Individual Pairing
                </Text>
                <Text style={[typography.bodySecondary, { marginBottom: 14 }]}>
                  Select category, then choose 2 or more models below to link as compatible.
                </Text>

                {/* 1. Category Selector */}
                <Text style={styles.label}>1. Select Spare Part Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.chip,
                        selectedCategoryId === c.id && styles.chipActive,
                      ]}
                      onPress={() => setSelectedCategoryId(c.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedCategoryId === c.id && styles.chipTextActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* 2. Group Staging Box */}
                <View style={styles.stagingBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[typography.h3, { fontSize: 14 }]}>
                      2. Staged Models ({manualSelectedModels.length})
                    </Text>
                    {manualSelectedModels.length > 0 && (
                      <TouchableOpacity onPress={() => setManualSelectedModels([])}>
                        <Text style={{ color: colors.error, fontSize: 12, fontWeight: '700' }}>Clear All</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {manualSelectedModels.length === 0 ? (
                    <Text style={[typography.caption, { fontStyle: 'italic', paddingVertical: 8 }]}>
                      No models selected yet. Search and tap "+ Add to Group" on models below.
                    </Text>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {manualSelectedModels.map((m) => (
                        <View key={m.id} style={styles.stagedModelChip}>
                          <Text style={styles.stagedModelText}>
                            📱 {m.brandName ? `${m.brandName} ` : ''}{m.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleToggleManualModel(m)}
                            style={{ paddingLeft: 6 }}
                          >
                            <Text style={{ color: colors.error, fontWeight: '700', fontSize: 13 }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        backgroundColor:
                          manualSelectedModels.length >= 2 ? colors.primary : colors.borderDark,
                      },
                    ]}
                    onPress={handlePublishManualPairing}
                    disabled={manualSelectedModels.length < 2 || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={[typography.button, { color: '#fff' }]}>
                        ⚡ Publish Compatibility Group ({manualSelectedModels.length} models)
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* 3. Catalog Picker */}
                <Text style={[styles.label, { marginTop: 14 }]}>3. Pick Models from Database</Text>
                <TextInput
                  style={[styles.input, { marginBottom: 8 }]}
                  placeholder="Filter models by name or number (e.g. Note 10, A52)..."
                  value={manualSearchQuery}
                  onChangeText={setManualSearchQuery}
                />

                {/* Brand Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      manualBrandFilter === 'all' && styles.chipActive,
                    ]}
                    onPress={() => setManualBrandFilter('all')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        manualBrandFilter === 'all' && styles.chipTextActive,
                      ]}
                    >
                      All Brands
                    </Text>
                  </TouchableOpacity>
                  {brands.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.chip,
                        manualBrandFilter === b.id && styles.chipActive,
                      ]}
                      onPress={() => setManualBrandFilter(b.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          manualBrandFilter === b.id && styles.chipTextActive,
                        ]}
                      >
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Models List */}
                {models
                  .filter((m) => {
                    if (!m.isActive) return false;
                    if (manualBrandFilter !== 'all' && m.brandId !== manualBrandFilter) return false;
                    if (manualSearchQuery.trim()) {
                      const q = manualSearchQuery.toLowerCase();
                      const matchName = m.name?.toLowerCase().includes(q);
                      const matchBrand = m.brandName?.toLowerCase().includes(q);
                      const matchNum = m.modelNumber?.toLowerCase().includes(q);
                      if (!matchName && !matchBrand && !matchNum) return false;
                    }
                    return true;
                  })
                  .slice(0, 30)
                  .map((m) => {
                    const isSelected = manualSelectedModels.some((sm) => sm.id === m.id);
                    return (
                      <View key={m.id} style={styles.listItem}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                            {m.brandName ? `${m.brandName} ` : ''}{m.name}
                          </Text>
                          {m.modelNumber ? (
                            <Text style={typography.caption}>Model No: {m.modelNumber}</Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.smallBtn,
                            {
                              backgroundColor: isSelected ? colors.successBg : colors.primaryLight,
                              borderWidth: 1,
                              borderColor: isSelected ? colors.success : colors.primary,
                            },
                          ]}
                          onPress={() => handleToggleManualModel(m)}
                        >
                          <Text
                            style={{
                              color: isSelected ? colors.success : colors.primary,
                              fontSize: 12,
                              fontWeight: '700',
                            }}
                          >
                            {isSelected ? '✓ In Group' : '+ Add to Group'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </View>
            )}
          </View>
        )}

        {/* 2. Brands Tab */}
        {activeTab === 'brands' && (
          <View>
            <Text style={[typography.h3, { marginBottom: 8 }]}>Add New Brand</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Brand Name (e.g. Motorola)"
                value={newBrandName}
                onChangeText={setNewBrandName}
              />
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: colors.primary, height: 44 }]}
                onPress={async () => {
                  if (!newBrandName.trim()) return;
                  try {
                    await adminApi.createBrand(newBrandName.trim());
                    setNewBrandName('');
                    loadBrands();
                  } catch (e: any) {
                    Alert.alert('Error', e.message || 'Cannot create brand');
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={[typography.h3, { marginBottom: 12 }]}>All Brands</Text>
            {brands.map((b) => (
              <View key={b.id} style={styles.listItem}>
                <View>
                  <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                    {b.name}
                  </Text>
                  <Text style={typography.caption}>
                    Status: {b.isActive ? 'Active' : 'Deactivated'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.smallBtn,
                    { backgroundColor: b.isActive ? colors.errorBg : colors.successBg },
                  ]}
                  onPress={async () => {
                    try {
                      if (b.isActive) {
                        await adminApi.deactivateBrand(b.id);
                      } else {
                        await adminApi.reactivateBrand(b.id);
                      }
                      loadBrands();
                    } catch (e: any) {
                      Alert.alert('Error', e.message || 'Cannot update brand');
                    }
                  }}
                >
                  <Text
                    style={{
                      color: b.isActive ? colors.error : colors.success,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {b.isActive ? 'Deactivate' : 'Reactivate'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 3. Categories Tab */}
        {activeTab === 'categories' && (
          <View>
            <Text style={[typography.h3, { marginBottom: 8 }]}>Add New Category</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Category Name (e.g. Charging Flex)"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: colors.primary, height: 44 }]}
                onPress={async () => {
                  if (!newCategoryName.trim()) return;
                  try {
                    await adminApi.createCategory(newCategoryName.trim());
                    setNewCategoryName('');
                    loadCategories();
                  } catch (e: any) {
                    Alert.alert('Error', e.message || 'Cannot create category');
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={[typography.h3, { marginBottom: 12 }]}>All Categories</Text>
            {categories.map((c) => (
              <View key={c.id} style={styles.listItem}>
                <View>
                  <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                    {c.name}
                  </Text>
                  <Text style={typography.caption}>
                    Status: {c.isActive ? 'Active' : 'Deactivated'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.smallBtn,
                    { backgroundColor: c.isActive ? colors.errorBg : colors.successBg },
                  ]}
                  onPress={async () => {
                    try {
                      if (c.isActive) {
                        await adminApi.deactivateCategory(c.id);
                      } else {
                        await adminApi.reactivateCategory(c.id);
                      }
                      loadCategories();
                    } catch (e: any) {
                      Alert.alert('Error', e.message || 'Cannot update category');
                    }
                  }}
                >
                  <Text
                    style={{
                      color: c.isActive ? colors.error : colors.success,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {c.isActive ? 'Deactivate' : 'Reactivate'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 4. Models Tab */}
        {activeTab === 'models' && (
          <View>
            <Text style={[typography.h3, { marginBottom: 8 }]}>Create New Model</Text>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Select Brand</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {brands.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.chip,
                      newModelBrandId === b.id && styles.chipActive,
                    ]}
                    onPress={() => setNewModelBrandId(b.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        newModelBrandId === b.id && styles.chipTextActive,
                      ]}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.input, { marginBottom: 8 }]}
                placeholder="Model Name (e.g. Galaxy A53)"
                value={newModelName}
                onChangeText={setNewModelName}
              />
              <TextInput
                style={[styles.input, { marginBottom: 12 }]}
                placeholder="Optional Model Number (e.g. SM-A536B)"
                value={newModelNumber}
                onChangeText={setNewModelNumber}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  if (!newModelBrandId || !newModelName.trim()) return;
                  try {
                    await adminApi.createModel(newModelBrandId, newModelName.trim(), newModelNumber.trim() || undefined);
                    setNewModelName('');
                    setNewModelNumber('');
                    loadModels();
                  } catch (e: any) {
                    Alert.alert('Error', e.message || 'Cannot create model');
                  }
                }}
              >
                <Text style={[typography.button, { color: '#fff' }]}>Create Model</Text>
              </TouchableOpacity>
            </View>

            <Text style={[typography.h3, { marginTop: 16, marginBottom: 12 }]}>All Models</Text>
            {models.map((m) => (
              <View key={m.id} style={styles.listItem}>
                <View>
                  <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                    {m.brandName} {m.name}
                  </Text>
                  <Text style={typography.caption}>
                    {m.modelNumber ? `Model No: ${m.modelNumber} | ` : ''}
                    {m.isActive ? 'Active' : 'Deactivated'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.smallBtn,
                    { backgroundColor: m.isActive ? colors.errorBg : colors.successBg },
                  ]}
                  onPress={async () => {
                    try {
                      if (m.isActive) {
                        await adminApi.deactivateModel(m.id);
                      } else {
                        await adminApi.reactivateModel(m.id);
                      }
                      loadModels();
                    } catch (e: any) {
                      Alert.alert('Error', e.message || 'Cannot update model');
                    }
                  }}
                >
                  <Text
                    style={{
                      color: m.isActive ? colors.error : colors.success,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {m.isActive ? 'Deactivate' : 'Reactivate'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 5. Users Tab */}
        {activeTab === 'users' && (
          <View>
            <Text style={[typography.h3, { marginBottom: 12 }]}>Registered Users</Text>
            {usersList.map((u) => (
              <View key={u.id} style={styles.listItem}>
                <View>
                  <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                    {u.name} ({u.email})
                  </Text>
                  <Text style={typography.caption}>
                    Shop: {u.shopName || 'N/A'} | City: {u.city || 'N/A'} | Status:{' '}
                    {u.status}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.smallBtn,
                    {
                      backgroundColor:
                        u.status === 'active' ? colors.errorBg : colors.successBg,
                    },
                  ]}
                  onPress={async () => {
                    try {
                      if (u.status === 'active') {
                        await adminApi.deactivateUser(u.id);
                      } else {
                        await adminApi.reactivateUser(u.id);
                      }
                      loadUsers();
                    } catch (e: any) {
                      Alert.alert('Error', e.message || 'Cannot update user status');
                    }
                  }}
                >
                  <Text
                    style={{
                      color: u.status === 'active' ? colors.error : colors.success,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 6. Reports Tab */}
        {activeTab === 'reports' && (
          <View>
            <Text style={[typography.h3, { marginBottom: 12 }]}>Issue Reports</Text>
            {reportsList.map((r) => (
              <View key={r.id} style={styles.card}>
                <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                  Type: {r.type}
                </Text>
                <Text style={typography.caption}>
                  Status: {r.status} | Date: {new Date(r.createdAt).toLocaleDateString()}
                </Text>
                {r.description && (
                  <Text style={[typography.bodySecondary, { marginTop: 6 }]}>
                    "{r.description}"
                  </Text>
                )}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {['open', 'reviewing', 'resolved', 'rejected'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.smallBtn,
                        r.status === st
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.border },
                      ]}
                      onPress={async () => {
                        try {
                          await adminApi.updateReportStatus(r.id, st);
                          loadReports();
                        } catch (e: any) {
                          Alert.alert('Error', e.message || 'Cannot update report');
                        }
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: r.status === st ? '#fff' : colors.textPrimary,
                        }}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 7. Requests Tab */}
        {activeTab === 'requests' && (
          <View>
            <Text style={[typography.h3, { marginBottom: 12 }]}>
              Missing Model Requests
            </Text>
            {requestsList.map((req) => (
              <View key={req.id} style={styles.card}>
                <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                  {req.brandNameSubmitted} {req.modelNameSubmitted}
                </Text>
                <Text style={typography.caption}>
                  Model No: {req.modelNumberSubmitted || 'N/A'} | Status: {req.status}
                </Text>
                {req.notes && (
                  <Text style={[typography.bodySecondary, { marginTop: 6 }]}>
                    Notes: {req.notes}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: colors.successBg }]}
                    onPress={async () => {
                      try {
                        await adminApi.updateModelRequestStatus(req.id, 'approved');
                        loadRequests();
                      } catch (e: any) {
                        Alert.alert('Error', e.message || 'Cannot approve request');
                      }
                    }}
                  >
                    <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>
                      Approve
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: colors.errorBg }]}
                    onPress={async () => {
                      try {
                        await adminApi.updateModelRequestStatus(req.id, 'rejected');
                        loadRequests();
                      } catch (e: any) {
                        Alert.alert('Error', e.message || 'Cannot reject request');
                      }
                    }}
                  >
                    <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>
                      Reject
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 8. Allowlist Tab */}
        {activeTab === 'allowlist' && (
          <View>
            <Text style={[typography.h3, { marginBottom: 8 }]}>Add Admin Email</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="admin@example.com"
                value={newAdminEmail}
                onChangeText={setNewAdminEmail}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: colors.primary, height: 44 }]}
                onPress={async () => {
                  if (!newAdminEmail.trim()) return;
                  try {
                    await adminApi.addAdmin(newAdminEmail.trim());
                    setNewAdminEmail('');
                    loadAdmins();
                  } catch (e: any) {
                    Alert.alert('Error', e.message || 'Cannot add admin');
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={[typography.h3, { marginBottom: 12 }]}>
              Allowlisted Administrators
            </Text>
            {adminsList.map((adm) => (
              <View key={adm.id} style={styles.listItem}>
                <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                  {adm.emailNormalized}
                </Text>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: colors.errorBg }]}
                  onPress={async () => {
                    try {
                      await adminApi.removeAdmin(adm.id);
                      loadAdmins();
                    } catch (e: any) {
                      Alert.alert('Error', e.message || 'Cannot remove admin');
                    }
                  }}
                >
                  <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bigHamburgerBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bigHamburgerBar: {
    width: 22,
    height: 3,
    backgroundColor: colors.textPrimary,
    borderRadius: 2,
    marginVertical: 2.2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRightEmail: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    maxWidth: 100,
  },
  compatModeSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compatModeBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  compatModeBtnActive: {
    backgroundColor: colors.primary,
    elevation: 2,
  },
  compatModeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  compatModeBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  suggestionsBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    marginRight: 6,
    elevation: 1,
  },
  suggestionBrand: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
  suggestionName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  suggestionNumber: {
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: 3,
  },
  stagingBox: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    marginBottom: 14,
    elevation: 1,
  },
  stagedModelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  stagedModelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  sidebarDrawer: {
    width: 290,
    height: '100%',
    backgroundColor: colors.surface,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 16,
    paddingBottom: 20,
    paddingHorizontal: spacing.md,
    zIndex: 1000,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sidebarAppTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sidebarUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  sidebarUserEmail: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sidebarUserRole: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sidebarNavScroll: {
    flex: 1,
  },
  navSectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 5,
    paddingLeft: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: colors.primaryLight,
  },
  navItemIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  navItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  navItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  navItemDesc: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  activePill: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sidebarFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sidebarLogoutBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    marginBottom: 6,
  },
  sidebarLogoutText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 13,
  },
  versionText: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  scrollContent: {
    padding: spacing.md,
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
  button: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  previewBox: {
    marginTop: 20,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertBadge: {
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  conflictCard: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  conflictActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AdminAppContent />
    </SafeAreaProvider>
  );
}

