import { useEffect, useRef } from "react";

const DOT_COUNT = 50;
const DOT_SIZE_MIN = 2;
const DOT_SIZE_MAX = 5;

interface Dot {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
  pulseSpeed: number;
  pulseOffset: number;
}

const AnimatedDots = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initDots = () => {
      dotsRef.current = Array.from({ length: DOT_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: DOT_SIZE_MIN + Math.random() * (DOT_SIZE_MAX - DOT_SIZE_MIN),
        opacity: 0.15 + Math.random() * 0.25,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        pulseSpeed: 0.005 + Math.random() * 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
      }));
    };

    resize();
    initDots();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        initDots();
      }, 200);
    };
    window.addEventListener("resize", onResize);

    let time = 0;
    const animate = () => {
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dotsRef.current.forEach((dot) => {
        dot.x += dot.speedX;
        dot.y += dot.speedY;

        if (dot.x < -10) dot.x = canvas.width + 10;
        if (dot.x > canvas.width + 10) dot.x = -10;
        if (dot.y < -10) dot.y = canvas.height + 10;
        if (dot.y > canvas.height + 10) dot.y = -10;

        const pulse = Math.sin(time * dot.pulseSpeed + dot.pulseOffset);
        const currentOpacity = dot.opacity + pulse * 0.1;
        const currentSize = dot.size + pulse * 0.8;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(142, 72%, 40%, ${Math.max(0.05, currentOpacity)})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};

export default AnimatedDots;
