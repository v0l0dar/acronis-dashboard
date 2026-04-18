import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CacheStore } from './cache'

describe('CacheStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('get', () => {
    it('returns null for a missing key', () => {
      const cache = new CacheStore<string>()
      expect(cache.get('missing')).toBeNull()
    })

    it('returns the stored value within TTL', () => {
      const cache = new CacheStore<string>(1000)
      cache.set('k', 'hello')
      expect(cache.get('k')).toBe('hello')
    })

    it('returns null after the entry expires', () => {
      const cache = new CacheStore<string>(1000)
      cache.set('k', 'hello')
      vi.advanceTimersByTime(1001)
      expect(cache.get('k')).toBeNull()
    })

    it('does not expire before TTL elapses', () => {
      const cache = new CacheStore<string>(1000)
      cache.set('k', 'hello')
      vi.advanceTimersByTime(999)
      expect(cache.get('k')).toBe('hello')
    })
  })

  describe('set with custom TTL', () => {
    it('respects a per-entry TTL override', () => {
      const cache = new CacheStore<string>(60000)
      cache.set('short', 'value', 500)
      vi.advanceTimersByTime(501)
      expect(cache.get('short')).toBeNull()
    })

    it('updates value and resets expiry when same key is set again', () => {
      const cache = new CacheStore<string>(1000)
      cache.set('k', 'first')
      vi.advanceTimersByTime(800)
      cache.set('k', 'second')
      vi.advanceTimersByTime(800)
      expect(cache.get('k')).toBe('second')
    })
  })

  describe('LRU eviction', () => {
    it('evicts the least-recently-used entry when maxSize is exceeded', () => {
      const cache = new CacheStore<number>(60000, 2)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.set('c', 3)
      expect(cache.get('a')).toBeNull()
      expect(cache.get('b')).toBe(2)
      expect(cache.get('c')).toBe(3)
    })

    it('promotes an entry to most-recently-used on get', () => {
      const cache = new CacheStore<number>(60000, 2)
      cache.set('a', 1)
      cache.set('b', 2)
      cache.get('a')
      cache.set('c', 3)
      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBeNull()
      expect(cache.get('c')).toBe(3)
    })
  })

  describe('invalidate', () => {
    it('removes a single key', () => {
      const cache = new CacheStore<string>()
      cache.set('k', 'v')
      cache.invalidate('k')
      expect(cache.get('k')).toBeNull()
    })

    it('leaves other keys untouched', () => {
      const cache = new CacheStore<string>()
      cache.set('a', '1')
      cache.set('b', '2')
      cache.invalidate('a')
      expect(cache.get('b')).toBe('2')
    })
  })

  describe('invalidateByPrefix', () => {
    it('removes all keys with the given prefix', () => {
      const cache = new CacheStore<string>()
      cache.set('user:1', 'a')
      cache.set('user:2', 'b')
      cache.set('deal:1', 'c')
      cache.invalidateByPrefix('user:')
      expect(cache.get('user:1')).toBeNull()
      expect(cache.get('user:2')).toBeNull()
    })

    it('keeps keys that do not match the prefix', () => {
      const cache = new CacheStore<string>()
      cache.set('user:1', 'a')
      cache.set('deal:1', 'c')
      cache.invalidateByPrefix('user:')
      expect(cache.get('deal:1')).toBe('c')
    })
  })

  describe('clear', () => {
    it('removes all entries', () => {
      const cache = new CacheStore<string>()
      cache.set('a', '1')
      cache.set('b', '2')
      cache.clear()
      expect(cache.stats().total).toBe(0)
    })
  })

  describe('stats', () => {
    it('counts active and expired entries separately', () => {
      const cache = new CacheStore<string>(1000)
      cache.set('alive', 'v')
      cache.set('dying', 'v', 400)
      vi.advanceTimersByTime(500)
      const { total, active, expired } = cache.stats()
      expect(total).toBe(2)
      expect(active).toBe(1)
      expect(expired).toBe(1)
    })

    it('returns zeros for an empty store', () => {
      const cache = new CacheStore<string>()
      expect(cache.stats()).toEqual({ total: 0, active: 0, expired: 0 })
    })
  })
})
