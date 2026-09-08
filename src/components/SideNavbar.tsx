import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  LayoutDashboard,
  Calendar,
  Trophy,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Bell,
  Sun,
  Moon,
  FileSpreadsheet,
  LogOut,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { SheetUser, CRMNotification, SyncState } from '../types';

interface SideNavbarProps {
  isOpen: boolean;
  onClose: () => void;
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

export const SideNavbar: React.FC<SideNavbarProps> = ({
  isOpen,
  onClose,
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
  const [showNotificationsList, setShowNotificationsList] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isAdmin = user.role === 'Admin';
  const isAgent = user.role === 'Sales Agent';
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getInitials = (name?: string) => {
    if (!name) return 'EX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleNavClick = (view: 'dashboard' | 'leaderboard' | 'audit' | 'calendar' | 'users') => {
    onSelectView(view);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="side-navbar-drawer"
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="Side Navigation Menu"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side drawer panel */}
      <aside
        id="side-navbar-panel"
        className="relative z-10 flex h-full w-full max-w-xs sm:max-w-sm flex-col bg-[#111827] text-white shadow-2xl border-r border-slate-800 transition-transform duration-300 ease-out animate-in slide-in-from-left"
      >
        {/* Drawer Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5 bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#6366f1] rounded flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Obsidian <span className="text-[#6366f1]">CRM</span>
              </span>
              <p className="text-[10px] text-slate-400 font-mono">Main Navigation & Controls</p>
            </div>
          </div>

          <button
            id="side-nav-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#1f2937] text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Section 1: User Profile & Role Info */}
          <div
            id="side-nav-user-card"
            className="rounded-xl border border-slate-800 bg-[#1f2937] p-3.5 space-y-2.5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-[#6366f1]/40 text-[#6366f1] font-bold text-sm shrink-0">
                {getInitials(user.userName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user.userName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span>Assigned Role:</span>
              </span>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border ${
                  isAdmin
                    ? 'bg-purple-900/40 text-purple-300 border-purple-800/60'
                    : 'bg-sky-900/40 text-sky-300 border-sky-800/60'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>

          {/* Section 2: CRM Navigation Views (Filtered strictly by Role) */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Views {isAgent ? '(Agent Access)' : '(Executive Admin)'}
            </p>

            {/* CRM Master (Available to both Admin and Agent) */}
            <button
              id="side-nav-crm-master"
              onClick={() => handleNavClick('dashboard')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                currentView === 'dashboard'
                  ? 'bg-[#6366f1] text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#1f2937]/70 text-slate-300 hover:bg-[#1f2937] hover:text-white border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-4 w-4" />
                <span>CRM Master</span>
              </div>
              {currentView === 'dashboard' && <CheckCircle2 className="h-4 w-4 text-white" />}
            </button>

            {/* Calendar & Follow-Ups (Available to both Admin and Agent) */}
            <button
              id="side-nav-calendar"
              onClick={() => handleNavClick('calendar')}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                currentView === 'calendar'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-600/30'
                  : 'bg-[#1f2937]/70 text-slate-300 hover:bg-[#1f2937] hover:text-white border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-orange-400" />
                <span>Calendar & Follow-Ups</span>
              </div>
              {currentView === 'calendar' && <CheckCircle2 className="h-4 w-4 text-white" />}
            </button>

            {/* Leaderboard (Admin ONLY - Hidden from Agent) */}
            {isAdmin && (
              <button
                id="side-nav-leaderboard"
                onClick={() => handleNavClick('leaderboard')}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  currentView === 'leaderboard'
                    ? 'bg-[#6366f1] text-white shadow-md shadow-indigo-600/30'
                    : 'bg-[#1f2937]/70 text-slate-300 hover:bg-[#1f2937] hover:text-white border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span>Team Leaderboard</span>
                </div>
                {currentView === 'leaderboard' && <CheckCircle2 className="h-4 w-4 text-white" />}
              </button>
            )}

            {/* Audit Trail (Admin ONLY - Hidden from Agent) */}
            {isAdmin && (
              <button
                id="side-nav-audit"
                onClick={() => handleNavClick('audit')}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  currentView === 'audit'
                    ? 'bg-[#6366f1] text-white shadow-md shadow-indigo-600/30'
                    : 'bg-[#1f2937]/70 text-slate-300 hover:bg-[#1f2937] hover:text-white border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-4 w-4 text-indigo-400" />
                  <span>Audit Trail</span>
                </div>
                {currentView === 'audit' && <CheckCircle2 className="h-4 w-4 text-white" />}
              </button>
            )}

            {/* Team & User Management (Admin ONLY - Hidden from Agent) */}
            {isAdmin && (
              <button
                id="side-nav-users"
                onClick={() => handleNavClick('users')}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  currentView === 'users'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-[#1f2937]/70 text-slate-300 hover:bg-[#1f2937] hover:text-white border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span>Team & User Management</span>
                </div>
                {currentView === 'users' && <CheckCircle2 className="h-4 w-4 text-white" />}
              </button>
            )}
          </div>

          {/* Section 3: Action Controls (Refresh, Notifications, Theme, Storage) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Controls & Actions
            </p>

            {/* Refresh CRM Data Button */}
            <button
              id="side-nav-refresh-btn"
              onClick={() => {
                onRefreshSync();
              }}
              disabled={syncState.isSyncing}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-[#1f2937] px-3.5 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw
                  className={`h-4 w-4 ${syncState.isSyncing ? 'animate-spin text-[#6366f1]' : 'text-slate-400'}`}
                />
                <span>{syncState.isSyncing ? 'Syncing CRM Data...' : 'Refresh CRM Data'}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {syncState.isSyncing ? 'Live...' : 'Instant'}
              </span>
            </button>

            {/* Notifications Dropdown / Accordion */}
            <div className="rounded-xl border border-slate-800 bg-[#1f2937] overflow-hidden">
              <button
                id="side-nav-notifications-btn"
                onClick={() => setShowNotificationsList(!showNotificationsList)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Bell className="h-4 w-4 text-slate-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <span>Notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                      {unreadCount} new
                    </span>
                  )}
                  {showNotificationsList ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              {showNotificationsList && (
                <div className="border-t border-slate-800/80 p-3 space-y-2 bg-[#111827]/70">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Recent Activity
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearNotifications}
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-[11px] text-slate-500 py-2 text-center">No notifications yet</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-lg border border-slate-800 bg-[#1f2937]/80 p-2 text-[11px]"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-slate-200 truncate">{n.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono shrink-0">
                              {n.time || n.timestamp}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{n.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              id="side-nav-theme-btn"
              onClick={onToggleTheme}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-[#1f2937] px-3.5 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700/80 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-400" />
                )}
                <span>Theme Mode</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {theme === 'dark' ? 'Obsidian Dark' : 'Executive Light'}
              </span>
            </button>

            {/* Google Sheets / Storage Config Modal Button */}
            <button
              id="side-nav-storage-btn"
              onClick={() => {
                onOpenSheetModal();
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-[#1f2937] px-3.5 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700/80 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                <span>Database & Google Sheets</span>
              </div>
            </button>
          </div>
        </div>

        {/* Drawer Footer: Sign Out Button */}
        <div className="border-t border-slate-800 p-4 bg-[#111827]">
          <button
            id="side-nav-logout-btn"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
