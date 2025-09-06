
import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useUserRole } from '@/hooks/useUserRole';
import { BrandLogo } from '@/components/common/BrandLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LayoutDashboard, Receipt, BarChart3, Target, User, Settings, FolderOpen, Calendar, Crown, LogOut, Shield } from 'lucide-react';

interface SidebarProps {
  onProfileClick?: () => void;
  onConfigClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onProfileClick, onConfigClick }) => {
  const { user, logout } = useAppContext();
  const { t } = usePreferences();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Verificar se estamos na página de administração
  const isAdminPage = location.pathname === '/admin';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    if (isAdmin && isAdminPage && onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  // Se for admin na página de admin, mostrar apenas menu administrativo
  if (isAdmin && isAdminPage) {
    const adminMenuItems = [
      {
        icon: Settings,
        label: 'Configurações',
        action: () => {
          if (onConfigClick) {
            onConfigClick();
          }
        }
      }
    ];

    return (
      <div className="hidden md:flex h-screen w-64 lg:w-64 xl:w-72 flex-col bg-background border-r">
        {/* Logo/Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {adminMenuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={item.action}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          ))}
          
          {/* Botão Perfil que executa função ao invés de navegar */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleProfileClick}
          >
            <User className="h-5 w-5" />
            Perfil
          </Button>
        </nav>

        {/* Bottom Navigation - Theme Toggle e Logout */}
        <div className="p-4 border-t space-y-2">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Tema</span>
            <ThemeToggle variant="ghost" size="sm" />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  // Menu padrão para usuários normais
  const defaultMenuItems = [
    {
      icon: LayoutDashboard,
      label: t('nav.dashboard'),
      href: '/dashboard'
    },
    {
      icon: Receipt,
      label: t('nav.transactions'),
      href: '/transactions'
    },
    {
      icon: FolderOpen,
      label: t('nav.categories'),
      href: '/categories'
    },
    {
      icon: Target,
      label: t('nav.goals'),
      href: '/goals'
    },
    {
      icon: Calendar,
      label: t('schedule.title'),
      href: '/schedule'
    },
    {
      icon: BarChart3,
      label: t('nav.reports'),
      href: '/reports'
    },
    {
      icon: Crown,
      label: t('nav.plans'),
      href: '/plans'
    },
  ];

  // Adicionar item admin apenas se o usuário for admin e não estiver na página admin
  let menuItems = [...defaultMenuItems];
  if (isAdmin && !isAdminPage) {
    const adminMenuItem = {
      icon: Shield,
      label: 'Admin',
      href: '/admin'
    };
    menuItems.push(adminMenuItem);
  }

  const bottomMenuItems = [
    {
      icon: User,
      label: t('nav.profile'),
      href: '/profile'
    },
    {
      icon: Settings,
      label: t('nav.settings'),
      href: '/settings'
    },
  ];

  if (!user) return null;

  return (
    <div className="hidden md:flex h-screen w-64 lg:w-64 xl:w-72 flex-col bg-background border-r overflow-hidden">
      {/* Logo/Header */}
      <div className="p-6 border-b flex-shrink-0">
        <BrandLogo size="md" showCompanyName={true} />
      </div>

      {/* Navigation - Scrollable content */}
      <div className="flex-1 flex flex-col min-h-0">
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Navigation - Always visible */}
        <div className="p-4 border-t space-y-2 flex-shrink-0 bg-background">
          {bottomMenuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Tema</span>
            <ThemeToggle variant="ghost" size="sm" />
          </div>
          
          {/* Logout Button */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {t('settings.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
