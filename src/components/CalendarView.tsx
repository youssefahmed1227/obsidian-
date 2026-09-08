import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Building,
  Phone,
  MessageSquare,
  CheckCircle2,
  X,
  Filter,
  Check,
  AlertCircle,
  Tag,
  Trash2,
} from 'lucide-react';
import { CalendarEvent, CustomerRecord, SheetUser } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  customers: CustomerRecord[];
  currentUser?: SheetUser;
  availableUsers?: SheetUser[];
  onAddEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleCompleteEvent?: (eventId: string) => void;
}

type CalendarViewMode = 'Day' | 'Week' | 'Month';

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  customers,
  currentUser,
  availableUsers = [],
  onAddEvent,
  onDeleteEvent,
  onToggleCompleteEvent,
}) => {
  // Current reference date (defaulting to September 2026 to match screenshot)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 8, 7)); // Sep 7, 2026 (Month 8 = September)
  const [viewMode, setViewMode] = useState<CalendarViewMode>('Month');

  // Filter checkboxes matching screenshot sidebar
  const [showMyEvents, setShowMyEvents] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showMilestones, setShowMilestones] = useState(true);
  const [showReminders, setShowReminders] = useState(true);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');

  // New Event Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<'my_events' | 'tasks' | 'milestones' | 'reminders'>('my_events');
  const [newEventDate, setNewEventDate] = useState('2026-09-07');
  const [newEventTime, setNewEventTime] = useState('10:00 AM');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');

  // Selected event for detail popup
  const [selectedEventDetail, setSelectedEventDetail] = useState<CalendarEvent | null>(null);

  // Month navigation
  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
  const year = currentDate.getFullYear();

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'Month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'Week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'Month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'Week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 7)); // Reset to Sep 7, 2026
  };

  // Combine calendar events with any customer records that have reminderDate scheduled
  const allCombinedEvents = useMemo(() => {
    const list: CalendarEvent[] = [...events];

    // Include customer reminder dates as reminder events if not already present
    customers.forEach((cust) => {
      if (cust.reminderDate) {
        const existing = list.find((e) => e.customerId === cust.customerId && e.date === cust.reminderDate);
        if (!existing) {
          list.push({
            id: `rem-cust-${cust.customerId}`,
            title: `Reminder: ${cust.companyName} (${cust.contactPerson})`,
            date: cust.reminderDate,
            time: cust.reminderTime || '10:00 AM',
            type: 'reminder',
            category: 'reminders',
            assignedTo: cust.assignedTo,
            customerId: cust.customerId,
            companyName: cust.companyName,
            contactPerson: cust.contactPerson,
            phone: cust.phone,
            whatsappPhone: cust.whatsappPhone || cust.phone,
            notes: cust.reminderNote || 'Follow-up call scheduled',
          });
        }
      }
    });

    return list;
  }, [events, customers]);

  // Filter events based on sidebar checkboxes & agent filter
  const filteredEvents = useMemo(() => {
    return allCombinedEvents.filter((evt) => {
      // Category filter
      if (evt.category === 'my_events' && !showMyEvents) return false;
      if (evt.category === 'tasks' && !showTasks) return false;
      if (evt.category === 'milestones' && !showMilestones) return false;
      if (evt.category === 'reminders' && !showReminders) return false;

      // Agent filter
      if (selectedAgentFilter !== 'all' && evt.assignedTo && evt.assignedTo !== selectedAgentFilter) {
        return false;
      }

      return true;
    });
  }, [allCombinedEvents, showMyEvents, showTasks, showMilestones, showReminders, selectedAgentFilter]);

  // Generate 7-column headers in the exact format shown in screenshot: "Mon 31-Aug-26"
  const columnHeaders = useMemo(() => {
    // Determine the start of the week for the first row of this month view
    // Or base it on the first week displayed
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Find first day of month
    const firstDayOfMonth = new Date(year, month, 1);
    // Day of week: 0 = Sunday, 1 = Monday ... 6 = Saturday
    // In screenshot, Monday is the first column:
    // Mon 31-Aug-26, Tue 01-Sep-26, Wed 02-Sep-26, Thu 03-Sep-26, Fri 04-Sep-26, Sat 05-Sep-26, Sun 06-Sep-26
    const dayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun, 1 is Mon
    // If Monday is day 1, diff to Monday:
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startCalendarDate = new Date(year, month, 1 - diffToMonday);

    const headers: { dayName: string; formatted: string; dateObj: Date }[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startCalendarDate);
      d.setDate(startCalendarDate.getDate() + i);
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthAbbr = d.toLocaleString('en-US', { month: 'short' });
      const yearShort = String(d.getFullYear()).slice(2);
      const formatted = `${dayNames[i]} ${dayNum}-${monthAbbr}-${yearShort}`;
      headers.push({ dayName: dayNames[i], formatted, dateObj: d });
    }

    return headers;
  }, [currentDate]);

  // Build grid of 35 or 42 days for the Month View
  const calendarGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startDate = new Date(year, month, 1 - diffToMonday);

    const days: {
      dateObj: Date;
      dateString: string; // YYYY-MM-DD
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarEvent[];
    }[] = [];

    // Today is fixed to Sep 7, 2026 for demonstration, or real today
    const isTodayMatch = (d: Date) => {
      return (
        d.getFullYear() === 2026 &&
        d.getMonth() === 8 &&
        d.getDate() === 7
      );
    };

    for (let i = 0; i < 35; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateString = `${y}-${m}-${dayStr}`;

      const dayEvents = filteredEvents.filter((e) => e.date === dateString);

      days.push({
        dateObj: d,
        dateString,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: isTodayMatch(d),
        events: dayEvents,
      });
    }

    return days;
  }, [currentDate, filteredEvents]);

  // Open modal with specific date prefilled
  const handleOpenNewEventModal = (dateStr?: string) => {
    if (dateStr) {
      setNewEventDate(dateStr);
    } else {
      setNewEventDate('2026-09-07');
    }
    setNewEventTitle('');
    setSelectedCustomerId('');
    setNewEventNotes('');
    setIsModalOpen(true);
  };

  const handleSaveNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    let customerInfo: Partial<CalendarEvent> = {};
    if (selectedCustomerId) {
      const cust = customers.find((c) => c.customerId === selectedCustomerId);
      if (cust) {
        customerInfo = {
          customerId: cust.customerId,
          companyName: cust.companyName,
          contactPerson: cust.contactPerson,
          phone: cust.phone,
          whatsappPhone: cust.whatsappPhone || cust.phone,
        };
      }
    }

    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newEventTitle.trim(),
      date: newEventDate,
      time: newEventTime,
      type: newEventCategory === 'tasks' ? 'task' : newEventCategory === 'milestones' ? 'milestone' : 'event',
      category: newEventCategory,
      assignedTo: currentUser?.userName || 'admin',
      notes: newEventNotes.trim() || undefined,
      ...customerInfo,
    };

    onAddEvent(newEvt);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header with Title & Orange New Event Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400">
              <CalendarIcon className="h-6 w-6" />
            </span>
            <span>Calendar</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Interactive schedule for client follow-ups, calls, tasks, and executive milestones.
          </p>
        </div>

        {/* Orange New Event Button (matching screenshot) */}
        <button
          onClick={() => handleOpenNewEventModal()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f97316] hover:bg-[#ea580c] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Main Calendar Card Container */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] shadow-2xl overflow-hidden">
        {/* Navigation & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-slate-800 bg-[#161f30]">
          {/* Left: Today pill button + Prev / Next chevrons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-3.5 py-1.5 text-xs font-bold text-amber-300 transition-colors shadow-sm"
            >
              Today
            </button>
            <div className="flex items-center gap-1 border border-slate-700 bg-slate-800/80 rounded-lg p-0.5">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="Previous period"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="Next period"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Center: Month Year Title */}
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              {monthName} {year}
            </h2>
          </div>

          {/* Right: View Mode Segmented Controls [Day] [Week] [Month] */}
          <div className="flex items-center justify-end">
            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800/90 p-1">
              {(['Day', 'Week', 'Month'] as CalendarViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    viewMode === mode
                      ? 'bg-[#fed7aa] text-slate-900 shadow font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2-Column Body: Grid + Sidebar */}
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left / Main Calendar Grid Column */}
          <div className="flex-1 overflow-x-auto">
            {viewMode === 'Month' && (
              <div className="min-w-[720px]">
                {/* 7 Column Headers matching screenshot format "Mon 31-Aug-26" */}
                <div className="grid grid-cols-7 border-b border-slate-800 bg-[#1e293b]/70 text-slate-300 text-xs font-bold text-center">
                  {columnHeaders.map((col, idx) => (
                    <div key={idx} className="py-2.5 px-2 border-r border-slate-800 last:border-r-0 truncate">
                      {col.formatted}
                    </div>
                  ))}
                </div>

                {/* 35 Days Grid */}
                <div className="grid grid-cols-7 auto-rows-fr divide-y divide-slate-800/80">
                  {calendarGridDays.map((day, idx) => {
                    const isRightCol = (idx + 1) % 7 === 0;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleOpenNewEventModal(day.dateString)}
                        className={`min-h-[105px] p-2 transition-colors cursor-pointer border-r border-slate-800/80 ${
                          isRightCol ? 'border-r-0' : ''
                        } ${
                          day.isToday
                            ? 'bg-[#fefce8]/10 ring-1 ring-amber-500/40 relative'
                            : day.isCurrentMonth
                            ? 'bg-[#111827] hover:bg-[#1f2937]/50'
                            : 'bg-[#0b0f17]/80 text-slate-600 hover:bg-[#131b29]'
                        }`}
                      >
                        {/* Day Number Header */}
                        <div className="flex items-center justify-between mb-1.5">
                          {day.isToday && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                              Today
                            </span>
                          )}
                          <span
                            className={`text-xs font-mono ml-auto ${
                              day.isToday
                                ? 'text-amber-400 font-bold'
                                : day.isCurrentMonth
                                ? 'text-slate-300'
                                : 'text-slate-600'
                            }`}
                          >
                            {day.dayNumber}
                          </span>
                        </div>

                        {/* Events List in Day */}
                        <div className="space-y-1">
                          {day.events.slice(0, 3).map((evt) => {
                            let badgeStyle = 'bg-blue-600/20 text-blue-300 border-blue-500/30';
                            if (evt.category === 'tasks') {
                              badgeStyle = 'bg-slate-700/50 text-slate-300 border-slate-600/50';
                            } else if (evt.category === 'milestones') {
                              badgeStyle = 'bg-slate-900 text-slate-200 border-slate-700 font-semibold';
                            } else if (evt.category === 'reminders') {
                              badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                            }

                            return (
                              <div
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEventDetail(evt);
                                }}
                                className={`group flex items-center justify-between rounded px-1.5 py-0.5 text-[11px] border truncate hover:scale-[1.02] transition-transform ${badgeStyle}`}
                              >
                                <span className="truncate">{evt.title}</span>
                                {evt.time && (
                                  <span className="text-[9px] opacity-70 ml-1 shrink-0 font-mono">
                                    {evt.time}
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {day.events.length > 3 && (
                            <div className="text-[10px] font-semibold text-slate-500 hover:text-slate-300 pl-1">
                              +{day.events.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'Week' && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {columnHeaders.map((col, idx) => {
                    const y = col.dateObj.getFullYear();
                    const m = String(col.dateObj.getMonth() + 1).padStart(2, '0');
                    const d = String(col.dateObj.getDate()).padStart(2, '0');
                    const dateStr = `${y}-${m}-${d}`;
                    const dayEvents = filteredEvents.filter((e) => e.date === dateStr);

                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-800 bg-[#161f30] p-3 flex flex-col min-h-[220px]"
                      >
                        <div className="border-b border-slate-700/60 pb-2 mb-2">
                          <span className="text-xs font-bold text-slate-300">{col.formatted}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          {dayEvents.length === 0 ? (
                            <p className="text-[11px] italic text-slate-500">No events scheduled</p>
                          ) : (
                            dayEvents.map((evt) => (
                              <div
                                key={evt.id}
                                onClick={() => setSelectedEventDetail(evt)}
                                className="rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-xs cursor-pointer hover:border-amber-500/50 transition-colors"
                              >
                                <p className="font-semibold text-white">{evt.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{evt.time}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'Day' && (
              <div className="p-6 max-w-2xl mx-auto space-y-4">
                <div className="rounded-xl border border-slate-800 bg-[#161f30] p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Daily Schedule: {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <p className="text-xs text-slate-400">Manage daily interactions, calls, and follow-ups</p>
                  </div>
                  <button
                    onClick={() => handleOpenNewEventModal(currentDate.toISOString().split('T')[0])}
                    className="rounded-lg bg-orange-500 hover:bg-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow"
                  >
                    + Add Task / Call
                  </button>
                </div>

                <div className="space-y-3">
                  {filteredEvents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
                      No events scheduled for this day. Click above to add an event.
                    </div>
                  ) : (
                    filteredEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEventDetail(evt)}
                        className="rounded-xl border border-slate-800 bg-[#1f2937]/70 p-4 hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{evt.title}</span>
                            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                              {evt.time || 'All Day'}
                            </span>
                          </div>
                          {evt.companyName && (
                            <p className="text-xs text-indigo-400 mt-1">
                              Client: {evt.companyName} ({evt.contactPerson})
                            </p>
                          )}
                          {evt.notes && <p className="text-xs text-slate-400 mt-1">{evt.notes}</p>}
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-500" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Column (Matching the screenshot's right sidebar) */}
          <div className="w-full lg:w-72 p-5 bg-[#0f172a] space-y-6 shrink-0">
            {/* Section 1: SHOW ON MY CALENDAR */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Show on My Calendar
              </h3>
              <div className="h-px bg-slate-800 my-3" />

              <div className="space-y-3 text-xs">
                {/* My Events */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showMyEvents}
                    onChange={(e) => setShowMyEvents(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                      showMyEvents ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {showMyEvents && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="text-slate-200 group-hover:text-white font-medium">My Events</span>
                  <span className="ml-auto h-2.5 w-2.5 rounded-full bg-blue-500" />
                </label>

                {/* Tasks */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showTasks}
                    onChange={(e) => setShowTasks(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                      showTasks ? 'bg-slate-400 border-slate-300 text-slate-900' : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {showTasks && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="text-slate-200 group-hover:text-white font-medium">Tasks</span>
                  <span className="ml-auto h-2.5 w-2.5 rounded-full bg-slate-400" />
                </label>

                {/* My Milestones */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showMilestones}
                    onChange={(e) => setShowMilestones(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                      showMilestones ? 'bg-slate-900 border-slate-600 text-white' : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {showMilestones && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="text-slate-200 group-hover:text-white font-medium">My Milestones</span>
                  <span className="ml-auto h-2.5 w-2.5 rounded-full bg-slate-900 border border-slate-600" />
                </label>

                {/* Client Reminders & Calls */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showReminders}
                    onChange={(e) => setShowReminders(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                      showReminders ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {showReminders && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="text-slate-200 group-hover:text-white font-medium">
                    Client Reminders & Calls
                  </span>
                  <span className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </label>
              </div>
            </div>

            {/* Section 2: ALSO SHOW EVENTS FOR */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Also Show Events For
              </h3>
              <div className="h-px bg-slate-800 my-3" />

              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedAgentFilter('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                    selectedAgentFilter === 'all'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  ✓ All Team Members
                </button>

                {availableUsers.map((u) => (
                  <button
                    key={u.userName}
                    type="button"
                    onClick={() => setSelectedAgentFilter(u.userName)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-medium flex items-center justify-between ${
                      selectedAgentFilter === u.userName
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{u.userName}</span>
                    <span className="text-[10px] text-slate-500">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Contact Follow-Up Counter */}
            <div className="rounded-xl border border-slate-800 bg-[#1e293b]/50 p-3 space-y-2 text-xs">
              <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wide">
                Calendar Overview
              </span>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-300">Total Events:</span>
                <span className="font-bold text-white">{filteredEvents.length}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-emerald-400">Client Follow-ups:</span>
                <span className="font-bold text-emerald-300">
                  {filteredEvents.filter((e) => e.category === 'reminders').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-orange-500" />
                <span>Create Calendar Event</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewEvent} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Call Eleanor Vance or Milestone Q3"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300">Date *</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300">Time</label>
                  <input
                    type="text"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Category *</label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="my_events">My Events (Blue)</option>
                  <option value="tasks">Tasks (Slate)</option>
                  <option value="milestones">My Milestones (Dark)</option>
                  <option value="reminders">Client Reminders & Calls (Emerald)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Link to Client (Optional)</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">-- No Client Attached --</option>
                  {customers.map((c) => (
                    <option key={c.customerId} value={c.customerId}>
                      {c.companyName} ({c.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Notes & Details</label>
                <textarea
                  rows={2}
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  placeholder="Meeting agenda, discussion points, phone follow-up notes..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow shadow-orange-600/30"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Drawer / Popover */}
      {selectedEventDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/40 uppercase">
                  {selectedEventDetail.category.replace('_', ' ')}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{selectedEventDetail.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEventDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CalendarIcon className="h-4 w-4 text-amber-400" />
                <span className="font-mono">{selectedEventDetail.date}</span>
                {selectedEventDetail.time && (
                  <span className="font-mono text-slate-400">• {selectedEventDetail.time}</span>
                )}
              </div>

              {selectedEventDetail.companyName && (
                <div className="rounded-xl border border-slate-800 bg-[#1f2937]/70 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Building className="h-4 w-4 text-indigo-400" />
                    <span>{selectedEventDetail.companyName}</span>
                  </div>
                  {selectedEventDetail.contactPerson && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span>{selectedEventDetail.contactPerson}</span>
                    </div>
                  )}

                  {/* Dual Phone Buttons for Direct Calling and WhatsApp */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
                    {selectedEventDetail.phone ? (
                      <a
                        href={`tel:${selectedEventDetail.phone}`}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 py-2 text-xs font-semibold"
                      >
                        <Phone className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Call Phone</span>
                      </a>
                    ) : null}

                    {selectedEventDetail.whatsappPhone ? (
                      <a
                        href={`https://wa.me/${selectedEventDetail.whatsappPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 py-2 text-xs font-semibold"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              )}

              {selectedEventDetail.notes && (
                <div className="rounded-xl border border-slate-800 bg-[#1e293b]/40 p-3 text-slate-300 leading-relaxed">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Notes</p>
                  <p>{selectedEventDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-4">
              <button
                type="button"
                onClick={() => {
                  onDeleteEvent(selectedEventDetail.id);
                  setSelectedEventDetail(null);
                }}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Event</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEventDetail(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
