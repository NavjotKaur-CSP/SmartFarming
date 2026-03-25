import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { 
  Leaf, 
  LayoutDashboard, 
  Sprout, 
  CloudSun, 
  TrendingUp, 
  Bell, 
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  BarChart3,
  FlaskConical
} from 'lucide-react';
import { getAlerts } from '../services/api';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await getAlerts();
        const alerts = Array.isArray(response.data) ? response.data : [];
        const unread = alerts.filter(a => !a.is_read).length;
        setUnreadAlerts(unread);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };
    fetchAlerts();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Crops', href: '/dashboard/crops', icon: Sprout },
    { name: 'Crop Health', href: '/dashboard/health', icon: FlaskConical },
    { name: 'Yield Prediction', href: '/dashboard/yield', icon: BarChart3 },
    { name: 'Weather & Soil', href: '/dashboard/weather', icon: CloudSun },
    { name: 'Market Prices', href: '/dashboard/market', icon: TrendingUp },
    { name: 'Alerts', href: '/dashboard/alerts', icon: Bell, badge: unreadAlerts },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="dashboard-layout">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#FDFBF7] border-r border-[#E7E5E4] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-[#E7E5E4]">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2F5233] rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-[#1C1917]">SmartFarm</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-[#78716C] hover:text-[#1C1917]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-[#2F5233] text-white shadow-md'
                    : 'text-[#44403C] hover:bg-[#2F5233]/10 hover:text-[#2F5233]'
                }`}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <Badge className={`${isActive(item.href) ? 'bg-white text-[#2F5233]' : 'bg-[#D97736] text-white'}`}>
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-[#E7E5E4]">
            <Link 
              to="/dashboard/profile"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#2F5233]/10 transition-colors"
              data-testid="nav-profile"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src="https://images.pexels.com/photos/2519332/pexels-photo-2519332.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" />
                <AvatarFallback className="bg-[#2F5233] text-white">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1C1917] truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-[#78716C] truncate">{user?.farm_name || 'My Farm'}</p>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="glass-header sticky top-0 z-30 border-b border-[#E7E5E4]">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-[#44403C] hover:text-[#1C1917]"
                data-testid="mobile-menu-button"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-[#1C1917]">
                  {navigation.find(n => isActive(n.href))?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-[#78716C] hidden sm:block">
                  {user?.farm_name ? `${user.farm_name} • ${user.location || 'Location not set'}` : 'Welcome back!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/dashboard/alerts" className="relative p-2 text-[#44403C] hover:text-[#1C1917] hover:bg-[#E7E5E4] rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {unreadAlerts > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#D97736] rounded-full" />
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-[#E7E5E4]" data-testid="user-menu-trigger">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="https://images.pexels.com/photos/2519332/pexels-photo-2519332.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" />
                      <AvatarFallback className="bg-[#2F5233] text-white text-sm">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-[#78716C]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-[#1C1917]">{user?.name}</p>
                    <p className="text-xs text-[#78716C]">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
