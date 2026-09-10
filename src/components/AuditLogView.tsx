import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  User,
  Trash2,
  CheckCircle,
  TrendingUp,
  LogIn,
  RefreshCw,
  Tag,
  ChevronDown,
  HardDrive,
  FileText,
} from 'lucide-react';
import { AuditLogEntry, AuditActionType, SheetUser } from '../types';
import { getHistoryTimeBreakdown } from '../utils/dateTime';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  currentUser: SheetUser;
  onClearLogs?: () => void;
  onBackToDashboard: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  currentUser,
  onClearLogs,
  onBackToDashboard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const actionFilters: { label: string; value: string; count?: number }[] = [
    { label: 'All Events', value: 'ALL' },
    { label: 'Deals Won', value: 'DEAL_CLOSED_WON' },
    { label: 'Stage Updates', value: 'STAGE_UPDATED' },
    { label: 'Clients Created', value: 'CLIENT_CREATED' },
    { label: 'Edits & Deletes', value: 'MODIFICATIONS' },
    { label: 'File Operations', value: 'FILES' },
    { label: 'Logins & Auth', value: 'USER_LOGIN' },
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      // Action filter
      if (selectedAction !== 'ALL') {
        if (selectedAction === 'MODIFICATIONS') {
          if (entry.action !== 'CLIENT_EDITED' && entry.action !== 'CLIENT_DELETED') {
            return false;
          }
        } else if (selectedAction === 'FILES') {
          if (
            entry.action !== 'FILE_STORAGE_INIT' &&
            entry.action !== 'FILE_EXPORT' &&
            entry.action !== 'FILE_IMPORT' &&
            entry.action !== 'SHEET_SYNC'
          ) {
            return false;
          }
        } else if (entry.action !== selectedAction) {
          return false;
        }
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      return (
        entry.details.toLowerCase().includes(term) ||
        entry.userName.toLowerCase().includes(term) ||
        entry.userEmail.toLowerCase().includes(term) ||
        (entry.dayName && entry.dayName.toLowerCase().includes(term)) ||
        (entry.formattedDate && entry.formattedDate.toLowerCase().includes(term)) ||
        (entry.companyName && entry.companyName.toLowerCase().includes(term)) ||
        (entry.entityId && entry.entityId.toLowerCase().includes(term)) ||
        entry.action.toLowerCase().includes(term)
      );
    });
  }, [logs, selectedAction, searchTerm]);

  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Day Name',
      'Date',
      'Time',
      'Timestamp (ISO)',
      'Action',
      'Details',
      'User Name',
      'User Email',
      'User Role',
      'Entity ID',
      'Company Name',
    ];

    const rows = filteredLogs.map((log) => {
      const breakdown = getHistoryTimeBreakdown(log.timestamp);
      return [
        `"${log.id}"`,
        `"${log.dayName || breakdown.dayName}"`,
        `"${log.formattedDate || breakdown.date}"`,
        `"${log.formattedTime || breakdown.time}"`,
        `"${log.timestamp}"`,
        `"${log.action}"`,
        `"${log.details.replace(/"/g, '""')}"`,
        `"${log.userName}"`,
        `"${log.userEmail}"`,
        `"${log.userRole}"`,
        `"${log.entityId || ''}"`,
        `"${log.companyName || ''}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `crm_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'DEAL_CLOSED_WON':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
            Closed Won
          </span>
        );
      case 'DEAL_CLOSED_LOST':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-400 border border-rose-500/20">
            Closed Lost
          </span>
        );
      case 'CLIENT_CREATED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-500/20">
            Created Record
          </span>
        );
      case 'STAGE_UPDATED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
            Stage Progression
          </span>
        );
      case 'CLIENT_EDITED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-400 border border-sky-500/20">
            Record Edited
          </span>
        );
      case 'CLIENT_DELETED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-950/60 px-2 py-0.5 text-[11px] font-semibold text-red-400 border border-red-800/40">
            Deleted Record
          </span>
        );
      case 'USER_LOGIN':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700">
            User Auth
          </span>
        );
      case 'FILE_STORAGE_INIT':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-950/60 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-800/40">
            File Storage
          </span>
        );
      case 'FILE_EXPORT':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-800/40">
            File Export
          </span>
        );
      case 'FILE_IMPORT':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-950/60 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-800/40">
            File Import
          </span>
        );
      case 'SHEET_SYNC':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700">
            Data Sync
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400 border border-slate-700">
            {action}
          </span>
        );
    }
  };

  return (
    <div id="audit-log-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-[#6366f1]" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Executive System Audit Trail
            </h2>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              File-Based Data Store
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Operational audit logs recording all deals created, stage progressions, deletions, and file backups with day names and history timestamps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#1f2937] px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Audit Trail</span>
          </button>

          <button
            onClick={onBackToDashboard}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Back to Directory
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#1f2937] p-3 shadow-lg">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail by day name, date, agent, action, or company..."
            className="w-full rounded-lg border border-slate-700 bg-[#111827] py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {actionFilters.map((flt) => {
            const isSelected = selectedAction === flt.value;
            return (
              <button
                key={flt.value}
                onClick={() => setSelectedAction(flt.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#6366f1] text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-[#111827] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {flt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-800 bg-[#1f2937] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#111827]">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Recorded Action History ({filteredLogs.length} events)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <HardDrive className="h-3.5 w-3.5 text-indigo-400" />
            <span>Persisted directly in Local File Store</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No audit records match the selected filter criteria.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const breakdown = getHistoryTimeBreakdown(log.timestamp);
              const day = log.dayName || breakdown.dayName;
              const dateStr = log.formattedDate || breakdown.date;
              const timeStr = log.formattedTime || breakdown.time;

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Action, Day Name, Date & Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold text-[10px] uppercase tracking-wider border border-indigo-500/20 whitespace-nowrap">
                        {day}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        {dateStr}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {timeStr}
                      </span>
                      <span className="text-slate-600">•</span>
                      {getActionBadge(log.action)}
                      {log.entityId && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300 border border-slate-700">
                          {log.entityId}
                        </span>
                      )}
                      {log.companyName && (
                        <span className="font-bold text-white">{log.companyName}</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{log.details}</p>

                    {(log.previousValue !== undefined || log.newValue !== undefined) && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-1">
                        {log.previousValue !== undefined && (
                          <span>
                            Prior: <span className="text-slate-300">{log.previousValue}</span>
                          </span>
                        )}
                        {log.previousValue !== undefined && log.newValue !== undefined && (
                          <span>→</span>
                        )}
                        {log.newValue !== undefined && (
                          <span>
                            Result: <span className="text-emerald-400 font-semibold">{log.newValue}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: User Signature info */}
                  <div className="flex sm:flex-col sm:items-end justify-between items-center text-[11px] shrink-0 border-t border-slate-800/60 pt-2 sm:border-t-0 sm:pt-0">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="font-semibold text-slate-200">{log.userName}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">{log.userEmail}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
