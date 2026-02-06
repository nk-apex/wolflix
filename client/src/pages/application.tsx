import { Smartphone, Globe, Monitor, Settings, Download, ExternalLink, CheckCircle2 } from "lucide-react";
import { GlassCard, GlassPanel } from "@/components/glass-card";

const platforms = [
  {
    title: "Mobile App",
    desc: "Stream on iOS and Android devices",
    icon: Smartphone,
    features: ["Offline downloads", "Push notifications", "Picture-in-picture"],
    status: "Coming Soon",
  },
  {
    title: "Browser Extension",
    desc: "Quick access from your browser toolbar",
    icon: Globe,
    features: ["One-click streaming", "Bookmarks sync", "Dark mode"],
    status: "Available",
  },
  {
    title: "Desktop App",
    desc: "Native app for Windows, Mac, and Linux",
    icon: Monitor,
    features: ["4K streaming", "Hardware acceleration", "System tray"],
    status: "Coming Soon",
  },
  {
    title: "Settings",
    desc: "Configure your streaming preferences",
    icon: Settings,
    features: ["Quality settings", "Subtitle preferences", "Playback speed"],
    status: "Available",
  },
];

export default function Application() {
  return (
    <div className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Downloads</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-application-heading">Application</h1>
        <p className="text-gray-500 font-mono text-sm mt-1">Get WOLFLIX on all your devices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {platforms.map((platform) => (
          <GlassCard key={platform.title} className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-500/10 p-3">
                  <platform.icon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">{platform.title}</h3>
                  <p className="text-xs font-mono text-gray-500">{platform.desc}</p>
                </div>
              </div>
              <span className={`text-xs font-mono px-2 py-1 rounded-md ${
                platform.status === "Available"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
              }`}>
                {platform.status}
              </span>
            </div>
            <ul className="space-y-2 mb-5">
              {platform.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm font-mono text-gray-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500/60" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-mono text-sm font-bold transition-all ${
                platform.status === "Available"
                  ? "bg-green-500 text-black hover:bg-green-400"
                  : "bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed"
              }`}
              disabled={platform.status !== "Available"}
              data-testid={`button-download-${platform.title.toLowerCase().replace(/\s/g, "-")}`}
            >
              {platform.status === "Available" ? (
                <>
                  <Download className="w-4 h-4" /> Download
                </>
              ) : (
                "Coming Soon"
              )}
            </button>
          </GlassCard>
        ))}
      </div>

      <GlassPanel>
        <div className="flex items-center gap-3 mb-4">
          <ExternalLink className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-display font-bold text-white">System Requirements</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-xs font-mono text-green-400 uppercase tracking-wider mb-2">Minimum</h3>
            <ul className="space-y-1.5 text-sm font-mono text-gray-400">
              <li>2 GB RAM</li>
              <li>1 GHz Processor</li>
              <li>500 MB Storage</li>
              <li>5 Mbps Internet</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-mono text-green-400 uppercase tracking-wider mb-2">Recommended</h3>
            <ul className="space-y-1.5 text-sm font-mono text-gray-400">
              <li>4 GB RAM</li>
              <li>2 GHz Processor</li>
              <li>1 GB Storage</li>
              <li>25 Mbps Internet</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-mono text-green-400 uppercase tracking-wider mb-2">Supported OS</h3>
            <ul className="space-y-1.5 text-sm font-mono text-gray-400">
              <li>Windows 10+</li>
              <li>macOS 12+</li>
              <li>Ubuntu 20.04+</li>
              <li>Android 10+ / iOS 15+</li>
            </ul>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
