import React, { useState } from 'react';
import Canvas from '../components/Canvas';
import PostCreationModal from '../components/PostCreationModal';
import InquiryModal from '../components/InquiryModal';
import { socket } from '../utils/socket';

function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInquiryOpen, setIsInquiryOpen] = useState(false);
    const [scale, setScale] = useState(0.6);
    const [position, setPosition] = useState({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    });

    const handleCreatePost = ({ content, color, font }) => {
        const id = crypto.randomUUID();
        const secret = crypto.randomUUID();

        localStorage.setItem(`post_secret_${id}`, secret);

        // 화면 중앙 좌표 계산 (역변환)
        // 화면 중앙(window/2)에서 현재 캔버스 위치(position)를 빼고, 스케일로 나눔
        const centerX = (window.innerWidth / 2 - position.x) / scale;
        const centerY = (window.innerHeight / 2 - position.y) / scale;

        // 약간의 랜덤 오프셋 추가 (-50 ~ +50)
        const randomOffset = () => (Math.random() - 0.5) * 100;

        const newPost = {
            id,
            content,
            style: {
                color,
                font,
                rotation: (Math.random() * 10) - 5
            },
            position: {
                x: centerX + randomOffset() - 100, // -100은 포스트잇 크기의 절반 보정
                y: centerY + randomOffset() - 100,
                zIndex: Date.now()
            },
            auth: {
                deleteSecret: secret
            },
            meta: {
                createdAt: new Date().toISOString(),
                deviceInfo: {
                    userAgent: navigator.userAgent
                }
            }
        };

        socket.emit('post:create', newPost);
    };

    return (
        <div className="w-full h-screen overflow-hidden relative">
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

