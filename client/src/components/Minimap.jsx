import React, { useMemo } from 'react';

const Minimap = ({ posts, scale, position, setPosition }) => {
    const MINIMAP_SIZE = 200; // 미니맵 크기 증가
    const WORLD_VIEW_SIZE = 4000; // 미니맵이 보여줄 월드 범위 (world units)

    // 현재 뷰포트의 중심 좌표 계산 (월드 좌표)
    const viewportCenterX = -position.x / scale + window.innerWidth / 2 / scale;
    const viewportCenterY = -position.y / scale + window.innerHeight / 2 / scale;

    // 미니맵이 표시할 월드 영역 (뷰포트 중심 기준)
    const mapBounds = {
        minX: viewportCenterX - WORLD_VIEW_SIZE / 2,
        maxX: viewportCenterX + WORLD_VIEW_SIZE / 2,
        minY: viewportCenterY - WORLD_VIEW_SIZE / 2,
        maxY: viewportCenterY + WORLD_VIEW_SIZE / 2,
        width: WORLD_VIEW_SIZE,
        height: WORLD_VIEW_SIZE
    };

    // 미니맵 스케일 (정사각형)
    const mapScale = MINIMAP_SIZE / WORLD_VIEW_SIZE;

    // 월드 좌표 → 미니맵 좌표 변환
    const worldToMap = (x, y) => {
        return {
            x: (x - mapBounds.minX) * mapScale,
            y: (y - mapBounds.minY) * mapScale
        };
    };

    // 미니맵 좌표 → 월드 좌표 변환
    const mapToWorld = (mx, my) => {
        return {
            x: mx / mapScale + mapBounds.minX,
            y: my / mapScale + mapBounds.minY
        };
    };

    // 미니맵 범위 내의 포스트잇만 필터링
    const visiblePosts = useMemo(() => {
        return posts.filter(post => {
            return (
                post.position.x >= mapBounds.minX &&
                post.position.x <= mapBounds.maxX &&
                post.position.y >= mapBounds.minY &&
                post.position.y <= mapBounds.maxY
            );
        });
    }, [posts, mapBounds.minX, mapBounds.maxX, mapBounds.minY, mapBounds.maxY]);

    // 현재 뷰포트 계산
    const viewportWidth = window.innerWidth / scale;
    const viewportHeight = window.innerHeight / scale;
    const viewportX = -position.x / scale;
    const viewportY = -position.y / scale;

    const viewportRect = {
        ...worldToMap(viewportX, viewportY),
        width: viewportWidth * mapScale,
        height: viewportHeight * mapScale
    };

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const worldPos = mapToWorld(clickX, clickY);

        // 클릭한 위치를 뷰포트 중앙으로
        const newX = -worldPos.x * scale + window.innerWidth / 2;
        const newY = -worldPos.y * scale + window.innerHeight / 2;

        setPosition({ x: newX, y: newY });
    };

    return (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
            {/* 중심 좌표 표시 */}
            <div className="bg-black bg-opacity-70 backdrop-blur-md text-white px-3 py-2 rounded-lg shadow-xl text-xs font-mono">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">중심:</span>
                    <span className="font-bold text-green-400">
                        ({Math.round(viewportCenterX)}, {Math.round(viewportCenterY)})
                    </span>
                </div>
            </div>

            {/* 미니맵 */}
            <div
                className="bg-white bg-opacity-90 backdrop-blur-md rounded-lg shadow-xl border-2 border-gray-300 overflow-hidden cursor-pointer hover:bg-opacity-100 transition-all relative"
                style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
                onClick={handleClick}
                title="클릭하여 이동"
            >
                {/* 그리드 배경 */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />

                {/* 중심 십자선 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-px bg-red-400 opacity-30" />
                    <div className="absolute w-px h-full bg-red-400 opacity-30" />
                </div>

                {/* 포스트잇 표시 */}
                {visiblePosts.map(post => {
                    const pos = worldToMap(post.position.x, post.position.y);
                    return (
                        <div
                            key={post.id}
                            className="absolute rounded-full"
                            style={{
                                left: pos.x,
                                top: pos.y,
                                width: '5px',
                                height: '5px',
                                backgroundColor: post.style.color || '#facc15',
                                transform: 'translate(-50%, -50%)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }}
                        />
                    );
                })}

                {/* 뷰포트 사각형 */}
                <div
                    className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none"
                    style={{
                        left: viewportRect.x,
                        top: viewportRect.y,
                        width: viewportRect.width,
                        height: viewportRect.height
                    }}
                />

                {/* 중심점 표시 */}
                <div
                    className="absolute w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-lg pointer-events-none"
                    style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            </div>
        </div>
    );
};

export default Minimap;
