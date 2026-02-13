/**
 * Simple in-memory cache with TTL support
 * Used to avoid duplicate API requests
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 60000; // 1 minute default

  /**
   * Get a cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in the cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys that start with a prefix
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get size of cache
   */
  get size(): number {
    return this.cache.size;
  }
}

// Export a singleton instance
export const apiCache = new SimpleCache();

// Cache key builders
export const CacheKeys = {
  publishedRoutes: () => 'routes:published',
  routeById: (id: string) => `routes:id:${id}`,
  routeBySlug: (slug: string) => `routes:slug:${slug}`,
  routeWaypoints: (routeId: string) => `routes:waypoints:${routeId}`,
  businessesNearRoute: (routeId: string, radius: number) => `routes:businesses:${routeId}:${radius}`,
  allBusinesses: () => 'businesses:all',
  businessesByType: (type: string) => `businesses:type:${type}`,
  businessById: (id: string) => `businesses:id:${id}`,
  searchBusinesses: (query: string) => `businesses:search:${query}`,
} as const;

// TTL constants
export const CacheTTL = {
  SHORT: 30000,       // 30 seconds - for search results
  MEDIUM: 60000,      // 1 minute - for lists
  LONG: 300000,       // 5 minutes - for individual items
  VERY_LONG: 600000,  // 10 minutes - for static data
} as const;
