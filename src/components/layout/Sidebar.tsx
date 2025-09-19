import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Ship, 
  Users, 
  FileText, 
  Search, 
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Prodotti', href: '/products', icon: Ship },
  { name: 'Clienti', href: '/customers', icon: Users },
  { name: 'RFQ', href: '/rfq', icon: FileText },
  { name: 'Trova Girante', href: '/search', icon: Search },
  { name: 'Equivalenze', href: '/equivalences', icon: ArrowLeftRight },
  { name: 'Import/Export', href: '/import-export', icon: Settings },
];

export const Sidebar = () => {
  const { collapsed, toggleCollapsed } = useSidebar();
  const location = useLocation();

  return (
    <div className={cn(
      "bg-card border-r border-border flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Ship className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-semibold text-sm">BU Nautica</h1>
              <p className="text-xs text-muted-foreground">Gestione Prodotti</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    collapsed && "justify-center"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                  {!collapsed && item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!collapsed ? (
          <div className="text-xs text-muted-foreground">
            <p>v1.0.0 - Fase 1</p>
            <p>Core Prodotti</p>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center">
            <p>v1.0</p>
          </div>
        )}
      </div>
    </div>
  );
};