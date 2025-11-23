/**
 * db.js
 * SQLite 데이터베이스 연결 및 스키마 초기화 (sqlite3)
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// DB 파일 경로 설정 (Railway Volume 지원)
let dbPath;
if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
  dbPath = path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'database.sqlite');
} else if (fs.existsSync('/server')) {
  // Railway Volume Mount Path가 /server인 경우 자동 감지
  dbPath = path.join('/server', 'database.sqlite');
} else {
  // 로컬 개발 환경
  dbPath = path.resolve(__dirname, 'digital_wall.db');
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 실패:', err.message);
  } else {
    console.log(`데이터베이스에 연결되었습니다: ${dbPath}`);
  }
});

// 테이블 초기화
const initDb = () => {
  db.serialize(() => {
    // 게시글 테이블
    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        content TEXT,
        color TEXT,
        font TEXT,
        rotation REAL,
        x INTEGER,
        y INTEGER,
        zIndex INTEGER,
        deleteSecret TEXT,
        createdAt TEXT,
        ipAddress TEXT,
        deviceInfo TEXT,
        isBanned INTEGER DEFAULT 0,
        nickname TEXT
      )
    `, (err) => {
      // 기존 테이블이 있을 경우 컬럼 추가 시도 (오류 무시)
      if (!err) {
        db.run('ALTER TABLE posts ADD COLUMN nickname TEXT', () => { });
      }
    });

    // 문의 테이블
    db.run(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        message TEXT,
        contactInfo TEXT,
        isRead INTEGER DEFAULT 0,
        createdAt TEXT,
        ipAddress TEXT,
        deviceInfo TEXT
      )
    `);
  });

  console.log('데이터베이스 테이블이 준비되었습니다.');
};

initDb();

module.exports = db;
