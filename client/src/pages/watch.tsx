import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Play, Download, ArrowLeft, Star, Calendar, Clock, ExternalLink, Loader2, Search, Maximize, Minimize, ChevronDown, ChevronLeft, ChevronRight, Tv2, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { getImageUrl } from "@/lib/tmdb";

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
  imdb_id?: string;
}

interface SeasonDetail {
  season_number: number;
  episodes: {
    episode_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date: string | null;
    runtime: number | null;
  }[];
}

function buildPlayerUrl(contentId: string, contentType: string, season: number, episode: number): string {
  if (!contentId) return "";
  if (contentType === "tv") {
    return `https://player.autoembed.cc/embed/tv/${contentId}/${season}/${episode}`;
  }
  return `https://player.autoembed.cc/embed/movie/${contentId}`;
}

export default function Watch() {
  const [, params] = useRoute("/watch/:type/:id");
  const [, navigate] = useLocation();
  const type = params?.type || "movie";
  const id = params?.id || "";

  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get("source") || "tmdb";
  const isZone = source === "zone";

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [renderCount, setRenderCount] = useState(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerSectionRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const prevIdRef = useRef(id);

  if (prevIdRef.current !== id) {
    prevIdRef.current = id;
    setSeason(1);
    setEpisode(1);
    setRenderCount(0);
    setShowDownloads(false);
  }

  const scrollToPlayer = useCallback(() => {
    setTimeout(() => {
      playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, []);

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

  const tmdbEndpoint = type === "tv" ? `/api/tmdb/tv/${id}` : `/api/tmdb/movie/${id}`;
  const { data: tmdbData, isLoading: tmdbLoading } = useQuery<TMDBDetail>({
    queryKey: [tmdbEndpoint],
    enabled: !!id,
  });

  const { data: externalIds } = useQuery<{ imdb_id?: string }>({
    queryKey: [`/api/tmdb/${type}/${id}/external_ids`],
    enabled: !!id && !isZone && type === "tv",
  });

  const tvId = useMemo(() => {
    if (type !== "tv") return null;
    if (!isZone) return id;
    if (tmdbData?.id) return String(tmdbData.id);
    return null;
  }, [type, isZone, id, tmdbData]);

  const { data: seasonData, isLoading: seasonLoading } = useQuery<SeasonDetail>({
    queryKey: ["/api/tmdb/tv", tvId, "season", season],
    queryFn: async () => {
      const res = await fetch(`/api/tmdb/tv/${tvId}/season/${season}`);
      if (!res.ok) throw new Error("Failed to fetch season");
      return res.json();
    },
    enabled: !!tvId && type === "tv",
  });

  const episodes = seasonData?.episodes || [];
  const episodeCount = episodes.length;
  const seasonCount = tmdbData?.number_of_seasons || 0;
  const totalEpisodes = tmdbData?.number_of_episodes || 0;

  useEffect(() => {
    if (episodeCount > 0 && episode > episodeCount) {
      setEpisode(episodeCount);
    }
  }, [episodeCount, episode]);

  const imdbId = useMemo(() => {
    if (isZone && id.startsWith("tt")) return id;
    if (type === "movie" && tmdbData?.imdb_id) return tmdbData.imdb_id;
    if (type === "tv" && externalIds?.imdb_id) return externalIds.imdb_id;
    return null;
  }, [type, tmdbData, externalIds, isZone, id]);

  const tmdbId = useMemo(() => {
    if (tmdbData?.id) return String(tmdbData.id);
    if (!isZone) return id;
    return null;
  }, [tmdbData, isZone, id]);

  const zoneTitle = urlParams.get("title") || "";
  const title = isZone
    ? (zoneTitle || tmdbData?.title || tmdbData?.name || id)
    : (tmdbData?.title || tmdbData?.name || "");

  const contentId = tmdbId || imdbId || "";
  const playerUrl = buildPlayerUrl(contentId, type, season, episode);

  const posterUrl = getImageUrl(tmdbData?.poster_path || null, "w500");
  const backdropUrl = getImageUrl(tmdbData?.backdrop_path || null, "w1280");
  const rating = tmdbData?.vote_average || 0;
  const year = ((tmdbData?.release_date || tmdbData?.first_air_date)?.split("-")[0] || "");
  const description = tmdbData?.overview || "";
  const duration = tmdbData?.runtime || 0;

  const currentEpisodeData = episodes.find(ep => ep.episode_number === episode);

  const isFirstEpisode = season <= 1 && episode <= 1;
  const isLastEpisode = season >= seasonCount && episode >= episodeCount;

  const goTo = useCallback((newSeason: number, newEpisode: number) => {
    setSeason(newSeason);
    setEpisode(newEpisode);
    setRenderCount(c => c + 1);
    scrollToPlayer();
  }, [scrollToPlayer]);

  const goPrev = useCallback(() => {
    if (episode > 1) {
      goTo(season, episode - 1);
    } else if (season > 1) {
      goTo(season - 1, 999);
    }
  }, [episode, season, goTo]);

  const goNext = useCallback(() => {
    if (episodeCount > 0 && episode < episodeCount) {
      goTo(season, episode + 1);
    } else if (season < seasonCount) {
      goTo(season + 1, 1);
    }
  }, [episode, episodeCount, season, seasonCount, goTo]);

  useEffect(() => {
    if (type !== "tv") return;
    const onMessage = (event: MessageEvent) => {
      try {
        const d = event.data;
        if (d === "ended" || d?.type === "ended" || d?.event === "ended" || d?.event === "video_end" || d?.event === "complete") {
          goNext();
        }
      } catch {}
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [type, goNext]);

  if (tmdbLoading) {
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
                {tmdbData?.status && (
                  <Badge variant="outline" className="text-green-400 border-green-500/20 bg-green-500/10 font-mono" data-testid="text-status">
                    {tmdbData.status}
                  </Badge>
                )}
              </div>

              {tmdbData?.genres && tmdbData.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tmdbData.genres.map((g) => (
                    <Badge key={g.id} variant="outline" className="text-green-300 border-green-500/15 bg-green-500/10 font-mono" data-testid={`badge-genre-${g.id}`}>
                      {g.name}
                    </Badge>
                  ))}
                </div>
              )}

              {description && (
                <p className="text-sm text-gray-300 leading-relaxed mb-6 max-w-2xl" data-testid="text-watch-overview">
                  {description}
                </p>
              )}

              {seasonCount > 0 && (
                <p className="text-xs font-mono text-gray-500 mb-4" data-testid="text-seasons">
                  {seasonCount} Seasons / {totalEpisodes} Episodes
                </p>
              )}
            </div>
          </div>

          <div ref={playerSectionRef}>
            {type === "tv" && (
              <div className="flex items-center justify-between gap-3 mb-3 px-1 flex-wrap">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goPrev}
                    disabled={isFirstEpisode}
                    className="border-green-500/30 text-green-400 font-mono gap-1"
                    data-testid="button-prev-episode"
                  >
                    <SkipBack className="w-4 h-4" />
                    Prev
                  </Button>
                  <div className="text-center" data-testid="text-current-playing">
                    <span className="text-white font-display font-bold text-base">
                      S{season} E{episode}
                    </span>
                    {currentEpisodeData?.name && (
                      <span className="text-gray-400 text-sm ml-2 font-mono">
                        {currentEpisodeData.name}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goNext}
                    disabled={isLastEpisode}
                    className="border-green-500/30 text-green-400 font-mono gap-1"
                    data-testid="button-next-episode"
                  >
                    Next
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDownloads(!showDownloads)}
                    className="text-green-400 font-mono text-xs"
                    data-testid="button-toggle-downloads"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Downloads
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleFullscreen}
                    className="text-white"
                    data-testid="button-fullscreen"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            <GlassPanel className="mb-4 p-0 overflow-hidden">
              {!playerUrl ? (
                <div className="w-full aspect-video bg-black flex items-center justify-center">
                  <div className="text-center">
                    <Search className="w-10 h-10 text-green-500/20 mx-auto mb-3" />
                    <p className="text-sm font-mono text-gray-500" data-testid="text-no-source">
                      No streaming source found for this title
                    </p>
                  </div>
                </div>
              ) : (
                <div ref={playerContainerRef} className="relative w-full aspect-video bg-black">
                  <iframe
                    ref={iframeRef}
                    key={`player-${season}-${episode}-${renderCount}`}
                    src={playerUrl}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen; encrypted-media"
                    referrerPolicy="origin"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                    data-testid="iframe-player"
                  />
                </div>
              )}
            </GlassPanel>

            {type !== "tv" && (
              <div className="flex items-center justify-end gap-2 mb-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDownloads(!showDownloads)}
                  className="text-green-400 font-mono text-xs"
                  data-testid="button-toggle-downloads-movie"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Downloads
                  <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showDownloads ? "rotate-180" : ""}`} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleFullscreen}
                  className="text-white"
                  data-testid="button-fullscreen-movie"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>

          {showDownloads && (
            <GlassPanel className="mb-8">
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2 mb-4" data-testid="text-download-heading">
                <Download className="w-5 h-5 text-green-400" />
                Downloads
              </h2>
              <DownloadSection title={title} />
            </GlassPanel>
          )}

          {type === "tv" && seasonCount > 0 && (
            <GlassPanel className="mb-8">
              <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2" data-testid="text-season-selector">
                <Tv2 className="w-5 h-5 text-green-400" />
                Seasons & Episodes
              </h3>

              <div className="mb-4">
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: seasonCount }, (_, i) => i + 1).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={season === s ? "default" : "ghost"}
                      onClick={() => goTo(s, 1)}
                      className={`font-mono text-xs ${season === s ? "bg-green-600 text-white" : "text-gray-400"}`}
                      data-testid={`button-season-${s}`}
                    >
                      Season {s}
                    </Button>
                  ))}
                </div>
              </div>

              {seasonLoading ? (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                  <span className="text-sm font-mono text-gray-400">Loading episodes...</span>
                </div>
              ) : episodeCount > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-gray-400">
                      {episodeCount} Episodes
                    </span>
                    <span className="text-xs font-mono text-green-400">
                      Playing: S{season}E{episode}
                    </span>
                  </div>
                  <div className="grid gap-2 max-h-[500px] overflow-y-auto pr-1">
                    {episodes.map((ep) => {
                      const isActive = episode === ep.episode_number;
                      return (
                        <button
                          key={`s${season}-e${ep.episode_number}`}
                          onClick={() => goTo(season, ep.episode_number)}
                          className={`flex items-start gap-3 p-3 rounded-md text-left transition-all ${
                            isActive
                              ? "bg-green-500/20 border border-green-500/40 shadow-lg shadow-green-500/10"
                              : "bg-black/30 border border-green-500/5 hover:border-green-500/20 hover:bg-green-500/5"
                          }`}
                          data-testid={`button-episode-${ep.episode_number}`}
                        >
                          <div className={`flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center font-mono text-sm font-bold ${
                            isActive
                              ? "bg-green-500 text-black"
                              : "bg-green-500/10 text-green-400"
                          }`}>
                            {ep.episode_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-mono font-medium truncate ${
                              isActive ? "text-green-300" : "text-white"
                            }`}>
                              {ep.name || `Episode ${ep.episode_number}`}
                            </p>
                            {ep.overview && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ep.overview}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {ep.runtime && (
                                <span className="text-[10px] font-mono text-gray-600">{ep.runtime}m</span>
                              )}
                              {ep.air_date && (
                                <span className="text-[10px] font-mono text-gray-600">{ep.air_date}</span>
                              )}
                            </div>
                          </div>
                          {isActive && (
                            <div className="flex-shrink-0 flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                              <span className="text-[10px] font-mono text-green-400">PLAYING</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}

function DownloadSection({ title }: { title: string }) {
  const { data: arslanSearch, isLoading: arslanLoading } = useQuery<{ results?: { title: string; url: string }[] }>({
    queryKey: ["/api/arslan/search", title],
    queryFn: async () => {
      const res = await fetch(`/api/arslan/search?text=${encodeURIComponent(title)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: !!title && title.length > 1,
  });

  const firstResult = arslanSearch?.results?.[0];

  const { data: arslanMovie, isLoading: arslanMovieLoading } = useQuery<{ title?: string; links?: { quality: string; size: string; url: string }[] }>({
    queryKey: ["/api/arslan/movie", firstResult?.url],
    queryFn: async () => {
      const res = await fetch(`/api/arslan/movie?url=${encodeURIComponent(firstResult!.url)}`);
      if (!res.ok) throw new Error("Movie details failed");
      return res.json();
    },
    enabled: !!firstResult?.url,
  });

  const downloadLinks = arslanMovie?.links || [];
  const isLoading = arslanLoading || arslanMovieLoading;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-8 justify-center">
        <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
        <span className="text-sm font-mono text-gray-400" data-testid="text-searching-downloads">Searching for download links...</span>
      </div>
    );
  }

  if (downloadLinks.length === 0) {
    return (
      <div className="text-center py-8">
        <Download className="w-8 h-8 text-green-500/20 mx-auto mb-3" />
        <p className="text-sm font-mono text-gray-500" data-testid="text-no-downloads">No download links found</p>
        <p className="text-xs font-mono text-gray-600 mt-1">Downloads may not be available for this title</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {downloadLinks.map((dl, i) => {
        const decodedUrl = decodeHtmlEntities(dl.url);
        return (
          <a
            key={i}
            href={decodedUrl}
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
                <p className="text-sm font-mono font-bold text-white" data-testid={`text-quality-${i}`}>
                  {dl.quality || "Download"}
                </p>
                {dl.size && (
                  <p className="text-xs font-mono text-gray-500" data-testid={`text-size-${i}`}>
                    {dl.size}
                  </p>
                )}
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" />
          </a>
        );
      })}
    </div>
  );
}

function decodeHtmlEntities(html: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
}
