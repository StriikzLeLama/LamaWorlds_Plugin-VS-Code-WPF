/**
 * Simple in-memory cache with TTL (Time To Live)
 */
export class Cache<T> {
    private _cache: Map<string, { value: T; expires: number }> = new Map();
    private _defaultTTL: number;

    constructor(defaultTTL: number = 60000) { // 1 minute default
        this._defaultTTL = defaultTTL;
    }

    set(key: string, value: T, ttl?: number): void {
        const expires = Date.now() + (ttl || this._defaultTTL);
        this._cache.set(key, { value, expires });
    }

    get(key: string): T | undefined {
        const item = this._cache.get(key);
        if (!item) {
            return undefined;
        }

        if (Date.now() > item.expires) {
            this._cache.delete(key);
            return undefined;
        }

        return item.value;
    }

    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    delete(key: string): void {
        this._cache.delete(key);
    }

    clear(): void {
        this._cache.clear();
    }

    size(): number {
        // Clean expired entries
        const now = Date.now();
        for (const [key, item] of this._cache.entries()) {
            if (now > item.expires) {
                this._cache.delete(key);
            }
        }
        return this._cache.size;
    }
}

