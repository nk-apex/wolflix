import { Link, useLocation } from "wouter";
import { 
  Film, Tv, Theater, Palette, BookOpen, 
  Flame, Smartphone, Search, Settings, User, Clapperboard
} from "lucide-react";
import wolflixLogo from "@assets/wolflix-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainMenu = [
  { title: "Welcome", url: "/", icon: Clapperboard },
  { title: "Movies", url: "/movies", icon: Film },
  { title: "TV Shows", url: "/tv-shows", icon: Tv },
  { title: "Series", url: "/series", icon: Theater },
  { title: "Animation", url: "/animation", icon: Palette },
  { title: "Novel", url: "/novel", icon: BookOpen },
  { title: "Most Viewed", url: "/most-viewed", icon: Flame },
  { title: "Application", url: "/application", icon: Smartphone },
];

const secondaryMenu = [
  { title: "Search", url: "/search", icon: Search },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-green-500/10">
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
            <img src={wolflixLogo} alt="WOLFLIX" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-xl font-display font-bold text-white tracking-wide">
              WOLF<span className="text-green-400">LIX</span>
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-mono text-gray-600 uppercase tracking-widest px-4">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenu.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className={isActive ? "text-green-400" : ""} />
                        <span className="font-mono text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-green-500/10" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-mono text-gray-600 uppercase tracking-widest px-4">
            General
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryMenu.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className={isActive ? "text-green-400" : ""} />
                        <span className="font-mono text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-green-500/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-mono text-gray-500">System Online</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
