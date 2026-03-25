import { motion } from "framer-motion";

const FloatingShapes = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Floating circles */}
    <motion.div
      className="absolute w-72 h-72 rounded-full opacity-[0.04]"
      style={{ background: "hsl(var(--primary))", top: "10%", right: "-5%" }}
      animate={{ y: [0, -40, 0], x: [0, 20, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute w-48 h-48 rounded-full opacity-[0.03]"
      style={{ background: "hsl(var(--primary))", bottom: "15%", left: "-3%" }}
      animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
    />
    {/* Floating diamond */}
    <motion.div
      className="absolute w-16 h-16 rotate-45 rounded-lg opacity-[0.06]"
      style={{ background: "hsl(var(--primary))", top: "30%", left: "8%" }}
      animate={{ y: [0, -25, 0], rotate: [45, 90, 45] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
    />
    {/* Small dots */}
    {[
      { top: "20%", left: "15%", delay: 0 },
      { top: "60%", right: "10%", delay: 1.5 },
      { top: "45%", left: "75%", delay: 3 },
    ].map((pos, i) => (
      <motion.div
        key={i}
        className="absolute w-3 h-3 rounded-full opacity-[0.08]"
        style={{ background: "hsl(var(--primary))", ...pos }}
        animate={{ y: [0, -20, 0], opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: pos.delay }}
      />
    ))}
  </div>
);

export default FloatingShapes;
