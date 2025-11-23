import React, { useEffect, useRef } from 'react';

const Snow = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let animationFrameId;
        let particles = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticles = () => {
            const particleCount = 100; // 눈송이 개수
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 3 + 1, // 크기 1~4px
                    speedY: Math.random() * 1 + 0.5, // 낙하 속도
                    speedX: Math.random() * 0.5 - 0.25, // 좌우 흔들림
                    opacity: Math.random() * 0.5 + 0.3 // 투명도
                });
            }
        };

        const drawParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fill();
            });
        };

        const updateParticles = () => {
            particles.forEach((p) => {
                p.y += p.speedY;
                p.x += p.speedX;

                // 화면 밖으로 나가면 위로 재설정
                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                }
                if (p.x > canvas.width) {
                    p.x = 0;
                } else if (p.x < 0) {
                    p.x = canvas.width;
                }
            });
        };

        const animate = () => {
            drawParticles();
            updateParticles();
            animationFrameId = requestAnimationFrame(animate);
        };

        // 초기화
        resizeCanvas();
        createParticles();
        animate();

        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        />
    );
};

export default Snow;
