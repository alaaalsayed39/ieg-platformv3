'use strict';

/**
 * Builds a MongoDB connection URI with a guaranteed database name.
 * Atlas SRV strings often omit /dbname — we inject MONGO_DB_NAME (default: ieg_platform).
 */
const getMongoUri = () => {
  const raw = process.env.MONGO_URI || 'mongodb://localhost:27017/ieg_platform';
  const dbName = process.env.MONGO_DB_NAME || 'ieg_platform';

  if (raw.includes('mongodb+srv://') || raw.includes('mongodb://')) {
    try {
      const url = new URL(raw.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
      const pathname = url.pathname.replace(/^\//, '');
      let dbPath = pathname;
      if (!dbPath || dbPath === '') {
        dbPath = dbName;
      }
      const isSrv = raw.startsWith('mongodb+srv://');
      const host = url.host;
      const search = url.search || (isSrv ? '?retryWrites=true&w=majority' : '');
      const auth = url.username
        ? `${encodeURIComponent(url.username)}:${encodeURIComponent(url.password)}@`
        : '';
      return `${isSrv ? 'mongodb+srv' : 'mongodb'}://${auth}${host}/${dbPath}${search}`;
    } catch {
      return raw.includes('/ieg_platform') ? raw : `${raw.replace(/\/?$/, '')}/${dbName}`;
    }
  }
  return raw;
};

const getMongoOptions = () => ({
  dbName: process.env.MONGO_DB_NAME || 'ieg_platform',
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_TIMEOUT_MS, 10) || 15000,
  maxPoolSize: 10,
});

module.exports = { getMongoUri, getMongoOptions };
