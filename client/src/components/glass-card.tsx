import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = true, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-[1rem] border border-green-500/20 bg-black/30 backdrop-blur-sm",
        "shadow-[0_0_40px_rgba(0,255,0,0.15)] transition-all duration-300",
        hover && "cursor-pointer hover:border-green-500/40 hover:shadow-[0_0_60px_rgba(0,255,0,0.2)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function GlassPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "rounded-[1rem] border border-green-500/10 bg-black/20 backdrop-blur-sm p-6",
      className
    )}>
      {children}
    </div>
  );
}
