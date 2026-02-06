import { User, Film, Clock, Star, TrendingUp } from "lucide-react";
import { GlassCard, GlassPanel } from "@/components/glass-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const watchHistory = [
  { title: "The Matrix", time: "2h ago", rating: 8.7 },
  { title: "Inception", time: "5h ago", rating: 8.8 },
  { title: "Interstellar", time: "1d ago", rating: 8.6 },
  { title: "The Dark Knight", time: "2d ago", rating: 9.0 },
];

const profileStats = [
  { label: "Movies Watched", value: "247", icon: Film },
  { label: "Hours Streamed", value: "892", icon: Clock },
  { label: "Avg Rating", value: "8.4", icon: Star },
  { label: "Watchlist", value: "56", icon: TrendingUp },
];

export default function Profile() {
  return (
    <div className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-green-400">Account</span>
        <h1 className="text-3xl font-display font-bold text-white mt-1" data-testid="text-profile-heading">Profile</h1>
      </div>

      <GlassPanel className="mb-6">
        <div className="flex items-center gap-5">
          <Avatar className="w-20 h-20 border-2 border-green-500/30">
            <AvatarFallback className="bg-green-500/10 text-green-400 text-2xl font-display font-bold">W</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-display font-bold text-white">WOLFLIX User</h2>
            <p className="text-sm font-mono text-gray-500">Premium Member since 2024</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-mono text-green-400">Online</span>
            </div>
          </div>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {profileStats.map((stat) => (
          <GlassCard key={stat.label} hover={false} className="p-4 text-center">
            <stat.icon className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-xl font-display font-bold text-white">{stat.value}</p>
            <p className="text-xs font-mono text-gray-500 mt-0.5">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard hover={false} className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-green-400" />
          <h2 className="font-display font-bold text-white">Watch History</h2>
        </div>
        <div className="space-y-3">
          {watchHistory.map((item) => (
            <div key={item.title} className="flex items-center justify-between py-2 border-b border-green-500/10 last:border-0">
              <div>
                <p className="text-sm font-display text-white">{item.title}</p>
                <p className="text-xs font-mono text-gray-500">{item.time}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-green-400 fill-green-400" />
                <span className="text-xs font-mono text-green-400">{item.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
