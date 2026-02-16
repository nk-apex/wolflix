import { ContentCard } from "./content-card";
import { type SubjectItem } from "@/lib/tmdb";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

interface ContentGridProps {
  title: string;
  icon?: React.ReactNode;
  items: SubjectItem[];
  type?: "movie" | "tv";
  isLoading?: boolean;
  columns?: number;
}

export function ContentGrid({ title, icon, items, type, isLoading }: ContentGridProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        {icon && <span className="text-green-400">{icon}</span>}
        <h2 className="text-xl font-display font-bold text-white">{title}</h2>
        <ChevronRight className="w-5 h-5 text-green-500/50" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {isLoading
          ? Array.from({ length: 14 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="w-full aspect-[2/3] rounded-xl bg-green-900/10" />
                <Skeleton className="w-3/4 h-3 mt-2 rounded bg-green-900/10" />
              </div>
            ))
          : items.map((item, idx) => (
              <ContentCard key={`${item.subjectId}-${idx}`} item={item} type={type} />
            ))}
      </div>
    </div>
  );
}
