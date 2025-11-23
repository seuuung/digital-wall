import React, { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { getRelativeTime } from '../utils/timeFormat';

const PostIt = ({ data, scale, onMove, onFocus, onDelete, isMine }) => {
    const nodeRef = useRef(null);
    const { id, content, nickname, style, position, meta } = data;
    const [relativeTime, setRelativeTime] = useState('');

    // 상대 시간 업데이트
    useEffect(() => {
        const updateTime = () => {
            if (meta?.createdAt) {
                setRelativeTime(getRelativeTime(meta.createdAt));
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 60000); // 1분마다 업데이트

        return () => clearInterval(interval);
    }, [meta]);

    const handleStart = () => {
        if (onFocus) {
            onFocus(id);
        }
    };

    const handleStop = (e, dragData) => {
        onMove(id, { x: dragData.x, y: dragData.y, zIndex: position.zIndex });
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            defaultPosition={{ x: position.x, y: position.y }}
            position={{ x: position.x, y: position.y }}
            scale={scale}
            onStart={handleStart}
            onStop={handleStop}
            disabled={false}
        >
            <div
                ref={nodeRef}
                className="absolute post-it-container"
                style={{
                    zIndex: position.zIndex,
                    touchAction: 'none'
                }}
            >
                <div
                    className="p-4 shadow-lg cursor-move select-none transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 flex flex-col justify-center items-center text-center group"
                    style={{
                        backgroundColor: style.color,
                        fontFamily: style.font,
                        transform: `rotate(${style.rotation}deg)`,
                        width: '200px',
                        minHeight: '200px',
                        boxShadow: '5px 5px 15px rgba(0,0,0,0.3)',
                        borderRadius: '4px'
                    }}
                >
                    {/* 상대 시간 표시 */}
                    {relativeTime && (
                        <div className="absolute top-2 left-2 text-xs text-gray-600 opacity-70">
                            {relativeTime}
                        </div>
                    )}

                    {/* 내용 */}
                    <div className="whitespace-pre-wrap break-words text-lg w-full pointer-events-none flex-grow flex items-center justify-center">
                        {content}
                    </div>

                    {/* 닉네임 표시 */}
                    {nickname && (
                        <div className="absolute top-2 right-2 text-xs opacity-50 font-bold text-gray-700">
                            {nickname}
                        </div>
                    )}

                    {/* 삭제 버튼 */}
                    {isMine && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(id);
                            }}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 text-white font-bold shadow-md flex items-center justify-center z-10 hover:bg-red-600 transition-colors"
                            title="삭제하기"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        </Draggable>
    );
};

export default PostIt;
