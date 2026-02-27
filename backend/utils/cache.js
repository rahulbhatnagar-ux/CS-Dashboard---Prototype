const cache = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

function get(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function getStale(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  return { value: entry.value, stale: Date.now() > entry.expires };
}

function set(key, value, ttl = DEFAULT_TTL) {
  cache.set(key, { value, expires: Date.now() + ttl });
}

function clear() {
  cache.clear();
}

module.exports = { get, getStale, set, clear };
