const AnimatedDots = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
      style={{
        backgroundImage: "radial-gradient(circle, hsl(142 72% 40% / 0.18) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
  );
};

export default AnimatedDots;
