import React, { useState } from 'react';
import axios from 'axios';

const InquiryModal = ({ isOpen, onClose }) => {
    const [message, setMessage] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        try {
            await axios.post('/api/inquiries', {
                message,
                contactInfo,
                meta: {
                    deviceInfo: { userAgent: navigator.userAgent }
                }
            });
            setSubmitted(true);
            setTimeout(() => {
                setMessage('');
                setContactInfo('');
                setSubmitted(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('문의 전송 실패:', error);
            alert('문의 전송에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white bg-opacity-90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white border-opacity-20">
                {submitted ? (
                    <div className="text-center py-8">
                        <div className="text-6xl mb-4">✓</div>
                        <h3 className="text-2xl font-bold text-green-600 mb-2">문의가 전송되었습니다!</h3>
                        <p className="text-gray-600">빠른 시일 내에 답변드리겠습니다.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            관리자에게 문의하기
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    문의 내용 *
                                </label>
                                <textarea
                                    className="w-full h-32 p-3 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="무엇을 도와드릴까요?"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    연락처 (선택)
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="이메일 또는 전화번호"
                                    value={contactInfo}
                                    onChange={(e) => setContactInfo(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                                    disabled={isSubmitting}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 font-medium"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? '전송 중...' : '문의하기'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default InquiryModal;
