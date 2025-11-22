import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAbsoluteTime } from '../utils/timeFormat';

const Admin = () => {
    // \uc778\uc99d \uc0c1\ud0dc
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [secret, setSecret] = useState('');

    // \ub370\uc774\ud130
    const [posts, setPosts] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'inquiries'

    // \ub85c\uadf8\uc778 \ucc98\ub9ac
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // \ube44\ubc00\ubc88\ud638 \ud655\uc778 (\ud3ec\uc2a4\ud2b8 \uc870\ud68c\ub85c \ud14c\uc2a4\ud2b8)
            const res = await axios.get(`/api/admin/posts?secret=${password}`);
            if (res.status === 200) {
                setSecret(password);
                setIsAuthenticated(true);
                sessionStorage.setItem('admin_secret', password);
            }
        } catch (err) {
            alert('\ube44\ubc00\ubc88\ud638\uac00 \uc62c\ubc14\ub974\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.');
        }
    };

    // \ud3ec\uc2a4\ud2b8 \uc870\ud68c
    const fetchPosts = async () => {
        try {
            const res = await axios.get(`/api/admin/posts?secret=${secret}`);
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // \ubb38\uc758 \uc870\ud68c
    const fetchInquiries = async () => {
        try {
            const res = await axios.get(`/api/admin/inquiries?secret=${secret}`);
            setInquiries(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // \ud3ec\uc2a4\ud2b8 \uc0ad\uc81c
    const handleDeletePost = async (id) => {
        if (!confirm('\uc815\ub9d0 \uc0ad\uc81c\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?')) return;
        try {
            await axios.delete(`/api/admin/posts/${id}`, { data: { secret } });
            alert('\uc0ad\uc81c\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
            fetchPosts();
        } catch (err) {
            alert('\uc0ad\uc81c \uc2e4\ud328');
        }
    };

    // IP \ucc28\ub2e8
    const handleBan = async (ip) => {
        if (!confirm(`IP ${ip}\ub97c \ucc28\ub2e8\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?`)) return;
        try {
            await axios.post('/api/admin/ban', { ip, secret });
            alert('\ucc28\ub2e8\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
            fetchPosts();
        } catch (err) {
            alert('\uc624\ub958 \ubc1c\uc0dd');
        }
    };

    // \ubb38\uc758 \uc77d\uc74c \ucc98\ub9ac
    const handleMarkAsRead = async (id) => {
        try {
            await axios.post(`/api/admin/inquiries/${id}/read`, { secret });
            fetchInquiries();
        } catch (err) {
            console.error(err);
        }
    };

    // \ucd08\uae30 \ub85c\ub4dc
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
            // 10\ucd08\ub9c8\ub2e4 \uc790\ub3d9 \uc0c8\ub85c\uace0\uce68
            const interval = setInterval(() => {
                fetchPosts();
                fetchInquiries();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    // \ub85c\uadf8\uc544\uc6c3
    const handleLogout = () => {
        sessionStorage.removeItem('admin_secret');
        setIsAuthenticated(false);
        setSecret('');
    };

    // \ub85c\uadf8\uc778 \ud654\uba74
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{
                background: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe)',
                backgroundSize: '400% 400%',
                animation: 'gradient-shift 15s ease infinite'
            }}>
                <div className="glass p-10 rounded-3xl shadow-2xl w-full max-w-md">
                    <h1 className="text-3xl font-bold mb-6 text-white text-center">\uad00\ub9ac\uc790 \ub85c\uadf8\uc778 \ud83d\udd11</h1>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            placeholder="\uad00\ub9ac\uc790 \ube44\ubc00\ubc88\ud638"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 border-2 border-white border-opacity-30 rounded-xl mb-4 bg-white bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-2xl font-bold text-lg"
                        >
                            \ub85c\uadf8\uc778
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // \uad00\ub9ac\uc790 \ub300\uc2dc\ubcf4\ub4dc
    return (
        <div className="p-8 bg-gray-100 min-h-screen overflow-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">\uad00\ub9ac\uc790 \ub300\uc2dc\ubcf4\ub4dc</h1>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    \ub85c\uadf8\uc544\uc6c3
                </button>
            </div>

            {/* \ud0ed */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'posts'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    \ud3ec\uc2a4\ud2b8 ({posts.length})
                </button>
                <button
                    onClick={() => setActiveTab('inquiries')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'inquiries'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    \ubb38\uc758 ({inquiries.filter(i => !i.isRead).length}/{inquiries.length})
                </button>
            </div>

            {/* \ud3ec\uc2a4\ud2b8 \ubaa9\ub85d */}
            {activeTab === 'posts' && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">\uac8c\uc2dc\uae00 \ubaa9\ub85d</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2 border">ID</th>
                                <th className="p-2 border">\ub0b4\uc6a9</th>
                                <th className="p-2 border">IP</th>
                                <th className="p-2 border">\uc791\uc131\uc77c</th>
                                <th className="p-2 border">\uc0c1\ud0dc</th>
                                <th className="p-2 border">\uad00\ub9ac</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post) => (
                                <tr key={post.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 border text-xs font-mono">{post.id.slice(0, 8)}...</td>
                                    <td className="p-2 border">
                                        <div
                                            className="w-full h-24 p-2 overflow-hidden text-xs rounded shadow-sm relative"
                                            style={{
                                                backgroundColor: post.style?.color || '#fff740',
                                                fontFamily: post.style?.font || 'Noto Sans KR',
                                                transform: `rotate(${post.style?.rotation || 0}deg) scale(0.8)`
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
                                        {post.isBanned ? <span className="text-red-500 font-bold">\ucc28\ub2e8\ub428</span> : '\uc815\uc0c1'}
                                    </td>
                                    <td className="p-2 border text-center space-x-2">
                                        <button
                                            onClick={() => handleDeletePost(post.id)}
                                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                        >
                                            \uc0ad\uc81c
                                        </button>
                                        <button
                                            onClick={() => handleBan(post.ipAddress)}
                                            className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                                        >
                                            IP \ucc28\ub2e8
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* \ubb38\uc758 \ubaa9\ub85d */}
            {activeTab === 'inquiries' && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">\ubb38\uc758 \ubaa9\ub85d</h2>
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
                                            \uc77d\uc74c \ucc98\ub9ac
                                        </button>
                                    )}
                                </div>
                                <p className="text-gray-800 mb-2 whitespace-pre-wrap">{inquiry.message}</p>
                                {inquiry.contactInfo && (
                                    <p className="text-sm text-gray-600">
                                        <strong>\uc5f0\ub77d\ucc98:</strong> {inquiry.contactInfo}
                                    </p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">IP: {inquiry.ipAddress}</p>
                            </div>
                        ))}
                        {inquiries.length === 0 && (
                            <p className="text-gray-500 text-center py-8">\ubb38\uc758\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
