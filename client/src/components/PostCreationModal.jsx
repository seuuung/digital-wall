import React, { useState } from 'react';

const COLORS = [
    '#FEF3C7', '#FEE2E2', '#E0E7FF', '#D1FAE5', '#F3E8FF', // 파스텔 톤
    '#FFDEE9', '#FDE68A', '#D1D5DB', '#BAE6FD', '#FBCFE8'  // 추가 색상
];
const FONTS = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy'];

const PostCreationModal = ({ isOpen, onClose, onCreate }) => {
    const [content, setContent] = useState('');
    const [nickname, setNickname] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [font, setFont] = useState(FONTS[0]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        onCreate({ content, nickname, color, font });
        setContent('');
        setNickname('');
        onClose();
    };

    const charCount = content.length;
    const maxChars = 200;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="glass p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white border-opacity-20 transform transition-all duration-300 scale-100">
                <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    새 포스트잇 ✨
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="닉네임 (선택)"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            maxLength={10}
                            className="w-full p-3 border-2 border-white border-opacity-30 rounded-xl bg-white bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all mb-2"
                        />
                    </div>
                    <div className="relative mb-4">
                        <textarea
                            className="w-full h-40 p-4 border-2 border-white border-opacity-30 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all shadow-inner"
                            placeholder="무슨 생각을 하고 계신가요? 🤔"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            style={{ backgroundColor: color, fontFamily: font }}
                            maxLength={maxChars}
                        />
                        <div className={`absolute bottom-2 right-2 text-sm font-mono ${charCount > maxChars * 0.9 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                            {charCount}/{maxChars}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-white mb-2 drop-shadow-lg">
                            🎨 배경색
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`w-10 h-10 rounded-full border-4 transition-all duration-200 hover:scale-110 ${color === c ? 'border-white shadow-lg' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-white mb-2 drop-shadow-lg">
                            🖋️ 폰트
                        </label>
                        <select
                            value={font}
                            onChange={(e) => setFont(e.target.value)}
                            className="w-full p-3 border-2 border-white border-opacity-30 rounded-xl bg-white bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                        >
                            {FONTS.map((f) => (
                                <option key={f} value={f} style={{ fontFamily: f }}>
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all font-semibold"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-2xl font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!content.trim()}
                        >
                            작성하기 ✓
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostCreationModal;

