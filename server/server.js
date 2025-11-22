/**
 * server.js
 * 디지털 담벼락 (Digital Wall) 백엔드 진입점
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const db = require('./db');
const setupSocket = require('./socket');

// 앱 초기화
const app = express();
const server = http.createServer(app);

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../client/dist')));

// Socket.io 설정
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 소켓 이벤트 설정
setupSocket(io);

// API 라우트

// 관리자용: 모든 게시글 조회
app.get('/api/admin/posts', (req, res) => {
    const secret = req.query.secret;
    // 간단한 인증
    if (secret !== (process.env.ADMIN_SECRET || 'admin-secret')) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    db.all('SELECT * FROM posts', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 관리자용: IP 차단 및 게시글 숨김
app.post('/api/admin/ban', (req, res) => {
    const { ip, secret } = req.body;
    if (secret !== (process.env.ADMIN_SECRET || 'admin-secret')) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    // 해당 IP의 모든 글 밴 처리
    db.run('UPDATE posts SET isBanned = 1 WHERE ipAddress = ?', [ip], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '차단 처리 실패' });
        }

        // 소켓으로 삭제 이벤트 전송 (클라이언트에서 제거하도록)
        db.all('SELECT id FROM posts WHERE ipAddress = ?', [ip], (err, rows) => {
            if (!err && rows) {
                rows.forEach(post => {
                    io.emit('post:deleted', { id: post.id });
                });
            }
        });

        res.json({ success: true });
    });
});

// 관리자용: 문의 목록 조회
app.get('/api/admin/inquiries', (req, res) => {
    const secret = req.query.secret;
    if (secret !== (process.env.ADMIN_SECRET || 'admin-secret')) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    db.all('SELECT * FROM inquiries ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '조회 실패' });
        }
        res.json(rows);
    });
});

// 관리자용: 문의 읽음 처리
app.post('/api/admin/inquiries/:id/read', (req, res) => {
    const { secret } = req.body;
    if (secret !== (process.env.ADMIN_SECRET || 'admin-secret')) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    db.run('UPDATE inquiries SET isRead = 1 WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '처리 실패' });
        }
        res.json({ success: true });
    });
});

// 관리자용: 포스트 삭제
app.delete('/api/admin/posts/:id', (req, res) => {
    const { secret } = req.body;
    if (secret !== (process.env.ADMIN_SECRET || 'admin-secret')) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '삭제 실패' });
        }
        // 소켓으로 삭제 이벤트 전송
        io.emit('post:deleted', { id: req.params.id });
        res.json({ success: true });
    });
});

// 문의 등록
app.post('/api/inquiries', (req, res) => {
    const { message, contactInfo, meta } = req.body;
    const id = crypto.randomUUID();

    const sql = `
    INSERT INTO inquiries (id, message, contactInfo, createdAt, ipAddress, deviceInfo)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

    const params = [
        id,
        message,
        contactInfo,
        new Date().toISOString(),
        req.ip,
        JSON.stringify(meta?.deviceInfo || {})
    ];

    db.run(sql, params, function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '문의 등록 실패' });
        }
        res.json({ success: true });
    });
});

// 기본 라우트
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// SPA 라우팅
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 서버 시작
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Railway requires binding to 0.0.0.0

server.listen(PORT, HOST, () => {
    console.log(`서버가 http://${HOST}:${PORT} 에서 실행 중입니다.`);
});
