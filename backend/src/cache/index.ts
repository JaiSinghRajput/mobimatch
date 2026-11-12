import Redis from 'ioredis';
import { config } from '../config';

let redisClient: Redis | null = null;
let isConnected = false;

export function getRedisClient(): Redis | null {
  if (!redisClient && config.redisUrl) {
    try {
      redisClient = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        connectTimeout: 3000,
        retryStrategy(times) {
          if (times > 3) {
            return null; // Stop retrying after 3 attempts
          }
          return Math.min(times * 500, 2000);
        },
        lazyConnect: true,
      });

      redisClient.on('connect', () => {
        isConnected = true;
        console.log('Connected to Redis cache.');
      });

      redisClient.on('error', (err) => {
        isConnected = false;
        // Do not crash, treat Redis as optional cache
        console.warn('Redis warning (operating in safe direct DB fallback mode):', err.message);
      });

      redisClient.on('close', () => {
        isConnected = false;
      });

      // Attempt initial connection asynchronously
      redisClient.connect().catch((err) => {
        isConnected = false;
        console.warn('Could not establish initial Redis connection. Operating in DB fallback mode.');
      });
    } catch (e) {
      console.warn('Failed to initialize Redis client. Falling back directly to DB.');
      redisClient = null;
      isConnected = false;
    }
  }
  return redisClient;
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client || !isConnected) return null;

  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Cache read error for key ${key}:`, (err as Error).message);
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = getRedisClient();
  if (!client || !isConnected) return;

  try {
    const serialized = JSON.stringify(value);
    await client.set(key, serialized, 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`Cache write error for key ${key}:`, (err as Error).message);
  }
}

export async function invalidateCacheKeys(patterns: string[]): Promise<void> {
  const client = getRedisClient();
  if (!client || !isConnected) return;

  try {
    for (const pattern of patterns) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    }
  } catch (err) {
    console.warn('Cache invalidation error:', (err as Error).message);
  }
}

export async function invalidateCatalogCache(): Promise<void> {
  await invalidateCacheKeys([
    'mobimatch:brands*',
    'mobimatch:categories*',
    'mobimatch:search*',
    'mobimatch:compat*',
  ]);
}

export function isCacheReady(): boolean {
  return isConnected;
}

export async function closeCache(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }
    redisClient = null;
    isConnected = false;
  }
}
