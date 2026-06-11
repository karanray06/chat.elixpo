/**
 * Full-screen background image with gradient fade + vignette.
 * Used by both the news and podcast pages.
 */
export default function MediaOverlay({
  imageUrl,
  gradientColor,
  className,
}: {
  imageUrl: string;
  gradientColor: string;
  className?: string;
}) {
  return (
    <>
      {imageUrl && (
        <div
          className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 ${className ?? ""}`}
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, ${gradientColor}33 20%, ${gradientColor}aa 45%, ${gradientColor}ee 65%, ${gradientColor} 85%)`,
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: "radial-gradient(ellipse at center 30%, transparent 40%, rgba(0,0,0,0.4) 100%)" }}
      />
    </>
  );
}
