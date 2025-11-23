import { io } from 'socket.io-client';

// 개발 환경에서는 localhost:3000, 배포 시에는 현재 호스트 사용
// Vite proxy가 /socket.io를 처리하므로 항상 상대 경로 사용
const URL = '/';

export const socket = io(URL, {
    autoConnect: true
});
