const fs = require('fs');
const path = require('path');
const express = require('express');

function dirHasIndex(dir) {
  return Boolean(dir) && fs.existsSync(path.join(dir, 'index.html'));
}

function sendIndex(dir) {
  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }
    res.sendFile(path.join(dir, 'index.html'), (err) => {
      if (err) next(err);
    });
  };
}

module.exports = function serveWeb(app) {
  const publicWebDir = process.env.PUBLIC_WEB_DIR || path.join(__dirname, 'web', 'public');
  const adminWebDir = process.env.ADMIN_WEB_DIR || path.join(__dirname, 'web', 'admin');
  const hasPublic = dirHasIndex(publicWebDir);
  const hasAdmin = dirHasIndex(adminWebDir);

  if (!hasPublic && !hasAdmin) {
    return;
  }

  console.log('已啟用整合前端', {
    public: hasPublic ? publicWebDir : null,
    admin: hasAdmin ? adminWebDir : null,
  });

  if (hasAdmin) {
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path === '/admin' || req.path === '/admin.html') {
        return res.redirect(301, '/admin/');
      }
      next();
    });
    app.use('/admin', express.static(adminWebDir, { index: false, fallthrough: true }));
    app.use('/admin', sendIndex(adminWebDir));
  }

  if (hasPublic) {
    app.use(express.static(publicWebDir, { index: false, fallthrough: true }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
      }
      return sendIndex(publicWebDir)(req, res, next);
    });
  }
};
