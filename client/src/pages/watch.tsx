import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Play, Download, ArrowLeft, Star, Calendar, Clock, ExternalLink, Loader2, Search, Maximize, Minimize, ChevronDown, Tv2, SkipBack, SkipForward } from "lucide-react";
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

function getPlayerUrl(contentId: string, contentType: string, season?: number, episode?: number): string {
  if (!contentId) return "";
  if (contentType === "tv") {
    return `https://player.autoembed.cc/embed/tv/${contentId}/${season || 1}/${episode || 1}`;
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
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [playerKey, setPlayerKey] = useState(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerSectionRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const changeSeason = useCallback((season: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(1);
    setPlayerKey(k => k + 1);
  }, []);

  const changeEpisode = useCallback((episode: number) => {
    setSelectedEpisode(episode);
    setPlayerKey(k => k + 1);
  }, []);

  useEffect(() => {
    setShowDownloads(false);
    setSelectedSeason(1);
    setSelectedEpisode(1);
    setPlayerKey(0);
  }, [id]);

  const scrollToPlayer = useCallback(() => {
    setTimeout(() => {
      playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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

  const { data: seasonData } = useQuery<SeasonDetail>({
    queryKey: ["/api/tmdb/tv", tvId, "season", selectedSeason],
    queryFn: async () => {
      const res = await fetch(`/api/tmdb/tv/${tvId}/season/${selectedSeason}`);
      if (!res.ok) throw new Error("Failed to fetch season");
      return res.json();
    },
    enabled: !!tvId && type === "tv",
  });

  const episodeCount = seasonData?.episodes?.length || 0;

  useEffect(() => {
    if (episodeCount > 0 && selectedEpisode > episodeCount) {
      setSelectedEpisode(episodeCount);
    }
  }, [episodeCount, selectedEpisode]);

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
  const playerUrl = useMemo(() => {
    return getPlayerUrl(contentId, type, selectedSeason, selectedEpisode);
  }, [contentId, type, selectedSeason, selectedEpisode]);

  const posterUrl = getImageUrl(tmdbData?.poster_path || null, "w500");
  const backdropUrl = getImageUrl(tmdbData?.backdrop_path || null, "w1280");
  const rating = tmdbData?.vote_average || 0;
  const year = ((tmdbData?.release_date || tmdbData?.first_air_date)?.split("-")[0] || "");
  const description = tmdbData?.overview || "";
  const duration = tmdbData?.runtime || 0;

  const seasonCount = tmdbData?.number_of_seasons || 0;

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

              {tmdbData?.number_of_seasons && (
                <p className="text-xs font-mono text-gray-500 mb-4" data-testid="text-seasons">
                  {tmdbData.number_of_seasons} Seasons / {tmdbData.number_of_episodes} Episodes
                </p>
              )}
            </div>
          </div>

          <div ref={playerSectionRef}>
          <GlassPanel className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2" data-testid="text-stream-heading">
                <Play className="w-5 h-5 text-green-400" />
                Stream Now
                {type === "tv" && (
                  <span className="text-xs font-mono text-gray-500 ml-2">
                    S{selectedSeason} E{selectedEpisode}
                  </span>
                )}
              </h2>
            </div>

            {!playerUrl ? (
              <div className="w-full aspect-video rounded-t-xl border border-green-500/20 border-b-0 bg-black flex items-center justify-center">
                <div className="text-center">
                  <Search className="w-10 h-10 text-green-500/20 mx-auto mb-3" />
                  <p className="text-sm font-mono text-gray-500" data-testid="text-no-source">
                    No streaming source found for this title
                  </p>
                </div>
              </div>
            ) : (
              <div ref={playerContainerRef} className="relative w-full aspect-video rounded-t-xl overflow-hidden border border-green-500/20 border-b-0 bg-black">
                <iframe
                  ref={iframeRef}
                  key={`${playerUrl}-${playerKey}`}
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

            <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-b-xl border border-green-500/20 border-t-0 bg-black/60 backdrop-blur-sm">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-gray-400 truncate" data-testid="text-now-playing">
                  {title || "Now Playing"}
                  {type === "tv" && ` - S${selectedSeason}E${selectedEpisode}`}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {type === "tv" && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (selectedEpisode > 1) {
                          changeEpisode(selectedEpisode - 1);
                        } else if (selectedSeason > 1) {
                          setSelectedSeason(selectedSeason - 1);
                          setSelectedEpisode(999);
                          setPlayerKey(k => k + 1);
                        }
                      }}
                      disabled={selectedSeason === 1 && selectedEpisode === 1}
                      className="text-green-400"
                      data-testid="button-prev-episode"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (episodeCount > 0 && selectedEpisode < episodeCount) {
                          changeEpisode(selectedEpisode + 1);
                        } else if (selectedSeason < seasonCount) {
                          changeSeason(selectedSeason + 1);
                        }
                      }}
                      disabled={selectedSeason >= seasonCount && selectedEpisode >= episodeCount}
                      className="text-green-400"
                      data-testid="button-next-episode"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDownloads(!showDownloads)}
                  className="text-green-400 font-mono text-xs"
                  data-testid="button-toggle-downloads"
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
                  data-testid="button-fullscreen"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </GlassPanel>
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
                <span className="text-xs font-mono text-gray-400 mr-3">Season:</span>
                <div className="flex gap-1 flex-wrap mt-1">
                  {Array.from({ length: seasonCount }, (_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={selectedSeason === (i + 1) ? "default" : "ghost"}
                      onClick={() => { changeSeason(i + 1); scrollToPlayer(); }}
                      className={`font-mono text-xs ${selectedSeason === (i + 1) ? "bg-green-600 text-white" : "text-gray-400"}`}
                      data-testid={`button-season-${i + 1}`}
                    >
                      S{i + 1}
                    </Button>
                  ))}
                </div>
              </div>

              {episodeCount > 0 && (
                <div>
                  <span className="text-xs font-mono text-gray-400 mb-1 block">
                    Episodes ({episodeCount}):
                  </span>
                  <div className="grid gap-2 mt-2 max-h-[400px] overflow-y-auto pr-1">
                    {seasonData!.episodes.map((ep) => (
                      <button
                        key={ep.episode_number}
                        onClick={() => { changeEpisode(ep.episode_number); scrollToPlayer(); }}
                        className={`flex items-start gap-3 p-3 rounded-md text-left transition-all ${
                          selectedEpisode === ep.episode_number
                            ? "bg-green-500/15 border border-green-500/30"
                            : "bg-black/30 border border-green-500/5 hover:border-green-500/15"
                        }`}
                        data-testid={`button-episode-${ep.episode_number}`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center font-mono text-xs font-bold ${
                          selectedEpisode === ep.episode_number
                            ? "bg-green-500 text-black"
                            : "bg-green-500/10 text-green-400"
                        }`}>
                          {ep.episode_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-mono font-medium truncate ${
                            selectedEpisode === ep.episode_number ? "text-green-300" : "text-white"
                          }`}>
                            {ep.name || `Episode ${ep.episode_number}`}
                          </p>
                          {ep.overview && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ep.overview}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            {ep.runtime && (
                              <span className="text-[10px] font-mono text-gray-600">{ep.runtime}m</span>
                            )}
                            {ep.air_date && (
                              <span className="text-[10px] font-mono text-gray-600">{ep.air_date}</span>
                            )}
                          </div>
                        </div>
                        {selectedEpisode === ep.episode_number && (
                          <div className="flex-shrink-0">
                            <Play className="w-4 h-4 text-green-400 fill-green-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
