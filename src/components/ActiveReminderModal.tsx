import React from 'react';
import {
  Bell,
  X,
  Phone,
  MessageSquare,
  Building,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { CustomerRecord } from '../types';

interface ActiveReminderModalProps {
  reminders: CustomerRecord[];
  isOpen: boolean;
  onDismiss: (customerId: string) => void;
  onDismissAll: () => void;
  onLogCallCase: (customer: CustomerRecord, caseTitle: string) => void;
  onReschedule: (customer: CustomerRecord) => void;
}

export const ActiveReminderModal: React.FC<ActiveReminderModalProps> = ({
  reminders,
  isOpen,
  onDismiss,
  onDismissAll,
  onLogCallCase,
  onReschedule,
}) => {
  if (!isOpen || reminders.length === 0) return null;

  const currentReminder = reminders[0];

  const todayFormatted = `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
  const defaultCaseTitle = `called ${todayFormatted}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/50 bg-[#111827] p-6 shadow-2xl shadow-amber-500/10 animate-in zoom-in-95 duration-200">
        {/* Glow Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-xl bg-amber-400/20 opacity-75" />
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="reminder-modal-title" className="text-lg font-bold text-white">
                  Client Follow-Up Due
                </h2>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                  Reminder Alert
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {reminders.length > 1
                  ? `Showing 1 of ${reminders.length} pending client follow-ups due today`
                  : 'Scheduled contact reminder has arrived and logged in audit trail'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onDismiss(currentReminder.customerId)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Client Card */}
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#1f2937]/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Building className="h-4 w-4 text-indigo-400" />
                <span>{currentReminder.companyName}</span>
              </div>
              <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-500/30">
                {currentReminder.statusStage}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-slate-200">{currentReminder.contactPerson}</span>
              {currentReminder.assignedTo && (
                <span className="ml-auto text-slate-400 text-[11px]">
                  Agent: <strong className="text-slate-200">{currentReminder.assignedTo}</strong>
                </span>
              )}
            </div>

            {/* Reminder Date & Note */}
            <div className="rounded-lg bg-[#111827] border border-amber-900/40 p-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                <span>Scheduled Date: {currentReminder.reminderDate}</span>
                {currentReminder.reminderTime && (
                  <span className="text-amber-200/80">• {currentReminder.reminderTime}</span>
                )}
              </div>
              <p className="text-slate-300 italic text-[11px]">
                "{currentReminder.reminderNote || 'Follow-up call and account status check.'}"
              </p>
            </div>
          </div>

          {/* Direct Communication Channels (Dual Phone Numbers: Call & WhatsApp) */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Immediate Contact Channels:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Call Phone Number */}
              <a
                href={`tel:${currentReminder.phone}`}
                className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-emerald-300 hover:bg-emerald-900/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-emerald-400/80">Call Phone</p>
                    <p className="text-xs font-mono font-bold text-white">{currentReminder.phone || 'N/A'}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-400 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* WhatsApp Phone Number */}
              <a
                href={`https://wa.me/${(currentReminder.whatsappPhone || currentReminder.phone).replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-emerald-300 hover:bg-emerald-900/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-emerald-400/80">WhatsApp Chat</p>
                    <p className="text-xs font-mono font-bold text-white">
                      {currentReminder.whatsappPhone || currentReminder.phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-400 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Quick Case Resolution: Log "called 7/9/2025" and record in case history & audit trail */}
          <div className="rounded-xl border border-slate-800 bg-[#161f30] p-3 space-y-2">
            <span className="text-[11px] font-semibold text-slate-300">
              One-Click Action & Case History Logging:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onLogCallCase(currentReminder, 'called 7/9/2025')}
                className="flex-1 min-w-[130px] rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-3 text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4 text-white" />
                <span>Log: "called 7/9/2025"</span>
              </button>

              <button
                type="button"
                onClick={() => onLogCallCase(currentReminder, defaultCaseTitle)}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 px-3 text-xs font-medium transition-colors"
              >
                Log: "{defaultCaseTitle}"
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
          <button
            type="button"
            onClick={() => onReschedule(currentReminder)}
            className="text-amber-400 hover:text-amber-300 font-semibold underline"
          >
            Reschedule Reminder
          </button>

          <div className="flex items-center gap-2">
            {reminders.length > 1 && (
              <button
                type="button"
                onClick={onDismissAll}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-300 hover:bg-slate-700"
              >
                Dismiss All ({reminders.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => onDismiss(currentReminder.customerId)}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-slate-200 font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
