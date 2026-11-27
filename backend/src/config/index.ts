import dotenv from 'dotenv';
import path from 'path';

// Load .env file if available
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  databaseUrl: string;
  redisUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresIn: number;
  jwtRefreshExpiresIn: number;
  initialAdminEmail: string;
  googleClientIds: string[];
  devMockAuth: boolean;
  demoMode: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  minUserAppVersion: string;
  latestUserAppVersion: string;
  userAppUpdateUrl: string;
  minAdminAppVersion: string;
  latestAdminAppVersion: string;
  adminAppUpdateUrl: string;
  termsUrl: string;
  privacyPolicyUrl: string;
  accountDeletionUrl: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/mobimatch',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET ||
    'mobimatch_access_secret_development_min_32_chars_long',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    'mobimatch_refresh_secret_development_min_32_chars_long',
  jwtAccessExpiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '900', 10), // 15 mins default
  jwtRefreshExpiresIn: parseInt(
    process.env.JWT_REFRESH_EXPIRES_IN || '2592000',
    10
  ), // 30 days default
  initialAdminEmail: (
    process.env.INITIAL_ADMIN_EMAIL ||
    (process.env.NODE_ENV === 'test' ? 'admin@mobimatch.local' : 'Contact.mobimatch@gmail.com')
  )
    .trim()
    .toLowerCase(),
  googleClientIds: (process.env.GOOGLE_CLIENT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  devMockAuth:
    process.env.DEV_MOCK_AUTH === 'true' ||
    process.env.NODE_ENV === 'test' ||
    (process.env.NODE_ENV !== 'production' && !process.env.GOOGLE_CLIENT_IDS),
  demoMode: process.env.DEMO_MODE === 'true',
  maintenanceMode: process.env.APP_MAINTENANCE_MODE === 'true',
  maintenanceMessage:
    process.env.APP_MAINTENANCE_MESSAGE ||
    'MobiMatch is undergoing scheduled maintenance. Please check back shortly.',
  minUserAppVersion: process.env.MIN_USER_APP_VERSION || '1.0.0',
  latestUserAppVersion: process.env.LATEST_USER_APP_VERSION || '1.0.0',
  userAppUpdateUrl:
    process.env.USER_APP_UPDATE_URL ||
    'https://play.google.com/store/apps/details?id=com.mobimatch.app',
  minAdminAppVersion: process.env.MIN_ADMIN_APP_VERSION || '1.0.0',
  latestAdminAppVersion: process.env.LATEST_ADMIN_APP_VERSION || '1.0.0',
  adminAppUpdateUrl:
    process.env.ADMIN_APP_UPDATE_URL || 'https://mobimatch-backend-gw7a.onrender.com/legal/terms',
  termsUrl: process.env.TERMS_URL || 'https://mobimatch-backend-gw7a.onrender.com/legal/terms',
  privacyPolicyUrl:
    process.env.PRIVACY_POLICY_URL || 'https://mobimatch-backend-gw7a.onrender.com/legal/privacy',
  accountDeletionUrl:
    process.env.ACCOUNT_DELETION_URL ||
    'https://mobimatch-backend-gw7a.onrender.com/legal/account-deletion',
};
