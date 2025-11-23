import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PostIt from './PostIt';
import Minimap from './Minimap';
import { socket } from '../utils/socket';

const Canvas = ({ scale, setScale, position, setPosition }) => {
    const [posts, setPosts] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [lastTouchDistance, setLastTouchDistance] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        // 초기 데이터 수신
        socket.on('init', (initialPosts) => {
            setPosts(initialPosts);
        });

        // 게시글 생성 수신
        socket.on('post:created', (newPost) => {
            setPosts((prev) => [...prev, newPost]);
        });

        // 게시글 이동 수신
        socket.on('post:moved', (movedPost) => {
            setPosts((prev) =>
                prev.map((post) =>
                    post.id === movedPost.id ? { ...post, position: movedPost.position } : post
                )
            );
        });

        // 게시글 삭제 수신
        socket.on('post:deleted', ({ id }) => {
            setPosts((prev) => prev.filter((post) => post.id !== id));
        });

        return () => {
            socket.off('init');
            socket.off('post:created');
            socket.off('post:moved');
            socket.off('post:deleted');
        };
    }, []);

    // 마우스 패닝 핸들러
    const handleMouseDown = (e) => {
        // UI 요소가 아닌 배경이나 PostIt 영역에서만 드래그 시작
        const isUIElement = e.target.closest('button, .glass, [role="button"]');
        if (!isUIElement) {
            setIsDragging(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 터치 핸들러 (모바일)
    const getTouchDistance = (touches) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            setLastTouchDistance(getTouchDistance(e.touches));
        } else if (e.touches.length === 1 && e.target === containerRef.current) {
            setIsDragging(true);
            setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && lastTouchDistance) {
            e.preventDefault();
            const currentDistance = getTouchDistance(e.touches);
            const delta = currentDistance - lastTouchDistance;
            const zoomSensitivity = 0.01;
            const newScale = scale + delta * zoomSensitivity;
            setScale(Math.min(Math.max(0.1, newScale), 5));
            setLastTouchDistance(currentDistance);
        } else if (e.touches.length === 1 && isDragging) {
            e.preventDefault();
            const dx = e.touches[0].clientX - lastMousePos.x;
            const dy = e.touches[0].clientY - lastMousePos.y;
            setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        setLastTouchDistance(null);
    };

    // 줌 핸들러 (마우스 휠) - 화면 중앙 기준, 중심 좌표 고정
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const newScale = Math.min(Math.max(0.1, scale - e.deltaY * zoomSensitivity), 5);

        // 화면 중앙을 기준으로 줌
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // 줌 전 중앙의 월드 좌표
        const worldX = (centerX - position.x) / scale;
        const worldY = (centerY - position.y) / scale;

        // 새로운 스케일에서도 같은 월드 좌표가 중앙에 오도록 position 조정
        const newPosition = {
            x: centerX - worldX * newScale,
            y: centerY - worldY * newScale
        };

        setScale(newScale);
        setPosition(newPosition);
    }, [scale, position, setScale, setPosition]);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, [handleWheel]);

    const handlePostMove = (id, newPosition) => {
        setPosts((prev) =>
            prev.map((post) =>
                post.id === id ? { ...post, position: newPosition } : post
            )
        );
        socket.emit('post:move', { id, position: newPosition });
    };

    const handlePostFocus = (id) => {
        const maxZIndex = Math.max(...posts.map((p) => p.position.zIndex || 1), 0);
        const targetPost = posts.find((p) => p.id === id);

        if (targetPost && (targetPost.position.zIndex || 1) <= maxZIndex) {
            const newPosition = { ...targetPost.position, zIndex: maxZIndex + 1 };
            handlePostMove(id, newPosition);
        }
    };

    const handlePostDelete = (id) => {
        const secret = localStorage.getItem(`post_secret_${id}`);
        if (secret) {
            if (confirm('정말 삭제하시겠습니까?')) {
                socket.emit('post:delete', { id, secret });
            }
        }
    };

    // Viewport Culling: 화면에 보이는 포스트잇만 렌더링
    const visiblePosts = useMemo(() => {
        if (!containerRef.current) return posts;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 500;

        return posts.filter(post => {
            const screenX = post.position.x * scale + position.x;
            const screenY = post.position.y * scale + position.y;

            return (
                screenX > -margin &&
                screenX < viewportWidth + margin &&
                screenY > -margin &&
                screenY < viewportHeight + margin
            );
        });
    }, [posts, scale, position]);

    return (
        <div
            ref={containerRef}
            className="w-full h-screen overflow-hidden relative cursor-grab active:cursor-grabbing touch-none"
            style={{
                background: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: `${40 * scale}px ${40 * scale}px`,
                backgroundPosition: `${position.x}px ${position.y}px`,
                touchAction: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    pointerEvents: 'none'
                }}
            >
                {/* 원점 표시 */}
                <div
                    className="absolute top-0 left-0 w-6 h-6 -translate-x-1/2 -translate-y-1/2 z-0"
                    style={{
                        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 0.3) 50%, transparent 70%)',
                        animation: 'pulse-glow 2s ease-in-out infinite'
                    }}
                />

                {/* PostIt 컨테이너 */}
                <div className="w-full h-full pointer-events-auto">
                    {visiblePosts.map((post) => (
                        <PostIt
                            key={post.id}
                            data={post}
                            scale={scale}
                            onMove={handlePostMove}
                            onFocus={handlePostFocus}
                            onDelete={handlePostDelete}
                            isMine={!!localStorage.getItem(`post_secret_${post.id}`)}
                        />
                    ))}
                </div>
            </div>

            {/* 미니맵 */}
            <Minimap
                posts={posts}
                scale={scale}
                position={position}
                setPosition={setPosition}
            />

            {/* UI 컨트롤 */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 pointer-events-auto z-50">
                <button
                    onClick={() => {
                        setPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                        setScale(1);
                    }}
                    className="glass p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 text-2xl hover:scale-110 glow"
                    title="원점으로 복귀"
                >
                    🏠
                </button>
                <div className="glass px-4 py-2 rounded-full shadow-2xl text-white font-bold text-sm backdrop-blur-md">
                    {Math.round(scale * 100)}%
                </div>
                <div className="glass px-4 py-2 rounded-full shadow-2xl text-white font-bold text-xs backdrop-blur-md">
                    {visiblePosts.length} / {posts.length}
                </div>
            </div>
        </div>
    );
};

export default Canvas;
