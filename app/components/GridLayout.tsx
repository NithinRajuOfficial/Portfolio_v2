const GridLayout = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(220,207,237,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(220,207,237,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }}
    />
  );
};

export default GridLayout;
