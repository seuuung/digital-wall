import { io } from 'socket.io-client';

// 개발 환경에서는 localhost:3000, 배포 시에는 현재 호스트 사용
const URL = import.meta.env.DEV ? 'http://localhost:3000' : '/';

export const socket = io(URL, {
    autoConnect: true
});
