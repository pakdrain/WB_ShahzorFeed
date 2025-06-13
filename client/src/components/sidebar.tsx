import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Settings, Video, Menu, X, Scale, FileText, LogOut, User, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Purchase Form', href: '/purchase-form', icon: FileText },
  { name: 'Camera Settings', href: '/settings', icon: Settings },
  { name: 'Weighbridge Settings', href: '/weighbridge-settings', icon: Scale },
];

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-monitoring-slate border-monitoring-gray text-white hover:bg-monitoring-gray"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-monitoring-slate border-r border-monitoring-gray transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-monitoring-gray">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-monitoring-blue" />
              <h1 className="text-xl font-bold text-white">CCTV Monitor</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left h-12 px-4",
                      isActive
                        ? "bg-monitoring-blue text-white hover:bg-monitoring-blue/90"
                        : "text-gray-300 hover:bg-monitoring-gray hover:text-white"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-monitoring-gray space-y-3">
            {/* User Info */}
            <div className="flex items-center space-x-3 px-2">
              <div className="flex items-center justify-center w-8 h-8 bg-monitoring-blue rounded-full">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.userName || 'User'}
                </p>
                <p className="text-xs text-gray-400">
                  Authenticated
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-left h-10 px-2 text-gray-300 hover:bg-red-600 hover:text-white"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>

            <div className="text-xs text-gray-400 text-center pt-2">
              Live Camera Monitoring System
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}