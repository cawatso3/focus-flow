import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Crosshair, FolderOpen, Inbox, Settings, PauseCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NextActionBar } from '@/components/NextActionBar';
import { ParkSessionDialog } from '@/components/ParkSessionDialog';
import { useState, useEffect } from 'react';

const navItems = [
  { title: 'Focus', url: '/app/focus', icon: Crosshair },
  { title: 'Projects', url: '/app/projects', icon: FolderOpen },
  { title: 'Signal Inbox', url: '/app/inbox', icon: Inbox },
  { title: 'Settings', url: '/app/settings', icon: Settings },
];

function AppSidebarContent() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const [parkOpen, setParkOpen] = useState(false);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem className="mb-4 mt-2">
                  <div className={`px-3 ${collapsed ? 'text-center' : ''}`}>
                    <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                      {collapsed ? 'NC' : 'NicheCommand'}
                    </span>
                  </div>
                </SidebarMenuItem>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/app/focus'}
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setParkOpen(true)}
          >
            <PauseCircle className="h-4 w-4" />
            {!collapsed && <span>Park Session</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>
      <ParkSessionDialog open={parkOpen} onOpenChange={setParkOpen} />
    </>
  );
}

export default function AppLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const initials = user?.profile?.display_name?.slice(0, 2).toUpperCase() || '??';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebarContent />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 flex items-center border-b border-border/50 px-4 gap-4 bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              <NextActionBar />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                  <Settings className="mr-2 h-4 w-4" />Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { logout(); navigate('/'); }}>
                  <LogOut className="mr-2 h-4 w-4" />Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
