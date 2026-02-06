import { useState } from "react";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { Settings as SettingsIcon, Monitor, Volume2, Globe, Shield, Bell } from "lucide-react";

export default function SettingsPage() {
  const [quality, setQuality] = useState("1080p");
  const [autoplay, setAutoplay] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("English");

  return (
    <div className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Preferences</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-settings-heading">Settings</h1>
      </div>

      <div className="space-y-5">
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Monitor className="w-5 h-5 text-green-400" />
            <h2 className="font-display font-bold text-white">Playback</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-white">Video Quality</p>
                <p className="text-xs font-mono text-gray-500">Default streaming quality</p>
              </div>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="rounded-lg border border-green-500/20 bg-black/50 px-3 py-1.5 font-mono text-sm text-white focus:outline-none focus:border-green-500/50"
                data-testid="select-quality"
              >
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4K">4K</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-white">Autoplay</p>
                <p className="text-xs font-mono text-gray-500">Play next episode automatically</p>
              </div>
              <button
                onClick={() => setAutoplay(!autoplay)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoplay ? "bg-green-500" : "bg-gray-700"}`}
                data-testid="button-toggle-autoplay"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoplay ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Globe className="w-5 h-5 text-green-400" />
            <h2 className="font-display font-bold text-white">Language & Region</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-white">Interface Language</p>
              <p className="text-xs font-mono text-gray-500">Display language for the app</p>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-green-500/20 bg-black/50 px-3 py-1.5 font-mono text-sm text-white focus:outline-none focus:border-green-500/50"
              data-testid="select-language"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Bell className="w-5 h-5 text-green-400" />
            <h2 className="font-display font-bold text-white">Notifications</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-white">Push Notifications</p>
              <p className="text-xs font-mono text-gray-500">Get notified about new releases</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? "bg-green-500" : "bg-gray-700"}`}
              data-testid="button-toggle-notifications"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="font-display font-bold text-white">Privacy</h2>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-mono text-gray-400">
              Your data is protected with end-to-end encryption. WOLFLIX does not sell or share personal data with third parties.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-green-400">
              <Shield className="w-3.5 h-3.5" />
              <span>AES-256 Encryption Active</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
