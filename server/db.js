const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'wjcsuser',
  password: process.env.DB_PASSWORD || 'wjcspassword',
  database: process.env.DB_NAME || 'wjcssportsdays',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  dateStrings: true,
  timezone: '+08:00',
});

const RETRY_CODES = new Set([
  'ECONNREFUSED',
  'PROTOCOL_CONNECTION_LOST',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ER_CON_COUNT_ERROR',
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function translateSql(sql) {
  const trimmed = String(sql || '').trim();
  if (/^PRAGMA\s+foreign_keys/i.test(trimmed)) {
    return 'SELECT 1 AS ok';
  }
  const pragmaInfo = trimmed.match(/^PRAGMA\s+table_info\(\s*['"]?([A-Za-z0-9_]+)['"]?\s*\)/i);
  if (pragmaInfo) {
    const table = pragmaInfo[1].replace(/['"]/g, '');
    return `SELECT COLUMN_NAME AS name, IF(IS_NULLABLE='NO', 1, 0) AS \`notnull\`
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${mysql.escape(table)}
            ORDER BY ORDINAL_POSITION`;
  }
  return trimmed
    .replace(/INSERT OR IGNORE/gi, 'INSERT IGNORE')
    .replace(/INSERT OR REPLACE/gi, 'REPLACE')
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
    .replace(/\bREAL\b/gi, 'DOUBLE');
}

function parseStatementArgs(args) {
  const sql = args[0];
  const rest = args.slice(1);
  let cb = null;
  if (rest.length && typeof rest[rest.length - 1] === 'function') {
    cb = rest.pop();
  }
  const params = rest.length === 1 && Array.isArray(rest[0]) ? rest[0] : rest;
  return { sql, params, cb };
}

async function exec(sql, params) {
  const translated = translateSql(sql);
  let lastErr;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const [rows, fields] = await pool.promise().query(translated, params);
      return { rows, fields };
    } catch (err) {
      lastErr = err;
      const retryable = RETRY_CODES.has(err.code) || /connect|ECONN|unavailable|handshake|not allowed/i.test(String(err.message || ''));
      if (!retryable || attempt === 39) {
        throw err;
      }
      await sleep(500);
    }
  }
  throw lastErr;
}

let queue = Promise.resolve();

function schedule(work) {
  const run = queue.then(work, work);
  queue = run.catch(() => {});
  return run;
}

function bindCallback(ctx, cb, err) {
  if (typeof cb === 'function') {
    cb.call(ctx, err);
  }
}

const db = {
  run(...args) {
    const { sql, params, cb } = parseStatementArgs(args);
    const ctx = { lastID: 0, changes: 0 };
    const done = schedule(async () => {
      try {
        const { rows } = await exec(sql, params);
        if (rows && typeof rows.insertId === 'number') ctx.lastID = rows.insertId;
        if (rows && typeof rows.affectedRows === 'number') ctx.changes = rows.affectedRows;
        bindCallback(ctx, cb, null);
      } catch (err) {
        bindCallback(ctx, cb, err);
        throw err;
      }
    });
    return done;
  },

  get(...args) {
    const { sql, params, cb } = parseStatementArgs(args);
    return schedule(async () => {
      try {
        const { rows } = await exec(sql, params);
        const row = Array.isArray(rows) ? rows[0] : undefined;
        if (cb) cb(null, row);
        return row;
      } catch (err) {
        if (cb) cb(err);
        throw err;
      }
    });
  },

  all(...args) {
    const { sql, params, cb } = parseStatementArgs(args);
    return schedule(async () => {
      try {
        const { rows } = await exec(sql, params);
        const list = Array.isArray(rows) ? rows : [];
        if (cb) cb(null, list);
        return list;
      } catch (err) {
        if (cb) cb(err);
        throw err;
      }
    });
  },

  serialize(fn) {
    fn();
  },

  prepare(sql) {
    let pending = Promise.resolve();
    return {
      run: (...args) => {
        let cb = null;
        const rest = [...args];
        if (rest.length && typeof rest[rest.length - 1] === 'function') {
          cb = rest.pop();
        }
        const params = rest.length === 1 && Array.isArray(rest[0]) ? rest[0] : rest;
        const p = db.run(sql, params, cb);
        pending = p.catch(() => {});
        return p;
      },
      get: (...args) => {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        return db.getAsync(sql, params);
      },
      finalize: (cb) => {
        pending.then(() => cb && cb(null), (err) => cb && cb(err));
      },
    };
  },

  getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
  },

  runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function onRun(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  close(cb) {
    pool.end((err) => {
      if (cb) cb(err);
    });
  },
};

module.exports = db;
