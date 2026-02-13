import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Play, Download, ArrowLeft, Star, Calendar, Clock, ExternalLink, Loader2, Search, Maximize, Minimize, Globe, SkipBack, SkipForward, ChevronDown, Tv2, Film, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { MovieBoxCard } from "@/components/moviebox-card";
import { getImageUrl } from "@/lib/tmdb";
import { type MovieBoxItem, getMovieBoxCover, getMovieBoxYear, getMovieBoxRating } from "@/lib/moviebox";

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

const ZONE_BASE = "https://zone.bwmxmd.co.ke";

export default function Watch() {
  const [, params] = useRoute("/watch/:type/:id");
  const [, navigate] = useLocation();
  const type = params?.type || "movie";
  const id = params?.id || "";

  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get("source") || "tmdb";
  const isMovieBox = source === "moviebox";
  const isZone = source === "zone";

  const mbItemFromStorage = useMemo(() => {
    if (!isMovieBox || !id) return null;
    try {
      const stored = sessionStorage.getItem(`mb_item_${id}`);
      if (stored) return JSON.parse(stored) as MovieBoxItem;
    } catch {}
    return null;
  }, [id, isMovieBox]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [selectedServer, setSelectedServer] = useState(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setShowDownloads(false);
    setSelectedSeason(1);
    setSelectedEpisode(1);
    setSelectedServer(0);
  }, [id, isMovieBox]);

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
    enabled: !!id && !isMovieBox && !isZone,
  });

  const { data: externalIds } = useQuery<{ imdb_id?: string }>({
    queryKey: [`/api/tmdb/${type}/${id}/external_ids`],
    enabled: !!id && !isMovieBox && !isZone && type === "tv",
  });

  const imdbId = useMemo(() => {
    if (isZone && id.startsWith("tt")) return id;
    if (type === "movie" && tmdbData?.imdb_id) return tmdbData.imdb_id;
    if (type === "tv" && externalIds?.imdb_id) return externalIds.imdb_id;
    return null;
  }, [type, tmdbData, externalIds, isZone, id]);

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

  const mbItemTitle = isMovieBox ? (mbItem?.title || "") : "";

  const { data: mbSearchByTitle } = useQuery<{ code: number; data: { items: MovieBoxItem[] } }>({
    queryKey: ["/api/wolfmovieapi/search-recover", id, mbItemTitle],
    queryFn: async () => {
      if (mbItemTitle) {
        const res = await fetch(`/api/wolfmovieapi/search?keyword=${encodeURIComponent(mbItemTitle)}&page=1&perPage=5`);
        if (!res.ok) throw new Error("Search failed");
        return res.json();
      }
      const trendRes = await fetch(`/api/wolfmovieapi/trending?page=1&perPage=50`);
      if (!trendRes.ok) throw new Error("Trending failed");
      const trendData = await trendRes.json();
      return { code: 0, data: { items: trendData?.data?.subjectList || [] } };
    },
    enabled: isMovieBox && !mbItem?.detailPath,
  });

  const recoveredMbItem = useMemo(() => {
    if (mbItem?.detailPath) return null;
    if (!mbSearchByTitle?.data?.items) return null;
    return mbSearchByTitle.data.items.find(item => String(item.subjectId) === String(id)) || null;
  }, [mbSearchByTitle, id, mbItem]);

  const effectiveMbItem = mbItem || recoveredMbItem;

  const zoneTitle = urlParams.get("title") || "";

  const title = isZone
    ? (zoneTitle || id)
    : isMovieBox
      ? (effectiveMbItem?.title || "")
      : (tmdbData?.title || tmdbData?.name || "");

  const detailPath = effectiveMbItem?.detailPath || "";

  const { data: mbSearchForTmdb } = useQuery<{ code: number; data: { items: MovieBoxItem[] } }>({
    queryKey: ["/api/wolfmovieapi/search-for-tmdb", title],
    queryFn: async () => {
      const res = await fetch(`/api/wolfmovieapi/search?keyword=${encodeURIComponent(title)}&page=1&perPage=10`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: !isMovieBox && !!title && title.length > 1,
  });

  const tmdbMbMatch = useMemo(() => {
    if (isMovieBox) return null;
    if (!mbSearchForTmdb?.data?.items) return null;
    const lowerTitle = title.toLowerCase();
    return mbSearchForTmdb.data.items.find(r =>
      r.title.toLowerCase() === lowerTitle
    ) || mbSearchForTmdb.data.items[0] || null;
  }, [mbSearchForTmdb, title, isMovieBox]);

  const effectiveSubjectId = isMovieBox ? id : (tmdbMbMatch?.subjectId ? String(tmdbMbMatch.subjectId) : null);

  const { data: streamDomainData } = useQuery<{ code: number; data: string }>({
    queryKey: ["/api/wolfmovieapi/stream-domain"],
    queryFn: async () => {
      const res = await fetch("/api/wolfmovieapi/stream-domain");
      if (!res.ok) throw new Error("Failed to fetch stream domain");
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  const streamDomain = streamDomainData?.data || "https://123movienow.cc";
  const cleanStreamDomain = streamDomain.replace(/\/$/, "");

  const zonePlayerUrl = useMemo(() => {
    if (!imdbId) return "";
    return `${ZONE_BASE}/movie/${imdbId}`;
  }, [imdbId]);

  const movieBoxPlayerUrl = useMemo(() => {
    if (!effectiveSubjectId) return "";
    const se = type === "tv" ? selectedSeason : 0;
    const ep = type === "tv" ? selectedEpisode : 0;
    return `${cleanStreamDomain}/spa/videoPlayPage/movies/${effectiveSubjectId}?se=${se}&ep=${ep}`;
  }, [effectiveSubjectId, type, selectedSeason, selectedEpisode, cleanStreamDomain]);

  const tmdbId = isMovieBox ? null : id;

  const embedServers = useMemo(() => {
    if (!tmdbId) return [];
    const mediaType = type === "tv" ? "tv" : "movie";
    return [
      {
        name: "VidSrc",
        url: `https://vidsrc.icu/embed/${mediaType}/${tmdbId}${type === "tv" ? `/${selectedSeason}/${selectedEpisode}` : ""}`,
      },
      {
        name: "MultiEmbed",
        url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1${type === "tv" ? `&s=${selectedSeason}&e=${selectedEpisode}` : ""}`,
      },
      {
        name: "SuperEmbed",
        url: `https://getsuperembed.link/?video_id=${tmdbId}&tmdb=1${type === "tv" ? `&s=${selectedSeason}&e=${selectedEpisode}` : ""}`,
      },
    ];
  }, [tmdbId, type, selectedSeason, selectedEpisode]);

  const allServers = useMemo(() => {
    const servers: { name: string; url: string; source: string }[] = [];
    if (zonePlayerUrl) {
      servers.push({ name: "Zone Stream", url: zonePlayerUrl, source: "zone" });
    }
    if (movieBoxPlayerUrl) {
      servers.push({ name: "MovieBox Player", url: movieBoxPlayerUrl, source: "moviebox" });
    }
    if (!isMovieBox) {
      embedServers.forEach(s => {
        servers.push({ ...s, source: "embed" });
      });
    }
    return servers;
  }, [zonePlayerUrl, movieBoxPlayerUrl, embedServers, isMovieBox]);

  const activeServerUrl = allServers[selectedServer]?.url || "";

  const posterUrl = isMovieBox
    ? (effectiveMbItem ? getMovieBoxCover(effectiveMbItem) : "")
    : isZone ? "" : getImageUrl(tmdbData?.poster_path || null, "w500");

  const backdropUrl = isMovieBox
    ? (effectiveMbItem?.stills?.[0]?.url || "")
    : isZone ? "" : getImageUrl(tmdbData?.backdrop_path || null, "w1280");

  const rating = isMovieBox
    ? (effectiveMbItem ? parseFloat(getMovieBoxRating(effectiveMbItem)) : 0)
    : (tmdbData?.vote_average || 0);

  const year = isMovieBox
    ? (effectiveMbItem ? getMovieBoxYear(effectiveMbItem) : "")
    : ((tmdbData?.release_date || tmdbData?.first_air_date)?.split("-")[0] || "");

  const genre = isMovieBox
    ? (effectiveMbItem?.genre || "")
    : "";

  const description = isMovieBox
    ? (effectiveMbItem?.description || "")
    : isZone ? "Stream this content directly on Zone Stream. Use the player above to watch." : (tmdbData?.overview || "");

  const duration = isMovieBox
    ? (effectiveMbItem?.duration ? Math.round(effectiveMbItem.duration / 60) : 0)
    : (tmdbData?.runtime || 0);

  const country = isMovieBox ? (effectiveMbItem?.countryName || "") : "";

  const mbRelated = mbDetailRec?.data?.items || [];

  const seasonCount = useMemo(() => {
    if (isMovieBox && effectiveMbItem?.season) {
      const s = effectiveMbItem.season;
      if (Array.isArray(s)) return s.length;
      if (typeof s === "number") return s;
    }
    if (!isMovieBox && tmdbData?.number_of_seasons) {
      return tmdbData.number_of_seasons;
    }
    if (tmdbMbMatch?.season) {
      const s = tmdbMbMatch.season;
      if (typeof s === "number") return s;
      if (Array.isArray(s)) return s.length;
    }
    return 0;
  }, [isMovieBox, effectiveMbItem, tmdbData, tmdbMbMatch]);

  const navigateRelated = (direction: "prev" | "next") => {
    if (mbRelated.length === 0) return;
    const currentIdx = mbRelated.findIndex(r => String(r.subjectId) === String(id));
    let targetIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;
    if (targetIdx < 0) targetIdx = mbRelated.length - 1;
    if (targetIdx >= mbRelated.length) targetIdx = 0;
    const target = mbRelated[targetIdx];
    const mediaType = target.subjectType === 2 ? "tv" : "movie";
    sessionStorage.setItem(`mb_item_${target.subjectId}`, JSON.stringify(target));
    navigate(`/watch/${mediaType}/${target.subjectId}?source=moviebox`);
  };

  if (tmdbLoading && !isMovieBox && !isZone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  const isSearching = !isMovieBox && !isZone && !tmdbMbMatch && !!title;
  const hasServers = allServers.length > 0;

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

              {isMovieBox && seasonCount > 0 && (
                <p className="text-xs font-mono text-gray-500 mb-4" data-testid="text-seasons-mb">
                  {seasonCount} Season{seasonCount > 1 ? "s" : ""}
                </p>
              )}

              {isMovieBox && effectiveMbItem?.staffList && effectiveMbItem.staffList.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {effectiveMbItem.staffList.slice(0, 5).map((staff) => (
                    <span key={staff.staffId} className="text-xs font-mono text-gray-500">
                      {staff.staffName} ({staff.staffRole})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {type === "tv" && seasonCount > 0 && (
            <GlassPanel className="mb-6">
              <h3 className="text-sm font-display font-bold text-white mb-3 flex items-center gap-2" data-testid="text-season-selector">
                <Tv2 className="w-4 h-4 text-green-400" />
                Season & Episode
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">Season:</span>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: seasonCount }, (_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={selectedSeason === (i + 1) ? "default" : "ghost"}
                        onClick={() => { setSelectedSeason(i + 1); setSelectedEpisode(1); }}
                        className={`font-mono text-xs ${selectedSeason === (i + 1) ? "bg-green-600 text-white" : "text-gray-400"}`}
                        data-testid={`button-season-${i + 1}`}
                      >
                        S{i + 1}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">Episode:</span>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(ep => (
                      <Button
                        key={ep}
                        size="sm"
                        variant={selectedEpisode === ep ? "default" : "ghost"}
                        onClick={() => { setSelectedEpisode(ep); }}
                        className={`font-mono text-xs ${selectedEpisode === ep ? "bg-green-600 text-white" : "text-gray-400"}`}
                        data-testid={`button-episode-${ep}`}
                      >
                        E{ep}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </GlassPanel>
          )}

          <GlassPanel className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2" data-testid="text-stream-heading">
                <Play className="w-5 h-5 text-green-400" />
                Stream Now
                {allServers[selectedServer] && (
                  <Badge variant="outline" className="text-green-400 border-green-500/20 bg-green-500/10 font-mono ml-2">
                    {allServers[selectedServer].name}
                  </Badge>
                )}
              </h2>
              {allServers.length > 1 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {allServers.map((server, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={selectedServer === i ? "default" : "ghost"}
                      onClick={() => setSelectedServer(i)}
                      className={`font-mono text-xs ${selectedServer === i ? "bg-green-600 text-white" : "text-gray-400"}`}
                      data-testid={`button-server-${i}`}
                    >
                      {server.source === "zone" ? <Globe className="w-3 h-3 mr-1" /> : <Server className="w-3 h-3 mr-1" />}
                      {server.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {isSearching ? (
              <div className="w-full aspect-video rounded-t-xl border border-green-500/20 border-b-0 bg-black flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-green-500/30 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-mono text-gray-500" data-testid="text-loading-stream">
                    Finding streaming sources...
                  </p>
                  <p className="text-xs font-mono text-gray-600 mt-1">Connecting to stream servers</p>
                </div>
              </div>
            ) : !hasServers ? (
              <div className="w-full aspect-video rounded-t-xl border border-green-500/20 border-b-0 bg-black flex items-center justify-center">
                <div className="text-center">
                  <Search className="w-10 h-10 text-green-500/20 mx-auto mb-3" />
                  <p className="text-sm font-mono text-gray-500" data-testid="text-no-source">
                    No streaming source found for this title
                  </p>
                  <p className="text-xs font-mono text-gray-600 mt-1">Try searching for a different title</p>
                </div>
              </div>
            ) : (
              <div ref={playerContainerRef} className="relative w-full aspect-video rounded-t-xl overflow-hidden border border-green-500/20 border-b-0 bg-black">
                <iframe
                  ref={iframeRef}
                  key={activeServerUrl}
                  src={activeServerUrl}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  referrerPolicy="origin"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-top-navigation"
                  data-testid="iframe-player"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-b-xl border border-green-500/20 border-t-0 bg-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => navigateRelated("prev")}
                  className="text-gray-400"
                  disabled={mbRelated.length === 0}
                  data-testid="button-prev"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => navigateRelated("next")}
                  className="text-gray-400"
                  disabled={mbRelated.length === 0}
                  data-testid="button-next"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 text-center">
                <p className="text-xs font-mono text-gray-400 truncate" data-testid="text-now-playing">
                  {title || "Now Playing"}
                  {allServers[selectedServer] && ` - ${allServers[selectedServer].name}`}
                </p>
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

          {showDownloads && (
            <GlassPanel className="mb-8">
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2 mb-4" data-testid="text-download-heading">
                <Download className="w-5 h-5 text-green-400" />
                Downloads
              </h2>
              <DownloadSection title={title} effectiveSubjectId={effectiveSubjectId} />
            </GlassPanel>
          )}

          {mbRelated.length > 0 && (
            <GlassPanel className="mb-8">
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2 mb-4" data-testid="text-related-heading">
                <Film className="w-5 h-5 text-green-400" />
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

function DownloadSection({ title, effectiveSubjectId }: { title: string; effectiveSubjectId: string | null }) {
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
