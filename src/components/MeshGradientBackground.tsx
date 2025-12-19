import React, { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

interface Orb {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    baseRadius: number; // Original radius to pulse around
    growth: number; // Rate of radius change
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

        // Premium Modern Colors
        const colors = isDarkMode
            ? [
                'hsla(270, 80%, 40%, 0.7)', // Vibrant Purple
                'hsla(320, 80%, 45%, 0.7)', // Neon Pink
                'hsla(220, 90%, 45%, 0.7)', // Electric Blue
                'hsla(250, 70%, 35%, 0.7)', // Deep Indigo
                'hsla(180, 80%, 40%, 0.7)', // Cyan Glow
              ]
            : [
                'hsla(210, 50%, 98%, 0.4)', // Ghost Blue
                'hsla(195, 50%, 99%, 0.4)', // Almost White
                'hsla(220, 30%, 98%, 0.4)', // Whisper Blue
                'hsla(180, 30%, 97%, 0.4)', // Hint of Cyan
                'hsla(200, 40%, 98%, 0.4)', // Pure Mist
              ];

        const initOrbs = () => {
            orbs = [];
            // More orbs for a richer "mesh" feel
            const numOrbs = 10; 
            for (let i = 0; i < numOrbs; i++) {
                const radius = Math.random() * 250 + 200; // Larger orbs (200-450)
                orbs.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    // Significantly faster movement
                    vx: (Math.random() - 0.5) * 4, 
                    vy: (Math.random() - 0.5) * 4,
                    radius: radius,
                    baseRadius: radius,
                    growth: (Math.random() - 0.5) * 2, // Faster breathing
                    color: colors[i % colors.length],
                });
            }
        };

        const resizeCanvas = () => {
            if (canvas) {
                // Slightly larger than screen to hide edges when blurring
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        const updateAndDraw = () => {
            if (!ctx || !canvas) return;

            // Clear canvas
            ctx.fillStyle = isDarkMode ? '#050510' : '#ffffff'; // Darker black for deep contrast
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update positions
            orbs.forEach((orb) => {
                orb.x += orb.vx;
                orb.y += orb.vy;

                // Bounce off walls with buffer (allows them to go slightly off screen)
                const bounceBuffer = orb.radius / 2;
                if (orb.x < -bounceBuffer) orb.vx = Math.abs(orb.vx);
                if (orb.x > canvas.width + bounceBuffer) orb.vx = -Math.abs(orb.vx);
                if (orb.y < -bounceBuffer) orb.vy = Math.abs(orb.vy);
                if (orb.y > canvas.height + bounceBuffer) orb.vy = -Math.abs(orb.vy);

                // Pulse radius
                orb.radius += orb.growth;
                if (orb.radius > orb.baseRadius + 60 || orb.radius < orb.baseRadius - 60) {
                    orb.growth = -orb.growth;
                }

                // Draw
                const gradient = ctx.createRadialGradient(
                    orb.x, orb.y, 0,
                    orb.x, orb.y, Math.max(0, orb.radius)
                );
                gradient.addColorStop(0, orb.color);
                gradient.addColorStop(1, 'transparent'); // Smooth fade

                ctx.beginPath();
                ctx.fillStyle = gradient;
                // Composite operation to blend colors beautifully
                ctx.globalCompositeOperation = isDarkMode ? 'screen' : 'multiply'; 
                // 'screen' makes lights additive (glowing), 'multiply' mixes pigments (watercolor)
                
                // Fallback for light mode if multiply is too dark, use 'source-over' or 'overlay'
                if (!isDarkMode) ctx.globalCompositeOperation = 'source-over';

                ctx.arc(orb.x, orb.y, Math.max(0, orb.radius), 0, Math.PI * 2);
                ctx.fill();
                
                // Reset composite
                ctx.globalCompositeOperation = 'source-over';
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
                // Extra blur for that creamy mesh look
                filter: 'blur(100px)',
                opacity: 0.9,
            }}
        />
    );
};
