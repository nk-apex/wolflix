import { useState, useRef, useEffect, useMemo } from "react";
import { useRoute, useSearch, useLocation } from "wouter";
import { ArrowLeft, Play, Pause, Download, Loader2, Video, Headphones, Volume2, VolumeX, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MusicResult {
  success: boolean;
  title?: string;
  videoId?: string;
  format?: string;
  quality?: string;
  downloadUrl?: string;
  thumbnail?: string;
  streamUrl?: string;
  error?: string;
}

export default function MusicPlay() {
  const [, params] = useRoute("/music/play/:id");
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const videoId = params?.id || "";

  const { titleFromUrl, channelFromUrl, durationFromUrl } = useMemo(() => {
    const raw = searchString || "";
    const sp = new URLSearchParams(raw.startsWith("?") ? raw : "?" + raw);
    const fromWindow = new URLSearchParams(window.location.search);
    return {
      titleFromUrl: sp.get("title") || fromWindow.get("title") || "",
      channelFromUrl: sp.get("channel") || fromWindow.get("channel") || "",
      durationFromUrl: sp.get("duration") || fromWindow.get("duration") || "",
    };
  }, [searchString]);

  const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [streamData, setStreamData] = useState<MusicResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const thumbnailMax = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const loadStream = async (fmt: "mp3" | "mp4") => {
    setLoading(true);
    setError("");
    setStreamData(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);

    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const endpoint = fmt === "mp3" ? "/api/wolflix/music/mp3" : "/api/wolflix/music/mp4";

    try {
      const res = await fetch(`${endpoint}?url=${encodeURIComponent(ytUrl)}`);
      const data: MusicResult = await res.json();

      if (!data.success || !data.streamUrl) {
        setError(data.error || "Could not load stream. Please try again.");
        setLoading(false);
        return;
      }

      setStreamData(data);
    } catch {
      setError("Failed to load stream. Please try again.");
    }

    setLoading(false);
  };

  const handleFormatChange = (fmt: "mp3" | "mp4") => {
    setFormat(fmt);
    loadStream(fmt);
  };

  const togglePlay = () => {
    const el = format === "mp4" ? videoRef.current : audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const el = format === "mp4" ? videoRef.current : audioRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    const el = format === "mp4" ? videoRef.current : audioRef.current;
    if (!el) return;
    setProgress(el.currentTime);
    setDuration(el.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = format === "mp4" ? videoRef.current : audioRef.current;
    if (!el) return;
    const time = Number(e.target.value);
    el.currentTime = time;
    setProgress(time);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!streamData?.streamUrl) return;
    const el = format === "mp4" ? videoRef.current : audioRef.current;
    if (el) {
      el.load();
      el.play().catch(() => {});
    }
  }, [streamData?.streamUrl]);

  return (
    <div className="min-h-screen bg-black">
      <div className="relative w-full" style={{ height: streamData && format === "mp4" ? "60vh" : "auto" }}>
        {format === "mp4" && streamData?.streamUrl ? (
          <div className="w-full h-full bg-black">
            <video
              ref={videoRef}
              src={streamData.streamUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
              data-testid="video-player"
            />
          </div>
        ) : format === "mp3" && streamData?.streamUrl ? (
          <div className="relative w-full" style={{ height: "40vh" }}>
            <img
              src={thumbnailMax}
              alt={titleFromUrl}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = thumbnail; }}
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-2 border-green-500/40 mx-auto mb-4 overflow-hidden">
                  <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
                {isPlaying && (
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" />
                    <div className="w-1 h-6 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                    <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                    <div className="w-1 h-5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0.45s" }} />
                    <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0.6s" }} />
                  </div>
                )}
              </div>
            </div>
            <audio
              ref={audioRef}
              src={streamData.streamUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              data-testid="audio-player"
            />
          </div>
        ) : (
          <div className="relative w-full" style={{ height: "40vh" }}>
            <img
              src={thumbnailMax}
              alt={titleFromUrl}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = thumbnail; }}
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 flex items-center justify-center">
              {loading ? (
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-green-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-mono text-gray-400">Loading {format.toUpperCase()} stream...</p>
                </div>
              ) : (
                <div className="text-center">
                  <Music className="w-16 h-16 text-green-500/30 mx-auto mb-4" />
                  <p className="text-sm font-mono text-gray-400">Choose a format below to start playing</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/music")}
              className="text-white/80 flex-shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-sm lg:text-base font-display font-bold text-white truncate" data-testid="text-music-play-title">
              {titleFromUrl || "Music Player"}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-3xl mx-auto">
        <div className="flex items-start gap-4 mb-6">
          <img
            src={thumbnail}
            alt={titleFromUrl}
            className="w-20 h-20 lg:w-28 lg:h-28 rounded-xl object-cover flex-shrink-0"
            data-testid="img-music-thumbnail"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg lg:text-xl font-display font-bold text-white mb-1" data-testid="text-track-title">
              {titleFromUrl || "Unknown Track"}
            </h2>
            {channelFromUrl && (
              <p className="text-sm font-mono text-gray-400 mb-2">{channelFromUrl}</p>
            )}
            {durationFromUrl && (
              <Badge variant="outline" className="text-green-400 border-green-500/20 font-mono text-xs">
                {durationFromUrl}
              </Badge>
            )}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Choose Format</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleFormatChange("mp3")}
              className={`flex-1 rounded-xl border px-4 py-4 flex flex-col items-center gap-2 transition-colors ${format === "mp3" && streamData ? "border-green-500/40 bg-green-500/10" : "border-green-500/20 bg-black/40"}`}
              data-testid="button-format-mp3"
            >
              <Headphones className={`w-6 h-6 ${format === "mp3" && streamData ? "text-green-400" : "text-gray-400"}`} />
              <span className={`font-mono text-sm font-bold ${format === "mp3" && streamData ? "text-green-400" : "text-white"}`}>MP3</span>
              <span className="font-mono text-xs text-gray-500">Audio Only</span>
            </button>
            <button
              onClick={() => handleFormatChange("mp4")}
              className={`flex-1 rounded-xl border px-4 py-4 flex flex-col items-center gap-2 transition-colors ${format === "mp4" && streamData ? "border-green-500/40 bg-green-500/10" : "border-green-500/20 bg-black/40"}`}
              data-testid="button-format-mp4"
            >
              <Video className={`w-6 h-6 ${format === "mp4" && streamData ? "text-green-400" : "text-gray-400"}`} />
              <span className={`font-mono text-sm font-bold ${format === "mp4" && streamData ? "text-green-400" : "text-white"}`}>MP4</span>
              <span className="font-mono text-xs text-gray-500">Video</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm font-mono text-red-400" data-testid="text-music-error">{error}</p>
          </div>
        )}

        {streamData?.streamUrl && (
          <div className="rounded-xl border border-green-500/10 bg-green-500/5 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-400 border-green-500/20 font-mono text-xs">
                  {streamData.format?.toUpperCase() || format.toUpperCase()} {streamData.quality}
                </Badge>
                <span className="text-xs font-mono text-gray-500">Now Playing</span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={togglePlay} className="text-green-400" data-testid="button-play-pause">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={toggleMute} className="text-gray-400" data-testid="button-mute">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                {streamData.downloadUrl && (
                  <a href={streamData.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="ghost" className="text-green-400" data-testid="button-download">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {duration > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500 w-10 text-right">{formatTime(progress)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1 h-1 rounded-full appearance-none bg-green-500/20 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-400"
                  data-testid="input-seek"
                />
                <span className="text-xs font-mono text-gray-500 w-10">{formatTime(duration)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
