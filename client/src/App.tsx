import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import Movies from "@/pages/movies";
import TVShows from "@/pages/tv-shows";
import Series from "@/pages/series";
import Animation from "@/pages/animation";
import Novel from "@/pages/novel";
import MostViewed from "@/pages/most-viewed";
import Application from "@/pages/application";
import Search from "@/pages/search";
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
      <Route path="/search" component={Search} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/profile" component={Profile} />
      <Route path="/watch/:type/:id" component={Watch} />
      <Route component={NotFound} />
    </Switch>
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
              <header className="flex items-center gap-2 p-2 border-b border-green-500/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
                <SidebarTrigger data-testid="button-sidebar-toggle" className="text-gray-400 hover:text-green-400 transition-colors" />
                <span className="text-xs font-mono text-gray-600">WOLFLIX v1.0</span>
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
