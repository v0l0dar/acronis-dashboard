interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
}

class CacheStore<T = unknown> {
  private _store = new Map<string, CacheEntry<T>>()
  private _defaultTTL: number

  constructor(defaultTTL = 60000) {
    this._defaultTTL = defaultTTL
  }

  get(key: string): T | null {
    const entry = this._store.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this._store.delete(key)
      return null
    }

    return entry.value
  }

  set(key: string, value: T, ttl?: number): void {
    this._store.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? this._defaultTTL),
      createdAt: Date.now()
    })
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
