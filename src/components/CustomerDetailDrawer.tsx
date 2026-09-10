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
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-lg border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Top Bar */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  {customer.customerId}
                </span>
                <span className="rounded-lg bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 text-xs font-bold text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1.5">
                  <Tag className="h-3 w-3" />
                  <span>{customer.type || customer.customerType || 'Enterprise'}</span>
                </span>
                {customer.newLead && (
                  <span className="rounded-lg bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 text-xs font-extrabold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                    NEW LEAD
                  </span>
                )}
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {customer.createdDayName || createdBreakdown.dayName}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Company & Deal Value Hero */}
            <div>
              <h2 id="drawer-title" className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {customer.companyName}
              </h2>
              <div className="mt-3.5 flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1f2937]/70 p-4.5 shadow-2xs">
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                    Deal Valuation
                  </p>
                  <p className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-0.5">
                    {formatExactCurrency(customer.dealValue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Stage</p>
                  <span
                    className={`inline-block mt-1 rounded-full px-3.5 py-1 text-xs font-extrabold uppercase border shadow-2xs ${stageCfg.badgeBg}`}
                  >
                    {customer.statusStage}
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps & Day Name Header Info Card */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#1e293b]/50 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2 font-medium">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <span>Created:</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-500/20">
                    {customer.createdDayName || createdBreakdown.dayName}
                  </span>
                  <span>{customer.createdDate || createdBreakdown.date}</span>
                  <span className="text-slate-400 dark:text-slate-500">• {customer.createdTime || createdBreakdown.time}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/70 dark:border-slate-800/60">
                <span className="flex items-center gap-2 font-medium">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  <span>Last Activity:</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-500/20">
                    {updatedBreakdown.dayName}
                  </span>
                  <span>{updatedBreakdown.date}</span>
                  <span className="text-slate-400 dark:text-slate-500">• {updatedBreakdown.time}</span>
                </span>
              </div>
            </div>

            {/* Quick Stage Progression */}
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5 uppercase tracking-wider">
                Advance Deal Stage
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STAGES.map((st) => (
                  <button
                    key={st}
                    onClick={() => onQuickUpdateStage(customer, st)}
                    className={`rounded-xl p-2.5 text-xs font-semibold border text-left transition-all ${
                      customer.statusStage === st
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f2937]/40 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{st}</span>
                      {customer.statusStage === st && (
                        <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1f2937]/50 p-4.5 space-y-3.5">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Contact & Account Details
              </p>

              <div className="flex items-center gap-2.5 text-xs">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-bold text-slate-900 dark:text-white text-sm">{customer.contactPerson}</span>
                {customer.assignedTo && (
                  <span className="ml-auto text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-300/60 dark:border-slate-700/60">
                    Agent: <strong className="text-slate-900 dark:text-slate-200">{customer.assignedTo}</strong>
                  </span>
                )}
              </div>

              {customer.email && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Send Email
                  </a>
                </div>
              )}

              {/* Dual Phone Numbers: Regular Call & WhatsApp */}
              {customer.phone && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Calls Phone</span>
                      <span className="font-semibold">{customer.phone}</span>
                    </div>
                  </div>
                  <a
                    href={`tel:${customer.phone}`}
                    className="rounded-lg bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                  >
                    Call
                  </a>
                </div>
              )}

              {customer.whatsappPhone && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">WhatsApp Phone</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{customer.whatsappPhone}</span>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${customer.whatsappPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Customer Type:</span>
                </span>
                <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                  {customer.type || customer.customerType || 'Enterprise'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                <Hash className="h-4 w-4 text-slate-400" />
                <span className="font-mono font-medium">Deal ID: {customer.dealId}</span>
              </div>
            </div>

            {/* Poultry Natural Remedies & Farm Profile (🐔 النوع، 🔢 عدد الطيور، 📅 العمر، 🌿 الأدوية العشبية) */}
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-slate-50/70 dark:via-[#1e293b]/70 to-slate-100/50 dark:to-[#0f172a]/90 p-4.5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌿</span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      بيانات المزرعة والقطيع والأدوية العشبية
                    </h3>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400/90 font-medium">
                      Natural Poultry Remedies & Farm Profile
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(customer)}
                  className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>تعديل</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. 🐔 النوع */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111827]/80 p-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                    <span>🐔</span>
                    <span>النوع (Flock)</span>
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {customer.poultryType || 'دجاج تسمين'}
                  </p>
                </div>

                {/* 2. 🔢 عدد الطيور */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111827]/80 p-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                    <span>🔢</span>
                    <span>عدد الطيور</span>
                  </span>
                  <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {customer.birdCount !== undefined && customer.birdCount !== ''
                      ? `${Number(customer.birdCount).toLocaleString()} طائر`
                      : 'غير مسجل'}
                  </p>
                </div>

                {/* 3. 📅 العمر */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111827]/80 p-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                    <span>📅</span>
                    <span>العمر (Age)</span>
                  </span>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {customer.flockAge || 'غير محدد'}
                  </p>
                </div>
              </div>

              {/* Water Consumption & Dosage Estimator */}
              {customer.birdCount && Number(customer.birdCount) > 0 && (
                <div className="rounded-xl bg-emerald-100/60 dark:bg-emerald-500/10 border border-emerald-300/60 dark:border-emerald-500/20 p-2.5 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span>💧</span>
                    <span>استهلاك ماء الشرب اليومي المقدر:</span>
                    <strong className="font-mono font-bold">
                      ~{((Number(customer.birdCount) * 180) / 1000).toFixed(0)} لتر/يوم
                    </strong>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 font-semibold">
                    🌿 الجرعة (1 مل/لتر): ~{((Number(customer.birdCount) * 180) / 1000).toFixed(0)} مل/يوم
                  </span>
                </div>
              )}

              {/* 4. 📦 المنتجات اللي سأل عنها أو اشتراها */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1 mb-1.5">
                  <span>🌿</span>
                  <span>المنتجات والأدوية البيطرية الطبيعية والعشبية المطلوبة</span>
                </span>
                {customer.feedProducts ? (
                  <div className="flex flex-wrap gap-1.5">
                    {customer.feedProducts
                      .split(/[،,]/)
                      .map((p) => p.trim())
                      .filter(Boolean)
                      .map((prod, pIdx) => (
                        <span
                          key={pIdx}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-500/30 font-semibold"
                        >
                          <span>🌿</span>
                          <span>{prod}</span>
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    لم تُسجل مستحضرات عشبية محددة بعد. انقر تعديل لتحديد الأدوية الطبيعية المطلوبة.
                  </p>
                )}
              </div>
            </div>

            {/* Scheduled Calendar Reminder Details */}
            {customer.reminderDate && (
              <div className="rounded-2xl border border-amber-300/80 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Scheduled Calendar Reminder</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30">
                    {customer.reminderDismissed ? 'Completed' : 'Active'}
                  </span>
                </div>
                <div className="text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-slate-900 dark:text-white">{customer.reminderDate}</span>
                  {customer.reminderTime && <span className="text-slate-500 dark:text-slate-400">at {customer.reminderTime}</span>}
                </div>
                {customer.reminderNote && (
                  <p className="text-xs text-amber-900 dark:text-amber-200/80 italic mt-1 bg-amber-100/50 dark:bg-black/20 p-2 rounded-lg">
                    "{customer.reminderNote}"
                  </p>
                )}
              </div>
            )}

            {/* Scheduled Follow-Up Meeting */}
            {customer.followUpDate && (
              <div className="rounded-2xl border border-sky-300/80 dark:border-sky-500/30 bg-sky-50/70 dark:bg-sky-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-xs">
                    <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span>Follow-Up Meeting & Further Information</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-500/30">
                    Scheduled
                  </span>
                </div>
                <div className="text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span className="font-bold text-slate-900 dark:text-white">{customer.followUpDate}</span>
                  {customer.followUpTime && <span className="text-slate-500 dark:text-slate-400">at {customer.followUpTime}</span>}
                </div>
                {customer.followUpPurpose && (
                  <p className="text-xs text-sky-900 dark:text-sky-200/90 mt-1 bg-sky-100/50 dark:bg-black/20 p-2 rounded-lg">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Meeting Details: </span>
                    "{customer.followUpPurpose}"
                  </p>
                )}
              </div>
            )}

            {/* Client Case Information & Case History */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1f2937]/50 p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                    Client Case & Interaction
                  </span>
                </div>
                {customer.latestCase && (
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/25 px-2.5 py-0.5 rounded-full">
                    {customer.latestCase}
                  </span>
                )}
              </div>

              {customer.caseHistory && customer.caseHistory.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Case History Log</p>
                  <div className="space-y-2">
                    {customer.caseHistory.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white">{item.title}</span>
                            {(item.callType || (item.caseType === 'call' ? 'Outbound Call' : undefined)) && (
                              <span className="rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-extrabold">
                                {item.callType || 'Outbound Call'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {item.dayName ? `${item.dayName}, ` : ''}{item.date} {item.time || ''}
                          </span>
                        </div>
                        {item.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No case history logged yet.</p>
              )}
            </div>

            {/* Photo / Document Uploaded */}
            {customer.photoUrl && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1f2937]/50 p-4.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                    <ImageIcon className="h-4 w-4 text-indigo-500" />
                    <span>Uploaded Photo / Document</span>
                  </div>
                  {customer.photoName && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[180px]">
                      {customer.photoName}
                    </span>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0f172a] p-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={customer.photoUrl}
                    alt={customer.photoName || 'Client Photo'}
                    className="max-h-56 rounded-lg object-contain shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Executive Notes & Requirements
              </p>
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-[#1f2937]/40 p-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[64px]">
                {customer.notes || (
                  <span className="italic text-slate-400">No notes recorded for this deal.</span>
                )}
              </div>
            </div>

            {/* History Time & Activity Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-500" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                    History & Activity Timeline
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  {historyItems.length} {historyItems.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              <div className="space-y-2.5 border-l-2 border-slate-200 dark:border-slate-800 ml-2 pl-4 py-1">
                {historyItems.map((hist, idx) => (
                  <div key={hist.id || idx} className="relative group">
                    <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-[#111827] bg-[#6366f1]" />
                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-slate-50/60 dark:bg-[#1e293b]/40 p-3.5 hover:border-indigo-300 dark:hover:border-slate-700 transition-colors shadow-2xs">
                      {/* Day Name and Date Header */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-500/20">
                            {hist.dayName}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {hist.date}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {hist.time}
                        </span>
                      </div>

                      {/* Action Title, Call Type and User */}
                      <div className="flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{hist.action}</span>
                          {hist.callType && (
                            <span className="rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-extrabold">
                              {hist.callType}
                            </span>
                          )}
                        </div>
                        {hist.user && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            by {hist.user}
                          </span>
                        )}
                      </div>

                      {/* Stage changes if available */}
                      {hist.previousValue && hist.newValue && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-300 font-semibold">
                          <span className="text-slate-400">{hist.previousValue}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-bold">{hist.newValue}</span>
                        </div>
                      )}

                      {/* Detail Text */}
                      {hist.details && (
                        <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
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
          <div className="p-4.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111827] flex items-center justify-between gap-3">
            <button
              onClick={() => onDelete(customer)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors shadow-2xs"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors shadow-2xs"
              >
                Close
              </button>
              <button
                onClick={() => onEdit(customer)}
                className="flex items-center gap-1.5 rounded-xl bg-[#6366f1] px-4.5 py-2 text-xs font-bold text-white hover:bg-indigo-600 transition-all shadow-md shadow-indigo-600/20"
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
