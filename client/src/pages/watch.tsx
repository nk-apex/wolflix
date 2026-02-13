import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Play, Download, ArrowLeft, Star, Calendar, Clock, ExternalLink, Loader2, Search, Maximize, Minimize, Globe, Subtitles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { MovieBoxCard } from "@/components/moviebox-card";
import { getImageUrl } from "@/lib/tmdb";
import { type MovieBoxItem, getMovieBoxCover, getMovieBoxYear, getMovieBoxRating } from "@/lib/moviebox";

interface ArslanSearchResult {
  title: string;
  imdb: string;
  year: string;
  link: string;
  image: string;
  type: string;
}

interface ArslanMovieDetail {
  title: string;
  imdb: string;
  tmdb: string;
  date: string;
  country: string;
  runtime: string;
  image: string;
  category: string[];
  description: string;
  director: string;
  cast: string;
  dl_links: { quality: string; size: string; link: string }[];
}

interface TMDBDetail {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genres: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status: string;
}

export default function Watch() {
  const [, params] = useRoute("/watch/:type/:id");
  const [, navigate] = useLocation();
  const type = params?.type || "movie";
  const id = params?.id || "";

  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get("source") || "tmdb";
  const isMovieBox = source === "moviebox";

  const mbItemFromStorage = useMemo(() => {
    if (!isMovieBox || !id) return null;
    try {
      const stored = sessionStorage.getItem(`mb_item_${id}`);
      if (stored) return JSON.parse(stored) as MovieBoxItem;
    } catch {}
    return null;
  }, [id, isMovieBox]);

  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [streamServer, setStreamServer] = useState<"multiembed" | "autoembed" | "2embed" | "moviebox">(
    isMovieBox ? "moviebox" : "multiembed"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const { data: tmdbData, isLoading: tmdbLoading } = useQuery<TMDBDetail>({
    queryKey: ["/api/tmdb", type, id],
    enabled: !!id && !isMovieBox,
  });

  const { data: streamDomain } = useQuery<{ code: number; data: string }>({
    queryKey: ["/api/wolfmovieapi/stream-domain"],
  });

  const { data: mbDetailRec } = useQuery<{ code: number; data: { items: MovieBoxItem[] } }>({
    queryKey: ["/api/wolfmovieapi/detail", id],
    enabled: !!id && isMovieBox,
    queryFn: async () => {
      const res = await fetch(`/api/wolfmovieapi/detail/${id}`);
      if (!res.ok) throw new Error("Detail failed");
      return res.json();
    },
  });

  const mbItem = mbItemFromStorage;

  const title = isMovieBox
    ? (mbItem?.title || "")
    : (tmdbData?.title || tmdbData?.name || "");

  const { data: arslanSearch, isLoading: arslanSearching } = useQuery<{ result?: { data?: ArslanSearchResult[] } }>({
    queryKey: ["/api/arslan/search", title],
    queryFn: async () => {
      const res = await fetch(`/api/arslan/search?text=${encodeURIComponent(title)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: !!title && title.length > 1,
  });

  const arslanResults = arslanSearch?.result?.data || [];
  const bestMatch = selectedSource || (arslanResults.length > 0 ? arslanResults[0].link : null);

  const { data: arslanDetail, isLoading: detailLoading } = useQuery<{ result?: { data?: ArslanMovieDetail } }>({
    queryKey: ["/api/arslan/movie", bestMatch],
    queryFn: async () => {
      const res = await fetch(`/api/arslan/movie?url=${encodeURIComponent(bestMatch!)}`);
      if (!res.ok) throw new Error("Details failed");
      return res.json();
    },
    enabled: !!bestMatch,
  });

  const movieDetail = arslanDetail?.result?.data;
  const dlLinks = movieDetail?.dl_links || [];

  const movieboxDomain = streamDomain?.data?.replace(/\/$/, "") || "https://123movienow.cc";

  const streamUrls: Record<string, string> = {
    multiembed: `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    autoembed: type === "movie" ? `https://autoembed.co/movie/tmdb/${id}` : `https://autoembed.co/tv/tmdb/${id}`,
    "2embed": `https://www.2embed.cc/embed/${id}`,
    moviebox: `${movieboxDomain}/play/${id}`,
  };
  const streamUrl = streamUrls[streamServer];

  const posterUrl = isMovieBox
    ? (mbItem ? getMovieBoxCover(mbItem) : "")
    : getImageUrl(tmdbData?.poster_path || null, "w500");

  const backdropUrl = isMovieBox
    ? (mbItem?.stills?.[0]?.url || "")
    : getImageUrl(tmdbData?.backdrop_path || null, "w1280");

  const rating = isMovieBox
    ? (mbItem ? parseFloat(getMovieBoxRating(mbItem)) : 0)
    : (tmdbData?.vote_average || 0);

  const year = isMovieBox
    ? (mbItem ? getMovieBoxYear(mbItem) : "")
    : ((tmdbData?.release_date || tmdbData?.first_air_date)?.split("-")[0] || "");

  const genre = isMovieBox
    ? (mbItem?.genre || "")
    : "";

  const description = isMovieBox
    ? (mbItem?.description || "")
    : (tmdbData?.overview || "");

  const duration = isMovieBox
    ? (mbItem?.duration ? Math.round(mbItem.duration / 60) : 0)
    : (tmdbData?.runtime || 0);

  const country = isMovieBox ? (mbItem?.countryName || "") : "";

  const mbRelated = mbDetailRec?.data?.items || [];

  if (tmdbLoading && !isMovieBox) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="relative">
        {(backdropUrl || posterUrl) && (
          <div className="absolute inset-0 h-[500px]">
            <img src={backdropUrl || posterUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
          </div>
        )}

        <div className="relative z-10 px-6 py-6 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-6 text-gray-400 font-mono"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {posterUrl && (
              <div className="flex-shrink-0">
                <GlassCard hover={false} className="overflow-hidden w-[250px]">
                  <img src={posterUrl} alt={title} className="w-full rounded-[1rem]" data-testid="img-poster" />
                </GlassCard>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-3" data-testid="text-watch-title">{title || `Content #${id}`}</h1>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                {rating > 0 && (
                  <span className="flex items-center gap-1 text-sm font-mono text-green-400" data-testid="text-rating">
                    <Star className="w-4 h-4 fill-green-400" />
                    {rating.toFixed(1)}
                  </span>
                )}
                {year && (
                  <span className="flex items-center gap-1 text-sm font-mono text-gray-400" data-testid="text-year">
                    <Calendar className="w-4 h-4" />
                    {year}
                  </span>
                )}
                {duration > 0 && (
                  <span className="flex items-center gap-1 text-sm font-mono text-gray-400" data-testid="text-runtime">
                    <Clock className="w-4 h-4" />
                    {duration} min
                  </span>
                )}
                {!isMovieBox && tmdbData?.status && (
                  <Badge variant="outline" className="text-green-400 border-green-500/20 bg-green-500/10 font-mono" data-testid="text-status">
                    {tmdbData.status}
                  </Badge>
                )}
                {isMovieBox && (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 font-mono" data-testid="badge-source-moviebox">
                    <Globe className="w-3 h-3 mr-1" />
                    MovieBox
                  </Badge>
                )}
                {country && (
                  <Badge variant="outline" className="text-gray-300 border-gray-500/20 bg-gray-500/10 font-mono" data-testid="badge-country">
                    {country}
                  </Badge>
                )}
              </div>

              {!isMovieBox && tmdbData?.genres && tmdbData.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tmdbData.genres.map((g) => (
                    <Badge key={g.id} variant="outline" className="text-green-300 border-green-500/15 bg-green-500/10 font-mono" data-testid={`badge-genre-${g.id}`}>
                      {g.name}
                    </Badge>
                  ))}
                </div>
              )}

              {isMovieBox && genre && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {genre.split(",").map((g) => (
                    <Badge key={g.trim()} variant="outline" className="text-green-300 border-green-500/15 bg-green-500/10 font-mono" data-testid={`badge-genre-mb-${g.trim()}`}>
                      {g.trim()}
                    </Badge>
                  ))}
                </div>
              )}

              {description && (
                <p className="text-sm text-gray-300 leading-relaxed mb-6 max-w-2xl" data-testid="text-watch-overview">
                  {description}
                </p>
              )}

              {!isMovieBox && tmdbData?.number_of_seasons && (
                <p className="text-xs font-mono text-gray-500 mb-4" data-testid="text-seasons">
                  {tmdbData.number_of_seasons} Seasons / {tmdbData.number_of_episodes} Episodes
                </p>
              )}

              {isMovieBox && mbItem?.season && mbItem.season.length > 0 && (
                <p className="text-xs font-mono text-gray-500 mb-4" data-testid="text-seasons-mb">
                  {mbItem.season.length} Season{mbItem.season.length > 1 ? "s" : ""}
                </p>
              )}

              {isMovieBox && mbItem?.staffList && mbItem.staffList.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {mbItem.staffList.slice(0, 5).map((staff) => (
                    <span key={staff.staffId} className="text-xs font-mono text-gray-500">
                      {staff.staffName} ({staff.staffRole})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <GlassPanel className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2" data-testid="text-stream-heading">
                <Play className="w-5 h-5 text-green-400" />
                Stream Now
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-gray-500" data-testid="text-server-label">Server:</span>
                <Button
                  size="sm"
                  variant={streamServer === "multiembed" ? "default" : "ghost"}
                  onClick={() => setStreamServer("multiembed")}
                  className={`text-xs font-mono ${streamServer === "multiembed" ? "bg-green-500 text-black" : "text-gray-400"}`}
                  data-testid="button-server-multiembed"
                >
                  Server 1
                </Button>
                <Button
                  size="sm"
                  variant={streamServer === "autoembed" ? "default" : "ghost"}
                  onClick={() => setStreamServer("autoembed")}
                  className={`text-xs font-mono ${streamServer === "autoembed" ? "bg-green-500 text-black" : "text-gray-400"}`}
                  data-testid="button-server-autoembed"
                >
                  Server 2
                </Button>
                <Button
                  size="sm"
                  variant={streamServer === "2embed" ? "default" : "ghost"}
                  onClick={() => setStreamServer("2embed")}
                  className={`text-xs font-mono ${streamServer === "2embed" ? "bg-green-500 text-black" : "text-gray-400"}`}
                  data-testid="button-server-2embed"
                >
                  Server 3
                </Button>
                <Button
                  size="sm"
                  variant={streamServer === "moviebox" ? "default" : "ghost"}
                  onClick={() => setStreamServer("moviebox")}
                  className={`text-xs font-mono ${streamServer === "moviebox" ? "bg-emerald-500 text-black" : "text-emerald-400"}`}
                  data-testid="button-server-moviebox"
                >
                  MovieBox
                </Button>
              </div>
            </div>
            <div ref={playerContainerRef} className="relative w-full aspect-video rounded-xl overflow-hidden border border-green-500/20 bg-black">
              <iframe
                src={streamUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                referrerPolicy="origin"
                data-testid="iframe-player"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleFullscreen}
                className="absolute top-3 right-3 z-20 bg-black/60 text-white backdrop-blur-sm"
                data-testid="button-fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </GlassPanel>

          <GlassPanel className="mb-8">
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2 mb-4" data-testid="text-download-heading">
              <Download className="w-5 h-5 text-green-400" />
              Download Links
            </h2>

            {arslanSearching || detailLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center">
                <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                <span className="text-sm font-mono text-gray-400" data-testid="text-searching">Searching for download sources...</span>
              </div>
            ) : dlLinks.length > 0 ? (
              <div className="space-y-3">
                {dlLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-green-500/10 hover-elevate transition-colors"
                    data-testid={`link-download-${i}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Download className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-bold text-white truncate" data-testid={`text-quality-${i}`}>{link.quality}</p>
                        {link.size && link.size !== "----" && (
                          <p className="text-xs font-mono text-gray-500" data-testid={`text-size-${i}`}>{link.size}</p>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </a>
                ))}
              </div>
            ) : arslanResults.length === 0 && !arslanSearching ? (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-green-500/20 mx-auto mb-3" />
                <p className="text-sm font-mono text-gray-500" data-testid="text-no-downloads">No download sources found for this title</p>
                <p className="text-xs font-mono text-gray-600 mt-1">Try using the stream player above</p>
              </div>
            ) : null}

            {arslanResults.length > 1 && (
              <div className="mt-6 pt-4 border-t border-green-500/10">
                <p className="text-xs font-mono text-gray-500 mb-3" data-testid="text-other-sources">Other sources found:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {arslanResults.map((result, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      onClick={() => setSelectedSource(result.link)}
                      className={`text-left h-auto p-3 justify-start font-mono text-xs ${
                        bestMatch === result.link
                          ? "border border-green-500/40 bg-green-500/10 text-green-400"
                          : "border border-green-500/10 text-gray-400"
                      }`}
                      data-testid={`button-source-${i}`}
                    >
                      <div className="min-w-0 w-full">
                        <p className="truncate font-bold" data-testid={`text-source-title-${i}`}>{result.title}</p>
                        <p className="text-gray-600 mt-0.5">{result.year} / {result.type} / IMDB {result.imdb}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </GlassPanel>

          {mbRelated.length > 0 && (
            <GlassPanel className="mb-8">
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2 mb-4" data-testid="text-related-heading">
                <Subtitles className="w-5 h-5 text-green-400" />
                Related Content
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {mbRelated.map((item: MovieBoxItem) => (
                  <MovieBoxCard key={item.subjectId} item={item} />
                ))}
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
