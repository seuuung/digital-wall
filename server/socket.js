/**
 * socket.js
 * Socket.io 이벤트 핸들러 (sqlite3)
 */
const db = require('./db');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`클라이언트 접속: ${socket.id}`);

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
            const { id, content, style, position, auth, meta } = data;

            // IP 주소
            const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

            const sql = `
        INSERT INTO posts (id, content, color, font, rotation, x, y, zIndex, deleteSecret, createdAt, ipAddress, deviceInfo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            const params = [
                id,
                content,
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
        });
    });
};
