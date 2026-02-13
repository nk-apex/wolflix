import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Search as SearchIcon } from "lucide-react";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import Movies from "@/pages/movies";
import TVShows from "@/pages/tv-shows";
import Series from "@/pages/series";
import Animation from "@/pages/animation";
import Novel from "@/pages/novel";
import MostViewed from "@/pages/most-viewed";
import Application from "@/pages/application";
import SearchPage from "@/pages/search";
import SettingsPage from "@/pages/settings";
import Profile from "@/pages/profile";
import Watch from "@/pages/watch";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/movies" component={Movies} />
      <Route path="/tv-shows" component={TVShows} />
      <Route path="/series" component={Series} />
      <Route path="/animation" component={Animation} />
      <Route path="/novel" component={Novel} />
      <Route path="/most-viewed" component={MostViewed} />
      <Route path="/application" component={Application} />
      <Route path="/search" component={SearchPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/profile" component={Profile} />
      <Route path="/watch/:type/:id" component={Watch} />
      <Route component={NotFound} />
    </Switch>
  );
}

function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-md">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-500/40" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, shows..."
          className="w-full rounded-xl border border-green-500/15 bg-black/40 py-1.5 pl-9 pr-3 font-mono text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/40 transition-all"
          data-testid="input-global-search"
        />
      </div>
    </form>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full bg-black">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <header className="flex items-center gap-3 p-2 border-b border-green-500/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
                <SidebarTrigger data-testid="button-sidebar-toggle" className="text-gray-400 hover:text-green-400 transition-colors" />
                <GlobalSearchBar />
                <span className="text-xs font-mono text-gray-600 hidden sm:block flex-shrink-0">WOLFLIX v1.0</span>
              </header>
              <main className="flex-1 overflow-y-auto bg-black">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
