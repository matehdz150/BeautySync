export interface CachePort {
  get<T>(key: string): Promise<T | null>;

  set(key: string, value: any, ttlSeconds?: number): Promise<void>;

  del(key: string): Promise<void>;

  delPattern(pattern: string): Promise<void>;
}
