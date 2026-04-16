const CodFormLogo = ({ size = "md", variant = "auto" }: { size?: "sm" | "md" | "lg"; variant?: "light" | "dark" | "auto" }) => {
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-xl";
  const badgeSize = size === "sm" ? "text-[7px] px-1 py-px" : "text-[9px] px-1.5 py-0.5";
  const textColor = variant === "light" ? "text-white/90" : variant === "dark" ? "text-foreground" : "text-foreground";

  return (
    <span className={`${textSize} font-bold inline-flex items-center gap-1`} dir="ltr">
      <span className={`tracking-tight ${textColor}`}>Cod</span>
      <span className={`font-extrabold ${textColor}`}>Form</span>
      <span
        className={`${badgeSize} text-white rounded font-bold`}
        style={{ background: "linear-gradient(135deg, hsl(250 80% 65%), hsl(340 75% 55%))" }}
      >
        PRO
      </span>
    </span>
  );
};

export default CodFormLogo;
