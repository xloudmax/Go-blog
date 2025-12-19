·import React, { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

interface Orb {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
}

export const MeshGradientBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { isDarkMode } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let orbs: Orb[] = [];

        // Colors based on theme
        const colors = isDarkMode
            ? [
                'hsla(253, 50%, 20%, 0.8)', // Deep Purple
                'hsla(225, 50%, 20%, 0.8)', // Midnight Blue
                'hsla(339, 50%, 20%, 0.8)', // Dark Magenta
                'hsla(280, 50%, 15%, 0.8)', // Deep Violet
                'hsla(200, 50%, 15%, 0.8)', // Dark Cyan
              ]
            : [
                'hsla(28, 100%, 74%, 0.8)',  // Peach
                'hsla(189, 100%, 56%, 0.8)', // Cyan
                'hsla(355, 100%, 83%, 0.8)', // Pink
                'hsla(340, 100%, 76%, 0.8)', // Rose
                'hsla(22, 100%, 77%, 0.8)',  // Orange
              ];

        const initOrbs = () => {
            orbs = [];
            const numOrbs = 6;
            for (let i = 0; i < numOrbs; i++) {
                orbs.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 1.5, // Slow velocity
                    vy: (Math.random() - 0.5) * 1.5,
                    radius: Math.random() * 200 + 150, // Large radius (150-350)
                    color: colors[i % colors.length],
                });
            }
        };

        const resizeCanvas = () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        const updateAndDraw = () => {
            if (!ctx || !canvas) return;

            // Clear canvas
            ctx.fillStyle = isDarkMode ? '#0f172a' : '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update positions
            orbs.forEach((orb) => {
                orb.x += orb.vx;
                orb.y += orb.vy;

                // Bounce off walls with buffer
                if (orb.x < -orb.radius) orb.vx = Math.abs(orb.vx);
                if (orb.x > canvas.width + orb.radius) orb.vx = -Math.abs(orb.vx);
                if (orb.y < -orb.radius) orb.vy = Math.abs(orb.vy);
                if (orb.y > canvas.height + orb.radius) orb.vy = -Math.abs(orb.vy);

                // Draw
                const gradient = ctx.createRadialGradient(
                    orb.x, orb.y, 0,
                    orb.x, orb.y, orb.radius
                );
                gradient.addColorStop(0, orb.color);
                gradient.addColorStop(1, 'transparent');

                ctx.beginPath();
                ctx.fillStyle = gradient;
                ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(updateAndDraw);
        };

        window.addEventListener('resize', resizeCanvas);
        
        // Initial setup
        resizeCanvas();
        initOrbs();
        updateAndDraw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isDarkMode]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none transition-opacity duration-1000"
            style={{
                zIndex: 0,
                // Heavy blur applied via CSS for performance
                filter: 'blur(80px)',
                opacity: 0.8,
            }}
        />
    );
};
