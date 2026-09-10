import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageSquare,
  Building,
  User,
  Clock,
  CheckCircle2,
  ExternalLink,
  Plus,
  Bell,
} from 'lucide-react';
import { CustomerRecord } from '../types';
import { getTodayISO } from '../utils/dateTime';

interface ContactRemindersCalendarCardProps {
  customers: CustomerRecord[];
  onOpenFullCalendar: () => void;
  onEditCustomer: (customer: CustomerRecord) => void;
  onLogCallCase: (customer: CustomerRecord, caseTitle: string) => void;
}

export const ContactRemindersCalendarCard: React.FC<ContactRemindersCalendarCardProps> = ({
  customers,
  onOpenFullCalendar,
  onEditCustomer,
  onLogCallCase,
}) => {
  // Mini calendar current view month (dynamic to today's date)
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  const monthName = viewDate.toLocaleString('en-US', { month: 'short' });
  const year = viewDate.getFullYear();

  const handlePrevMonth = () => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() - 1);
    setViewDate(next);
  };

  const handleNextMonth = () => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + 1);
    setViewDate(next);
  };

  const handleGoToday = () => {
    setViewDate(new Date());
    setSelectedDateFilter(getTodayISO());
  };

  // Map of date string "YYYY-MM-DD" -> count of client follow-ups
  const remindersByDate = useMemo(() => {
    const map: Record<string, CustomerRecord[]> = {};
    customers.forEach((c) => {
      if (c.reminderDate) {
        if (!map[c.reminderDate]) map[c.reminderDate] = [];
        map[c.reminderDate].push(c);
      }
    });
    return map;
  }, [customers]);

  // Generate mini calendar month grid
  const daysInMonth = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);

    // Day of week: 0 = Sun, 1 = Mon ...
    const startDayOfWeek = firstDay.getDay(); // Sunday as 0
    const totalDays = lastDay.getDate();

    const days: {
      dayNumber: number;
      dateString: string;
      hasReminder: boolean;
      reminderCount: number;
    }[] = [];

    // Empty lead slots
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ dayNumber: 0, dateString: '', hasReminder: false, reminderCount: 0 });
    }

    // Days of month
    for (let d = 1; d <= totalDays; d++) {
      const dateString = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const recs = remindersByDate[dateString] || [];
      days.push({
        dayNumber: d,
        dateString,
        hasReminder: recs.length > 0,
        reminderCount: recs.length,
      });
    }

    return days;
  }, [viewDate, remindersByDate]);

  // Clients with reminders list
  const clientRemindersList = useMemo(() => {
    const withReminders = customers.filter((c) => !!c.reminderDate);
    if (selectedDateFilter) {
      return withReminders.filter((c) => c.reminderDate === selectedDateFilter);
    }
    // Sort by reminderDate ascending
    return withReminders.sort((a, b) => (a.reminderDate || '').localeCompare(b.reminderDate || ''));
  }, [customers, selectedDateFilter]);

  const todayStr = useMemo(() => getTodayISO(), []);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#111827] p-5 shadow-sm dark:shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/30">
            <CalendarIcon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Contact Reminders</span>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/30">
                {Object.keys(remindersByDate).length} Dates
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Scheduled client calls & WhatsApp follow-ups</p>
          </div>
        </div>

        <button
          onClick={onOpenFullCalendar}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366f1] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20"
        >
          <span>Full View</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* Mini Calendar Widget */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161f30] p-3.5">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              {monthName} {year}
            </span>
            <button
              type="button"
              onClick={handleGoToday}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors border border-amber-200 dark:border-amber-500/30"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-1">
            {selectedDateFilter && (
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-bold mr-1.5"
              >
                Clear Filter
              </button>
            )}
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 pb-1.5 uppercase">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {daysInMonth.map((day, idx) => {
            if (day.dayNumber === 0) {
              return <div key={idx} className="h-7" />;
            }

            const isSelected = selectedDateFilter === day.dateString;
            const isToday = day.dateString === todayStr;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (day.hasReminder) {
                    setSelectedDateFilter(isSelected ? null : day.dateString);
                  }
                }}
                className={`relative h-7.5 rounded-lg flex items-center justify-center font-mono text-[11px] transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm shadow-amber-500/30 ring-2 ring-amber-400/50'
                    : day.hasReminder
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 font-bold'
                    : isToday
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{day.dayNumber}</span>
                {day.hasReminder && !isSelected && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming Reminders List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {selectedDateFilter ? `Follow-ups on ${selectedDateFilter}:` : 'Upcoming Follow-ups & Reminders:'}
          </span>
          <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
            {clientRemindersList.length} clients
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {clientRemindersList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
              No reminders scheduled for this period. Open any client record to set a reminder date.
            </div>
          ) : (
            clientRemindersList.map((cust) => {
              const isDueToday = cust.reminderDate === todayStr;
              return (
                <div
                  key={cust.customerId}
                  className={`rounded-xl border p-3 text-xs transition-all ${
                    isDueToday
                      ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20'
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161f30]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{cust.companyName}</span>
                        {isDueToday && (
                          <span className="rounded bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 animate-pulse">
                            DUE TODAY
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {cust.contactPerson} • <span className="font-mono text-indigo-600 dark:text-indigo-300 font-semibold">{cust.statusStage}</span>
                      </p>
                    </div>

                    <span className="rounded-md bg-white dark:bg-[#111827] px-2 py-0.5 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-300 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs">
                      {cust.reminderDate}
                    </span>
                  </div>

                  {cust.reminderNote && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic mt-1.5 line-clamp-1 bg-white/60 dark:bg-black/20 px-2 py-1 rounded-md">
                      "{cust.reminderNote}"
                    </p>
                  )}

                  {/* Dual Phone Quick Contact Buttons */}
                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      {cust.phone && (
                        <a
                          href={`tel:${cust.phone}`}
                          className="flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-500/30 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 transition-colors"
                        >
                          <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Call</span>
                        </a>
                      )}

                      {cust.whatsappPhone && (
                        <a
                          href={`https://wa.me/${cust.whatsappPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 border border-emerald-200 dark:border-emerald-500/30 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 transition-colors"
                        >
                          <MessageSquare className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onLogCallCase(cust, 'called 7/9/2025')}
                        className="rounded-lg bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2 py-1 text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Log Call</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditCustomer(cust)}
                        className="rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent px-2.5 py-1 text-[10px] font-semibold transition-colors"
                      >
                        Edit
                      </button>
                    </div>
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
