import Link from "next/link";

type Props = {
  href?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
};

const sizes = {
  sm: { icon: "h-7 w-7", text: "text-lg" },
  md: { icon: "h-8 w-8", text: "text-2xl" },
  lg: { icon: "h-10 w-10", text: "text-3xl" },
  hero: { icon: "h-14 w-14 md:h-20 md:w-20", text: "text-5xl md:text-7xl" },
};

export function BrandLogo({ href = "/", variant = "dark", size = "md", className = "" }: Props) {
  const s = sizes[size];
  const textColor = variant === "light" ? "text-white" : "text-brand-800";

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pawmarket-logo.png"
        alt=""
        className={`${s.icon} shrink-0 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105`}
      />
      <span className={`font-display tracking-tight ${s.text} ${textColor}`}>PawMarket</span>
    </span>
  );

  if (!href) return inner;

  return (
    <Link href={href} className="group inline-flex" aria-label="PawMarket home">
      {inner}
    </Link>
  );
}
