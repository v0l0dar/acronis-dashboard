interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
}

const DEFAULT_MAX_SIZE = 100

export class CacheStore<T = unknown> {
  private _store = new Map<string, CacheEntry<T>>()
  private _defaultTTL: number
  private _maxSize: number

  constructor(defaultTTL = 60000, maxSize = DEFAULT_MAX_SIZE) {
    this._defaultTTL = defaultTTL
    this._maxSize = maxSize
  }

  get(key: string): T | null {
    const entry = this._store.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this._store.delete(key)
      return null
    }

    // Refresh insertion order so this entry is considered most-recently-used
    this._store.delete(key)
    this._store.set(key, entry)

    return entry.value
  }

  set(key: string, value: T, ttl?: number): void {
    // Remove first to update position when key already exists
    this._store.delete(key)

    this._store.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? this._defaultTTL),
      createdAt: Date.now()
    })

    // Evict the least-recently-used entry when the store exceeds the size cap
    if (this._store.size > this._maxSize) {
      const lruKey = this._store.keys().next().value as string
      this._store.delete(lruKey)
    }
  }

  invalidate(key: string): void {
    this._store.delete(key)
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) {
        this._store.delete(key)
      }
    }
  }

  clear(): void {
    this._store.clear()
  }

  stats(): { total: number; active: number; expired: number } {
    let active = 0
    let expired = 0
    const now = Date.now()

    for (const entry of this._store.values()) {
      if (now > entry.expiresAt) expired++
      else active++
    }

    return { total: this._store.size, active, expired }
  }
}

export const listCache = new CacheStore(60000)
export const detailCache = new CacheStore(300000)
