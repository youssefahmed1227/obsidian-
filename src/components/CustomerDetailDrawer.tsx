import React, { useEffect } from 'react';
import {
  X,
  Building,
  User,
  Mail,
  Phone,
  MessageSquare,
  DollarSign,
  FileText,
  Hash,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  History,
  ArrowRight,
  ShieldCheck,
  Image as ImageIcon,
  Bell,
  Briefcase,
  Tag,
} from 'lucide-react';
import { CustomerRecord, StageType } from '../types';
import { formatCurrency, formatExactCurrency, ALL_STAGES, STAGE_CONFIG } from '../utils/metrics';
import { formatDateWithDay, formatFullDateTime, getHistoryTimeBreakdown } from '../utils/dateTime';

interface CustomerDetailDrawerProps {
  customer: CustomerRecord | null;
  onClose: () => void;
  onEdit: (customer: CustomerRecord) => void;
  onDelete: (customer: CustomerRecord) => void;
  onQuickUpdateStage: (customer: CustomerRecord, newStage: StageType) => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  customer,
  onClose,
  onEdit,
  onDelete,
  onQuickUpdateStage,
}) => {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!customer) return null;

  const stageCfg = STAGE_CONFIG[customer.statusStage] || STAGE_CONFIG.Lead;

  // Derive created and updated breakdown
  const createdBreakdown = getHistoryTimeBreakdown(customer.createdAt);
  const updatedBreakdown = customer.updatedAt ? getHistoryTimeBreakdown(customer.updatedAt) : createdBreakdown;

  const historyItems = customer.history && customer.history.length > 0
    ? customer.history
    : [
        {
          id: 'initial-entry',
          timestamp: createdBreakdown.timestamp,
          dayName: customer.createdDayName || createdBreakdown.dayName,
          date: customer.createdDate || createdBreakdown.date,
          time: customer.createdTime || createdBreakdown.time,
          fullFormatted: `${customer.createdDayName || createdBreakdown.dayName}, ${customer.createdDate || createdBreakdown.date} • ${customer.createdTime || createdBreakdown.time}`,
          action: 'Account Created',
          user: customer.assignedTo || 'admin',
          details: customer.notes || 'Record created in local file store.',
          newValue: customer.statusStage,
        },
      ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-lg border-l border-slate-800 bg-[#111827] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Top Bar */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-mono font-semibold text-indigo-400 border border-indigo-500/20">
                  {customer.customerId}
                </span>
                <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>{customer.type || customer.customerType || 'Enterprise'}</span>
                </span>
                {customer.newLead && (
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/30">
                    NEW LEAD
                  </span>
                )}
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                  {customer.createdDayName || createdBreakdown.dayName}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Company & Deal Value Hero */}
            <div>
              <h2 id="drawer-title" className="text-xl font-extrabold text-white">
                {customer.companyName}
              </h2>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-[#1f2937]/70 p-4">
                <div>
                  <p className="text-[11px] uppercase font-semibold text-slate-400">
                    Deal Valuation
                  </p>
                  <p className="text-2xl font-mono font-bold text-white mt-0.5">
                    {formatExactCurrency(customer.dealValue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase font-semibold text-slate-400">Stage</p>
                  <span
                    className={`inline-block mt-1 rounded-full px-3 py-1 text-xs font-semibold border ${stageCfg.badgeBg}`}
                  >
                    {customer.statusStage}
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps & Day Name Header Info Card */}
            <div className="rounded-xl border border-slate-800/80 bg-[#1e293b]/50 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Created:</span>
                </span>
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 font-semibold text-[10px]">
                    {customer.createdDayName || createdBreakdown.dayName}
                  </span>
                  <span>{customer.createdDate || createdBreakdown.date}</span>
                  <span className="text-slate-400">• {customer.createdTime || createdBreakdown.time}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 pt-1.5 border-t border-slate-800/60">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Last Activity:</span>
                </span>
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-semibold text-[10px]">
                    {updatedBreakdown.dayName}
                  </span>
                  <span>{updatedBreakdown.date}</span>
                  <span className="text-slate-400">• {updatedBreakdown.time}</span>
                </span>
              </div>
            </div>

            {/* Quick Stage Progression */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Advance Deal Stage
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STAGES.map((st) => (
                  <button
                    key={st}
                    onClick={() => onQuickUpdateStage(customer, st)}
                    className={`rounded-lg p-2 text-xs font-medium border text-left transition-all ${
                      customer.statusStage === st
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-sm'
                        : 'border-slate-800 bg-[#1f2937]/40 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{st}</span>
                      {customer.statusStage === st && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="rounded-xl border border-slate-800 bg-[#1f2937]/50 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Contact & Account Details
              </p>

              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <User className="h-4 w-4 text-slate-500" />
                <span className="font-semibold text-white">{customer.contactPerson}</span>
                {customer.assignedTo && (
                  <span className="ml-auto text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                    Agent: <strong className="text-slate-200">{customer.assignedTo}</strong>
                  </span>
                )}
              </div>

              {customer.email && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-xs font-medium text-indigo-400 hover:underline"
                  >
                    Send Email
                  </a>
                </div>
              )}

              {/* Dual Phone Numbers: Regular Call & WhatsApp */}
              {customer.phone && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Phone className="h-4 w-4 text-blue-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Calls Phone</span>
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                  <a
                    href={`tel:${customer.phone}`}
                    className="rounded bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                  >
                    Call
                  </a>
                </div>
              )}

              {customer.whatsappPhone && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <MessageSquare className="h-4 w-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-semibold block">WhatsApp Phone</span>
                      <span className="text-emerald-300 font-medium">{customer.whatsappPhone}</span>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${customer.whatsappPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                  >
                    WhatsApp
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Customer Type:</span>
                </span>
                <span className="font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {customer.type || customer.customerType || 'Enterprise'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-400 pt-1 border-t border-slate-800">
                <Hash className="h-4 w-4 text-slate-500" />
                <span className="font-mono">Deal ID: {customer.dealId}</span>
              </div>
            </div>

            {/* Scheduled Calendar Reminder Details */}
            {customer.reminderDate && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                    <Bell className="h-4 w-4 text-amber-400" />
                    <span>Scheduled Calendar Reminder</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                    {customer.reminderDismissed ? 'Completed' : 'Active'}
                  </span>
                </div>
                <div className="text-xs text-slate-200 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-bold text-white">{customer.reminderDate}</span>
                  {customer.reminderTime && <span className="text-slate-400">at {customer.reminderTime}</span>}
                </div>
                {customer.reminderNote && (
                  <p className="text-xs text-amber-200/80 italic mt-1">"{customer.reminderNote}"</p>
                )}
              </div>
            )}

            {/* Scheduled Follow-Up Meeting (Further Information - Decided by Employee) */}
            {customer.followUpDate && (
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-300 font-semibold text-xs">
                    <Calendar className="h-4 w-4 text-sky-400" />
                    <span>Follow-Up Meeting & Further Information</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-500/30">
                    Scheduled
                  </span>
                </div>
                <div className="text-xs text-slate-200 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-sky-400" />
                  <span className="font-bold text-white">{customer.followUpDate}</span>
                  {customer.followUpTime && <span className="text-slate-300">at {customer.followUpTime}</span>}
                </div>
                {customer.followUpPurpose && (
                  <p className="text-xs text-sky-200/90 mt-1">
                    <span className="text-slate-400">Meeting Details: </span>
                    "{customer.followUpPurpose}"
                  </p>
                )}
              </div>
            )}

            {/* Client Case Information & Case History */}
            <div className="rounded-xl border border-slate-800 bg-[#1f2937]/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Client Case & Interaction
                  </span>
                </div>
                {customer.latestCase && (
                  <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 rounded">
                    {customer.latestCase}
                  </span>
                )}
              </div>

              {customer.caseHistory && customer.caseHistory.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Case History Log</p>
                  <div className="space-y-1.5">
                    {customer.caseHistory.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-800 bg-[#111827] p-2.5 text-xs text-slate-300 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">{item.title}</span>
                            {(item.callType || (item.caseType === 'call' ? 'Outbound Call' : undefined)) && (
                              <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold">
                                {item.callType || 'Outbound Call'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.dayName ? `${item.dayName}, ` : ''}{item.date} {item.time || ''}
                          </span>
                        </div>
                        {item.notes && <p className="text-[11px] text-slate-400">{item.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No case history logged yet.</p>
              )}
            </div>

            {/* Photo / Document Uploaded */}
            {customer.photoUrl && (
              <div className="rounded-xl border border-slate-800 bg-[#1f2937]/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    <ImageIcon className="h-4 w-4 text-indigo-400" />
                    <span>Uploaded Photo / Document</span>
                  </div>
                  {customer.photoName && (
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                      {customer.photoName}
                    </span>
                  )}
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={customer.photoUrl}
                    alt={customer.photoName || 'Client Photo'}
                    className="max-h-56 rounded object-contain"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Executive Notes & Requirements
              </p>
              <div className="rounded-xl border border-slate-800 bg-[#1f2937]/40 p-3.5 text-xs text-slate-300 leading-relaxed min-h-[60px]">
                {customer.notes || (
                  <span className="italic text-slate-500">No notes recorded for this deal.</span>
                )}
              </div>
            </div>

            {/* History Time & Activity Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-400" />
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    History & Activity Timeline
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {historyItems.length} {historyItems.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              <div className="space-y-2.5 border-l-2 border-slate-800 ml-2 pl-4 py-1">
                {historyItems.map((hist, idx) => (
                  <div key={hist.id || idx} className="relative group">
                    <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-[#111827] bg-indigo-500" />
                    <div className="rounded-lg border border-slate-800/90 bg-[#1e293b]/40 p-3 hover:border-slate-700 transition-colors">
                      {/* Day Name and Date Header */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">
                            {hist.dayName}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {hist.date}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {hist.time}
                        </span>
                      </div>

                      {/* Action Title, Call Type and User */}
                      <div className="flex items-center justify-between text-xs text-slate-200 font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{hist.action}</span>
                          {hist.callType && (
                            <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold">
                              {hist.callType}
                            </span>
                          )}
                        </div>
                        {hist.user && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            by {hist.user}
                          </span>
                        )}
                      </div>

                      {/* Stage changes if available */}
                      {hist.previousValue && hist.newValue && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-indigo-300">
                          <span className="text-slate-400">{hist.previousValue}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-semibold">{hist.newValue}</span>
                        </div>
                      )}

                      {/* Detail Text */}
                      {hist.details && (
                        <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                          {hist.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action Drawer Footer */}
          <div className="p-4 border-t border-slate-800 bg-[#111827] flex items-center justify-between gap-3">
            <button
              onClick={() => onDelete(customer)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-900/30 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => onEdit(customer)}
                className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Record</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
