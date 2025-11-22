import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAbsoluteTime } from '../utils/timeFormat';

const Admin = () => {
    // 인증 상태
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [secret, setSecret] = useState('');

    // 데이터
    const [posts, setPosts] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'inquiries'

    // 로그인 처리
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // 비밀번호 확인 (포스트 조회로 테스트)
            const res = await axios.get(`/api/admin/posts?secret=${password}`);
            if (res.status === 200) {
                setSecret(password);
                setIsAuthenticated(true);
                sessionStorage.setItem('admin_secret', password);
            }
        } catch (err) {
            alert('비밀번호가 올바르지 않습니다.');
        }
    };

    // 포스트 조회
    const fetchPosts = async () => {
        try {
            const res = await axios.get(`/api/admin/posts?secret=${secret}`);
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // 문의 조회
    const fetchInquiries = async () => {
        try {
            const res = await axios.get(`/api/admin/inquiries?secret=${secret}`);
            setInquiries(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // 포스트 삭제
    const handleDeletePost = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await axios.delete(`/api/admin/posts/${id}`, { data: { secret } });
            alert('삭제되었습니다.');
            fetchPosts();
        } catch (err) {
            alert('삭제 실패');
        }
    };

    // IP 차단
    const handleBan = async (ip) => {
        if (!confirm(`IP ${ip}를 차단하시겠습니까?`)) return;
        try {
            await axios.post('/api/admin/ban', { ip, secret });
            alert('차단되었습니다.');
            fetchPosts();
        } catch (err) {
            alert('오류 발생');
        }
    };

    // 문의 읽음 처리
    const handleMarkAsRead = async (id) => {
        try {
            await axios.post(`/api/admin/inquiries/${id}/read`, { secret });
            fetchInquiries();
        } catch (err) {
            console.error(err);
        }
    };

    // 초기 로드
    useEffect(() => {
        const savedSecret = sessionStorage.getItem('admin_secret');
        if (savedSecret) {
            setSecret(savedSecret);
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPosts();
            fetchInquiries();
            // 10초마다 자동 새로고침
            const interval = setInterval(() => {
                fetchPosts();
                fetchInquiries();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    // 로그아웃
    const handleLogout = () => {
        sessionStorage.removeItem('admin_secret');
        setIsAuthenticated(false);
        setSecret('');
    };

    // 로그인 화면
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{
                background: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe)',
                backgroundSize: '400% 400%',
                animation: 'gradient-shift 15s ease infinite'
            }}>
                <div className="glass p-10 rounded-3xl shadow-2xl w-full max-w-md">
                    <h1 className="text-3xl font-bold mb-6 text-white text-center">관리자 로그인 🔐</h1>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            placeholder="관리자 비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 border-2 border-white border-opacity-30 rounded-xl mb-4 bg-white bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-2xl font-bold text-lg"
                        >
                            로그인
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // 관리자 대시보드
    return (
        <div className="p-8 bg-gray-100 min-h-screen overflow-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">관리자 대시보드</h1>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    로그아웃
                </button>
            </div>

            {/* 탭 */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'posts'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    포스트 ({posts.length})
                </button>
                <button
                    onClick={() => setActiveTab('inquiries')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'inquiries'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    문의 ({inquiries.filter(i => !i.isRead).length}/{inquiries.length})
                </button>
            </div>

            {/* 포스트 목록 */}
            {activeTab === 'posts' && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">게시글 목록</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2 border">ID</th>
                                <th className="p-2 border">내용</th>
                                <th className="p-2 border">스타일</th>
                                <th className="p-2 border">IP</th>
                                <th className="p-2 border">작성일</th>
                                <th className="p-2 border">상태</th>
                                <th className="p-2 border">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post) => (
                                <tr key={post.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 border text-xs font-mono">{post.id.slice(0, 8)}...</td>
                                    <td className="p-2 border">
                                        <div
                                            className="w-full h-24 p-2 overflow-hidden text-xs rounded shadow-sm relative flex items-center justify-center text-center"
                                            style={{
                                                backgroundColor: post.style?.color || '#fff740',
                                                fontFamily: post.style?.font || 'Noto Sans KR',
                                                transform: `rotate(${post.style?.rotation || 0}deg) scale(0.9)`
                                            }}
                                        >
                                            {post.content}
                                        </div>
                                    </td>
                                    <td className="p-2 border text-xs">
                                        <div>Color: {post.style?.color}</div>
                                        <div>Font: {post.style?.font}</div>
                                    </td>
                                    <td className="p-2 border">{post.ipAddress}</td>
                                    <td className="p-2 border text-sm">{getAbsoluteTime(post.createdAt)}</td>
                                    <td className="p-2 border text-center">
                                        {post.isBanned ? <span className="text-red-500 font-bold">차단됨</span> : '정상'}
                                    </td>
                                    <td className="p-2 border text-center space-x-2">
                                        <button
                                            onClick={() => handleDeletePost(post.id)}
                                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                        >
                                            삭제
                                        </button>
                                        <button
                                            onClick={() => handleBan(post.ipAddress)}
                                            className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                                        >
                                            IP 차단
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 문의 목록 */}
            {activeTab === 'inquiries' && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">문의 목록</h2>
                    <div className="space-y-4">
                        {inquiries.map((inquiry) => (
                            <div
                                key={inquiry.id}
                                className={`p-4 border rounded-lg ${inquiry.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {!inquiry.isRead && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">NEW</span>
                                        )}
                                        <span className="text-sm text-gray-500">
                                            {getAbsoluteTime(inquiry.createdAt)}
                                        </span>
                                    </div>
                                    {!inquiry.isRead && (
                                        <button
                                            onClick={() => handleMarkAsRead(inquiry.id)}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            읽음 처리
                                        </button>
                                    )}
                                </div>
                                <p className="text-gray-800 mb-2 whitespace-pre-wrap">{inquiry.message}</p>
                                {inquiry.contactInfo && (
                                    <p className="text-sm text-gray-600">
                                        <strong>연락처:</strong> {inquiry.contactInfo}
                                    </p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">IP: {inquiry.ipAddress}</p>
                            </div>
                        ))}
                        {inquiries.length === 0 && (
                            <p className="text-gray-500 text-center py-8">문의가 없습니다.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
