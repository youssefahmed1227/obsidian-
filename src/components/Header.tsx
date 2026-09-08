import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  FileSpreadsheet,
  Bell,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  Trophy,
  ShieldAlert,
  Calendar,
  Users,
  Menu,
} from 'lucide-react';
import { SheetUser, CRMNotification, SyncState } from '../types';
import { SideNavbar } from './SideNavbar';

interface HeaderProps {
  user: SheetUser;
  onLogout: () => void;
  syncState: SyncState;
  onRefreshSync: () => void;
  notifications: CRMNotification[];
  onClearNotifications: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSheetModal: () => void;
  currentView: 'dashboard' | 'leaderboard' | 'audit' | 'calendar' | 'users';
  onSelectView: (view: 'dashboard' | 'leaderboard' | 'audit' | 'calendar' | 'users') => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  syncState,
  onRefreshSync,
  notifications,
  onClearNotifications,
  theme,
  onToggleTheme,
  onOpenSheetModal,
  currentView,
  onSelectView,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'EX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isAdmin = user.role === 'Admin';

  return (
    <>
      <header
        id="crm-header"
        className="sticky top-0 z-30 h-16 w-full border-b border-slate-800 bg-[#111827] text-white transition-colors shrink-0"
        role="banner"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Brand & Main Navigation */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* The ONLY Menu Button */}
            <button
              id="header-menu-btn"
              onClick={() => setIsSideNavOpen(true)}
              aria-label="Open Navigation Menu"
              title="Open Navigation Menu"
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#1f2937] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-[#6366f1] shrink-0"
            >
              <Menu className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-semibold">Menu</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Clean Brand Logo */}
            <button
              id="header-lightning-logo-btn"
              onClick={() => onSelectView('dashboard')}
              aria-label="Obsidian CRM Dashboard"
              title="Obsidian CRM Dashboard"
              className="flex items-center gap-2.5 p-1 -m-1 rounded-xl hover:bg-slate-800/80 transition-all focus:outline-none group cursor-pointer shrink-0"
            >
              <div className="w-8 h-8 bg-[#6366f1] rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:bg-indigo-600 transition-all group-hover:scale-105 shrink-0">
                <Zap className="w-5 h-5 text-white fill-current" />
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight uppercase text-slate-100 leading-none hidden sm:inline-block">
                Obsidian <span className="text-[#6366f1]">CRM</span>
              </h1>
            </button>

            {/* Desktop Navigation Tabs - Agent sees ONLY CRM Master and Calendar */}
            <nav
              className="hidden lg:flex items-center gap-1.5 bg-[#1f2937]/80 p-1.5 rounded-lg border border-slate-800"
              aria-label="Main Navigation"
            >
              <button
                id="nav-crm-master-btn"
                onClick={() => onSelectView('dashboard')}
                title="CRM Master"
                aria-label="CRM Master"
                className={`flex h-8 items-center gap-1.5 px-2.5 rounded-md text-xs font-semibold transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-[#6366f1] text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden md:inline">CRM Master</span>
              </button>

              <button
                id="nav-calendar-btn"
                onClick={() => onSelectView('calendar')}
                title="Calendar & Follow-Ups"
                aria-label="Calendar & Follow-Ups"
                className={`flex h-8 items-center gap-1.5 px-2.5 rounded-md text-xs font-semibold transition-all ${
                  currentView === 'calendar'
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Calendar className="h-4 w-4 text-orange-400" />
                <span className="hidden md:inline">Calendar</span>
              </button>

              {isAdmin && (
                <button
                  id="nav-leaderboard-btn"
                  onClick={() => onSelectView('leaderboard')}
                  title="Leaderboard"
                  aria-label="Leaderboard"
                  className={`flex h-8 items-center gap-1.5 px-2.5 rounded-md text-xs font-semibold transition-all ${
                    currentView === 'leaderboard'
                      ? 'bg-[#6366f1] text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="hidden md:inline">Leaderboard</span>
                </button>
              )}

              {isAdmin && (
                <button
                  id="nav-audit-btn"
                  onClick={() => onSelectView('audit')}
                  title="Audit Trail"
                  aria-label="Audit Trail"
                  className={`flex h-8 items-center gap-1.5 px-2.5 rounded-md text-xs font-semibold transition-all ${
                    currentView === 'audit'
                      ? 'bg-[#6366f1] text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <ShieldAlert className="h-4 w-4 text-indigo-400" />
                  <span className="hidden md:inline">Audit</span>
                </button>
              )}

              {isAdmin && (
                <button
                  id="nav-users-btn"
                  onClick={() => onSelectView('users')}
                  title="Team & User Management"
                  aria-label="Team & User Management"
                  className={`flex h-8 items-center gap-1.5 px-2.5 rounded-md text-xs font-semibold transition-all ${
                    currentView === 'users'
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="hidden md:inline">Users</span>
                </button>
              )}
            </nav>
          </div>

          {/* Action Controls & Sync Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Role Badge */}
            <div
              id="active-role-badge"
              className="hidden md:flex items-center gap-2 rounded-lg border border-slate-800 bg-[#1f2937] px-2.5 py-1.5 text-xs text-slate-300 select-none"
              title={`Authenticated Role: ${user.role} (Enforced)`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-400">Role:</span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-purple-900/40 text-purple-300 border border-purple-800/50'
                    : 'bg-sky-900/40 text-sky-300 border border-sky-800/50'
                }`}
              >
                {user.role}
              </span>
            </div>

            {/* Clean Refresh Button */}
            <button
              id="header-refresh-btn"
              onClick={onRefreshSync}
              disabled={syncState.isSyncing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#1f2937]/80 px-2.5 sm:px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Refresh CRM data"
              aria-label="Refresh CRM data"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${syncState.isSyncing ? 'animate-spin text-[#6366f1]' : 'text-slate-400'}`}
              />
              <span className="font-medium hidden sm:inline">{syncState.isSyncing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#1f2937] text-slate-300 hover:bg-slate-700 hover:text-white transition-all focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
              title={`Toggle ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-400" />
              )}
            </button>

            {/* Notifications Bell Dropdown */}
            <div className="relative block" ref={notifRef}>
              <button
                id="notif-btn"
                onClick={() => setShowNotifs(!showNotifs)}
                aria-expanded={showNotifs}
                aria-label="Notifications"
                className="relative p-1.5 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none rounded-lg hover:bg-slate-800/80"
              >
                <Bell className="w-5 h-5 text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#111827]"></span>
                )}
              </button>

              {showNotifs && (
                <div
                  id="notifications-dropdown"
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-[#1f2937] p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">Live Notifications</h3>
                      <span className="rounded-full bg-[#6366f1]/20 px-2 py-0.5 text-[10px] font-medium text-[#6366f1]">
                        Real-time
                      </span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearNotifications}
                        className="text-xs text-slate-400 hover:text-[#6366f1] transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="rounded-lg border border-slate-800/80 bg-[#111827]/70 p-3 hover:bg-[#111827] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-200">{notif.title}</p>
                            <div className="flex items-center gap-1 shrink-0">
                              {notif.dayName && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 font-bold text-[9px] border border-indigo-500/20">
                                  {notif.dayName}
                                </span>
                              )}
                              <span className="text-[10px] whitespace-nowrap text-slate-400 font-mono">
                                {notif.date || notif.timestamp}
                              </span>
                            </div>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-400">
                            {notif.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Menu Dropdown */}
            <div className="relative block border-l border-slate-800 pl-2 sm:pl-4" ref={userRef}>
              <button
                id="user-profile-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                className="flex items-center gap-2.5 focus:outline-none"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-slate-200">{user.userName}</p>
                  <div className="flex items-center justify-end gap-1">
                    <span
                      className={`text-[9px] font-mono px-1 rounded ${
                        isAdmin ? 'bg-purple-900/50 text-purple-300' : 'bg-sky-900/50 text-sky-300'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 hover:border-[#6366f1] transition-colors">
                  <span className="text-xs font-bold text-[#6366f1]">{getInitials(user.userName)}</span>
                </div>
              </button>

              {showUserMenu && (
                <div
                  id="user-menu-dropdown"
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-[#1f2937] p-2 shadow-2xl z-50 text-xs"
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-semibold text-white">{user.userName}</p>
                    <p className="text-[11px] truncate text-slate-400">{user.email}</p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded bg-[#6366f1]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#6366f1] border border-[#6366f1]/20">
                      <ShieldCheck className="h-3 w-3" />
                      Role: {user.role}
                    </span>
                  </div>

                  <div className="mt-1 space-y-1">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          onSelectView('users');
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Users className="h-3.5 w-3.5 text-purple-400" />
                        <span>Manage Team & Users</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onOpenSheetModal();
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Database & Google Sheets</span>
                    </button>
                    <button
                      onClick={onLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Side Navigation Drawer (Opened exclusively by the single Menu button) */}
      <SideNavbar
        isOpen={isSideNavOpen}
        onClose={() => setIsSideNavOpen(false)}
        user={user}
        onLogout={onLogout}
        syncState={syncState}
        onRefreshSync={onRefreshSync}
        notifications={notifications}
        onClearNotifications={onClearNotifications}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenSheetModal={onOpenSheetModal}
        currentView={currentView}
        onSelectView={onSelectView}
      />
    </>
  );
};
