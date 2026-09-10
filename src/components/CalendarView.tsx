import React, { useState, useEffect, useMemo } from 'react';
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
  Circle,
  X,
  Filter,
  Check,
  AlertCircle,
  Tag,
  Trash2,
  ExternalLink,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { CalendarEvent, CustomerRecord, SheetUser } from '../types';
import { formatDateToISO, getTodayISO, formatDateOnly, formatTimeOnly } from '../utils/dateTime';

interface CalendarViewProps {
  events: CalendarEvent[];
  customers: CustomerRecord[];
  currentUser?: SheetUser;
  availableUsers?: SheetUser[];
  onAddEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onToggleCompleteEvent?: (eventId: string) => void;
  onOpenCustomerDetail?: (customerId: string) => void;
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
  onOpenCustomerDetail,
}) => {
  // Live current time clock ticker (updates every second so the calendar is alive)
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's real local date string "YYYY-MM-DD"
  const todayISO = useMemo(() => formatDateToISO(liveNow), [liveNow]);

  // Current calendar viewport date (initialized to real today)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('Month');
  // Week days configuration: default to 5-day work week (Sun, Mon, Tue, Wed, Thu)
  const [weekDaysSpan, setWeekDaysSpan] = useState<'5day' | '7day'>('5day');

  // Currently selected day in month/week view for quick inspection
  const [selectedDateISO, setSelectedDateISO] = useState<string>(() => formatDateToISO(new Date()));

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyEvents, setShowMyEvents] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showMilestones, setShowMilestones] = useState(true);
  const [showReminders, setShowReminders] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');

  // New Event Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<'my_events' | 'tasks' | 'milestones' | 'reminders'>('my_events');
  const [newEventDate, setNewEventDate] = useState(() => getTodayISO());
  const [newEventTime, setNewEventTime] = useState('10:00 AM');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');

  // Selected event for detail popup
  const [selectedEventDetail, setSelectedEventDetail] = useState<CalendarEvent | null>(null);

  // Month navigation calculations
  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
  const year = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth();

  // Navigation handlers that move the calendar seamlessly
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
    setSelectedDateISO(formatDateToISO(next));
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
    setSelectedDateISO(formatDateToISO(next));
  };

  // Jump to actual real today
  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateISO(formatDateToISO(now));
  };

  // Jump to tomorrow
  const handleJumpToTomorrow = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    setCurrentDate(tom);
    setSelectedDateISO(formatDateToISO(tom));
  };

  // Direct date picker jump
  const handleCustomDateJump = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const jumped = new Date(y, m, d);
        setCurrentDate(jumped);
        setSelectedDateISO(val);
      }
    }
  };

  // Month & Year dropdown pickers
  const handleSelectMonth = (mIdx: number) => {
    const next = new Date(currentDate);
    next.setMonth(mIdx);
    setCurrentDate(next);
  };

  const handleSelectYear = (yVal: number) => {
    const next = new Date(currentDate);
    next.setFullYear(yVal);
    setCurrentDate(next);
  };

  // Combine calendar events with any customer records that have reminderDate or followUpDate
  const allCombinedEvents = useMemo(() => {
    const list: CalendarEvent[] = [...events];

    // Include customer reminder dates as reminder events if not already present
    customers.forEach((cust) => {
      if (cust.reminderDate) {
        const existing = list.find((e) => e.customerId === cust.customerId && e.date === cust.reminderDate);
        if (!existing) {
          list.push({
            id: `rem-cust-${cust.customerId}`,
            title: `Follow-up: ${cust.companyName}`,
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
            notes: cust.reminderNote || 'Scheduled client telephone follow-up',
            completed: cust.reminderDismissed || false,
          });
        }
      }

      // Include follow-up meeting date if defined
      if (cust.followUpDate) {
        const existingMeeting = list.find((e) => e.customerId === cust.customerId && e.date === cust.followUpDate);
        if (!existingMeeting) {
          list.push({
            id: `meeting-cust-${cust.customerId}`,
            title: `Meeting: ${cust.companyName}`,
            date: cust.followUpDate,
            time: cust.followUpTime || '02:00 PM',
            type: 'event',
            category: 'my_events',
            assignedTo: cust.assignedTo,
            customerId: cust.customerId,
            companyName: cust.companyName,
            contactPerson: cust.contactPerson,
            phone: cust.phone,
            whatsappPhone: cust.whatsappPhone || cust.phone,
            notes: cust.followUpPurpose || 'Discovery follow-up session',
          });
        }
      }
    });

    return list;
  }, [events, customers]);

  // Filter events based on search, checkboxes, status, & sales agent
  const filteredEvents = useMemo(() => {
    return allCombinedEvents.filter((evt) => {
      // Category filter
      if (evt.category === 'my_events' && !showMyEvents) return false;
      if (evt.category === 'tasks' && !showTasks) return false;
      if (evt.category === 'milestones' && !showMilestones) return false;
      if (evt.category === 'reminders' && !showReminders) return false;

      // Status filter
      if (statusFilter === 'pending' && evt.completed) return false;
      if (statusFilter === 'completed' && !evt.completed) return false;

      // Agent filter
      if (selectedAgentFilter !== 'all' && evt.assignedTo && evt.assignedTo !== selectedAgentFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchCompany = evt.companyName?.toLowerCase().includes(q);
        const matchContact = evt.contactPerson?.toLowerCase().includes(q);
        const matchNotes = evt.notes?.toLowerCase().includes(q);
        const matchPhone = evt.phone?.includes(q) || evt.whatsappPhone?.includes(q);
        if (!matchTitle && !matchCompany && !matchContact && !matchNotes && !matchPhone) {
          return false;
        }
      }

      return true;
    });
  }, [
    allCombinedEvents,
    showMyEvents,
    showTasks,
    showMilestones,
    showReminders,
    statusFilter,
    selectedAgentFilter,
    searchQuery,
  ]);

  // Generate column headers based on Sunday as week start: (Sun, Mon, Tue, Wed, Thu...)
  const currentWeekDays = useMemo(() => {
    // Find Sunday of the current reference date
    const d = new Date(currentDate);
    const day = d.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
    const diffToSunday = day; // Sunday is 0
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - diffToSunday);

    const week: {
      dayName: string;
      formatted: string;
      shortDate: string;
      dateISO: string;
      dateObj: Date;
      isToday: boolean;
      isSelected: boolean;
      isWeekend?: boolean;
    }[] = [];

    // Week day names starting with Sunday
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const count = weekDaysSpan === '5day' ? 5 : 7;

    for (let i = 0; i < count; i++) {
      const dayObj = new Date(sunday);
      dayObj.setDate(sunday.getDate() + i);

      const iso = formatDateToISO(dayObj);
      const dayNum = String(dayObj.getDate()).padStart(2, '0');
      const monthAbbr = dayObj.toLocaleString('en-US', { month: 'short' });
      const yearShort = String(dayObj.getFullYear()).slice(2);
      const formatted = `${dayNames[i]} ${dayNum}-${monthAbbr}-${yearShort}`;
      const shortDate = `${dayNames[i]}, ${monthAbbr} ${dayNum}`;

      week.push({
        dayName: dayNames[i],
        formatted,
        shortDate,
        dateISO: iso,
        dateObj: dayObj,
        isToday: iso === todayISO,
        isSelected: iso === selectedDateISO,
        isWeekend: i === 5 || i === 6,
      });
    }

    return week;
  }, [currentDate, todayISO, selectedDateISO, weekDaysSpan]);

  // Week range label e.g. "Sun, Sep 6 – Thu, Sep 10, 2026"
  const weekRangeLabel = useMemo(() => {
    if (currentWeekDays.length === 0) return '';
    const start = currentWeekDays[0].dateObj;
    const end = currentWeekDays[currentWeekDays.length - 1].dateObj;
    const startStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }, [currentWeekDays]);

  // Standard 7 Column Headers for Month View starting with Sunday: Sun, Mon, Tue, Wed, Thu, Fri, Sat
  const monthDayHeaders = useMemo(() => {
    return [
      { name: 'Sun', fullName: 'Sunday', isWeekend: false },
      { name: 'Mon', fullName: 'Monday', isWeekend: false },
      { name: 'Tue', fullName: 'Tuesday', isWeekend: false },
      { name: 'Wed', fullName: 'Wednesday', isWeekend: false },
      { name: 'Thu', fullName: 'Thursday', isWeekend: false },
      { name: 'Fri', fullName: 'Friday', isWeekend: true },
      { name: 'Sat', fullName: 'Saturday', isWeekend: true },
    ];
  }, []);

  // Full Month Grid Calculation: dynamically outputs either 35 or 42 cells starting with Sunday
  const calendarGridDays = useMemo(() => {
    const yearNum = currentDate.getFullYear();
    const monthNum = currentDate.getMonth();

    const firstDayOfMonth = new Date(yearNum, monthNum, 1);
    const lastDayOfMonth = new Date(yearNum, monthNum + 1, 0);

    // Sunday as first day of week: 0 for Sun, 1 for Mon, ..., 6 for Sat
    const startDayOfWeek = firstDayOfMonth.getDay();
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Determine if we need 35 (5 rows) or 42 (6 rows) cells
    const totalNeeded = startDayOfWeek + totalDaysInMonth > 35 ? 42 : 35;

    const startDate = new Date(yearNum, monthNum, 1 - startDayOfWeek);

    const days: {
      dateObj: Date;
      dateString: string; // YYYY-MM-DD
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isWeekend: boolean;
      events: CalendarEvent[];
    }[] = [];

    for (let i = 0; i < totalNeeded; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const dateString = formatDateToISO(d);
      const dayEvents = filteredEvents.filter((e) => e.date === dateString);
      const dow = d.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat

      days.push({
        dateObj: d,
        dateString,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === monthNum,
        isToday: dateString === todayISO,
        isSelected: dateString === selectedDateISO,
        isWeekend: dow === 5 || dow === 6,
        events: dayEvents,
      });
    }

    return days;
  }, [currentDate, filteredEvents, todayISO, selectedDateISO]);

  // Events on the currently selected day (for Day View or sidebar preview)
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.date === selectedDateISO);
  }, [filteredEvents, selectedDateISO]);

  // Open modal with specific date prefilled
  const handleOpenNewEventModal = (dateStr?: string, defaultTime?: string) => {
    if (dateStr) {
      setNewEventDate(dateStr);
    } else {
      setNewEventDate(todayISO);
    }
    if (defaultTime) {
      setNewEventTime(defaultTime);
    } else {
      setNewEventTime('10:00 AM');
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
      completed: false,
      ...customerInfo,
    };

    onAddEvent(newEvt);
    setIsModalOpen(false);
  };

  // Day hours timeline definition: 8:00 AM to 7:00 PM
  const dayHourSlots = useMemo(() => {
    return [
      { label: '08:00 AM', hour24: 8 },
      { label: '09:00 AM', hour24: 9 },
      { label: '10:00 AM', hour24: 10 },
      { label: '11:00 AM', hour24: 11 },
      { label: '12:00 PM', hour24: 12 },
      { label: '01:00 PM', hour24: 13 },
      { label: '02:00 PM', hour24: 14 },
      { label: '03:00 PM', hour24: 15 },
      { label: '04:00 PM', hour24: 16 },
      { label: '05:00 PM', hour24: 17 },
      { label: '06:00 PM', hour24: 18 },
      { label: '07:00 PM', hour24: 19 },
    ];
  }, []);

  // Quick statistics
  const metrics = useMemo(() => {
    const total = allCombinedEvents.length;
    const todayCount = allCombinedEvents.filter((e) => e.date === todayISO).length;
    const pendingReminders = allCombinedEvents.filter((e) => e.category === 'reminders' && !e.completed).length;
    const completedTasks = allCombinedEvents.filter((e) => !!e.completed).length;
    return { total, todayCount, pendingReminders, completedTasks };
  }, [allCombinedEvents, todayISO]);

  return (
    <div className="space-y-5">
      {/* Top Real-Time System Header & Live Clock Bar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] p-4.5 shadow-sm dark:shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <CalendarIcon className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span>Interactive CRM Calendar</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time schedule for client telephone calls, WhatsApp check-ins, tasks, and executive milestones.
                </p>
              </div>
            </div>
          </div>

          {/* Live Clock & Fast Jump Shortcuts */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Live Ticking Time Badge */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-[#161f30] px-3 py-2 border border-slate-200/80 dark:border-slate-800">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <div className="text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400 mr-1.5 hidden sm:inline">Current:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {liveNow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1.5">
                  {liveNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Quick Jumps */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleJumpToToday}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-all border shadow-2xs flex items-center gap-1.5 ${
                  selectedDateISO === todayISO
                    ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                    : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/25'
                }`}
                title="Jump to Today's date"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Today</span>
              </button>

              <button
                type="button"
                onClick={handleJumpToTomorrow}
                className="rounded-xl px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Jump to Tomorrow"
              >
                Tomorrow
              </button>

              {/* Native Date Picker Direct Jump */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDateISO}
                  onChange={handleCustomDateJump}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1f2937] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  title="Directly pick any date on the calendar"
                />
              </div>
            </div>

            {/* Orange New Event Button */}
            <button
              onClick={() => handleOpenNewEventModal(selectedDateISO)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-4.5 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>New Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm dark:shadow-2xl overflow-hidden">
        {/* Navigation & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-[#161f30]">
          {/* Left: Previous, Next, and Month/Year Dropdown Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 rounded-xl p-1 shadow-2xs">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Previous period"
                title="Go to previous day / week / month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Next period"
                title="Go to next day / week / month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Month & Year Dropdowns */}
            <div className="flex items-center gap-1.5">
              <select
                value={currentMonthIdx}
                onChange={(e) => handleSelectMonth(parseInt(e.target.value, 10))}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => handleSelectYear(parseInt(e.target.value, 10))}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Center: Dynamic Period Title */}
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-wide flex items-center justify-center gap-2">
              <span>
                {viewMode === 'Month' && `${monthName} ${year}`}
                {viewMode === 'Week' && weekRangeLabel}
                {viewMode === 'Day' &&
                  currentDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
              </span>
              {selectedDateISO === todayISO && (
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Today
                </span>
              )}
            </h2>
          </div>

          {/* Right: Week Format (Sun–Thu vs 7 Days) + View Mode Segmented Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Week days switcher (Sun-Thu 5d vs 7d) */}
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setWeekDaysSpan('5day')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  weekDaysSpan === '5day'
                    ? 'bg-amber-400 text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
                title="Week: Sun, Mon, Tue, Wed, Thu (5 Days)"
              >
                Sun – Thu (5d)
              </button>
              <button
                type="button"
                onClick={() => setWeekDaysSpan('7day')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  weekDaysSpan === '7day'
                    ? 'bg-amber-400 text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
                title="Full Week: Sun – Sat (7 Days)"
              >
                7 Days
              </button>
            </div>

            {/* View Mode Segmented Controls [Day] [Week] [Month] */}
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-1 shadow-2xs">
              {(['Day', 'Week', 'Month'] as CalendarViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    viewMode === mode
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2-Column Body: Grid Area + Refined Sidebar */}
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 dark:divide-slate-800">
          {/* Main Content Column */}
          <div className="flex-1 overflow-x-auto min-w-0">
            {/* 1. MONTH VIEW */}
            {viewMode === 'Month' && (
              <div className="min-w-[720px]">
                {/* 7 Column Headers starting with Sunday */}
                <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-[#1e293b]/70 text-slate-700 dark:text-slate-300 text-xs font-bold text-center">
                  {monthDayHeaders.map((col, idx) => (
                    <div
                      key={idx}
                      className={`py-2.5 px-2 border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 truncate ${
                        col.isWeekend
                          ? 'bg-slate-200/40 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium'
                          : 'font-extrabold text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{col.name}</span>
                        {col.isWeekend && (
                          <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 uppercase hidden sm:inline">
                            (Wknd)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Days Grid: 35 or 42 cells */}
                <div className="grid grid-cols-7 auto-rows-fr divide-y divide-slate-200/80 dark:divide-slate-800/80">
                  {calendarGridDays.map((day, idx) => {
                    const isRightCol = (idx + 1) % 7 === 0;
                    const isSelected = day.dateString === selectedDateISO;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedDateISO(day.dateString);
                          setCurrentDate(day.dateObj);
                        }}
                        className={`min-h-[115px] p-2 transition-all cursor-pointer border-r border-slate-200/80 dark:border-slate-800/80 relative group ${
                          isRightCol ? 'border-r-0' : ''
                        } ${
                          day.isToday
                            ? 'bg-amber-50/60 dark:bg-[#fefce8]/10 ring-2 ring-amber-500'
                            : isSelected
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-500'
                            : day.isCurrentMonth
                            ? day.isWeekend
                              ? 'bg-slate-50/70 dark:bg-[#131b29] hover:bg-slate-100/60 dark:hover:bg-[#182335]'
                              : 'bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-[#1f2937]/50'
                            : 'bg-slate-50/40 dark:bg-[#0b0f17]/80 text-slate-400 dark:text-slate-600 hover:bg-slate-100/60 dark:hover:bg-[#131b29]'
                        }`}
                      >
                        {/* Day Number & Status Header */}
                        <div className="flex items-center justify-between mb-1.5">
                          {day.isToday ? (
                            <span className="rounded-md bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-extrabold shadow-2xs">
                              Today
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              {day.events.length > 0 ? `${day.events.length} evt` : ''}
                            </span>
                          )}

                          <div className="flex items-center gap-1.5 ml-auto">
                            {/* Hover quick add */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenNewEventModal(day.dateString);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
                              title={`Add event on ${day.dateString}`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>

                            <span
                              className={`text-xs font-mono font-bold ${
                                day.isToday
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : day.isCurrentMonth
                                  ? 'text-slate-800 dark:text-slate-200'
                                  : 'text-slate-400 dark:text-slate-600'
                              }`}
                            >
                              {day.dayNumber}
                            </span>
                          </div>
                        </div>

                        {/* Events List in Day */}
                        <div className="space-y-1">
                          {day.events.slice(0, 3).map((evt) => {
                            let badgeStyle = 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30';
                            if (evt.category === 'tasks') {
                              badgeStyle = 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600/50';
                            } else if (evt.category === 'milestones') {
                              badgeStyle = 'bg-amber-50 dark:bg-slate-900 text-amber-800 dark:text-slate-200 border-amber-300 dark:border-slate-700 font-semibold';
                            } else if (evt.category === 'reminders') {
                              badgeStyle = evt.completed
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through border-slate-200 dark:border-slate-700'
                                : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40 font-semibold';
                            }

                            return (
                              <div
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEventDetail(evt);
                                }}
                                className={`group/item flex items-center justify-between rounded-md px-1.5 py-0.5 text-[11px] border truncate hover:scale-[1.01] transition-transform ${badgeStyle}`}
                              >
                                <span className="truncate flex items-center gap-1">
                                  {evt.completed && <Check className="h-2.5 w-2.5 text-emerald-600 shrink-0" />}
                                  <span className="truncate">{evt.title}</span>
                                </span>
                                {evt.time && (
                                  <span className="text-[9px] opacity-80 ml-1 shrink-0 font-mono">
                                    {evt.time}
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {day.events.length > 3 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDateISO(day.dateString);
                                setCurrentDate(day.dateObj);
                                setViewMode('Day');
                              }}
                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline pl-1 text-left block"
                            >
                              +{day.events.length - 3} more →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. WEEK VIEW */}
            {viewMode === 'Week' && (
              <div className="p-4 space-y-4">
                <div
                  className={`grid gap-3 ${
                    currentWeekDays.length === 5
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7'
                  }`}
                >
                  {currentWeekDays.map((col, idx) => {
                    const dayEvents = filteredEvents.filter((e) => e.date === col.dateISO);

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border p-3 flex flex-col min-h-[300px] transition-all ${
                          col.isToday
                            ? 'border-amber-400 dark:border-amber-500/40 bg-amber-50/30 dark:bg-amber-500/5 ring-1 ring-amber-500/30'
                            : col.isSelected
                            ? 'border-indigo-400 dark:border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161f30]'
                        }`}
                      >
                        {/* Day Column Header */}
                        <div className="border-b border-slate-200 dark:border-slate-700/60 pb-2 mb-2.5 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              {col.dayName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {col.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {col.isToday && (
                              <span className="rounded bg-amber-500 text-white px-1.5 py-0.2 text-[9px] font-bold uppercase">
                                Today
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenNewEventModal(col.dateISO)}
                              className="p-1 rounded-md text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                              title="Add event on this day"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Events List in Week Column */}
                        <div className="flex-1 space-y-2 overflow-y-auto">
                          {dayEvents.length === 0 ? (
                            <div className="h-full flex items-center justify-center p-4">
                              <p className="text-[11px] italic text-slate-400 dark:text-slate-500 text-center">
                                No scheduled events
                              </p>
                            </div>
                          ) : (
                            dayEvents.map((evt) => (
                              <div
                                key={evt.id}
                                onClick={() => setSelectedEventDetail(evt)}
                                className={`rounded-xl border p-2.5 text-xs cursor-pointer transition-all hover:scale-[1.01] shadow-2xs ${
                                  evt.category === 'reminders'
                                    ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'
                                    : evt.category === 'tasks'
                                    ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80'
                                    : 'border-blue-200 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className={`font-bold text-slate-900 dark:text-white line-clamp-2 ${evt.completed ? 'line-through opacity-60' : ''}`}>
                                    {evt.title}
                                  </span>
                                  {onToggleCompleteEvent && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleCompleteEvent(evt.id);
                                      }}
                                      className="text-slate-400 hover:text-emerald-500 p-0.5 shrink-0"
                                    >
                                      {evt.completed ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                      ) : (
                                        <Circle className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{evt.time || 'All Day'}</span>
                                </p>
                                {evt.companyName && (
                                  <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 truncate mt-1">
                                    {evt.companyName}
                                  </p>
                                )}
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

            {/* 3. DAY VIEW WITH INTERACTIVE HOURLY TIMELINE */}
            {viewMode === 'Day' && (
              <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
                {/* Day View Header Bar */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#161f30] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                        {currentDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </h3>
                      {formatDateToISO(currentDate) === todayISO && (
                        <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedDayEvents.length} scheduled {selectedDayEvents.length === 1 ? 'item' : 'items'} on this date
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Stepper buttons for prev/next day */}
                    <button
                      type="button"
                      onClick={() => {
                        const prevD = new Date(currentDate);
                        prevD.setDate(prevD.getDate() - 1);
                        setCurrentDate(prevD);
                        setSelectedDateISO(formatDateToISO(prevD));
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                    >
                      ← Prev Day
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextD = new Date(currentDate);
                        nextD.setDate(nextD.getDate() + 1);
                        setCurrentDate(nextD);
                        setSelectedDateISO(formatDateToISO(nextD));
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                    >
                      Next Day →
                    </button>

                    <button
                      onClick={() => handleOpenNewEventModal(formatDateToISO(currentDate))}
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-orange-500/20"
                    >
                      + Add Task / Call
                    </button>
                  </div>
                </div>

                {/* Week Day Navigator Strip */}
                <div
                  className={`grid gap-1.5 sm:gap-2 ${
                    currentWeekDays.length === 5 ? 'grid-cols-5' : 'grid-cols-7'
                  }`}
                >
                  {currentWeekDays.map((wd) => {
                    const isCurrent = wd.dateISO === formatDateToISO(currentDate);
                    return (
                      <button
                        key={wd.dateISO}
                        type="button"
                        onClick={() => {
                          setCurrentDate(wd.dateObj);
                          setSelectedDateISO(wd.dateISO);
                        }}
                        className={`rounded-xl p-2 text-center transition-all border shadow-2xs ${
                          isCurrent
                            ? 'border-indigo-500 bg-indigo-500 text-white font-extrabold shadow-indigo-500/20'
                            : wd.isToday
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161f30] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className="text-[10px] uppercase block tracking-wider opacity-80">{wd.dayName}</span>
                        <span className="text-sm font-mono font-bold block mt-0.5">{wd.dateObj.getDate()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Hourly Schedule Timeline */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
                  {dayHourSlots.map((slot) => {
                    // Match events in this hour
                    const hourEvents = selectedDayEvents.filter((e) => {
                      if (!e.time) return slot.hour24 === 9; // default all-day to 9 AM
                      const match = e.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                      if (match) {
                        let h = parseInt(match[1], 10);
                        const isPM = match[3].toUpperCase() === 'PM';
                        if (isPM && h !== 12) h += 12;
                        if (!isPM && h === 12) h = 0;
                        return h === slot.hour24;
                      }
                      return false;
                    });

                    return (
                      <div
                        key={slot.hour24}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 hover:bg-slate-50/60 dark:hover:bg-[#161f30]/60 transition-colors group/row"
                      >
                        {/* Hour Label */}
                        <div className="w-24 shrink-0 font-mono text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{slot.label}</span>
                        </div>

                        {/* Events or Empty Slot Add Trigger */}
                        <div className="flex-1 w-full mt-2 sm:mt-0 space-y-2">
                          {hourEvents.length === 0 ? (
                            <div className="flex items-center justify-between py-1">
                              <span className="text-[11px] text-slate-400 italic">No events scheduled</span>
                              <button
                                type="button"
                                onClick={() => handleOpenNewEventModal(formatDateToISO(currentDate), slot.label)}
                                className="opacity-0 group-hover/row:opacity-100 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 transition-opacity"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Schedule at {slot.label}</span>
                              </button>
                            </div>
                          ) : (
                            hourEvents.map((evt) => (
                              <div
                                key={evt.id}
                                onClick={() => setSelectedEventDetail(evt)}
                                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#1f2937]/70 p-3 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-bold text-slate-900 dark:text-white text-sm ${evt.completed ? 'line-through opacity-60' : ''}`}>
                                      {evt.title}
                                    </span>
                                    <span className="rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.2 text-[10px] font-mono font-semibold">
                                      {evt.time}
                                    </span>
                                    {evt.category === 'reminders' && (
                                      <span className="rounded bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.2 text-[10px] font-bold">
                                        Client Follow-Up
                                      </span>
                                    )}
                                  </div>
                                  {evt.companyName && (
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium">
                                      <Building className="h-3.5 w-3.5" />
                                      <span>{evt.companyName} ({evt.contactPerson})</span>
                                    </p>
                                  )}
                                  {evt.notes && <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{evt.notes}"</p>}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Direct Dial / WhatsApp buttons */}
                                  {evt.phone && (
                                    <a
                                      href={`tel:${evt.phone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-500/30 transition-colors"
                                      title="Call contact"
                                    >
                                      <Phone className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                  {evt.whatsappPhone && (
                                    <a
                                      href={`https://wa.me/${evt.whatsappPhone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-500/30 transition-colors"
                                      title="WhatsApp chat"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                  {onToggleCompleteEvent && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleCompleteEvent(evt.id);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors"
                                      title={evt.completed ? 'Mark as pending' : 'Mark as completed'}
                                    >
                                      {evt.completed ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <Circle className="h-4 w-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
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
          </div>

          {/* Right Sidebar Column: Search, Filters & Overview */}
          <div className="w-full lg:w-76 p-5 bg-slate-50/50 dark:bg-[#0f172a] space-y-6 shrink-0">
            {/* Search Input Box */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Search Events & Clients
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, client, phone..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Section 1: SHOW ON MY CALENDAR */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Show on My Calendar
              </h3>
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-3" />

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
                    className={`h-4 w-4 rounded-md flex items-center justify-center border transition-colors ${
                      showMyEvents ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {showMyEvents && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white font-semibold">
                    My Events
                  </span>
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
                    className={`h-4 w-4 rounded-md flex items-center justify-center border transition-colors ${
                      showTasks ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {showTasks && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white font-semibold">
                    Tasks
                  </span>
                  <span className="ml-auto h-2.5 w-2.5 rounded-full bg-slate-500" />
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
                    className={`h-4 w-4 rounded-md flex items-center justify-center border transition-colors ${
                      showMilestones ? 'bg-amber-500 border-amber-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {showMilestones && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white font-semibold">
                    My Milestones
                  </span>
                  <span className="ml-auto h-2.5 w-2.5 rounded-full bg-amber-500" />
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
                    className={`h-4 w-4 rounded-md flex items-center justify-center border transition-colors ${
                      showReminders ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {showReminders && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white font-semibold">
                    Client Reminders & Calls
                  </span>
                  <span className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </label>
              </div>
            </div>

            {/* Status Segmented Filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Filter Status
              </h3>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                {(['all', 'pending', 'completed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`py-1 text-[11px] font-bold rounded-lg capitalize transition-colors ${
                      statusFilter === st
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: ALSO SHOW EVENTS FOR AGENT */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Team Member View
              </h3>
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-3" />

              <div className="space-y-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedAgentFilter('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors font-bold ${
                    selectedAgentFilter === 'all'
                      ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  ✓ All Team Members
                </button>

                {availableUsers.map((u) => (
                  <button
                    key={u.userName}
                    type="button"
                    onClick={() => setSelectedAgentFilter(u.userName)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors font-semibold flex items-center justify-between ${
                      selectedAgentFilter === u.userName
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{u.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{u.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Metrics Summary Box */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]/50 p-4 space-y-2.5 text-xs shadow-2xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                Activity Intelligence
              </span>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Total Events:</span>
                <span className="font-bold text-slate-900 dark:text-white">{metrics.total}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-amber-600 dark:text-amber-400 font-medium">Scheduled Today:</span>
                <span className="font-bold text-amber-700 dark:text-amber-300">{metrics.todayCount}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Pending Follow-ups:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">{metrics.pendingReminders}</span>
              </div>
              <div className="flex items-center justify-between font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Completed:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{metrics.completedTasks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                  <CalendarIcon className="h-4 w-4" />
                </span>
                <span>Schedule Calendar Event</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewEvent} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Call Eleanor Vance or Milestone Q4"
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] py-2 px-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Date *</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] py-2 px-3 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Time</label>
                  <input
                    type="text"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] py-2 px-3 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">Category *</label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] py-2 px-3 text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                >
                  <option value="my_events">My Events (Blue)</option>
                  <option value="tasks">Tasks (Slate)</option>
                  <option value="milestones">My Milestones (Amber)</option>
                  <option value="reminders">Client Reminders & Calls (Emerald)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">Link to Customer Account (Optional)</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] py-2 px-3 text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-1 focus:ring-orange-500"
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
                <label className="block font-bold text-slate-700 dark:text-slate-300">Notes & Objective</label>
                <textarea
                  rows={2}
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  placeholder="Meeting agenda, discussion points, follow-up objectives..."
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] py-2 px-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-4.5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20"
                >
                  Save to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Popup */}
      {selectedEventDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 dark:bg-indigo-500/20 px-2.5 py-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 uppercase">
                    {selectedEventDetail.category.replace('_', ' ')}
                  </span>
                  {selectedEventDetail.completed && (
                    <span className="rounded-lg bg-emerald-50 dark:bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 uppercase">
                      Completed
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2">
                  {selectedEventDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventDetail(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#1f2937]/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-amber-500" />
                  <span className="font-bold">{selectedEventDetail.date}</span>
                </div>
                {selectedEventDetail.time && (
                  <div className="flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{selectedEventDetail.time}</span>
                  </div>
                )}
              </div>

              {selectedEventDetail.companyName && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#1f2937]/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-bold">
                      <Building className="h-4 w-4 text-indigo-500" />
                      <span>{selectedEventDetail.companyName}</span>
                    </div>
                    {selectedEventDetail.customerId && onOpenCustomerDetail && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenCustomerDetail(selectedEventDetail.customerId!);
                          setSelectedEventDetail(null);
                        }}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <span>View Client</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {selectedEventDetail.contactPerson && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedEventDetail.contactPerson}</span>
                    </div>
                  )}

                  {/* Dual Phone Buttons for Direct Calling and WhatsApp */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    {selectedEventDetail.phone ? (
                      <a
                        href={`tel:${selectedEventDetail.phone}`}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 py-2 text-xs font-bold transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call Phone</span>
                      </a>
                    ) : null}

                    {selectedEventDetail.whatsappPhone ? (
                      <a
                        href={`https://wa.me/${selectedEventDetail.whatsappPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 py-2 text-xs font-bold transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              )}

              {selectedEventDetail.notes && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e293b]/40 p-3.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 mb-1">
                    Meeting Objective & Notes
                  </p>
                  <p>{selectedEventDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
              <button
                type="button"
                onClick={() => {
                  onDeleteEvent(selectedEventDetail.id);
                  setSelectedEventDetail(null);
                }}
                className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                {onToggleCompleteEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleCompleteEvent(selectedEventDetail.id);
                      setSelectedEventDetail((prev) => prev ? { ...prev, completed: !prev.completed } : null);
                    }}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors border ${
                      selectedEventDetail.completed
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {selectedEventDetail.completed ? '✓ Completed' : 'Mark Complete'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedEventDetail(null)}
                  className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-bold hover:opacity-90 shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
