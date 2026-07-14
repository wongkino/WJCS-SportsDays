const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3300;

// 中間件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 下載 CSV 範本 - 放在所有中間件之前
app.get('/api/participants/template', (req, res) => {
  try {
    const templatePath = path.join(__dirname, 'template.csv');
    
    // 檢查文件是否存在
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: '範本文件不存在' });
    }
    
    // 設置響應頭
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="participant_template.csv"');
    res.setHeader('Cache-Control', 'no-cache');
    
    // 發送文件
    res.sendFile(templatePath);
  } catch (error) {
    console.error('下載 CSV 範本時發生錯誤:', error);
    res.status(500).json({ error: '下載範本失敗' });
  }
});

// 資料庫初始化
const dbPath = path.join(__dirname, 'sportday.db');
const db = new sqlite3.Database(dbPath);

// 建立資料表
db.serialize(() => {
  // 啟用外鍵約束
  db.run('PRAGMA foreign_keys = ON');
  
  // 參賽者組別表
  db.run(`CREATE TABLE IF NOT EXISTS participant_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 參賽者表
  db.run(`CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    group_id INTEGER,
    group_type TEXT NOT NULL CHECK (group_type IN ('工場及社區組', '展能組')),
    gender TEXT NOT NULL CHECK (gender IN ('男', '女')),
    team_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES participant_groups (id) ON DELETE SET NULL,
    UNIQUE(name, group_type, gender)
  )`);

  // 比賽項目表
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('個人', '團體')),
    group_types TEXT DEFAULT '工場及社區組,展能組',
    genders TEXT DEFAULT '男,女',
    calculation_unit TEXT DEFAULT '分',
    ranking_method TEXT DEFAULT '最高分' CHECK (ranking_method IN ('最高分', '最低分', '最快時間', '最遠距離', '最多次數')),
    max_rounds INTEGER DEFAULT 2 CHECK (max_rounds IN (1, 2, 3, 4)),
    default_rounds INTEGER DEFAULT 1 CHECK (default_rounds IN (1, 2, 3, 4)),
    is_final_only INTEGER DEFAULT 0 CHECK (is_final_only IN (0, 1)),
    description TEXT,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, type, group_type, gender)
  )`);

  // 分數表
  db.run(`CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    round INTEGER NOT NULL CHECK (round IN (1, 2)),
    score REAL NOT NULL CHECK (score >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
    UNIQUE(participant_id, event_id, round)
  )`);

  // 管理員表
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 比賽狀態表 - 按項目獨立管理
  db.run(`CREATE TABLE IF NOT EXISTS competition_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    is_finished INTEGER NOT NULL DEFAULT 0 CHECK (is_finished IN (0, 1)),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
    UNIQUE(event_id)
  )`);

  // 記分員表
  db.run(`CREATE TABLE IF NOT EXISTS scorers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    assigned_events TEXT, -- JSON 格式存儲負責的項目
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 創建索引
  db.run('CREATE INDEX IF NOT EXISTS idx_participants_group_gender ON participants(group_type, gender)');
  db.run('CREATE INDEX IF NOT EXISTS idx_participants_name ON participants(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_scores_participant ON scores(participant_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_scores_event ON scores(event_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_scores_round ON scores(round)');
  db.run('CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)');
  // 最有用的複合索引 - 成績查詢優化
  db.run('CREATE INDEX IF NOT EXISTS idx_scores_event_round_score ON scores(event_id, round, score DESC, created_at, id)');

  // 資料庫遷移：為 participants 表添加 group_id 欄位並修改 group_type 約束
  db.all("PRAGMA table_info(participants)", (err, columns) => {
    if (err) {
      console.error('檢查 participants 表結構失敗:', err);
      return;
    }
    
    const hasGroupId = columns.some(col => col.name === 'group_id');
    const groupTypeColumn = columns.find(col => col.name === 'group_type');
    const needsConstraintUpdate = groupTypeColumn && groupTypeColumn.notnull === 1;
    
    if (!hasGroupId) {
      console.log('正在為 participants 表添加 group_id 欄位...');
      db.run('ALTER TABLE participants ADD COLUMN group_id INTEGER REFERENCES participant_groups(id)', (err) => {
        if (err) {
          console.error('添加 group_id 欄位失敗:', err);
        } else {
          console.log('成功添加 group_id 欄位');
        }
      });
    } else {
      console.log('group_id 欄位已存在');
    }
    
    // 如果需要修改 group_type 約束（移除 NOT NULL）
    if (needsConstraintUpdate) {
      console.log('正在修改 group_type 欄位約束...');
      
      db.serialize(() => {
        // 1. 創建新表
        db.run(`CREATE TABLE participants_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          group_type TEXT CHECK (group_type IN ('工場及社區組','展能組')),
          gender TEXT NOT NULL CHECK (gender IN ('男','女')),
          team_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          group_id INTEGER REFERENCES participant_groups(id),
          UNIQUE(name, group_type, gender)
        )`);
        
        // 2. 複製數據
        db.run(`INSERT INTO participants_new (id, name, group_type, gender, team_name, created_at, group_id)
                SELECT id, name, group_type, gender, team_name, created_at, group_id FROM participants`);
        
        // 3. 刪除舊表
        db.run('DROP TABLE participants');
        
        // 4. 重命名新表
        db.run('ALTER TABLE participants_new RENAME TO participants');
        
        // 5. 重新創建索引
        db.run('CREATE INDEX idx_participants_group_gender ON participants(group_type, gender)');
        db.run('CREATE INDEX idx_participants_name ON participants(name)');
        
        console.log('group_type 欄位約束修改完成');
      });
    } else {
      console.log('group_type 欄位約束無需修改');
    }
  });

  // 資料庫遷移：為 events 表添加新欄位
  db.all("PRAGMA table_info(events)", (err, columns) => {
    if (err) {
      console.error('檢查 events 表結構失敗:', err);
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    const newColumns = [
      { name: 'group_types', sql: 'ALTER TABLE events ADD COLUMN group_types TEXT DEFAULT "工場及社區組,展能組"' },
      { name: 'genders', sql: 'ALTER TABLE events ADD COLUMN genders TEXT DEFAULT "男,女"' },
      { name: 'calculation_unit', sql: 'ALTER TABLE events ADD COLUMN calculation_unit TEXT DEFAULT "分"' },
      { name: 'ranking_method', sql: 'ALTER TABLE events ADD COLUMN ranking_method TEXT DEFAULT "最高分" CHECK (ranking_method IN ("最高分", "最低分", "最快時間", "最遠距離", "最多次數"))' },
      { name: 'max_rounds', sql: 'ALTER TABLE events ADD COLUMN max_rounds INTEGER DEFAULT 2 CHECK (max_rounds IN (1, 2, 3, 4))' },
      { name: 'default_rounds', sql: 'ALTER TABLE events ADD COLUMN default_rounds INTEGER DEFAULT 1 CHECK (default_rounds IN (1, 2, 3, 4))' },
      { name: 'is_final_only', sql: 'ALTER TABLE events ADD COLUMN is_final_only INTEGER DEFAULT 0 CHECK (is_final_only IN (0, 1))' },
      { name: 'description', sql: 'ALTER TABLE events ADD COLUMN description TEXT' },
      { name: 'is_active', sql: 'ALTER TABLE events ADD COLUMN is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1))' }
    ];
    
    newColumns.forEach(col => {
      if (!columnNames.includes(col.name)) {
        console.log(`正在為 events 表添加 ${col.name} 欄位...`);
        db.run(col.sql, (err) => {
          if (err) {
            console.error(`添加 ${col.name} 欄位失敗:`, err);
          } else {
            console.log(`成功添加 ${col.name} 欄位`);
          }
        });
      } else {
        console.log(`${col.name} 欄位已存在`);
      }
    });
  });

  // 插入預設比賽項目（使用 UPSERT 避免重複）
  const events = [
    { 
      name: '火箭投擲', 
      type: '個人',
      group_types: '工場及社區組,展能組',
      genders: '男,女',
      calculation_unit: '米',
      ranking_method: '最遠距離',
      max_rounds: 3,
      default_rounds: 1,
      is_final_only: 0,
      description: '投擲火箭球，測量投擲距離'
    },
    { 
      name: '來回跑', 
      type: '個人',
      group_types: '工場及社區組,展能組',
      genders: '男,女',
      calculation_unit: '秒',
      ranking_method: '最快時間',
      max_rounds: 2,
      default_rounds: 1,
      is_final_only: 0,
      description: '來回跑步，測量完成時間'
    },
    { 
      name: '立定跳遠', 
      type: '個人',
      group_types: '工場及社區組,展能組',
      genders: '男,女',
      calculation_unit: '米',
      ranking_method: '最遠距離',
      max_rounds: 3,
      default_rounds: 1,
      is_final_only: 0,
      description: '立定跳遠，測量跳躍距離'
    },
    { 
      name: '硬地滾球', 
      type: '團體',
      group_types: '工場及社區組,展能組',
      genders: '男,女',
      calculation_unit: '分',
      ranking_method: '最高分',
      max_rounds: 4,
      default_rounds: 1,
      is_final_only: 1,
      description: '硬地滾球團體比賽，計算得分（直接決賽）'
    }
  ];

  // 清理重複的比賽項目並確保 UNIQUE 約束
  db.run('DELETE FROM events WHERE id NOT IN (SELECT MIN(id) FROM events GROUP BY name, type)', (err) => {
    if (err) {
      console.error('清理重複比賽項目失敗:', err);
      return;
    }
    console.log('已清理重複的比賽項目');
    
    // 確保 UNIQUE 約束存在
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_events_name_type ON events(name, type)', (err) => {
      if (err) {
        console.error('創建 UNIQUE 索引失敗:', err);
        return;
      }
      console.log('已確保 events 表有 UNIQUE(name, type) 約束');

      // 在 UNIQUE 約束創建後再插入資料
      events.forEach(event => {
        db.run('INSERT OR IGNORE INTO events (name, type, group_types, genders, calculation_unit, ranking_method, max_rounds, default_rounds, is_final_only, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
          [event.name, event.type, event.group_types, event.genders, event.calculation_unit, event.ranking_method, event.max_rounds, event.default_rounds, event.is_final_only, event.description], (err) => {
          if (err) {
            console.error('插入比賽項目失敗:', err);
          } else {
            console.log(`已確保比賽項目存在: ${event.name} (${event.type})`);
          }
        });
      });
    });
  });

  // 初始化比賽狀態（為每個項目創建狀態記錄）
  db.all('SELECT id FROM events', (err, events) => {
    if (err) {
      console.error('獲取比賽項目失敗:', err);
      return;
    }
    
    events.forEach(event => {
      db.run('INSERT OR IGNORE INTO competition_status (event_id, is_finished) VALUES (?, 0)', [event.id], (err) => {
        if (err) {
          console.error(`初始化項目 ${event.id} 比賽狀態失敗:`, err);
        } else {
          console.log(`項目 ${event.id} 比賽狀態已初始化`);
        }
      });
    });
  });
});

// 上傳配置
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ 
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 限制
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳 CSV 檔案'), false);
    }
  }
});

// API 路由

// ==================== 參賽者組別管理 API ====================

// 獲取所有參賽者組別
app.get('/api/participant-groups', (req, res) => {
  db.all('SELECT * FROM participant_groups ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 新增參賽者組別
app.post('/api/participant-groups', (req, res) => {
  const { name, description, is_active } = req.body;
  
  // 驗證必填欄位
  if (!name) {
    res.status(400).json({ error: '組別名稱為必填項目' });
    return;
  }
  
  // 檢查組別名稱是否已存在
  db.get('SELECT id FROM participant_groups WHERE name = ?', [name], (err, existing) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (existing) {
      res.status(409).json({ error: '組別名稱已存在' });
      return;
    }
    
    // 插入新組別
    db.run('INSERT INTO participant_groups (name, description, is_active) VALUES (?, ?, ?)', 
      [name, description || null, is_active !== false ? 1 : 0], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: '組別新增成功' });
    });
  });
});

// 修改參賽者組別
app.put('/api/participant-groups/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;
  
  // 驗證必填欄位
  if (!name) {
    res.status(400).json({ error: '組別名稱為必填項目' });
    return;
  }
  
  // 檢查組別是否存在
  db.get('SELECT id FROM participant_groups WHERE id = ?', [id], (err, existing) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!existing) {
      res.status(404).json({ error: '組別不存在' });
      return;
    }
    
    // 檢查組別名稱是否與其他組別衝突
    db.get('SELECT id FROM participant_groups WHERE name = ? AND id != ?', [name, id], (err, conflict) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (conflict) {
        res.status(409).json({ error: '組別名稱已存在' });
        return;
      }
      
      // 更新組別
      db.run('UPDATE participant_groups SET name = ?, description = ?, is_active = ? WHERE id = ?', 
        [name, description || null, is_active !== false ? 1 : 0, id], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: '組別更新成功' });
      });
    });
  });
});

// 根據組別類型自動分配組別
app.post('/api/participants/auto-assign-groups', (req, res) => {
  const { group_type, group_id } = req.body;
  
  if (!group_type || !group_id) {
    res.status(400).json({ error: '請提供組別類型和組別ID' });
    return;
  }
  
  // 驗證組別是否存在
  db.get('SELECT id FROM participant_groups WHERE id = ? AND is_active = 1', [group_id], (err, group) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!group) {
      res.status(400).json({ error: '指定的組別不存在或已停用' });
      return;
    }
    
    // 更新所有符合條件的參賽者
    db.run('UPDATE participants SET group_id = ? WHERE group_type = ? AND group_id IS NULL', 
      [group_id, group_type], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({ 
        message: '自動分配成功', 
        updatedCount: this.changes,
        groupType: group_type,
        groupId: group_id
      });
    });
  });
});

// 批量更新參賽者組別
app.post('/api/participants/batch-update-groups', (req, res) => {
  const { updates } = req.body; // [{ participant_id: 1, group_id: 2 }, ...]
  
  if (!Array.isArray(updates) || updates.length === 0) {
    res.status(400).json({ error: '請提供有效的更新資料' });
    return;
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    let completed = 0;
    let errors = [];
    
    updates.forEach((update, index) => {
      const { participant_id, group_id } = update;
      
      if (!participant_id) {
        errors.push(`第 ${index + 1} 項：缺少參賽者ID`);
        completed++;
        if (completed === updates.length) {
          db.run('ROLLBACK');
          res.status(400).json({ error: '更新失敗', details: errors });
        }
        return;
      }
      
      // 如果提供了 group_id，驗證組別是否存在
      if (group_id) {
        db.get('SELECT id FROM participant_groups WHERE id = ? AND is_active = 1', [group_id], (err, group) => {
          if (err) {
            errors.push(`參賽者 ${participant_id}：查詢組別失敗`);
          } else if (!group) {
            errors.push(`參賽者 ${participant_id}：組別不存在或已停用`);
          } else {
            // 更新參賽者組別
            db.run('UPDATE participants SET group_id = ? WHERE id = ?', [group_id, participant_id], function(err) {
              if (err) {
                errors.push(`參賽者 ${participant_id}：更新失敗`);
              }
            });
          }
          
          completed++;
          if (completed === updates.length) {
            if (errors.length > 0) {
              db.run('ROLLBACK');
              res.status(400).json({ error: '部分更新失敗', details: errors });
            } else {
              db.run('COMMIT');
              res.json({ message: '批量更新成功', updatedCount: updates.length });
            }
          }
        });
      } else {
        // 清除組別
        db.run('UPDATE participants SET group_id = NULL WHERE id = ?', [participant_id], function(err) {
          if (err) {
            errors.push(`參賽者 ${participant_id}：清除組別失敗`);
          }
          
          completed++;
          if (completed === updates.length) {
            if (errors.length > 0) {
              db.run('ROLLBACK');
              res.status(400).json({ error: '部分更新失敗', details: errors });
            } else {
              db.run('COMMIT');
              res.json({ message: '批量更新成功', updatedCount: updates.length });
            }
          }
        });
      }
    });
  });
});

// 刪除參賽者組別
app.delete('/api/participant-groups/:id', (req, res) => {
  const { id } = req.params;
  
  // 檢查是否有參賽者使用此組別
  db.get('SELECT COUNT(*) as count FROM participants WHERE group_id = ?', [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (result.count > 0) {
      res.status(409).json({ error: '無法刪除：此組別下還有參賽者' });
      return;
    }
    
    // 刪除組別
    db.run('DELETE FROM participant_groups WHERE id = ?', [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: '組別不存在' });
        return;
      }
      
      res.json({ message: '組別刪除成功' });
    });
  });
});

// ==================== 參賽者管理 API ====================

// 獲取所有參賽者
app.get('/api/participants', (req, res) => {
  db.all(`
    SELECT p.*, pg.name as group_name 
    FROM participants p 
    LEFT JOIN participant_groups pg ON p.group_id = pg.id 
    ORDER BY p.created_at DESC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 獲取所有比賽項目
app.get('/api/events', (req, res) => {
  db.all('SELECT * FROM events ORDER BY id', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 添加比賽項目
app.post('/api/events', (req, res) => {
  const { name, type, group_types, genders, calculation_unit, ranking_method, is_final_only, description, is_active } = req.body;
  
  // 驗證必填欄位
  if (!name || !type) {
    res.status(400).json({ error: '項目名稱和類型為必填項目' });
    return;
  }
  
  // 驗證項目類型枚舉
  if (!['個人', '團體'].includes(type)) {
    res.status(400).json({ error: '項目類型必須是「個人」或「團體」' });
    return;
  }
  
  // 驗證組別 - 動態檢查 participant_groups 表
  const selectedGroups = group_types ? group_types.split(',').map(g => g.trim()) : [];
  if (selectedGroups.length === 0) {
    res.status(400).json({ error: '請選擇至少一個組別' });
    return;
  }
  
  // 檢查所有選中的組別是否存在於 participant_groups 表中
  const placeholders = selectedGroups.map(() => '?').join(',');
  db.all(`SELECT name FROM participant_groups WHERE name IN (${placeholders}) AND is_active = 1`, selectedGroups, (err, validGroups) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const validGroupNames = validGroups.map(g => g.name);
    const invalidGroups = selectedGroups.filter(g => !validGroupNames.includes(g));
    if (invalidGroups.length > 0) {
      res.status(400).json({ error: `無效的組別: ${invalidGroups.join(', ')}` });
      return;
    }
    
    // 驗證性別
    const validGenders = ['男', '女'];
    const selectedGenders = genders ? genders.split(',').map(g => g.trim()) : validGenders;
    const invalidGenders = selectedGenders.filter(g => !validGenders.includes(g));
    if (invalidGenders.length > 0) {
      res.status(400).json({ error: `無效的性別: ${invalidGenders.join(', ')}` });
      return;
    }
    
    // 驗證排名方式
    if (ranking_method && !['最高分', '最低分', '最快時間', '最遠距離', '最多次數'].includes(ranking_method)) {
      res.status(400).json({ error: '排名方式必須是「最高分」、「最低分」、「最快時間」、「最遠距離」或「最多次數」' });
      return;
    }
    
    // 檢查是否已存在相同項目
    const groupTypesStr = selectedGroups.join(',');
    const gendersStr = selectedGenders.join(',');
    db.get('SELECT id FROM events WHERE name = ? AND type = ? AND group_types = ? AND genders = ?', 
      [name, type, groupTypesStr, gendersStr], (err, existing) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (existing) {
      res.status(409).json({ error: '相同的比賽項目已存在' });
      return;
    }
    
    // 插入新比賽項目
    db.run('INSERT INTO events (name, type, group_types, genders, calculation_unit, ranking_method, max_rounds, default_rounds, is_final_only, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [name, type, groupTypesStr, gendersStr, calculation_unit || '分', ranking_method || '最高分', 2, 1, is_final_only ? 1 : 0, description || null, is_active !== false ? 1 : 0], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id: this.lastID, 
        message: `比賽項目添加成功，包含組別: ${selectedGroups.join(', ')}，性別: ${selectedGenders.join(', ')}`,
        groups: selectedGroups,
        genders: selectedGenders
      });
    });
  });
  });
});

// 修改比賽項目
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, group_types, genders, calculation_unit, ranking_method, is_final_only, description, is_active } = req.body;
  
  // 驗證必填欄位
  if (!name || !type) {
    res.status(400).json({ error: '項目名稱和類型為必填項目' });
    return;
  }
  
  // 驗證項目類型枚舉
  if (!['個人', '團體'].includes(type)) {
    res.status(400).json({ error: '項目類型必須是「個人」或「團體」' });
    return;
  }
  
  // 驗證組別 - 動態檢查 participant_groups 表
  const selectedGroups = group_types ? group_types.split(',').map(g => g.trim()) : [];
  if (selectedGroups.length === 0) {
    res.status(400).json({ error: '請選擇至少一個組別' });
    return;
  }
  
  // 檢查所有選中的組別是否存在於 participant_groups 表中
  const placeholders = selectedGroups.map(() => '?').join(',');
  db.all(`SELECT name FROM participant_groups WHERE name IN (${placeholders}) AND is_active = 1`, selectedGroups, (err, validGroups) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const validGroupNames = validGroups.map(g => g.name);
    const invalidGroups = selectedGroups.filter(g => !validGroupNames.includes(g));
    if (invalidGroups.length > 0) {
      res.status(400).json({ error: `無效的組別: ${invalidGroups.join(', ')}` });
      return;
    }
    
    // 驗證性別
    const validGenders = ['男', '女'];
    const selectedGenders = genders ? genders.split(',').map(g => g.trim()) : validGenders;
    const invalidGenders = selectedGenders.filter(g => !validGenders.includes(g));
    if (invalidGenders.length > 0) {
      res.status(400).json({ error: `無效的性別: ${invalidGenders.join(', ')}` });
      return;
    }
    
    // 驗證排名方式
    if (ranking_method && !['最高分', '最低分', '最快時間', '最遠距離', '最多次數'].includes(ranking_method)) {
      res.status(400).json({ error: '排名方式必須是「最高分」、「最低分」、「最快時間」、「最遠距離」或「最多次數」' });
      return;
    }
    
    // 檢查比賽項目是否存在
    db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (!row) {
        res.status(404).json({ error: '比賽項目不存在' });
        return;
      }
      
      // 檢查是否已存在相同項目（排除自己）
      const groupTypesStr = selectedGroups.join(',');
      const gendersStr = selectedGenders.join(',');
      db.get('SELECT id FROM events WHERE name = ? AND type = ? AND group_types = ? AND genders = ? AND id != ?', 
        [name, type, groupTypesStr, gendersStr, id], (err, existing) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        if (existing) {
          res.status(409).json({ error: '相同的比賽項目已存在' });
          return;
        }
        
        // 更新比賽項目資料
        const sql = `UPDATE events 
                     SET name = ?, type = ?, group_types = ?, genders = ?, calculation_unit = ?, ranking_method = ?, max_rounds = ?, default_rounds = ?, is_final_only = ?, description = ?, is_active = ?
                     WHERE id = ?`;
        
        db.run(sql, [name, type, groupTypesStr, gendersStr, calculation_unit || '分', ranking_method || '最高分', 2, 1, is_final_only ? 1 : 0, description || null, is_active !== false ? 1 : 0, id], function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
            message: '比賽項目修改成功',
            event: {
              id: parseInt(id),
              name,
              type,
              group_types: groupTypesStr,
              genders: gendersStr,
              calculation_unit: calculation_unit || '分',
              ranking_method: ranking_method || '最高分',
              max_rounds: 2,
              default_rounds: 1,
              is_final_only: is_final_only ? 1 : 0,
              description: description || null,
              is_active: is_active !== false ? 1 : 0
            }
          });
        });
      });
    });
  });
});

// 刪除比賽項目
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  
  // 檢查比賽項目是否存在
  db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: '比賽項目不存在' });
      return;
    }
    
    // 檢查是否有相關的分數記錄
    db.get('SELECT COUNT(*) as count FROM scores WHERE event_id = ?', [id], (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (result.count > 0) {
        res.status(400).json({ error: '無法刪除，該項目已有分數記錄' });
        return;
      }
      
      // 刪除比賽項目
      db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        res.json({ message: '比賽項目刪除成功' });
      });
    });
  });
});

// 輸入分數
app.post('/api/scores', (req, res) => {
  const { participant_id, event_id, score, round } = req.body;
  
  if (!participant_id || !event_id || score === undefined || !round) {
    res.status(400).json({ error: '所有欄位為必填項目' });
    return;
  }

  // 驗證分數範圍
  const numScore = parseFloat(score);
  if (isNaN(numScore) || numScore < 0) {
    res.status(400).json({ error: '分數必須是大於等於0的數字' });
    return;
  }

  // 驗證輪次（支援字串和數字）
  let r;
  if (typeof round === 'string') {
    // 字串轉換
    if (round === '初賽') {
      r = 1;
    } else if (round === '決賽') {
      r = 2;
    } else if (round === '1') {
      r = 1;
    } else if (round === '2') {
      r = 2;
    } else {
      return res.status(400).json({ error: '輪次必須是「初賽」或「決賽」' });
    }
  } else {
    // 數字轉換
    r = Number(round);
    if (![1, 2].includes(r)) {
      return res.status(400).json({ error: '輪次必須是1（初賽）或2（決賽）' });
    }
  }

  // 根據比賽項目驗證輪次
  db.get('SELECT name FROM events WHERE id = ?', [event_id], (err, event) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!event) {
      return res.status(404).json({ error: '比賽項目不存在' });
    }
    
    // 火箭投擲只有決賽
    if (event.name === '火箭投擲' && r === 1) {
      return res.status(400).json({ error: '火箭投擲項目只有決賽，沒有初賽' });
    }
    
    // 其他項目可以繼續處理
    insertScore();
  });
  
  function insertScore() {
    db.run(
      'INSERT INTO scores (participant_id, event_id, score, round) VALUES (?, ?, ?, ?)',
      [participant_id, event_id, numScore, r],
      function(err) {
        if (err) {
          if (/UNIQUE/i.test(err.message)) {
            return res.status(409).json({ error: '該參賽者此項目該輪次已登記' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: '分數記錄成功' });
      }
    );
  }
});

// 獲取所有分數記錄
app.get('/api/scores/all', (req, res) => {
  const query = `
    SELECT 
      s.id,
      s.participant_id,
      s.event_id,
      s.round,
      s.score,
      s.created_at,
      p.name as participant_name,
      p.team_name,
      p.group_type,
      p.gender,
      e.name as event_name,
      e.type as event_type,
      e.is_final_only
    FROM scores s
    JOIN participants p ON s.participant_id = p.id
    JOIN events e ON s.event_id = e.id
    ORDER BY e.name, p.group_type, p.gender, 
      CASE 
        WHEN e.name = '來回跑' THEN s.score
        ELSE -s.score
      END ASC, s.created_at ASC, s.id ASC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 修改分數
app.put('/api/scores/:id', (req, res) => {
  const scoreId = req.params.id;
  const { score } = req.body;
  
  if (score === undefined) {
    res.status(400).json({ error: '分數為必填項目' });
    return;
  }

  // 驗證分數範圍
  const numScore = parseFloat(score);
  if (isNaN(numScore) || numScore < 0) {
    res.status(400).json({ error: '分數必須是大於等於0的數字' });
    return;
  }

  // 檢查分數記錄是否存在
  db.get('SELECT id FROM scores WHERE id = ?', [scoreId], (err, existing) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!existing) {
      res.status(404).json({ error: '分數記錄不存在' });
      return;
    }
    
    // 更新分數
    db.run(
      'UPDATE scores SET score = ? WHERE id = ?',
      [numScore, scoreId],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        if (this.changes === 0) {
          res.status(404).json({ error: '分數記錄不存在' });
          return;
        }
        
        res.json({ message: '分數修改成功' });
      }
    );
  });
});

// 刪除分數
app.delete('/api/scores/:id', (req, res) => {
  const scoreId = req.params.id;
  
  // 檢查分數記錄是否存在
  db.get('SELECT id FROM scores WHERE id = ?', [scoreId], (err, existing) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!existing) {
      res.status(404).json({ error: '分數記錄不存在' });
      return;
    }
    
    // 刪除分數記錄
    db.run(
      'DELETE FROM scores WHERE id = ?',
      [scoreId],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        if (this.changes === 0) {
          res.status(404).json({ error: '分數記錄不存在' });
          return;
        }
        
        res.json({ message: '分數刪除成功' });
      }
    );
  });
});

// 獲取初賽前三名
app.get('/api/scores/preliminary/top3', (req, res) => {
  const query = `
    SELECT 
      s.*,
      p.name as participant_name,
      COALESCE(pg.name, p.group_type) as group_type,
      p.gender,
      p.team_name,
      e.name as event_name,
      e.type as event_type,
      e.is_final_only
    FROM scores s
    JOIN participants p ON s.participant_id = p.id
    LEFT JOIN participant_groups pg ON p.group_id = pg.id
    JOIN events e ON s.event_id = e.id
    WHERE s.round = 1
    ORDER BY e.name, COALESCE(pg.name, p.group_type), p.gender, 
      CASE 
        WHEN e.name = '來回跑' THEN s.score
        ELSE -s.score
      END ASC, s.created_at ASC, s.id ASC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 按項目、組別、性別分組並取前三名
    const grouped = {};
    rows.forEach(row => {
      const key = `${row.event_name}_${row.group_type}_${row.gender}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });
    
    const top3 = {};
    Object.keys(grouped).forEach(key => {
      top3[key] = grouped[key].slice(0, 3);
    });
    
    res.json(top3);
  });
});

// 獲取決賽入圍者（初賽首8名）
app.get('/api/scores/final/qualifiers', (req, res) => {
  const query = `
    WITH ranked_scores AS (
      SELECT 
        s.*,
        p.name as participant_name,
        COALESCE(pg.name, p.group_type) as group_type,
        p.gender,
        p.team_name,
        e.name as event_name,
        e.type as event_type,
        e.is_final_only,
        ROW_NUMBER() OVER (
          PARTITION BY e.name, COALESCE(pg.name, p.group_type), p.gender 
          ORDER BY 
            CASE 
              WHEN e.name = '來回跑' THEN s.score
              ELSE -s.score
            END ASC, 
            s.created_at ASC, 
            s.id ASC
        ) as rank_in_group
      FROM scores s
      JOIN participants p ON s.participant_id = p.id
      LEFT JOIN participant_groups pg ON p.group_id = pg.id
      JOIN events e ON s.event_id = e.id
      WHERE s.round = 1
    )
    SELECT *
    FROM ranked_scores
    WHERE rank_in_group <= 8
    ORDER BY event_name, group_type, gender, rank_in_group
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 按組別分組返回結果
    const groupedResults = {};
    rows.forEach(row => {
      const groupKey = `${row.event_name}_${row.group_type}_${row.gender}`;
      if (!groupedResults[groupKey]) {
        groupedResults[groupKey] = [];
      }
      groupedResults[groupKey].push(row);
    });
    
    res.json(groupedResults);
  });
});

// 獲取最終勝出者
app.get('/api/scores/final/winners', (req, res) => {
  const query = `
    SELECT 
      s.*,
      p.name as participant_name,
      COALESCE(pg.name, p.group_type) as group_type,
      p.gender,
      p.team_name,
      e.name as event_name,
      e.type as event_type,
      e.is_final_only
    FROM scores s
    JOIN participants p ON s.participant_id = p.id
    LEFT JOIN participant_groups pg ON p.group_id = pg.id
    JOIN events e ON s.event_id = e.id
    WHERE s.round = 2
    ORDER BY e.name, COALESCE(pg.name, p.group_type), p.gender, 
      CASE 
        WHEN e.name = '來回跑' THEN s.score
        ELSE -s.score
      END ASC, s.created_at ASC, s.id ASC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 按項目、組別、性別分組並取前三名
    const grouped = {};
    rows.forEach(row => {
      const key = `${row.event_name}_${row.group_type}_${row.gender}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });
    
    const rankings = {};
    Object.keys(grouped).forEach(key => {
      const groupResults = grouped[key];
      rankings[key] = {
        champion: groupResults[0] || null,    // 冠軍
        runnerUp: groupResults[1] || null,    // 亞軍
        thirdPlace: groupResults[2] || null   // 季軍
      };
    });
    
    res.json(rankings);
  });
});

// 添加參賽者
app.post('/api/participants', (req, res) => {
  const { name, group_id, gender, team_name } = req.body;
  
  // 驗證必填欄位
  if (!name || !group_id || !gender) {
    res.status(400).json({ error: '姓名、組別和性別為必填項目' });
    return;
  }
  
  // 驗證性別枚舉
  if (!['男', '女'].includes(gender)) {
    res.status(400).json({ error: '性別必須是「男」或「女」' });
    return;
  }
  
  // 驗證組別是否存在
  db.get('SELECT id, name FROM participant_groups WHERE id = ? AND is_active = 1', [group_id], (err, group) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!group) {
      res.status(400).json({ error: '指定的組別不存在或已停用' });
      return;
    }
    
    // 檢查是否已存在相同參賽者
    db.get('SELECT id FROM participants WHERE name = ? AND group_id = ? AND gender = ?', 
      [name, group_id, gender], (err, existing) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (existing) {
        res.status(409).json({ error: '參賽者已存在' });
        return;
      }
      
      // 插入新參賽者
      db.run('INSERT INTO participants (name, group_id, gender, team_name) VALUES (?, ?, ?, ?)', 
        [name, group_id, gender, team_name || null], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID, message: '參賽者添加成功' });
      });
    });
  });
});

// 修改參賽者資料
app.put('/api/participants/:id', (req, res) => {
  const { id } = req.params;
  const { name, group_id, gender, team_name } = req.body;
  
  // 驗證必填欄位
  if (!name || !group_id || !gender) {
    res.status(400).json({ error: '姓名、組別和性別為必填項目' });
    return;
  }
  
  // 驗證性別枚舉
  if (!['男', '女'].includes(gender)) {
    res.status(400).json({ error: '性別必須是「男」或「女」' });
    return;
  }
  
  // 驗證組別是否存在
  db.get('SELECT id FROM participant_groups WHERE id = ? AND is_active = 1', [group_id], (err, group) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!group) {
      res.status(400).json({ error: '指定的組別不存在或已停用' });
      return;
    }
    
    // 檢查參賽者是否存在
    db.get('SELECT * FROM participants WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (!row) {
        res.status(404).json({ error: '參賽者不存在' });
        return;
      }
      
      // 檢查是否已存在相同參賽者（排除自己）
      db.get('SELECT id FROM participants WHERE name = ? AND group_id = ? AND gender = ? AND id != ?', 
        [name, group_id, gender, id], (err, existing) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        if (existing) {
          res.status(409).json({ error: '參賽者已存在' });
          return;
        }
        
        // 更新參賽者資料
        const sql = `UPDATE participants 
                     SET name = ?, group_id = ?, gender = ?, team_name = ?
                     WHERE id = ?`;
        
        db.run(sql, [name, group_id, gender, team_name || null, id], function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
            message: '參賽者資料修改成功',
            participant: {
              id: parseInt(id),
              name,
              group_id,
              gender,
              team_name: team_name || null,
              created_at: row.created_at
            }
          });
        });
      });
    });
  });
});

// CSV 匯入參賽者
app.post('/api/participants/import', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '請選擇 CSV 檔案' });
  }

  const filePath = req.file.path;
  const participants = [];
  const errors = [];

  fs.createReadStream(filePath)
    .pipe(csv({
      mapHeaders: ({ header }) => String(header || '').trim(),
      mapValues: ({ value }) => String(value || '').trim()
    }))
    .on('data', (row) => {
      // 驗證必要欄位
      if (!row.單位 || !row.姓名 || !row.性別 || !row.組別) {
        errors.push(`第 ${participants.length + 1} 行：缺少必要欄位（單位、姓名、性別、組別）`);
        return;
      }

      // 驗證性別
      if (!['男', '女'].includes(row.性別)) {
        errors.push(`第 ${participants.length + 1} 行：性別必須是「男」或「女」`);
        return;
      }

      participants.push({
        name: row.姓名,
        gender: row.性別,
        group_name: row.組別,
        team_name: row.單位
      });
    })
    .on('end', () => {
      // 刪除上傳的檔案
      fs.unlink(filePath, () => {});
      
      if (errors.length) {
        return res.status(400).json({ error: 'CSV 檔案格式錯誤', details: errors });
      }
      
      if (!participants.length) {
        return res.status(400).json({ error: 'CSV 檔案中沒有有效的參賽者資料' });
      }

      // 先獲取所有組別信息
      db.all('SELECT id, name FROM participant_groups WHERE is_active = 1', (err, groups) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // 創建組別名稱到ID的映射
        const groupMap = {};
        groups.forEach(group => {
          groupMap[group.name] = group.id;
        });
        
        // 驗證所有參賽者的組別是否存在
        const invalidGroups = [];
        participants.forEach((p, index) => {
          if (!groupMap[p.group_name]) {
            invalidGroups.push(`第 ${index + 1} 行：組別「${p.group_name}」不存在，請先在組別管理中創建此組別`);
          }
        });
        
        if (invalidGroups.length > 0) {
          return res.status(400).json({ error: '組別驗證失敗', details: invalidGroups });
        }
        
        db.serialize(() => {
          db.run('BEGIN');
          const stmt = db.prepare('INSERT OR IGNORE INTO participants(name, group_id, gender, team_name) VALUES (?, ?, ?, ?)');
          let success = 0, duplicate = 0, failed = 0;
          
          for (const p of participants) {
            const groupId = groupMap[p.group_name];
            stmt.run([p.name, groupId, p.gender, p.team_name ?? null], function(err) {
              if (err) failed++;
              else if (this.changes === 0) duplicate++;
              else success++;
            });
          }
          
          stmt.finalize(e => {
            if (e) { 
              db.run('ROLLBACK'); 
              return res.status(500).json({ error: e.message }); 
            }
            db.run('COMMIT', e2 => {
              if (e2) { 
                db.run('ROLLBACK'); 
                return res.status(500).json({ error: e2.message }); 
              }
              res.json({ 
                message: 'CSV 匯入完成', 
                total: participants.length, 
                success, 
                duplicate, 
                errors: failed 
              });
            });
          });
        });
      });
    })
    .on('error', (err) => {
      fs.unlinkSync(filePath);
      res.status(500).json({ error: '讀取 CSV 檔案時發生錯誤: ' + err.message });
    });
});

// 更新組別名稱（管理功能）
app.post('/api/participants/update-group-names', (req, res) => {
  db.run("UPDATE participants SET group_type = '工場及社區組' WHERE group_type = '工場組'", (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: '組別名稱已更新' });
  });
});

// 更新資料庫約束（管理功能）
app.post('/api/participants/update-constraints', (req, res) => {
  db.serialize(() => {
    db.run('BEGIN');
    db.all('SELECT id,name,group_type,gender,team_name,created_at FROM participants', (e1, P) => {
      if (e1) { db.run('ROLLBACK'); return res.status(500).json({ error: e1.message }); }
      db.all('SELECT id,participant_id,event_id,round,score,created_at FROM scores', (e2, S) => {
        if (e2) { db.run('ROLLBACK'); return res.status(500).json({ error: e2.message }); }

        db.run('DROP TABLE IF EXISTS scores', e3 => {
          if (e3) { db.run('ROLLBACK'); return res.status(500).json({ error: e3.message }); }
          db.run('DROP TABLE IF EXISTS participants', e4 => {
            if (e4) { db.run('ROLLBACK'); return res.status(500).json({ error: e4.message }); }

            db.run(`CREATE TABLE participants(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              group_type TEXT NOT NULL CHECK (group_type IN ('工場及社區組','展能組')),
              gender TEXT NOT NULL CHECK (gender IN ('男','女')),
              team_name TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(name, group_type, gender)
            )`, e5 => {
              if (e5) { db.run('ROLLBACK'); return res.status(500).json({ error: e5.message }); }

              const insP = db.prepare('INSERT OR REPLACE INTO participants(id,name,group_type,gender,team_name,created_at) VALUES (?,?,?,?,?,?)');
              for (const r of P) insP.run([r.id,r.name,r.group_type,r.gender,r.team_name,r.created_at]);
              insP.finalize(e6 => {
                if (e6) { db.run('ROLLBACK'); return res.status(500).json({ error: e6.message }); }

                db.run(`CREATE TABLE scores(
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  participant_id INTEGER NOT NULL,
                  event_id INTEGER NOT NULL,
                  round INTEGER NOT NULL CHECK (round IN (1,2)),
                  score REAL NOT NULL CHECK (score >= 0),
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
                  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                  UNIQUE(participant_id, event_id, round)
                )`, e7 => {
                  if (e7) { db.run('ROLLBACK'); return res.status(500).json({ error: e7.message }); }

                  const insS = db.prepare('INSERT OR REPLACE INTO scores(id,participant_id,event_id,round,score,created_at) VALUES (?,?,?,?,?,?)');
                  let failed = 0;
                  for (const s of S) insS.run([s.id,s.participant_id,s.event_id,s.round,s.score,s.created_at], er => { if (er) failed++; });
                  insS.finalize(e8 => {
                    if (e8) { db.run('ROLLBACK'); return res.status(500).json({ error: e8.message }); }

                    // 重建索引
                    db.run('CREATE INDEX IF NOT EXISTS idx_participants_group_gender ON participants(group_type, gender)');
                    db.run('CREATE INDEX IF NOT EXISTS idx_participants_name ON participants(name)');
                    db.run('CREATE INDEX IF NOT EXISTS idx_scores_participant ON scores(participant_id)');
                    db.run('CREATE INDEX IF NOT EXISTS idx_scores_event ON scores(event_id)');
                    db.run('CREATE INDEX IF NOT EXISTS idx_scores_round ON scores(round)');
                    db.run('CREATE INDEX IF NOT EXISTS idx_scores_event_round_score ON scores(event_id, round, score DESC, created_at, id)', () => {
                      db.run('COMMIT', ec => {
                        if (ec) { db.run('ROLLBACK'); return res.status(500).json({ error: ec.message }); }
                        res.json({ 
                          message: '資料庫約束已更新', 
                          restored_participants: P.length, 
                          restored_scores: S.length - failed, 
                          failed_scores: failed 
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// 清空所有參賽者（管理功能）
app.delete('/api/participants/clear', (req, res) => {
  db.run('DELETE FROM participants', (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: '所有參賽者資料已清空' });
  });
});

// 清理重複比賽項目（管理功能）
app.post('/api/events/cleanup', (req, res) => {
  db.serialize(() => {
    // 先清空所有比賽項目
    db.run('DELETE FROM events', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 重新插入正確的4個比賽項目
      const events = [
        { name: '火箭投擲', type: '個人' },
        { name: '來回跑', type: '個人' },
        { name: '立定跳遠', type: '個人' },
        { name: '硬地滾球', type: '團體' }
      ];
      
      let completed = 0;
      events.forEach(event => {
        db.run('INSERT INTO events (name, type) VALUES (?, ?)', [event.name, event.type], (err) => {
          if (err) {
            console.error('插入比賽項目失敗:', err);
          } else {
            console.log(`已插入比賽項目: ${event.name} (${event.type})`);
          }
          completed++;
          if (completed === events.length) {
            res.json({ message: '比賽項目已清理並重新設置' });
          }
        });
      });
    });
  });
});

// ==================== 記分員管理 API ====================

// 獲取所有記分員
app.get('/api/scorers', (req, res) => {
  const query = 'SELECT * FROM scorers ORDER BY created_at DESC';
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 解析 assigned_events JSON
    const scorers = rows.map(row => ({
      ...row,
      assigned_events: row.assigned_events ? JSON.parse(row.assigned_events) : []
    }));
    
    res.json(scorers);
  });
});

// 添加記分員
app.post('/api/scorers', (req, res) => {
  const { name, username, password, assigned_events, is_active = true } = req.body;
  
  if (!name || !username || !password || !assigned_events) {
    return res.status(400).json({ error: '請填寫所有必填欄位' });
  }
  
  const assignedEventsJson = JSON.stringify(assigned_events);
  
  const query = `
    INSERT INTO scorers (name, username, password, assigned_events, is_active)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [name, username, password, assignedEventsJson, is_active ? 1 : 0], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: '用戶名已存在' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    
    res.json({ 
      message: '記分員添加成功',
      id: this.lastID 
    });
  });
});

// 更新記分員
app.put('/api/scorers/:id', (req, res) => {
  const { id } = req.params;
  const { name, username, password, assigned_events, is_active } = req.body;
  
  if (!name || !username || !assigned_events) {
    return res.status(400).json({ error: '請填寫所有必填欄位' });
  }
  
  const assignedEventsJson = JSON.stringify(assigned_events);
  
  let query, params;
  
  if (password) {
    // 如果提供了密碼，則更新密碼
    query = `
      UPDATE scorers 
      SET name = ?, username = ?, password = ?, assigned_events = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    params = [name, username, password, assignedEventsJson, is_active ? 1 : 0, id];
  } else {
    // 如果沒有提供密碼，則不更新密碼
    query = `
      UPDATE scorers 
      SET name = ?, username = ?, assigned_events = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    params = [name, username, assignedEventsJson, is_active ? 1 : 0, id];
  }
  
  db.run(query, params, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: '用戶名已存在' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '記分員不存在' });
      return;
    }
    
    res.json({ message: '記分員更新成功' });
  });
});

// 刪除記分員
app.delete('/api/scorers/:id', (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM scorers WHERE id = ?';
  
  db.run(query, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '記分員不存在' });
      return;
    }
    
    res.json({ message: '記分員刪除成功' });
  });
});

// 記分員登入
app.post('/api/scorer/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      message: '請提供用戶名和密碼' 
    });
  }
  
  const query = 'SELECT * FROM scorers WHERE username = ? AND is_active = 1';
  
  db.get(query, [username], (err, row) => {
    if (err) {
      res.status(500).json({ 
        success: false,
        message: '登入失敗: ' + err.message 
      });
      return;
    }
    
    if (!row) {
      res.status(401).json({ 
        success: false,
        message: '用戶名不存在或已被停用' 
      });
      return;
    }
    
    if (row.password !== password) {
      res.status(401).json({ 
        success: false,
        message: '密碼錯誤' 
      });
      return;
    }
    
    // 解析 assigned_events JSON
    const scorer = {
      ...row,
      assigned_events: row.assigned_events ? JSON.parse(row.assigned_events) : []
    };
    
    res.json({ 
      success: true,
      message: '登入成功',
      scorer 
    });
  });
});

// 獲取記分員負責的項目
app.get('/api/scorer/events', (req, res) => {
  // 這裡可以根據記分員身份驗證來返回不同的項目
  // 暫時返回所有啟用的項目
  const query = 'SELECT * FROM events WHERE is_active = 1 ORDER BY name';
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json(rows);
  });
});

// 批量提交分數
app.post('/api/scores/batch', (req, res) => {
  const { scores } = req.body;
  
  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    return res.status(400).json({ error: '請提供有效的分數數據' });
  }
  
  const insertPromises = scores.map(scoreData => {
    return new Promise((resolve, reject) => {
      const { participant_id, event_name, round, score } = scoreData;
      
      if (!participant_id || !event_name || !round || score === undefined) {
        reject(new Error('分數數據不完整'));
        return;
      }
      
      // 首先獲取 event_id
      const eventQuery = 'SELECT id FROM events WHERE name = ?';
      db.get(eventQuery, [event_name], (err, event) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!event) {
          reject(new Error(`找不到項目: ${event_name}`));
          return;
        }
        
        // 插入或更新分數
        const scoreQuery = `
          INSERT OR REPLACE INTO scores (participant_id, event_id, round, score)
          VALUES (?, ?, ?, ?)
        `;
        
        db.run(scoreQuery, [participant_id, event.id, round, score], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ participant_id, event_name, round, score });
          }
        });
      });
    });
  });
  
  Promise.all(insertPromises)
    .then(results => {
      res.json({ 
        message: `成功提交 ${results.length} 個分數`,
        results 
      });
    })
    .catch(error => {
      console.error('批量提交分數失敗:', error);
      res.status(500).json({ error: error.message });
    });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
});

// 刪除所有分數記錄（需要密碼驗證）
app.post('/api/scores/delete-all', (req, res) => {
  const { password } = req.body;
  
  // 驗證密碼
  if (password !== 'wjwjcscs') {
    return res.status(401).json({ error: '密碼錯誤' });
  }
  
  db.serialize(() => {
    // 備份現有數據
    db.run('DROP TABLE IF EXISTS scores_backup');
    db.run('CREATE TABLE scores_backup AS SELECT * FROM scores');
    
    // 刪除所有分數記錄
    db.run('DELETE FROM scores', function(err) {
      if (err) {
        return res.status(500).json({ error: '刪除分數記錄失敗: ' + err.message });
      }
      
      res.json({ 
        message: '所有分數記錄已刪除',
        deletedCount: this.changes,
        note: '數據已備份到 scores_backup 表'
      });
    });
  });
});

// 刪除所有參賽者（需要密碼驗證）
app.post('/api/participants/delete-all', (req, res) => {
  const { password } = req.body;
  
  // 驗證密碼
  if (password !== 'wjwjcscs') {
    return res.status(401).json({ error: '密碼錯誤' });
  }
  
  db.serialize(() => {
    // 備份現有數據
    db.run('DROP TABLE IF EXISTS participants_backup');
    db.run('CREATE TABLE participants_backup AS SELECT * FROM participants');
    
    // 刪除所有參賽者（由於外鍵約束，相關的分數記錄也會被自動刪除）
    db.run('DELETE FROM participants', function(err) {
      if (err) {
        return res.status(500).json({ error: '刪除參賽者失敗: ' + err.message });
      }
      
      res.json({ 
        message: '所有參賽者已刪除',
        deletedCount: this.changes,
        note: '數據已備份到 participants_backup 表，相關分數記錄也會被自動刪除'
      });
    });
  });
});

// 重置數據庫結構為新的比賽規則
app.post('/api/database/reset-rounds', (req, res) => {
  db.serialize(() => {
    try {
      // 備份現有數據
      const backupScores = [];
      db.all('SELECT * FROM scores', (err, rows) => {
        if (err) {
          return res.status(500).json({ error: '備份數據失敗: ' + err.message });
        }
        
        backupScores.push(...rows);
        
        // 刪除舊表
        db.run('DROP TABLE IF EXISTS scores_backup');
        db.run('CREATE TABLE scores_backup AS SELECT * FROM scores');
        db.run('DROP TABLE scores');
        
        // 創建新表結構（1=初賽，2=決賽）
        db.run(`CREATE TABLE scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          participant_id INTEGER NOT NULL,
          event_id INTEGER NOT NULL,
          round INTEGER NOT NULL CHECK (round IN (1, 2)),
          score REAL NOT NULL CHECK (score >= 0),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          UNIQUE(participant_id, event_id, round)
        )`);
        
        // 恢復數據，只保留初賽(round=1)和決賽(round=2)
        const stmt = db.prepare('INSERT INTO scores (participant_id, event_id, round, score, created_at) VALUES (?, ?, ?, ?, ?)');
        backupScores.forEach(score => {
          // 只保留 round=1 和 round=2 的記錄
          if (score.round === 1 || score.round === 2) {
            stmt.run([score.participant_id, score.event_id, score.round, score.score, score.created_at]);
          }
        });
        stmt.finalize();
        
        // 重新創建索引
        db.run('CREATE INDEX IF NOT EXISTS idx_scores_participant ON scores(participant_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_scores_event ON scores(event_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_scores_round ON scores(round)');
        db.run('CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)');
        
        res.json({ 
          message: '數據庫結構已重置，支持新的比賽規則',
          backupCount: backupScores.length,
          note: '火箭投擲只有決賽，其他項目有初賽+決賽'
        });
      });
    } catch (error) {
      res.status(500).json({ error: '重置數據庫結構失敗: ' + error.message });
    }
  });
});

// 獲取所有比賽項目狀態
app.get('/api/competition/status', (req, res) => {
  const query = `
    SELECT 
      cs.event_id,
      e.name as event_name,
      e.type as event_type,
      cs.is_finished,
      cs.updated_at
    FROM competition_status cs
    JOIN events e ON cs.event_id = e.id
    ORDER BY e.name
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 轉換為更易用的格式
    const statusMap = {};
    rows.forEach(row => {
      statusMap[row.event_id] = {
        event_id: row.event_id,
        event_name: row.event_name,
        event_type: row.event_type,
        is_finished: row.is_finished === 1,
        updated_at: row.updated_at
      };
    });
    
    res.json(statusMap);
  });
});

// 獲取特定項目的比賽狀態
app.get('/api/competition/status/:eventId', (req, res) => {
  const eventId = req.params.eventId;
  
  const query = `
    SELECT 
      cs.event_id,
      e.name as event_name,
      e.type as event_type,
      cs.is_finished,
      cs.updated_at
    FROM competition_status cs
    JOIN events e ON cs.event_id = e.id
    WHERE cs.event_id = ?
  `;
  
  db.get(query, [eventId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: '找不到該項目的比賽狀態' });
      return;
    }
    
    res.json({
      event_id: row.event_id,
      event_name: row.event_name,
      event_type: row.event_type,
      is_finished: row.is_finished === 1,
      updated_at: row.updated_at
    });
  });
});

// 批量更新所有項目的比賽狀態（必須放在 :eventId 路由之前）
app.post('/api/competition/status/batch', (req, res) => {
  const { statuses } = req.body; // 期望格式: [{event_id: 1, is_finished: true}, ...]
  
  if (!Array.isArray(statuses)) {
    res.status(400).json({ error: 'statuses 必須是陣列' });
    return;
  }
  
  const updatePromises = statuses.map(status => {
    return new Promise((resolve, reject) => {
      if ((typeof status.event_id !== 'number' && typeof status.event_id !== 'string') || typeof status.is_finished !== 'boolean') {
        reject(new Error('無效的狀態資料格式'));
        return;
      }
      
      const eventId = parseInt(status.event_id);
      if (isNaN(eventId)) {
        reject(new Error('無效的 event_id'));
        return;
      }
      
      db.run(
        'UPDATE competition_status SET is_finished = ?, updated_at = CURRENT_TIMESTAMP WHERE event_id = ?',
        [status.is_finished ? 1 : 0, eventId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ event_id: eventId, changes: this.changes });
          }
        }
      );
    });
  });
  
  Promise.all(updatePromises)
    .then(results => {
      res.json({ 
        message: '批量更新完成',
        results: results
      });
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
});

// 更新特定項目的比賽狀態
app.post('/api/competition/status/:eventId', (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const { is_finished } = req.body;
  
  if (isNaN(eventId)) {
    res.status(400).json({ error: '無效的項目ID' });
    return;
  }
  
  if (typeof is_finished !== 'boolean') {
    res.status(400).json({ error: 'is_finished 必須是布林值' });
    return;
  }
  
  // 先檢查項目是否存在
  db.get('SELECT id FROM events WHERE id = ?', [eventId], (err, event) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!event) {
      res.status(404).json({ error: '找不到該比賽項目' });
      return;
    }
    
    // 更新或創建狀態記錄
    db.run(
      'UPDATE competition_status SET is_finished = ?, updated_at = CURRENT_TIMESTAMP WHERE event_id = ?',
      [is_finished ? 1 : 0, eventId],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        if (this.changes === 0) {
          // 如果沒有更新到記錄，創建一個新的
          db.run('INSERT INTO competition_status (event_id, is_finished) VALUES (?, ?)', [eventId, is_finished ? 1 : 0], (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ 
              message: '比賽狀態已更新',
              event_id: eventId,
              is_finished: is_finished
            });
          });
        } else {
          res.json({ 
            message: '比賽狀態已更新',
            event_id: eventId,
            is_finished: is_finished
          });
        }
      }
    );
  });
});

// 匯入參賽者資料
app.post('/api/import/participants', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '請選擇檔案' });
  }

  const filePath = req.file.path;
  const participants = [];
  const errors = [];

  fs.createReadStream(filePath)
    .pipe(csv({
      mapHeaders: ({ header }) => String(header || '').trim(),
      mapValues: ({ value }) => String(value || '').trim()
    }))
    .on('data', (row) => {
      // 驗證必要欄位
      if (!row.姓名 || !row.性別 || !row.組別) {
        errors.push(`第 ${participants.length + 1} 行：缺少必要欄位（姓名、性別、組別）`);
        return;
      }

      // 驗證性別
      if (!['男', '女'].includes(row.性別)) {
        errors.push(`第 ${participants.length + 1} 行：性別必須是「男」或「女」`);
        return;
      }

      // 驗證組別
      if (!['工場及社區組', '展能組'].includes(row.組別)) {
        errors.push(`第 ${participants.length + 1} 行：組別必須是「工場及社區組」或「展能組」`);
        return;
      }

      participants.push({
        name: row.姓名,
        gender: row.性別,
        group_type: row.組別,
        team_name: row.隊伍名稱 || ''
      });
    })
    .on('end', () => {
      if (errors.length > 0) {
        // 清理上傳的檔案
        fs.unlinkSync(filePath);
        return res.status(400).json({ 
          error: '資料驗證失敗', 
          details: errors 
        });
      }

      if (participants.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: '沒有有效的參賽者資料' });
      }

      // 批量插入參賽者
      const stmt = db.prepare('INSERT INTO participants (name, gender, group_type, team_name) VALUES (?, ?, ?, ?)');
      
      participants.forEach(participant => {
        stmt.run(participant.name, participant.gender, participant.group_type, participant.team_name);
      });
      
      stmt.finalize();

      // 清理上傳的檔案
      fs.unlinkSync(filePath);

      res.json({ 
        message: `成功匯入 ${participants.length} 位參賽者`,
        count: participants.length
      });
    })
    .on('error', (err) => {
      console.error('CSV 解析錯誤:', err);
      fs.unlinkSync(filePath);
      res.status(500).json({ error: '檔案解析失敗' });
    });
});

// 匯入分數資料
app.post('/api/import/scores', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '請選擇檔案' });
  }

  const filePath = req.file.path;
  
  try {
    // 讀取檔案內容
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n');
    
    if (lines.length < 2) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: '檔案格式不正確' });
    }

    const scores = [];
    const errors = [];

    // 跳過標題行，處理資料行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',');
      if (columns.length < 4) {
        errors.push(`第 ${i + 1} 行：欄位數量不足`);
        continue;
      }

      const [participant_name, event_name, round, score_str] = columns;
      
      // 驗證必要欄位
      if (!participant_name || !event_name || !round || !score_str) {
        errors.push(`第 ${i + 1} 行：缺少必要欄位`);
        continue;
      }

      // 驗證分數
      const score = parseFloat(score_str);
      if (isNaN(score)) {
        errors.push(`第 ${i + 1} 行：分數必須是數字`);
        continue;
      }

      // 驗證輪次
      if (!['初賽', '決賽'].includes(round)) {
        errors.push(`第 ${i + 1} 行：輪次必須是「初賽」或「決賽」`);
        continue;
      }

      scores.push({
        participant_name: participant_name.trim(),
        event_name: event_name.trim(),
        round: round.trim(),
        score: score
      });
    }

    if (errors.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: '資料驗證失敗', 
        details: errors 
      });
    }

    if (scores.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: '沒有有效的分數資料' });
    }

    // 批量插入分數
    let successCount = 0;
    let errorCount = 0;
    const processErrors = [];

    for (const scoreData of scores) {
      try {
        // 查找參賽者ID
        const participant = db.prepare('SELECT id FROM participants WHERE name = ?').get(scoreData.participant_name);
        if (!participant) {
          processErrors.push(`找不到參賽者：${scoreData.participant_name}`);
          errorCount++;
          continue;
        }

        // 查找比賽項目ID
        const event = db.prepare('SELECT id FROM events WHERE name = ?').get(scoreData.event_name);
        if (!event) {
          processErrors.push(`找不到比賽項目：${scoreData.event_name}`);
          errorCount++;
          continue;
        }

        // 插入分數
        db.prepare('INSERT OR REPLACE INTO scores (participant_id, event_id, round, score) VALUES (?, ?, ?, ?)')
          .run(participant.id, event.id, scoreData.round, scoreData.score);
        
        successCount++;
      } catch (err) {
        processErrors.push(`處理失敗：${scoreData.participant_name} - ${scoreData.event_name}: ${err.message}`);
        errorCount++;
      }
    }

    // 清理上傳的檔案
    fs.unlinkSync(filePath);

    let message = `成功匯入 ${successCount} 筆分數記錄`;
    if (errorCount > 0) {
      message += `，${errorCount} 筆失敗`;
    }

    res.json({ 
      message: message,
      successCount: successCount,
      errorCount: errorCount,
      errors: processErrors.slice(0, 10) // 只返回前10個錯誤
    });

  } catch (err) {
    console.error('處理分數匯入時發生錯誤:', err);
    fs.unlinkSync(filePath);
    res.status(500).json({ error: '處理分數匯入時發生錯誤' });
  }
});

// 匯入完整備份
app.post('/api/import/backup', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '請選擇檔案' });
  }

  const filePath = req.file.path;
  
  // 讀取檔案內容
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      fs.unlinkSync(filePath);
      return res.status(500).json({ error: '檔案讀取失敗' });
    }

    try {
      // 解析CSV內容
      const lines = data.split('\n');
      let currentSection = '';
      let processedCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('=== ')) {
          currentSection = line.replace(/=== | ===/g, '');
          continue;
        }

        if (line === '' || line.startsWith('ID,')) {
          continue;
        }

        // 根據不同區段處理資料
        switch (currentSection) {
          case '參賽者資料':
            // 處理參賽者資料
            break;
          case '比賽項目':
            // 處理比賽項目
            break;
          case '分數記錄':
            // 處理分數記錄
            break;
          case '比賽狀態':
            // 處理比賽狀態
            break;
        }
        
        processedCount++;
      }

      // 清理上傳的檔案
      fs.unlinkSync(filePath);

      res.json({ 
        message: `成功處理 ${processedCount} 筆備份資料`,
        count: processedCount
      });
    } catch (error) {
      console.error('備份解析錯誤:', error);
      fs.unlinkSync(filePath);
      res.status(500).json({ error: '備份檔案解析失敗' });
    }
  });
});

// 下載參賽者範本
app.get('/api/download/template/participants', (req, res) => {
  try {
    const templatePath = path.join(__dirname, 'template.csv');
    
    // 檢查文件是否存在
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: '範本文件不存在' });
    }
    
    // 設置響應頭
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="participant_template.csv"');
    res.setHeader('Cache-Control', 'no-cache');
    
    // 發送文件
    res.sendFile(templatePath);
  } catch (error) {
    console.error('下載參賽者範本時發生錯誤:', error);
    res.status(500).json({ error: '下載範本失敗' });
  }
});

// 下載分數範本
app.get('/api/download/template/scores', (req, res) => {
  try {
    // 生成分數範本CSV
    const csvHeader = '參賽者姓名,比賽項目,輪次,分數\n';
    const csvData = [
      '張三,火箭投擲,初賽,85.5',
      '李四,來回跑,初賽,12.3',
      '王五,立定跳遠,初賽,2.45',
      '陳六,硬地滾球,初賽,15'
    ].join('\n');
    
    const csv = '\ufeff' + csvHeader + csvData; // 添加BOM以支援中文
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="scores_template.csv"');
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send(csv);
  } catch (error) {
    console.error('下載分數範本時發生錯誤:', error);
    res.status(500).json({ error: '下載範本失敗' });
  }
});

// 下載備份範本
app.get('/api/download/template/backup', (req, res) => {
  try {
    // 生成備份範本說明
    const csvHeader = '資料類型,說明,範例\n';
    const csvData = [
      '參賽者資料,包含所有參賽者基本資料,請使用參賽者範本',
      '分數資料,包含所有比賽分數記錄,請使用分數範本',
      '完整備份,包含所有資料的完整備份,請使用匯出功能生成的完整備份檔案'
    ].join('\n');
    
    const csv = '\ufeff' + csvHeader + csvData; // 添加BOM以支援中文
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="backup_template.csv"');
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send(csv);
  } catch (error) {
    console.error('下載備份範本時發生錯誤:', error);
    res.status(500).json({ error: '下載範本失敗' });
  }
});

// 匯出參賽者資料
app.get('/api/export/participants', (req, res) => {
  const query = `
    SELECT 
      id,
      name,
      group_type,
      gender,
      team_name,
      created_at
    FROM participants 
    ORDER BY group_type, gender, name
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 轉換為CSV格式
    const csvHeader = 'ID,姓名,組別,性別,隊伍名稱,建立時間\n';
    const csvData = rows.map(row => 
      `${row.id},"${row.name}","${row.group_type}","${row.gender}","${row.team_name || ''}","${row.created_at}"`
    ).join('\n');
    
    const csv = csvHeader + csvData;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="participants.csv"');
    res.send('\ufeff' + csv); // 添加BOM以支援中文
  });
});

// 匯出分數資料
app.get('/api/export/scores', (req, res) => {
  const query = `
    SELECT 
      s.id,
      p.name as participant_name,
      p.group_type,
      p.gender,
      p.team_name,
      e.name as event_name,
      e.type as event_type,
      s.round,
      s.score,
      s.created_at
    FROM scores s
    JOIN participants p ON s.participant_id = p.id
    JOIN events e ON s.event_id = e.id
    ORDER BY e.name, s.round, s.score DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 轉換為CSV格式
    const csvHeader = 'ID,參賽者姓名,組別,性別,隊伍名稱,比賽項目,項目類型,輪次,分數,記錄時間\n';
    const csvData = rows.map(row => 
      `${row.id},"${row.participant_name}","${row.group_type}","${row.gender}","${row.team_name || ''}","${row.event_name}","${row.event_type}","${row.round}","${row.score}","${row.created_at}"`
    ).join('\n');
    
    const csv = csvHeader + csvData;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="scores.csv"');
    res.send('\ufeff' + csv);
  });
});

// 匯出比賽結果
app.get('/api/export/results', (req, res) => {
  const query = `
    SELECT 
      e.id as event_id,
      e.name as event_name,
      e.type as event_type,
      p.name as participant_name,
      COALESCE(pg.name, p.group_type) as group_type,
      p.gender,
      p.team_name,
      s.round,
      s.score,
      ROW_NUMBER() OVER (PARTITION BY e.id, s.round ORDER BY s.score DESC) as rank
    FROM scores s
    JOIN participants p ON s.participant_id = p.id
    LEFT JOIN participant_groups pg ON p.group_id = pg.id
    JOIN events e ON s.event_id = e.id
    ORDER BY e.name, s.round, s.score DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 轉換為CSV格式
    const csvHeader = '比賽項目,項目類型,參賽者姓名,組別,性別,隊伍名稱,輪次,分數,排名\n';
    const csvData = rows.map(row => 
      `"${row.event_name}","${row.event_type}","${row.participant_name}","${row.group_type}","${row.gender}","${row.team_name || ''}","${row.round}","${row.score}","${row.rank}"`
    ).join('\n');
    
    const csv = csvHeader + csvData;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
    res.send('\ufeff' + csv);
  });
});

// 匯出完整資料
app.get('/api/export/all', (req, res) => {
  const queries = {
    participants: 'SELECT * FROM participants ORDER BY id',
    events: 'SELECT * FROM events ORDER BY id',
    scores: 'SELECT * FROM scores ORDER BY id',
    competition_status: 'SELECT * FROM competition_status ORDER BY event_id'
  };
  
  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;
  
  Object.keys(queries).forEach(table => {
    db.all(queries[table], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      results[table] = rows;
      completed++;
      
      if (completed === total) {
        // 生成完整的CSV
        let csv = '';
        
        // 參賽者資料
        csv += '=== 參賽者資料 ===\n';
        csv += 'ID,姓名,組別,性別,隊伍名稱,建立時間\n';
        results.participants.forEach(row => {
          csv += `${row.id},"${row.name}","${row.group_type}","${row.gender}","${row.team_name || ''}","${row.created_at}"\n`;
        });
        
        csv += '\n=== 比賽項目 ===\n';
        csv += 'ID,項目名稱,項目類型,建立時間\n';
        results.events.forEach(row => {
          csv += `${row.id},"${row.name}","${row.type}","${row.created_at}"\n`;
        });
        
        csv += '\n=== 分數記錄 ===\n';
        csv += 'ID,參賽者ID,比賽項目ID,輪次,分數,記錄時間\n';
        results.scores.forEach(row => {
          csv += `${row.id},${row.participant_id},${row.event_id},"${row.round}","${row.score}","${row.created_at}"\n`;
        });
        
        csv += '\n=== 比賽狀態 ===\n';
        csv += 'ID,比賽項目ID,是否完結,更新時間\n';
        results.competition_status.forEach(row => {
          csv += `${row.id},${row.event_id},"${row.is_finished ? '是' : '否'}","${row.updated_at}"\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="complete_backup.csv"');
        res.send('\ufeff' + csv);
      }
    });
  });
});

// 管理員登入API
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '請提供用戶名和密碼' });
  }

  // 檢查是否有管理員記錄，如果沒有則創建默認管理員
  db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row.count === 0) {
      // 創建默認管理員
      const defaultPassword = 'wjwjcscs';
      db.run('INSERT INTO admins (username, password) VALUES (?, ?)', 
        ['admin', defaultPassword], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        console.log('已創建默認管理員帳號');
      });
    }

    // 驗證登入
    db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!admin || admin.password !== password) {
        return res.status(401).json({ error: '用戶名或密碼錯誤' });
      }

      res.json({ 
        success: true, 
        message: '登入成功',
        admin: { id: admin.id, username: admin.username }
      });
    });
  });
});

// 驗證管理員密碼API
app.post('/api/admin/verify-password', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: '請提供密碼' });
  }

  db.get('SELECT password FROM admins WHERE id = 1', (err, admin) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!admin) {
      return res.status(404).json({ error: '管理員不存在' });
    }

    res.json({ valid: admin.password === password });
  });
});

// 更新管理員資料API
app.put('/api/admin/profile', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '請提供用戶名和新密碼' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: '用戶名長度必須在3-20個字符之間' });
  }

  if (password.length < 6 || password.length > 50) {
    return res.status(400).json({ error: '密碼長度必須在6-50個字符之間' });
  }

  db.run('UPDATE admins SET username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1', 
    [username, password], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '管理員不存在' });
    }

    res.json({ 
      success: true, 
      message: '管理員資料更新成功',
      admin: { username }
    });
  });
});

// 優雅關閉
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('資料庫連線已關閉');
    process.exit(0);
  });
});
