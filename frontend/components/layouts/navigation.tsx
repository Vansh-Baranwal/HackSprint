'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { NotificationDropdown } from '@/components/ui/notification-dropdown';
import { UserRole } from '@/types';
import type { Notification } from '@/types';
import {
  Home,
  User,
  FileText,
  CheckCircle,
  Award,
  Users,
  AlertCircle,
  FileSearch,
  BarChart3,
  LogOut,
  Menu,
  X,
  Activity,
} from 'lucide-react';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="h-5 w-5" />,
    roles: [UserRole.ATHLETE, UserRole.FEDERATION, UserRole.ADMIN, UserRole.INVESTIGATOR, UserRole.COACH],
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: <User className="h-5 w-5" />,
    roles: [UserRole.ATHLETE],
  },
  {
    label: 'Diagnostics',
    href: '/diagnostics',
    icon: <Activity className="h-5 w-5" />,
    roles: [UserRole.ATHLETE],
  },
  {
    label: 'Documents',
    href: '/documents',
    icon: <FileText className="h-5 w-5" />,
    roles: [UserRole.ATHLETE],
  },
  {
    label: 'Verifications',
    href: '/verifications',
    icon: <CheckCircle className="h-5 w-5" />,
    roles: [UserRole.ATHLETE],
  },
  {
    label: 'Credentials',
    href: '/credentials',
    icon: <Award className="h-5 w-5" />,
    roles: [UserRole.ATHLETE],
  },
  {
    label: 'Verification Requests',
    href: '/verification-requests',
    icon: <CheckCircle className="h-5 w-5" />,
    roles: [UserRole.FEDERATION],
  },
  {
    label: 'Members',
    href: '/members',
    icon: <Users className="h-5 w-5" />,
    roles: [UserRole.FEDERATION],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: <AlertCircle className="h-5 w-5" />,
    roles: [UserRole.ATHLETE, UserRole.ADMIN, UserRole.INVESTIGATOR],
  },
  {
    label: 'Audit Logs',
    href: '/audit-logs',
    icon: <FileSearch className="h-5 w-5" />,
    roles: [UserRole.ADMIN, UserRole.INVESTIGATOR],
  },
  {
    label: 'Metrics',
    href: '/metrics',
    icon: <BarChart3 className="h-5 w-5" />,
    roles: [UserRole.ADMIN],
  },
];

export interface NavigationProps {
  userRoles: UserRole[];
  userName?: string;
  userEmail?: string;
  notificationCount?: number;
  isNotificationOpen?: boolean;
  onNotificationOpenChange?: (open: boolean) => void;
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  userRoles,
  userName,
  userEmail,
  notificationCount = 0,
  isNotificationOpen = false,
  onNotificationOpenChange,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onLogout,
}) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);

  const filteredItems = navigationItems.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-64 flex-col border-r border-white/10 bg-neutral-900/40 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Link href="/" className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-red-500 font-heading font-extrabold text-2xl uppercase tracking-widest drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            Khel Setu
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Main navigation">
          {filteredItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300',
                isActive(item.href)
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              )}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          {onNotificationOpenChange && (
            <div className="mb-2 flex justify-end">
              <NotificationDropdown
                notifications={notifications}
                unreadCount={notificationCount}
                isOpen={isNotificationOpen}
                onOpenChange={onNotificationOpenChange}
                onMarkAsRead={onMarkAsRead || (() => {})}
                onMarkAllAsRead={onMarkAllAsRead || (() => {})}
              />
            </div>
          )}
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white text-left"
            aria-expanded={isProfileDropdownOpen}
            aria-haspopup="true"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-600 text-white shadow-lg flex-shrink-0" aria-hidden="true">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{userName || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            </div>
          </button>

          {isProfileDropdownOpen && (
            <div className="mt-2 space-y-1" role="menu">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                role="menuitem"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-neutral-900/40 backdrop-blur-xl px-4 lg:hidden">
        <Link href="/" className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-red-500 font-heading font-extrabold text-xl uppercase tracking-widest">
          Khel Setu
        </Link>

        <div className="flex items-center gap-4">
          {onNotificationOpenChange && (
            <NotificationDropdown
              notifications={notifications}
              unreadCount={notificationCount}
              isOpen={isNotificationOpen}
              onOpenChange={onNotificationOpenChange}
              onMarkAsRead={onMarkAsRead || (() => {})}
              onMarkAllAsRead={onMarkAllAsRead || (() => {})}
            />
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-gray-300 hover:bg-white/5"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/95 backdrop-blur-xl lg:hidden"
          role="dialog"
          aria-label="Mobile navigation menu"
        >
          <nav className="space-y-1 p-4" aria-label="Mobile navigation">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300',
                  isActive(item.href)
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                )}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            <button
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </nav>
        </div>
      )}
    </>
  );
};
