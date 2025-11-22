import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white text-lg font-semibold">연결 중...</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
