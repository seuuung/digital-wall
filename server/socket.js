/**
 * socket.js
 * Socket.io 이벤트 핸들러 (sqlite3)
 */
const db = require('./db');

// 현재 접속 중인 사용자 정보를 저장하는 Map
const onlineUsers = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`클라이언트 접속: ${socket.id}`);

        // 접속자 정보 저장
        const userInfo = {
            socketId: socket.id,
            ipAddress: socket.handshake.headers['x-forwarded-for'] || socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent'],
            connectedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            deviceInfo: null,
            currentPosition: { x: 0, y: 0 }
        };
        onlineUsers.set(socket.id, userInfo);

        // 접속자 수 브로드캐스트
        setTimeout(() => {
            io.emit('user:count', io.engine.clientsCount);
        }, 100);

        // 클라이언트로부터 디바이스 정보 수신
        socket.on('user:info', (info) => {
            const user = onlineUsers.get(socket.id);
            if (user) {
                user.deviceInfo = info.deviceInfo;
                user.lastActivity = new Date().toISOString();
                onlineUsers.set(socket.id, user);
            }
        });

        // 사용자 위치 업데이트 수신
        socket.on('user:position', (position) => {
            const user = onlineUsers.get(socket.id);
            if (user) {
                user.currentPosition = position;
                user.lastActivity = new Date().toISOString();
                onlineUsers.set(socket.id, user);
            }
        });

        // 초기 데이터 전송 (차단되지 않은 게시글만)
        db.all('SELECT * FROM posts WHERE isBanned = 0', [], (err, rows) => {
            if (err) {
                console.error('초기 데이터 로드 실패:', err);
                return;
            }

            // DB 형식을 프론트엔드 형식으로 변환
            const transformedPosts = rows.map(row => ({
                id: row.id,
                content: row.content,
                nickname: row.nickname,
                style: {
                    color: row.color,
                    font: row.font,
                    rotation: row.rotation
                },
                position: {
                    x: row.x,
                    y: row.y,
                    zIndex: row.zIndex
                },
                meta: {
                    createdAt: row.createdAt,
                    deviceInfo: JSON.parse(row.deviceInfo || '{}')
                }
            }));

            socket.emit('init', transformedPosts);
        });

        // 게시글 생성
        socket.on('post:create', (data) => {
            const { id, content, nickname, style, position, auth, meta } = data;

            // IP 주소
            const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

            const sql = `
        INSERT INTO posts (id, content, nickname, color, font, rotation, x, y, zIndex, deleteSecret, createdAt, ipAddress, deviceInfo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const params = [
                id,
                content,
                nickname || '',
                style.color,
                style.font,
                style.rotation,
                position.x,
                position.y,
                position.zIndex,
                auth.deleteSecret,
                meta.createdAt,
                ip,
                JSON.stringify(meta.deviceInfo)
            ];

            db.run(sql, params, function (err) {
                if (err) {
                    console.error('게시글 생성 실패:', err);
                    return;
                }
                // 브로드캐스트
                io.emit('post:created', data);
            });

            // 마지막 활동 시간 업데이트
            const user = onlineUsers.get(socket.id);
            if (user) {
                user.lastActivity = new Date().toISOString();
                onlineUsers.set(socket.id, user);
            }
        });

        // 게시글 이동
        socket.on('post:move', (data) => {
            const { id, position } = data;

            const sql = 'UPDATE posts SET x = ?, y = ?, zIndex = ? WHERE id = ?';
            db.run(sql, [position.x, position.y, position.zIndex, id], function (err) {
                if (err) {
                    console.error('게시글 이동 실패:', err);
                    return;
                }
                // 브로드캐스트 (자신 제외)
                socket.broadcast.emit('post:moved', data);
            });

            // 마지막 활동 시간 업데이트
            const user = onlineUsers.get(socket.id);
            if (user) {
                user.lastActivity = new Date().toISOString();
                onlineUsers.set(socket.id, user);
            }
        });

        // 게시글 삭제
        socket.on('post:delete', (data) => {
            const { id, secret } = data;

            // 권한 확인
            db.get('SELECT deleteSecret FROM posts WHERE id = ?', [id], (err, row) => {
                if (err || !row) return;

                if (row.deleteSecret === secret) {
                    db.run('DELETE FROM posts WHERE id = ?', [id], function (err) {
                        if (!err) {
                            io.emit('post:deleted', { id });
                        }
                    });
                }
            });
        });

        socket.on('disconnect', () => {
            console.log(`클라이언트 접속 해제: ${socket.id}`);
            // 접속자 목록에서 제거
            onlineUsers.delete(socket.id);
            // 접속자 수 브로드캐스트
            io.emit('user:count', io.engine.clientsCount);
        });
    });

    // 온라인 사용자 목록을 반환하는 함수 (외부에서 사용)
    io.getOnlineUsers = () => {
        return Array.from(onlineUsers.values());
    };
};
