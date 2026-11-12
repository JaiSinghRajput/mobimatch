import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'expo-status-bar';
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAllowlisted, setIsAllowlisted] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [appConfig, setAppConfig] = useState<AppConfigResponse | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('compatibility');

  // Input States
  const [authEmailInput, setAuthEmailInput] = useState('admin@mobimatch.local');

  // Bulk Compatibility States
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [preview, setPreview] = useState<ParsePreviewResponse | null>(null);
  const [conflictResolutions, setConflictResolutions] = useState<
    Record<string, ConflictAction>
  >({});

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
    if (activeTab === 'brands' || activeTab === 'models') {
      loadBrands();
    }
    if (activeTab === 'models') {
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
        alert(err.message || 'Failed to sign in');
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
      alert('Please select a category first.');
      return;
    }
    if (!bulkTextInput.trim()) {
      alert('Please enter compatibility text.');
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
      alert(err.message || 'Failed to generate preview');
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
        alert(
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

      alert('Compatibility groups published successfully in one atomic transaction!');
      setPreview(null);
      setBulkTextInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to publish compatibility group');
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
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={typography.h2}>MobiMatch Admin</Text>
          <Text style={typography.caption}>{currentUser.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Text style={{ color: colors.error, fontWeight: '600' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsNav}>
        {[
          { key: 'compatibility', label: 'Compatibility' },
          { key: 'brands', label: 'Brands' },
          { key: 'categories', label: 'Categories' },
          { key: 'models', label: 'Models' },
          { key: 'users', label: 'Users' },
          { key: 'reports', label: 'Reports' },
          { key: 'requests', label: 'Requests' },
          { key: 'allowlist', label: 'Allowlist' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => {
              setActiveTab(tab.key as AdminTab);
              setPreview(null);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Contents */}
      <ScrollView style={styles.scrollContent}>
        {/* 1. Compatibility Tab */}
        {activeTab === 'compatibility' && (
          <View>
            <Text style={[typography.h3, { marginBottom: 12 }]}>
              Bulk Compatibility Text Parser
            </Text>
            <Text style={[typography.bodySecondary, { marginBottom: 16 }]}>
              Select category, then paste lines with '=' separating models (e.g.{' '}
              <Text style={{ fontWeight: 'bold' }}>
                Redmi Note 10 = Redmi Note 10S = Redmi Note 11
              </Text>
              ).
            </Text>

            {/* Category Selector */}
            <Text style={styles.label}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
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
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
              multiline
              numberOfLines={5}
              placeholder="Redmi Note 10 = Redmi Note 10S&#10;Samsung A52 = Samsung A52s"
              value={bulkTextInput}
              onChangeText={setBulkTextInput}
            />

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
                  await adminApi.createBrand(newBrandName);
                  setNewBrandName('');
                  loadBrands();
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
                    if (b.isActive) {
                      await adminApi.deactivateBrand(b.id);
                    } else {
                      await adminApi.reactivateBrand(b.id);
                    }
                    loadBrands();
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
                  await adminApi.createCategory(newCategoryName);
                  setNewCategoryName('');
                  loadCategories();
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
                    if (c.isActive) {
                      await adminApi.deactivateCategory(c.id);
                    } else {
                      await adminApi.reactivateCategory(c.id);
                    }
                    loadCategories();
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
                  await adminApi.createModel(newModelBrandId, newModelName, newModelNumber);
                  setNewModelName('');
                  setNewModelNumber('');
                  loadModels();
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
                    if (m.isActive) {
                      await adminApi.deactivateModel(m.id);
                    } else {
                      await adminApi.reactivateModel(m.id);
                    }
                    loadModels();
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
                    if (u.status === 'active') {
                      await adminApi.deactivateUser(u.id);
                    } else {
                      await adminApi.reactivateUser(u.id);
                    }
                    loadUsers();
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
                        await adminApi.updateReportStatus(r.id, st);
                        loadReports();
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
                      await adminApi.updateModelRequestStatus(req.id, 'approved');
                      loadRequests();
                    }}
                  >
                    <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>
                      Approve
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: colors.errorBg }]}
                    onPress={async () => {
                      await adminApi.updateModelRequestStatus(req.id, 'rejected');
                      loadRequests();
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
                  await adminApi.addAdmin(newAdminEmail);
                  setNewAdminEmail('');
                  loadAdmins();
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
                      alert(e.message || 'Cannot remove admin');
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
    paddingTop: StatusBar.currentHeight || 20,
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
  logoutBtn: {
    padding: spacing.xs,
  },
  tabsNav: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
    maxHeight: 50,
  },
  tabItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.xs,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
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
