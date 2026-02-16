import { useState, useRef, useEffect } from "react";
import { Search, Music, Play, Pause, Download, Loader2, Video, Headphones, Volume2, VolumeX } from "lucide-react";
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
  thumbnailMq?: string;
  youtubeUrl?: string;
  streamUrl?: string;
  error?: string;
}

interface TrackItem {
  title: string;
  videoId: string;
  thumbnail: string;
  streamUrl: string;
  downloadUrl: string;
  quality: string;
  format: string;
  youtubeUrl: string;
}

export default function MusicPage() {
  const [searchUrl, setSearchUrl] = useState("");
  const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [currentTrack, setCurrentTrack] = useState<TrackItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUrl.trim()) return;

    setLoading(true);
    setError("");

    try {
      const endpoint = format === "mp3" ? "/api/wolflix/music/mp3" : "/api/wolflix/music/mp4";
      const res = await fetch(`${endpoint}?url=${encodeURIComponent(searchUrl.trim())}`);
      const data: MusicResult = await res.json();

      if (!data.success || !data.streamUrl) {
        setError(data.error || "Could not process this URL. Make sure it's a valid YouTube link.");
        setLoading(false);
        return;
      }

      const newTrack: TrackItem = {
        title: data.title || "Unknown Track",
        videoId: data.videoId || "",
        thumbnail: data.thumbnail || "",
        streamUrl: data.streamUrl || "",
        downloadUrl: data.downloadUrl || "",
        quality: data.quality || "",
        format: data.format || format,
        youtubeUrl: data.youtubeUrl || searchUrl.trim(),
      };

      setTracks(prev => {
        const exists = prev.find(t => t.videoId === newTrack.videoId && t.format === newTrack.format);
        if (exists) return prev;
        return [newTrack, ...prev];
      });

      playTrack(newTrack);
      setSearchUrl("");
    } catch {
      setError("Failed to process URL. Please try again.");
    }

    setLoading(false);
  };

  const playTrack = (track: TrackItem) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);
  };

  const togglePlay = () => {
    const el = currentTrack?.format === "mp4" ? videoRef.current : audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const el = currentTrack?.format === "mp4" ? videoRef.current : audioRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    const el = currentTrack?.format === "mp4" ? videoRef.current : audioRef.current;
    if (!el) return;
    setProgress(el.currentTime);
    setDuration(el.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = currentTrack?.format === "mp4" ? videoRef.current : audioRef.current;
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
    if (!currentTrack) return;
    const el = currentTrack.format === "mp4" ? videoRef.current : audioRef.current;
    if (el) {
      el.load();
      el.play().catch(() => {});
    }
  }, [currentTrack?.streamUrl]);

  return (
    <div className="min-h-screen px-4 lg:px-6 py-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Listen</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-music-heading">Music</h1>
        <p className="text-sm font-mono text-gray-500 mt-1">Paste a YouTube URL to play or download music</p>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500/40" />
            <input
              type="text"
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className="w-full rounded-xl border border-green-500/20 bg-black/40 py-2.5 pl-10 pr-4 font-mono text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/40 transition-colors"
              data-testid="input-music-url"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-xl border border-green-500/20 overflow-hidden">
              <button
                type="button"
                onClick={() => setFormat("mp3")}
                className={`px-4 py-2 font-mono text-xs flex items-center gap-1.5 transition-colors ${format === "mp3" ? "bg-green-500 text-black font-bold" : "bg-black/40 text-gray-400"}`}
                data-testid="button-format-mp3"
              >
                <Headphones className="w-3 h-3" /> MP3
              </button>
              <button
                type="button"
                onClick={() => setFormat("mp4")}
                className={`px-4 py-2 font-mono text-xs flex items-center gap-1.5 transition-colors ${format === "mp4" ? "bg-green-500 text-black font-bold" : "bg-black/40 text-gray-400"}`}
                data-testid="button-format-mp4"
              >
                <Video className="w-3 h-3" /> MP4
              </button>
            </div>
            <Button
              type="submit"
              disabled={loading || !searchUrl.trim()}
              className="bg-green-500 text-black font-mono font-bold text-sm px-6"
              data-testid="button-music-search"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {loading ? "Loading..." : "Play"}
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm font-mono text-red-400" data-testid="text-music-error">{error}</p>
        </div>
      )}

      {currentTrack && (
        <div className="mb-6">
          {currentTrack.format === "mp4" ? (
            <div className="rounded-xl overflow-hidden bg-black border border-green-500/10 mb-3">
              <video
                ref={videoRef}
                src={currentTrack.streamUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full aspect-video"
                controls
                data-testid="video-player"
              />
            </div>
          ) : (
            <audio
              ref={audioRef}
              src={currentTrack.streamUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              data-testid="audio-player"
            />
          )}

          <div className="rounded-xl border border-green-500/10 bg-green-500/5 p-4">
            <div className="flex items-start gap-4">
              {currentTrack.thumbnail && (
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  data-testid="img-current-thumbnail"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-display font-bold text-white truncate" data-testid="text-current-title">
                  {currentTrack.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-green-400 border-green-500/20 font-mono text-xs">
                    {currentTrack.format.toUpperCase()} {currentTrack.quality}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {currentTrack.format === "mp3" && (
                  <>
                    <Button size="icon" variant="ghost" onClick={togglePlay} className="text-green-400" data-testid="button-play-pause">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={toggleMute} className="text-gray-400" data-testid="button-mute">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                  </>
                )}
                {currentTrack.downloadUrl && (
                  <a href={currentTrack.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="ghost" className="text-green-400" data-testid="button-download-current">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {currentTrack.format === "mp3" && duration > 0 && (
              <div className="mt-3 flex items-center gap-3">
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
        </div>
      )}

      {tracks.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-bold text-white mb-3">
            <Music className="w-4 h-4 inline mr-2 text-green-400" />
            Your Tracks ({tracks.length})
          </h2>
          <div className="space-y-2">
            {tracks.map((track, idx) => {
              const isActive = currentTrack?.videoId === track.videoId && currentTrack?.format === track.format;
              return (
                <div
                  key={track.videoId + track.format + idx}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors cursor-pointer ${isActive ? "border-green-500/30 bg-green-500/10" : "border-green-500/10 bg-black/20"}`}
                  onClick={() => playTrack(track)}
                  data-testid={`track-item-${track.videoId}`}
                >
                  {track.thumbnail && (
                    <img src={track.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-mono truncate ${isActive ? "text-green-400" : "text-white"}`}>
                      {track.title}
                    </p>
                    <p className="text-xs font-mono text-gray-600">{track.format.toUpperCase()} {track.quality}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isActive && isPlaying && (
                      <div className="flex items-center gap-0.5 mr-2">
                        <div className="w-0.5 h-3 bg-green-400 rounded-full animate-pulse" />
                        <div className="w-0.5 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                        <div className="w-0.5 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                      </div>
                    )}
                    {track.downloadUrl && (
                      <a href={track.downloadUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="text-gray-400" data-testid={`button-download-${track.videoId}`}>
                          <Download className="w-3 h-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tracks.length === 0 && !loading && (
        <div className="text-center py-16">
          <Music className="w-16 h-16 text-green-500/20 mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-gray-500 mb-2">No tracks yet</h3>
          <p className="text-sm font-mono text-gray-600 max-w-md mx-auto">
            Paste a YouTube URL above and choose MP3 for audio or MP4 for video playback
          </p>
        </div>
      )}
    </div>
  );
}
