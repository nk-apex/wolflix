import { ChevronRight } from "lucide-react";
import { ContentCard } from "./content-card";
import { type SubjectItem } from "@/lib/tmdb";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useState } from "react";

interface ContentRowProps {
  title: string;
  icon?: React.ReactNode;
  items: SubjectItem[];
  type?: "movie" | "tv";
  isLoading?: boolean;
}

export function ContentRow({ title, icon, items, type = "movie", isLoading }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 600;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 400);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        {icon && <span className="text-green-400">{icon}</span>}
        <h2 className="text-xl font-display font-bold text-white">{title}</h2>
        <ChevronRight className="w-5 h-5 text-green-500/50" />
      </div>
      <div className="relative group/row">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            data-testid="button-scroll-left"
          >
            <ChevronRight className="w-6 h-6 text-green-400 rotate-180" />
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[180px]">
                  <Skeleton className="w-full aspect-[2/3] rounded-2xl bg-green-900/10" />
                  <Skeleton className="w-3/4 h-4 mt-3 rounded bg-green-900/10" />
                  <Skeleton className="w-1/2 h-3 mt-1 rounded bg-green-900/10" />
                </div>
              ))
            : items.map((item) => (
                <ContentCard key={item.subjectId} item={item} type={type} />
              ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            data-testid="button-scroll-right"
          >
            <ChevronRight className="w-6 h-6 text-green-400" />
          </button>
        )}
      </div>
    </div>
  );
}
