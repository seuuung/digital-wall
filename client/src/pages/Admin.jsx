import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Admin = () => {
    const [posts, setPosts] = useState([]);
    const [secret, setSecret] = useState('admin-secret'); // 하드코딩된 시크릿 (실제로는 입력받거나 환경변수)

    const fetchPosts = async () => {
        try {
            const res = await axios.get(`/api/admin/posts?secret=${secret}`);
            setPosts(res.data);
        } catch (err) {
            console.error(err);
            // alert('권한이 없거나 오류가 발생했습니다.'); // 너무 잦은 알림 방지
        }
    };

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

    useEffect(() => {
        fetchPosts();
    }, []);

    return (
        <div className="p-8 bg-gray-100 min-h-screen overflow-auto">
            <h1 className="text-3xl font-bold mb-6">관리자 대시보드</h1>
            <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-bold mb-4">게시글 목록 ({posts.length})</h2>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">ID</th>
                            <th className="p-2 border">내용</th>
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
                                <td className="p-2 border">{post.content}</td>
                                <td className="p-2 border">{post.ipAddress}</td>
                                <td className="p-2 border text-sm">{new Date(post.createdAt).toLocaleString()}</td>
                                <td className="p-2 border text-center">
                                    {post.isBanned ? <span className="text-red-500 font-bold">차단됨</span> : '정상'}
                                </td>
                                <td className="p-2 border text-center">
                                    <button
                                        onClick={() => handleBan(post.ipAddress)}
                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                    >
                                        IP 차단
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Admin;
