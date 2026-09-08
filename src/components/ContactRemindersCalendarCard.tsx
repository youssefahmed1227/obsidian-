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
  // Mini calendar current view month (defaulting to September 2026)
  const [viewDate, setViewDate] = useState<Date>(() => new Date(2026, 8, 1));
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

  const todayStr = '2026-09-07';

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <CalendarIcon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Contact Reminders Calendar</span>
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                {Object.keys(remindersByDate).length} Dates
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Scheduled client telephone calls & WhatsApp follow-ups</p>
          </div>
        </div>

        <button
          onClick={onOpenFullCalendar}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#6366f1] hover:text-indigo-400 transition-colors"
        >
          <span>Full Calendar</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Mini Calendar Widget */}
      <div className="rounded-xl border border-slate-800/80 bg-[#161f30] p-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-white font-mono">
            {monthName} {year}
          </span>
          <div className="flex items-center gap-1">
            {selectedDateFilter && (
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold mr-1 underline"
              >
                Clear Filter
              </button>
            )}
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700"
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 pb-1">
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
                className={`relative h-7 rounded-md flex items-center justify-center font-mono text-[11px] transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-900 font-bold shadow-md shadow-amber-500/20'
                    : day.hasReminder
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 font-bold'
                    : isToday
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{day.dayNumber}</span>
                {day.hasReminder && !isSelected && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming Reminders List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            {selectedDateFilter ? `Follow-ups on ${selectedDateFilter}:` : 'Upcoming Follow-ups & Reminders:'}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {clientRemindersList.length} clients
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {clientRemindersList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-slate-500 text-xs">
              No reminders scheduled for this period. Open any client to add a calendar reminder.
            </div>
          ) : (
            clientRemindersList.map((cust) => {
              const isDueToday = cust.reminderDate === todayStr;
              return (
                <div
                  key={cust.customerId}
                  className={`rounded-xl border p-3 text-xs transition-colors ${
                    isDueToday
                      ? 'border-amber-500/40 bg-amber-950/20'
                      : 'border-slate-800 bg-[#161f30]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">{cust.companyName}</span>
                        {isDueToday && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-500/40 animate-pulse">
                            DUE TODAY
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {cust.contactPerson} • <span className="font-mono text-indigo-300">{cust.statusStage}</span>
                      </p>
                    </div>

                    <span className="rounded bg-[#111827] px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-slate-700 shrink-0">
                      {cust.reminderDate}
                    </span>
                  </div>

                  {cust.reminderNote && (
                    <p className="text-[11px] text-slate-300 italic mt-1.5 line-clamp-1">
                      "{cust.reminderNote}"
                    </p>
                  )}

                  {/* Dual Phone Quick Contact Buttons */}
                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                    <div className="flex items-center gap-2">
                      {cust.phone && (
                        <a
                          href={`tel:${cust.phone}`}
                          className="flex items-center gap-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 px-2 py-1 text-[10px] font-semibold text-emerald-300"
                        >
                          <Phone className="h-3 w-3 text-emerald-400" />
                          <span>Call</span>
                        </a>
                      )}

                      {cust.whatsappPhone && (
                        <a
                          href={`https://wa.me/${cust.whatsappPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 px-2 py-1 text-[10px] font-semibold text-emerald-300"
                        >
                          <MessageSquare className="h-3 w-3 text-emerald-400" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onLogCallCase(cust, 'called 7/9/2025')}
                        className="rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2 py-1 text-[10px] font-semibold flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Log "called 7/9/2025"</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditCustomer(cust)}
                        className="rounded bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 text-[10px] font-medium"
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
