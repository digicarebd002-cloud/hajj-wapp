import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  gradientBorder?: boolean;
}

const GlowCard = ({ children, className, gradientBorder = false }: GlowCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative rounded-2xl overflow-hidden",
        gradientBorder && "p-[1px]",
        className
      )}
      style={
        gradientBorder
          ? {
              background: isHovered
                ? `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary) / 0.3))`
                : `hsl(var(--border))`,
              backgroundSize: "200% 200%",
              animation: isHovered ? "gradientShift 3s ease infinite" : "none",
            }
          : undefined
      }
    >
      <div className={cn("relative rounded-2xl overflow-hidden", gradientBorder && "bg-card")}>
        {/* Mouse follow glow */}
        {isHovered && (
          <div
            className="absolute pointer-events-none z-10 transition-opacity duration-300"
            style={{
              left: mousePos.x - 100,
              top: mousePos.y - 100,
              width: 200,
              height: 200,
              background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
        )}
        {children}
      </div>
    </motion.div>
  );
};

export default GlowCard;
