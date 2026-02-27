const { execSync } = require('child_process');
const cache = require('../utils/cache');

const SF_CLI = '/usr/local/bin/sf';
const TARGET_ORG = 'plg-prod';
const QUERY_TIMEOUT = 30000;

function runSOQL(query) {
  const cacheKey = `soql:${query}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const cmd = `${SF_CLI} data query --target-org ${TARGET_ORG} --query "${query.replace(/"/g, '\\"')}" --result-format json`;
    const stdout = execSync(cmd, {
      timeout: QUERY_TIMEOUT,
      encoding: 'utf-8',
      env: { ...process.env, PATH: `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.HOME}/.nvm/versions/node/v20.19.5/bin:${process.env.PATH || ''}` },
    });

    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) throw new Error('No JSON in SF CLI output');

    const parsed = JSON.parse(stdout.slice(jsonStart));
    const records = parsed?.result?.records || [];
    const totalSize = parsed?.result?.totalSize ?? records.length;
    const result = { records, totalSize };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`SF query failed: ${err.message}`);
    const stale = cache.getStale(cacheKey);
    if (stale) {
      console.log('Returning stale cached data');
      return { ...stale.value, stale: true };
    }
    return { records: [], totalSize: 0, error: err.message };
  }
}

module.exports = { runSOQL };
