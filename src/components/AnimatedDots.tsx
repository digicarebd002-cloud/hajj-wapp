import { useEffect, useRef } from "react";

const DOT_COUNT = 72;
const DOT_SIZE_MIN = 2.5;
const DOT_SIZE_MAX = 6;

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

    const primaryColor =
      getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() ||
      "142 72% 40%";

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initDots = () => {
      dotsRef.current = Array.from({ length: DOT_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: DOT_SIZE_MIN + Math.random() * (DOT_SIZE_MAX - DOT_SIZE_MIN),
        opacity: 0.18 + Math.random() * 0.24,
        speedX: (Math.random() - 0.5) * 0.18,
        speedY: (Math.random() - 0.5) * 0.18,
        pulseSpeed: 0.01 + Math.random() * 0.015,
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
      }, 150);
    };

    window.addEventListener("resize", onResize);

    let time = 0;
    const animate = () => {
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dotsRef.current.forEach((dot) => {
        dot.x += dot.speedX;
        dot.y += dot.speedY;

        if (dot.x < -12) dot.x = canvas.width + 12;
        if (dot.x > canvas.width + 12) dot.x = -12;
        if (dot.y < -12) dot.y = canvas.height + 12;
        if (dot.y > canvas.height + 12) dot.y = -12;

        const pulse = Math.sin(time * dot.pulseSpeed + dot.pulseOffset);
        const currentOpacity = dot.opacity + pulse * 0.08;
        const currentSize = dot.size + pulse * 0.9;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Math.max(0.8, currentSize), 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${primaryColor} / ${Math.max(0.08, currentOpacity)})`;
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
