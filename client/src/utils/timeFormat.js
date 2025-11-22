/**
 * timeFormat.js
 * 시간 표시 유틸리티 함수
 */

/**
 * 상대 시간 변환 (일반 사용자용)
 * @param {string} isoString - ISO 8601 형식의 시간
 * @returns {string} "방금 전", "3분 전" 등
 */
export function getRelativeTime(isoString) {
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
        return '방금 전';
    } else if (diffMin < 60) {
        return `${diffMin}분 전`;
    } else if (diffHour < 24) {
        return `${diffHour}시간 전`;
    } else if (diffDay < 7) {
        return `${diffDay}일 전`;
    } else {
        return then.toLocaleDateString('ko-KR');
    }
}

/**
 * 절대 시간 포맷 (관리자용)
 * @param {string} isoString - ISO 8601 형식의 시간
 * @returns {string} "2024-11-22 14:30:00" 형식
 */
export function getAbsoluteTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(/\. /g, '-').replace('.', '');
}
