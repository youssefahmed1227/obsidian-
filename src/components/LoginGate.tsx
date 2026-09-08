import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Shield,
  UserCheck,
} from 'lucide-react';
import { SheetUser } from '../types';
import { authenticateUser, fetchUsersFromSheet } from '../services/googleSheets';
import { SPREADSHEET_ID } from '../services/storage';

interface LoginGateProps {
  onLoginSuccess: (user: SheetUser) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('1234');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sheetUsers, setSheetUsers] = useState<SheetUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchUsersFromSheet()
      .then((users) => {
        if (isMounted) {
          setSheetUsers(users);
          setIsLoadingUsers(false);
          // If inputs were cleared, default to first admin user
          setIdentifier((prev) => (prev ? prev : (users.find((u) => u.role === 'Admin')?.userName || 'admin')));
          setPassword((prev) => (prev ? prev : (users.find((u) => u.role === 'Admin')?.password || '1234')));
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingUsers(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please enter both your user_name/email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await authenticateUser(identifier, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setErrorMsg(
          'Authentication failed. Please verify credentials in your connected Google Sheet tab users!A:D.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error while contacting Google Sheet.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillAccount = (userNameOrEmail: string, pass: string) => {
    setIdentifier(userNameOrEmail);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0f19] px-4 py-12 selection:bg-[#6366f1] selection:text-white">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#6366f1] text-white shadow-xl shadow-indigo-600/30">
            <Zap className="h-6 w-6 text-white fill-current" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight uppercase text-slate-100">
            Obsidian <span className="text-[#6366f1]">CRM</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Executive Portal & Client Management Workspace
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#111827]/90 p-7 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <p className="text-xs leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Quick Auto-Fill Role Bar */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                <Zap className="h-3.5 w-3.5 text-amber-400 fill-current" />
                <span>Auto-Fill:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="autofill-admin-btn"
                  onClick={() => fillAccount('admin', '1234')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 border ${
                    identifier === 'admin'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-purple-950/40 text-purple-300 border-purple-800/50 hover:bg-purple-900/60'
                  }`}
                  title="Auto-fill Administrator (admin / 1234)"
                >
                  <Shield className="h-3 w-3 text-purple-300" />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  id="autofill-agent-btn"
                  onClick={() => fillAccount('sarah.j', '1234')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 border ${
                    identifier === 'sarah.j'
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-sky-950/40 text-sky-300 border-sky-800/50 hover:bg-sky-900/60'
                  }`}
                  title="Auto-fill Sales Agent (sarah.j / 1234)"
                >
                  <Users className="h-3 w-3 text-sky-300" />
                  <span>Sales Agent</span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="auth-identifier" className="block font-semibold text-slate-300">
                User Name or Email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="auth-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin or admin@gmail.com"
                  className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2.5 pl-9 pr-3 text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block font-semibold text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (e.g. 1234)"
                  className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2.5 pl-9 pr-3 text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#6366f1] py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying credentials with Google Sheets...</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Authenticate Session</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Real Google Sheet Accounts Box */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Google Sheet Accounts ({sheetUsers.length})</span>
              </span>
              <span className="text-[10px] text-slate-500">Click to fill</span>
            </div>

            <div className="space-y-2">
              {sheetUsers.map((user) => {
                const isAdmin = user.role === 'Admin';
                return (
                  <button
                    key={user.userName + user.email}
                    type="button"
                    onClick={() => fillAccount(user.userName || user.email, user.password)}
                    className="w-full text-left rounded-xl border border-slate-800 bg-[#1f2937]/50 p-2.5 hover:border-indigo-500/50 hover:bg-slate-800 transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{user.userName}</span>
                        <span
                          className={`rounded text-[9px] px-1.5 py-0.5 font-mono ${
                            isAdmin
                              ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                              : 'bg-sky-900/50 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                        {user.password ? 'Password set' : 'Fill'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-indigo-400/80" />
          <span>Secure Corporate Workspace • Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
};
