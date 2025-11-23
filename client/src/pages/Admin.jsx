import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAbsoluteTime } from '../utils/timeFormat';
import { socket } from '../utils/socket';

const Admin = () => {
    // 인증 상태
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [secret, setSecret] = useState('');

    // 데이터
    const [posts, setPosts] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [bannedIps, setBannedIps] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'inquiries', 'banned', 'online'
    const [selectedPost, setSelectedPost] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [filterIp, setFilterIp] = useState(null);
    const [userCount, setUserCount] = useState(0);

    // 커스텀 확인 모달 상태
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        message: '',
        onConfirm: null
    });

    const openConfirm = (message, onConfirm) => {
        setConfirmModal({ isOpen: true, message, onConfirm });
    };

    const closeConfirm = () => {
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
    };

    const handleConfirm = () => {
        if (confirmModal.onConfirm) {
            confirmModal.onConfirm();
        }
        closeConfirm();
    };

    // 로그인 처리
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`/api/admin/posts?secret=${password}`);
            setSecret(password);
            sessionStorage.setItem('admin_secret', password);
            setIsAuthenticated(true);
            alert('로그인 성공!');
        } catch (err) {
            alert('비밀번호가 틀렸습니다.');
        }
    };

    // 게시글 목록 조회
    const fetchPosts = async () => {
        try {
            const res = await axios.get(`/api/admin/posts?secret=${secret}`);
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // 문의 목록 조회
    const fetchInquiries = async () => {
        try {
            const res = await axios.get(`/api/admin/inquiries?secret=${secret}`);
            setInquiries(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // 차단된 IP 목록 조회
    const fetchBannedIps = async () => {
        try {
            const res = await axios.get(`/api/admin/banned-ips?secret=${secret}`);
            setBannedIps(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // 현재 접속 중인 사용자 조회
    const fetchOnlineUsers = async () => {
        try {
            const res = await axios.get(`/api/admin/online-users?secret=${secret}`);
            setOnlineUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // 포스트 삭제
    const handleDeletePost = (id) => {
        openConfirm('정말 삭제하시겠습니까?', async () => {
            try {
                await axios.delete(`/api/admin/posts/${id}`, { data: { secret } });
                alert('삭제되었습니다.');
                fetchPosts();
            } catch (err) {
                console.error('[Admin] Delete failed:', err);
                alert('삭제 실패: ' + (err.response?.data?.error || err.message));
            }
        });
    };

    // IP 차단
    const handleBan = (ip) => {
        openConfirm(`IP ${ip}를 차단하시겠습니까?`, async () => {
            try {
                await axios.post('/api/admin/ban', { ip, secret });
                alert('차단되었습니다.');
                fetchPosts();
                fetchBannedIps();
            } catch (err) {
                alert('오류 발생');
            }
        });
    };

    // IP 차단 해제
    const handleUnban = (ip) => {
        openConfirm(`IP ${ip}의 차단을 해제하시겠습니까?`, async () => {
            try {
                await axios.post('/api/admin/unban', { ip, secret });
                alert('차단이 해제되었습니다.');
                fetchBannedIps();
                fetchPosts();
            } catch (err) {
                alert('해제 실패');
            }
        });
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

        // 소켓 접속자 수 리스너
        socket.on('user:count', (count) => {
            setUserCount(count);
        });

        // 관리자임을 서버에 알림
        socket.emit('user:admin');

        return () => {
            socket.off('user:count');
        };
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPosts();
            fetchInquiries();
            fetchBannedIps();
            fetchOnlineUsers();
            // 5초마다 자동 새로고침
            const interval = setInterval(() => {
                fetchPosts();
                fetchInquiries();
                fetchBannedIps();
                fetchOnlineUsers();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    // 로그아웃
    const handleLogout = () => {
        sessionStorage.removeItem('admin_secret');
        setIsAuthenticated(false);
        setSecret('');
    };

    // 필터링된 포스트 목록
    const filteredPosts = filterIp
        ? posts.filter(post => post.ipAddress === filterIp)
        : posts;

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
        <div className="p-8 bg-gray-100 min-h-screen overflow-y-auto h-screen">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">관리자 대시보드</h1>
                    <div className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-bold text-gray-600">현재 접속: {userCount}명</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {filterIp && (
                        <button
                            onClick={() => setFilterIp(null)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-bold"
                        >
                            필터 해제 ({filterIp})
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        로그아웃
                    </button>
                </div>
            </div>

            {/* 탭 */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'posts'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    포스트 ({filteredPosts.length})
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
                <button
                    onClick={() => setActiveTab('banned')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'banned'
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    차단 관리 ({bannedIps.length})
                </button>
                <button
                    onClick={() => setActiveTab('online')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'online'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    🔴 현재 접속자 ({onlineUsers.length})
                </button>
            </div>

            {/* 포스트 목록 */}
            {activeTab === 'posts' && (
                <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
                    <h2 className="text-xl font-bold mb-4">게시글 목록 {filterIp ? `(IP: ${filterIp})` : ''}</h2>
                    <table className="w-full border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2 border text-xs">ID</th>
                                <th className="p-2 border">내용</th>
                                <th className="p-2 border">닉네임</th>
                                <th className="p-2 border text-xs">스타일</th>
                                <th className="p-2 border text-xs">상세</th>
                                <th className="p-2 border text-xs">IP</th>
                                <th className="p-2 border text-xs">작성일</th>
                                <th className="p-2 border text-xs">상태</th>
                                <th className="p-2 border text-xs">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPosts.map((post) => (
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
                                    <td className="p-2 border text-sm text-center font-bold">{post.nickname || '-'}</td>
                                    <td className="p-2 border text-xs">
                                        <div>색상: {post.style?.color}</div>
                                        <div>폰트: {post.style?.font}</div>
                                    </td>
                                    <td className="p-2 border text-xs text-center">
                                        <button
                                            onClick={() => setSelectedPost(post)}
                                            className="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 font-bold text-xs"
                                        >
                                            🔍 상세
                                        </button>
                                    </td>
                                    <td className="p-2 border text-xs">
                                        {post.ipAddress}
                                        <button
                                            onClick={() => setFilterIp(post.ipAddress)}
                                            className="ml-2 text-xs text-gray-400 hover:text-blue-500 underline"
                                            title="이 IP로 필터링"
                                        >
                                            [모아보기]
                                        </button>
                                    </td>
                                    <td className="p-2 border text-xs">{getAbsoluteTime(post.createdAt)}</td>
                                    <td className="p-2 border text-center text-xs">
                                        {post.isBanned ? <span className="text-red-500 font-bold">차단됨</span> : '정상'}
                                    </td>
                                    <td className="p-2 border text-center space-x-1">
                                        <button
                                            onClick={() => handleDeletePost(post.id)}
                                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                        >
                                            삭제
                                        </button>
                                        <button
                                            onClick={() => handleBan(post.ipAddress)}
                                            className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
                                        >
                                            차단
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
                                className={`p-4 border rounded-lg ${inquiry.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-300'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {!inquiry.isRead && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">NEW</span>
                                        )}
                                        <span className="text-sm text-gray-500">{getAbsoluteTime(inquiry.createdAt)}</span>
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
                                    <p className="text-sm text-gray-600"><strong>연락처:</strong> {inquiry.contactInfo}</p>
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

            {/* 차단 관리 */}
            {activeTab === 'banned' && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">차단된 IP 목록</h2>
                    <div className="space-y-2">
                        {bannedIps.map((ip) => (
                            <div key={ip} className="flex justify-between items-center p-4 border rounded hover:bg-gray-50">
                                <span className="font-mono text-lg">{ip}</span>
                                <button
                                    onClick={() => handleUnban(ip)}
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-bold"
                                >
                                    차단 해제
                                </button>
                            </div>
                        ))}
                        {bannedIps.length === 0 && (
                            <p className="text-gray-500 text-center py-8">차단된 IP가 없습니다.</p>
                        )}
                    </div>
                </div>
            )}

            {/* 온라인 사용자 */}
            {activeTab === 'online' && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">🔴 현재 접속 중인 사용자</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {onlineUsers.map((user, idx) => (
                            <div
                                key={user.socketId}
                                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                                onClick={() => setSelectedUser(user)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="font-bold text-lg">사용자 #{idx + 1}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(user.connectedAt).toLocaleTimeString('ko-KR')}부터 접속
                                    </span>
                                </div>

                                <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">IP:</span>
                                        <span className="font-mono">{user.ipAddress}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">현재 위치:</span>
                                        <span className="font-mono text-blue-600">
                                            ({user.currentPosition.x}, {user.currentPosition.y})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">마지막 활동:</span>
                                        <span>{new Date(user.lastActivity).toLocaleTimeString('ko-KR')}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUser(user);
                                    }}
                                    className="mt-2 w-full bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 font-bold text-xs"
                                >
                                    🔍 상세 정보
                                </button>
                            </div>
                        ))}
                    </div>
                    {onlineUsers.length === 0 && (
                        <p className="text-gray-500 text-center py-8">현재 접속 중인 사용자가 없습니다.</p>
                    )}
                </div>
            )}


            {/* 포스트 상세 정보 모달 */}
            {selectedPost && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedPost(null)}>
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">포스트 상세 정보 📝</h2>
                            <button onClick={() => setSelectedPost(null)} className="text-3xl hover:text-gray-600">&times;</button>
                        </div>

                        <div className="space-y-6">
                            {/* 포스트 미리보기 */}
                            <div className="flex justify-center bg-gray-100 p-8 rounded-lg">
                                <div
                                    className="w-64 h-64 p-6 shadow-lg flex items-center justify-center text-center text-xl break-words whitespace-pre-wrap"
                                    style={{
                                        backgroundColor: selectedPost.style?.color || '#fff740',
                                        fontFamily: selectedPost.style?.font || 'Noto Sans KR',
                                        transform: `rotate(${selectedPost.style?.rotation || 0}deg)`
                                    }}
                                >
                                    {selectedPost.content}
                                </div>
                            </div>

                            {/* 상세 정보 테이블 */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-bold mb-3 text-lg">메타 데이터</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">ID</span>
                                        <div className="font-mono">{selectedPost.id}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">닉네임</span>
                                        <div className="font-bold">{selectedPost.nickname || '(익명)'}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">작성일</span>
                                        <div>{getAbsoluteTime(selectedPost.createdAt)}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">IP 주소</span>
                                        <div className="font-mono">{selectedPost.ipAddress}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">위치 (X, Y)</span>
                                        <div className="font-mono">({selectedPost.position?.x}, {selectedPost.position?.y})</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Z-Index</span>
                                        <div className="font-mono">{selectedPost.position?.zIndex}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 디바이스 정보 */}
                            {selectedPost.meta?.deviceInfo && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="font-bold mb-3 text-lg">작성 기기 정보</h3>
                                    <pre className="whitespace-pre-wrap text-xs font-mono bg-white p-4 rounded border overflow-x-auto max-h-60">
                                        {JSON.stringify(selectedPost.meta.deviceInfo, null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        handleDeletePost(selectedPost.id);
                                        setSelectedPost(null);
                                    }}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-bold"
                                >
                                    삭제하기
                                </button>
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 font-bold"
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {
                selectedUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
                        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">접속자 포렌식 정보 🕵️‍♂️</h2>
                                <button onClick={() => setSelectedUser(null)} className="text-3xl hover:text-gray-600">&times;</button>
                            </div>

                            <div className="space-y-6">
                                {/* 기본 정보 */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-bold mb-3 text-lg">연결 정보</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-500 text-sm">Socket ID</span>
                                            <div className="font-mono text-xs">{selectedUser.socketId}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm">IP 주소</span>
                                            <div className="font-mono">{selectedUser.ipAddress}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm">접속 시각</span>
                                            <div>{getAbsoluteTime(selectedUser.connectedAt)}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm">마지막 활동</span>
                                            <div>{getAbsoluteTime(selectedUser.lastActivity)}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm">현재 위치 (X, Y)</span>
                                            <div className="font-mono text-blue-600">
                                                ({selectedUser.currentPosition.x}, {selectedUser.currentPosition.y})
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 디바이스 정보 */}
                                {selectedUser.deviceInfo && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h3 className="font-bold mb-3 text-lg">디바이스 환경 (Device Fingerprint)</h3>
                                        <pre className="whitespace-pre-wrap text-xs font-mono bg-white p-4 rounded border overflow-x-auto max-h-96">
                                            {JSON.stringify(selectedUser.deviceInfo, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setFilterIp(selectedUser.ipAddress);
                                            setActiveTab('posts');
                                            setSelectedUser(null);
                                        }}
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-bold"
                                    >
                                        이 사용자의 포스트 보기
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleBan(selectedUser.ipAddress);
                                            setSelectedUser(null);
                                        }}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-bold"
                                    >
                                        IP 차단
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 커스텀 확인 모달 */}
            {
                confirmModal.isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-2xl max-w-sm w-full">
                            <p className="text-lg mb-4">{confirmModal.message}</p>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={closeConfirm}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Admin;
