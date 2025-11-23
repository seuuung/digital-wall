import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Canvas from '../components/Canvas';
import PostCreationModal from '../components/PostCreationModal';
import InquiryModal from '../components/InquiryModal';
import { socket } from '../utils/socket';
import Snow from '../components/Snow';

function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInquiryOpen, setIsInquiryOpen] = useState(false);
    const [scale, setScale] = useState(0.6);
    const [position, setPosition] = useState({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    });

    const [userCount, setUserCount] = useState(0);

    useEffect(() => {
        socket.on('user:count', (count) => {
            setUserCount(count);
        });

        // 서버에 디바이스 정보 전송
        const deviceInfo = {
            userAgent: navigator.userAgent,
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                colorDepth: window.screen.colorDepth,
                pixelDepth: window.screen.pixelDepth
            },
            language: navigator.language,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            touchSupport: {
                maxTouchPoints: navigator.maxTouchPoints,
                onTouchStart: 'ontouchstart' in window
            },
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                rtt: navigator.connection.rtt,
                downlink: navigator.connection.downlink,
                saveData: navigator.connection.saveData
            } : 'Not supported'
        };
        socket.emit('user:info', { deviceInfo });

        return () => {
            socket.off('user:count');
        };
    }, []);

    // 위치 변경 시 서버에 알림
    useEffect(() => {
        const viewportCenterX = -position.x / scale + window.innerWidth / 2 / scale;
        const viewportCenterY = -position.y / scale + window.innerHeight / 2 / scale;

        socket.emit('user:position', {
            x: Math.round(viewportCenterX),
            y: Math.round(viewportCenterY)
        });
    }, [position, scale]);

    const handleCreatePost = ({ content, nickname, color, font }) => {
        const id = uuidv4();
        const deleteSecret = uuidv4();

        // 화면 중앙 좌표 계산 (현재 뷰 기준)
        const centerX = (window.innerWidth / 2 - position.x) / scale;
        const centerY = (window.innerHeight / 2 - position.y) / scale;

        // 약간의 랜덤 오프셋 추가 (-50 ~ +50)
        const randomOffset = () => (Math.random() - 0.5) * 100;

        const newPost = {
            id,
            content,
            nickname,
            style: {
                color,
                font,
                rotation: (Math.random() - 0.5) * 10
            },
            position: {
                x: centerX + randomOffset(),
                y: centerY + randomOffset(),
                zIndex: 1
            },
            auth: {
                deleteSecret
            },
            meta: {
                createdAt: new Date().toISOString(),
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    screen: {
                        width: window.screen.width,
                        height: window.screen.height,
                        colorDepth: window.screen.colorDepth,
                        pixelDepth: window.screen.pixelDepth
                    },
                    language: navigator.language,
                    platform: navigator.platform,
                    hardwareConcurrency: navigator.hardwareConcurrency,
                    deviceMemory: navigator.deviceMemory,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    touchSupport: {
                        maxTouchPoints: navigator.maxTouchPoints,
                        onTouchStart: 'ontouchstart' in window
                    },
                    connection: navigator.connection ? {
                        effectiveType: navigator.connection.effectiveType,
                        rtt: navigator.connection.rtt,
                        downlink: navigator.connection.downlink,
                        saveData: navigator.connection.saveData
                    } : 'Not supported'
                }
            }
        };

        socket.emit('post:create', newPost);
        localStorage.setItem(`post_secret_${id}`, deleteSecret);
    };

    return (
        <div className="w-full h-screen overflow-hidden relative">
            <Snow />

            {/* 접속자 수 표시 */}
            <div className="fixed top-4 left-4 z-50 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full backdrop-blur-sm font-bold shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {userCount}명 접속 중
            </div>

            <Canvas
                scale={scale}
                setScale={setScale}
                position={position}
                setPosition={setPosition}
            />

            {/* 플로팅 액션 버튼들 */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-50">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="glass px-6 py-3 md:px-8 md:py-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 font-bold text-base md:text-lg text-white backdrop-blur-md hover:scale-110 glow whitespace-nowrap"
                >
                    ✏️ 글쓰기
                </button>
                <button
                    onClick={() => setIsInquiryOpen(true)}
                    className="glass px-5 py-3 md:px-6 md:py-4 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 font-bold text-base md:text-lg text-white backdrop-blur-md hover:scale-110 whitespace-nowrap"
                >
                    💬 문의하기
                </button>
            </div>

            <PostCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreatePost}
            />

            <InquiryModal
                isOpen={isInquiryOpen}
                onClose={() => setIsInquiryOpen(false)}
            />
        </div>
    );
}

export default Home;
