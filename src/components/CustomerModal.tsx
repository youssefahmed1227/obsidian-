import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Building,
  User,
  Mail,
  Phone,
  MessageSquare,
  DollarSign,
  PoundSterling,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Calendar,
  Clock,
  Bell,
  Check,
  Plus,
  History,
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';
import {
  CustomerRecord,
  StageType,
  SheetUser,
  CustomerHistoryEntry,
  CustomerCaseEntry,
} from '../types';
import { ALL_STAGES } from '../utils/metrics';
import { getHistoryTimeBreakdown, formatDateWithDay, getTodayISO } from '../utils/dateTime';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: CustomerRecord) => void;
  initialData?: CustomerRecord | null;
  currentUser?: SheetUser;
  availableUsers?: SheetUser[];
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentUser,
  availableUsers = [],
}) => {
  const isEditing = !!initialData;

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [statusStage, setStatusStage] = useState<StageType>('Lead');
  const [dealValue, setDealValue] = useState<number | string>(50000);
  const [notes, setNotes] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [dealId, setDealId] = useState('');
  const [newLead, setNewLead] = useState(true);
  const [assignedTo, setAssignedTo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Customer Type (Customizable by Employee)
  const [customerType, setCustomerType] = useState('Enterprise');

  // Poultry Feed Specific Fields (🐔 النوع، 🔢 عدد الطيور، 📅 العمر، 📦 المنتجات)
  const [poultryType, setPoultryType] = useState('دجاج تسمين (Broilers)');
  const [birdCount, setBirdCount] = useState<number | string>('');
  const [flockAge, setFlockAge] = useState('');
  const [feedProducts, setFeedProducts] = useState('');

  // Calendar Reminder States
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('10:00');
  const [reminderNote, setReminderNote] = useState('');
  const [enableReminder, setEnableReminder] = useState(false);

  // Employee-Decided Follow-Up Meeting (Further Information)
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('11:00 AM');
  const [followUpPurpose, setFollowUpPurpose] = useState('Meeting - Discuss Further Information');
  const [enableFollowUp, setEnableFollowUp] = useState(false);

  // Client Case & Case History States
  const [caseAction, setCaseAction] = useState('called 7/9/2025');
  const [callType, setCallType] = useState('Outbound Call');
  const [caseNotes, setCaseNotes] = useState('');
  const [caseHistoryList, setCaseHistoryList] = useState<CustomerCaseEntry[]>([]);

  // Photo / Document Upload States
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoName, setPhotoName] = useState('');

  const salesAgentOptions = useMemo(() => {
    if (availableUsers && availableUsers.length > 0) {
      return availableUsers.map((u) => ({
        name: u.userName,
        email: u.email,
      }));
    }
    return [
      {
        name: currentUser?.userName || 'admin',
        email: currentUser?.email || 'admin@gmail.com',
      },
    ];
  }, [availableUsers, currentUser]);

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName);
      setContactPerson(initialData.contactPerson);
      setEmail(initialData.email);
      setPhone(initialData.phone);
      setWhatsappPhone(initialData.whatsappPhone || initialData.phone || '');
      setCustomerType(initialData.type || initialData.customerType || 'Enterprise');
      setStatusStage(initialData.statusStage);
      setDealValue(initialData.dealValue);
      setNotes(initialData.notes);
      setCustomerId(initialData.customerId);
      setDealId(initialData.dealId);
      setNewLead(initialData.newLead);
      setAssignedTo(
        initialData.assignedTo ||
          (currentUser ? currentUser.userName : salesAgentOptions[0]?.name || 'admin')
      );
      setReminderDate(initialData.reminderDate || '');
      setReminderTime(initialData.reminderTime || '10:00');
      setReminderNote(initialData.reminderNote || '');
      setEnableReminder(Boolean(initialData.reminderDate));

      setFollowUpDate(initialData.followUpDate || '');
      setFollowUpTime(initialData.followUpTime || '11:00 AM');
      setFollowUpPurpose(initialData.followUpPurpose || 'Meeting - Discuss Further Information');
      setEnableFollowUp(Boolean(initialData.followUpDate));

      setCaseAction(initialData.latestCase || 'called 7/9/2025');
      setCallType(initialData.latestCallType || 'Outbound Call');
      setCaseNotes('');
      setCaseHistoryList(initialData.caseHistory || []);
      setPhotoUrl(initialData.photoUrl || '');
      setPhotoName(initialData.photoName || '');
      setPoultryType(initialData.poultryType || 'دجاج تسمين (Broilers)');
      setBirdCount(initialData.birdCount !== undefined ? initialData.birdCount : '');
      setFlockAge(initialData.flockAge || '');
      setFeedProducts(initialData.feedProducts || '');
    } else {
      const randCust = Math.floor(1000 + Math.random() * 9000);
      const randDeal = Math.floor(1000 + Math.random() * 9000);
      setCompanyName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setWhatsappPhone('');
      setCustomerType('Enterprise');
      setStatusStage('Lead');
      setDealValue(50000);
      setNotes('');
      setPoultryType('دجاج تسمين (Broilers)');
      setBirdCount('');
      setFlockAge('');
      setFeedProducts('');
      setCustomerId(`CUST-${randCust}`);
      setDealId(`DEAL-${randDeal}`);
      setNewLead(true);
      setReminderDate(getTodayISO());
      setReminderTime('10:00');
      setReminderNote('Follow up on initial discovery requirements');
      setEnableReminder(true);

      setFollowUpDate('');
      setFollowUpTime('11:00 AM');
      setFollowUpPurpose('Meeting to know further information');
      setEnableFollowUp(false);

      setCaseAction('called 7/9/2025');
      setCallType('Outbound Call');
      setCaseNotes('Inbound introductory telephone call conducted.');
      setCaseHistoryList([]);
      setPhotoUrl('');
      setPhotoName('');

      if (currentUser && currentUser.role === 'Sales Agent') {
        setAssignedTo(currentUser.userName);
      } else {
        setAssignedTo(salesAgentOptions[0]?.name || currentUser?.userName || 'admin');
      }
    }
    setErrors({});
  }, [initialData, isOpen, currentUser, salesAgentOptions]);

  if (!isOpen) return null;

  const handleCopyPhoneToWhatsapp = () => {
    if (phone.trim()) {
      setWhatsappPhone(phone.trim());
    }
  };

  const handleSetQuickReminder = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const dateStr = d.toISOString().split('T')[0];
    setReminderDate(dateStr);
    setEnableReminder(true);
  };

  const handleAddCaseHistoryItem = () => {
    if (!caseAction.trim()) return;

    const now = new Date().toISOString();
    const breakdown = getHistoryTimeBreakdown(now);
    const newEntry: CustomerCaseEntry = {
      id: `case-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: now,
      dayName: breakdown.dayName,
      date: breakdown.date,
      time: breakdown.time,
      title: caseAction.trim(),
      caseType: caseAction.toLowerCase().includes('whatsapp')
        ? 'whatsapp'
        : caseAction.toLowerCase().includes('meeting')
        ? 'meeting'
        : 'call',
      callType: callType.trim() || 'Outbound Call',
      user: currentUser?.userName || assignedTo || 'admin',
      loggedBy: currentUser?.userName || assignedTo || 'admin',
      notes: caseNotes.trim() || undefined,
    };

    setCaseHistoryList((prev) => [newEntry, ...prev]);
    setCaseNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required.';
    }
    if (!contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const assignedAgent = salesAgentOptions.find((a) => a.name === assignedTo);
    const assignedEmail = assignedAgent
      ? assignedAgent.email
      : currentUser?.email || 'admin@gmail.com';

    const now = new Date().toISOString();
    const nowBreakdown = getHistoryTimeBreakdown(now);

    const createdAt = initialData?.createdAt || now;
    const createdBreakdown = getHistoryTimeBreakdown(createdAt);

    let history: CustomerHistoryEntry[] = initialData?.history ? [...initialData.history] : [];

    if (isEditing) {
      const stageChanged = initialData?.statusStage !== statusStage;
      const actionText = stageChanged
        ? `Stage changed from ${initialData?.statusStage} to ${statusStage}`
        : 'Account details updated';

      history.push({
        id: `hist-${customerId}-${Date.now()}`,
        timestamp: now,
        dayName: nowBreakdown.dayName,
        date: nowBreakdown.date,
        time: nowBreakdown.time,
        fullFormatted: nowBreakdown.fullFormatted,
        action: actionText,
        user: currentUser?.userName || assignedTo || 'admin',
        details: notes.trim() ? `Note: ${notes.trim()}` : actionText,
        previousValue: initialData?.statusStage,
        newValue: statusStage,
        callType: caseAction.toLowerCase().includes('call') ? (callType.trim() || 'Outbound Call') : undefined,
      });
    } else {
      history.push({
        id: `hist-${customerId}-init`,
        timestamp: createdAt,
        dayName: createdBreakdown.dayName,
        date: createdBreakdown.date,
        time: createdBreakdown.time,
        fullFormatted: createdBreakdown.fullFormatted,
        action: 'Account Created',
        user: currentUser?.userName || assignedTo || 'admin',
        details: notes.trim() || 'New enterprise account registered in local files.',
        newValue: statusStage,
      });
    }

    // Build finalized case history: if caseAction is specified and not already in list, prepend it
    let finalCaseHistory = [...caseHistoryList];
    if (caseAction.trim()) {
      const alreadyLogged = finalCaseHistory.some((c) => c.title === caseAction.trim());
      if (!alreadyLogged) {
        finalCaseHistory = [
          {
            id: `case-${Date.now()}`,
            timestamp: now,
            dayName: nowBreakdown.dayName,
            date: nowBreakdown.date,
            time: nowBreakdown.time,
            title: caseAction.trim(),
            caseType: caseAction.toLowerCase().includes('whatsapp')
              ? 'whatsapp'
              : caseAction.toLowerCase().includes('meeting')
              ? 'meeting'
              : 'call',
            callType: callType.trim() || 'Outbound Call',
            user: currentUser?.userName || assignedTo || 'admin',
            loggedBy: currentUser?.userName || assignedTo || 'admin',
            notes: caseNotes.trim() || undefined,
          },
          ...finalCaseHistory,
        ];
      }
    }

    const record: CustomerRecord = {
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsappPhone: (whatsappPhone || phone).trim(),
      type: customerType.trim() || 'Enterprise',
      customerType: customerType.trim() || 'Enterprise',
      statusStage,
      dealValue: Number(dealValue) || 0,
      notes: notes.trim(),
      customerId: customerId || `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      dealId: dealId || `DEAL-${Math.floor(1000 + Math.random() * 9000)}`,
      newLead,
      assignedTo: assignedTo || (currentUser?.userName ?? 'admin'),
      assignedToEmail: assignedEmail,
      createdAt,
      updatedAt: now,
      createdDayName: initialData?.createdDayName || createdBreakdown.dayName,
      createdDate: initialData?.createdDate || createdBreakdown.date,
      createdTime: initialData?.createdTime || createdBreakdown.time,
      history,
      reminderDate: enableReminder && reminderDate ? reminderDate : undefined,
      reminderTime: enableReminder && reminderTime ? reminderTime : undefined,
      reminderNote: enableReminder && reminderNote.trim() ? reminderNote.trim() : undefined,
      reminderDismissed: false,
      followUpDate: enableFollowUp && followUpDate ? followUpDate : undefined,
      followUpTime: enableFollowUp && followUpTime ? followUpTime : undefined,
      followUpPurpose: enableFollowUp && followUpPurpose.trim() ? followUpPurpose.trim() : undefined,
      latestCase: caseAction.trim() || undefined,
      latestCallType: callType.trim() || 'Outbound Call',
      caseHistory: finalCaseHistory,
      photoUrl: photoUrl || undefined,
      photoName: photoName || undefined,
      // Poultry Feed CRM Specifications
      poultryType: poultryType.trim() || undefined,
      birdCount: birdCount !== '' && !isNaN(Number(birdCount)) ? Number(birdCount) : (birdCount ? String(birdCount).trim() : undefined),
      flockAge: flockAge.trim() || undefined,
      feedProducts: feedProducts.trim() || undefined,
    };

    onSave(record);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 id="customer-modal-title" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-[#6366f1]" />
              <span>{isEditing ? 'Update Client Record' : 'Create Enterprise Account & Deal'}</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {isEditing
                ? 'Modify client contact channels, follow-up calendar reminder, and case history.'
                : 'Enter call & WhatsApp numbers, follow-up calendar reminder, and initial case.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Automated System Signature Pill */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-[#1f2937]/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-indigo-300">
            <Sparkles className="h-4 w-4 text-[#6366f1] shrink-0" />
            <span className="font-semibold">Automated Identifiers & Timestamp:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono">
            <span className="rounded bg-[#111827] px-2 py-0.5 text-slate-300 border border-slate-700">
              {customerId}
            </span>
            <span className="rounded bg-[#111827] px-2 py-0.5 text-indigo-300 border border-slate-700 font-semibold">
              {dealId}
            </span>
            <span className="rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 font-sans font-semibold text-[11px] flex items-center gap-1">
              <Calendar className="h-3 w-3 text-indigo-400" />
              {getHistoryTimeBreakdown(initialData?.createdAt || new Date().toISOString()).dayName},{' '}
              {getHistoryTimeBreakdown(initialData?.createdAt || new Date().toISOString()).date}
            </span>
            <span className="rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 font-sans font-semibold text-[11px]">
              {newLead ? '★ New Lead Active' : 'Established Lead'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Section 1: Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company Name */}
            <div>
              <label htmlFor="modal-company-name" className="block font-semibold text-slate-300">
                Company Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative mt-1">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="modal-company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corporation"
                  className={`w-full rounded-lg border bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                    errors.companyName
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-[#6366f1] focus:ring-[#6366f1]'
                  }`}
                />
              </div>
              {errors.companyName && (
                <p className="mt-1 text-[11px] text-rose-400">{errors.companyName}</p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label htmlFor="modal-contact-person" className="block font-semibold text-slate-300">
                Contact Person <span className="text-rose-400">*</span>
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="modal-contact-person"
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Jane Doe"
                  className={`w-full rounded-lg border bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                    errors.contactPerson
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-[#6366f1] focus:ring-[#6366f1]'
                  }`}
                />
              </div>
              {errors.contactPerson && (
                <p className="mt-1 text-[11px] text-rose-400">{errors.contactPerson}</p>
              )}
            </div>
          </div>

          {/* Email & Pipeline Stage & Customer Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label htmlFor="modal-email" className="block font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="modal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                />
              </div>
            </div>

            {/* Pipeline Stage */}
            <div>
              <label htmlFor="modal-status-stage" className="block font-semibold text-slate-300">
                Pipeline Stage
              </label>
              <select
                id="modal-status-stage"
                value={statusStage}
                onChange={(e) => setStatusStage(e.target.value as StageType)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
              >
                {ALL_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Type (Customizable by Employee) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label htmlFor="modal-customer-type" className="block text-xs font-semibold text-slate-300">
                  Customer Type <span className="text-[10px] text-indigo-400 font-normal">(Decided by Employee)</span>
                </label>
                <span className="text-[10px] text-slate-500">Freeform or choose preset</span>
              </div>
              <div className="relative mt-1">
                <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="modal-customer-type"
                  type="text"
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  placeholder="e.g. Enterprise, Corporate, SMB, Strategic Partner..."
                  className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-[10px]">
                <span className="text-slate-500">Employee presets:</span>
                {['Enterprise', 'Corporate', 'SMB', 'VIP Client', 'Strategic Partner', 'Government'].map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setCustomerType(tp)}
                    className="rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white transition-colors"
                  >
                    {tp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Poultry Natural & Herbal Medicines Specifications (🐔 النوع، 🔢 عدد الطيور، 📅 العمر، 🌿 الأدوية العشبية) */}
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/25 via-slate-900/50 to-slate-900/80 p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌿</span>
                <div>
                  <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>بيانات المزرعة والقطيع والأدوية العشبية الطبيعية</span>
                    <span className="text-[10px] text-emerald-400/80 font-normal">/ Natural Poultry Remedies</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    نوع الطيور، حجم القطيع، عمر الدورة، والمستحضرات والأدوية العشبية المطلوبة
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 font-mono">
                HERBAL VET REMEDIES
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* 1. 🐔 النوع (Flock Type) */}
              <div>
                <label htmlFor="modal-poultry-type" className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🐔</span>
                    <span>النوع (نوع الطيور)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Type</span>
                </label>
                <div className="relative">
                  <input
                    id="modal-poultry-type"
                    type="text"
                    value={poultryType}
                    onChange={(e) => setPoultryType(e.target.value)}
                    placeholder="مثال: دجاج تسمين، بياض، ساسو، بلدي..."
                    className="w-full rounded-xl border border-slate-700 bg-[#1f2937] py-2 px-3 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                {/* Quick Type Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    'دجاج تسمين',
                    'دجاج بياض',
                    'أمهات دواجن',
                    'دجاج ساسو',
                    'دجاج بلدي',
                    'بط',
                    'ديك رومي',
                  ].map((pType) => (
                    <button
                      key={pType}
                      type="button"
                      onClick={() => setPoultryType(pType)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                        poultryType === pType
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      {pType}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 🔢 عدد الطيور (Bird Count) */}
              <div>
                <label htmlFor="modal-bird-count" className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🔢</span>
                    <span>عدد الطيور</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Count</span>
                </label>
                <div className="relative">
                  <input
                    id="modal-bird-count"
                    type="number"
                    value={birdCount}
                    onChange={(e) => setBirdCount(e.target.value)}
                    placeholder="مثال: 10000"
                    min="0"
                    step="500"
                    className="w-full rounded-xl border border-slate-700 bg-[#1f2937] py-2 px-3 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                  />
                </div>
                {/* Quick Add Counts */}
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500">سريع:</span>
                  {[3000, 5000, 10000, 20000, 50000].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBirdCount(num)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border font-mono transition-all ${
                        Number(birdCount) === num
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      {num.toLocaleString()}
                    </button>
                  ))}
                </div>
                {/* Estimated Water & Medicine Dosage Helper */}
                {Number(birdCount) > 0 && (
                  <div className="mt-1.5 text-[10px] text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded space-y-0.5">
                    <div>💧 ماء الشرب اليومي: ~{((Number(birdCount) * 180) / 1000).toFixed(0)} لتر/يوم</div>
                    <div className="text-slate-400 font-mono">🌿 الجرعة (1 مل/لتر): ~{((Number(birdCount) * 180) / 1000).toFixed(0)} مل/يوم</div>
                  </div>
                )}
              </div>

              {/* 3. 📅 العمر (Flock Age) */}
              <div>
                <label htmlFor="modal-flock-age" className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>📅</span>
                    <span>العمر (عمر الطيور)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Age</span>
                </label>
                <div className="relative">
                  <input
                    id="modal-flock-age"
                    type="text"
                    value={flockAge}
                    onChange={(e) => setFlockAge(e.target.value)}
                    placeholder="مثال: 15 يوم، أو 4 أسابيع..."
                    className="w-full rounded-xl border border-slate-700 bg-[#1f2937] py-2 px-3 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                {/* Age Stage Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    'تحضين (1-10 يوم)',
                    'نمو (11-22 يوم)',
                    'ناهي (23-35 يوم)',
                    'إنتاج بيض',
                    'وقائي دوري',
                    'علاجي مكثف',
                  ].map((presetAge) => (
                    <button
                      key={presetAge}
                      type="button"
                      onClick={() => setFlockAge(presetAge)}
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-all ${
                        flockAge === presetAge
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      {presetAge}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. 📦 المنتجات اللي سأل عنها أو اشتراها (Inquired / Purchased Natural & Herbal Medicine Products) */}
            <div className="pt-2 border-t border-slate-800/80">
              <label htmlFor="modal-feed-products" className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>🌿</span>
                  <span>المنتجات والأدوية البيطرية العشبية والطبيعية المطلوبة</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Natural & Herbal Products</span>
              </label>
              <div className="relative">
                <input
                  id="modal-feed-products"
                  type="text"
                  value={feedProducts}
                  onChange={(e) => setFeedProducts(e.target.value)}
                  placeholder="مثال: رافع مناعة عشبي، مضاد سموم بيولوجي وعشبي، منشط كبد وغسيل كلى طبيعي، موسع شعب..."
                  className="w-full rounded-xl border border-slate-700 bg-[#1f2937] py-2 px-3 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              {/* Natural & Herbal Veterinary Medicine Products Quick Select Multi-Toggles */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'رافع مناعة عشبي',
                  'مضاد سموم بيولوجي وعشبي',
                  'منشط كبد وغسيل كلى طبيعي',
                  'موسع شعب ومضاد تنفسي عشبي',
                  'مطهر معوي ومضاد إسهال عشبي',
                  'مضاد كوكسيديا وكلوستريديا عشبي',
                  'منشط نمو وأحماض عضوية طبيعية',
                  'مستخلص أوريجانو ونعناع طبيعي',
                  'فيتامينات وأملاح معدنية مخلبية',
                  'بروبيوتيك وخمائر نافعة',
                  'مضاد إجهاد حراري وفيتامين C',
                ].map((prod) => {
                  const isSelected = feedProducts.includes(prod);
                  return (
                    <button
                      key={prod}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          const updated = feedProducts
                            .split('، ')
                            .map((p) => p.trim())
                            .filter((p) => p !== prod && p !== '')
                            .join('، ');
                          setFeedProducts(updated);
                        } else {
                          const updated = feedProducts.trim()
                            ? `${feedProducts.trim()}، ${prod}`
                            : prod;
                          setFeedProducts(updated);
                        }
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-bold shadow-xs'
                          : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{prod}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Dual Phone Numbers (Calls & WhatsApp) */}
          <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <Phone className="h-4 w-4 text-indigo-400" />
                <span>Contact Channels (Two Phone Numbers)</span>
              </div>
              <button
                type="button"
                onClick={handleCopyPhoneToWhatsapp}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Copy Call Phone to WhatsApp
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone 1: For Calls */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="modal-phone-calls" className="block text-[11px] font-semibold text-slate-300">
                    Phone Number (For Calls)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!phone.startsWith('+44')) {
                        setPhone('+44 ' + phone.replace(/^\+?[0-9]*\s*/, ''));
                      }
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono"
                    title="Insert UK Country Code"
                  >
                    🇬🇧 +44 UK
                  </button>
                </div>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                  <input
                    id="modal-phone-calls"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 20 7946 0192"
                    className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Phone 2: For WhatsApp */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="modal-phone-whatsapp" className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Phone Number (For WhatsApp)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!whatsappPhone.startsWith('+44')) {
                        setWhatsappPhone('+44' + whatsappPhone.replace(/^\+?[0-9]*/, ''));
                      }
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono"
                    title="Insert UK Country Code"
                  >
                    🇬🇧 +44 UK
                  </button>
                </div>
                <div className="relative mt-1">
                  <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                  <input
                    id="modal-phone-whatsapp"
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+44 7911 123456"
                    className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Calendar & Follow-Up Reminder */}
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span>Calendar Follow-Up & Pop-up Reminder</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-amber-200">
                <input
                  type="checkbox"
                  checked={enableReminder}
                  onChange={(e) => setEnableReminder(e.target.checked)}
                  className="rounded border-amber-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span>Enable Pop-Up Reminder</span>
              </label>
            </div>

            {enableReminder && (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Reminder Date */}
                  <div>
                    <label htmlFor="modal-reminder-date" className="block text-[11px] font-semibold text-slate-300">
                      Reminder Date
                    </label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-amber-400" />
                      <input
                        id="modal-reminder-date"
                        type="date"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Reminder Time */}
                  <div>
                    <label htmlFor="modal-reminder-time" className="block text-[11px] font-semibold text-slate-300">
                      Reminder Time
                    </label>
                    <div className="relative mt-1">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-amber-400" />
                      <input
                        id="modal-reminder-time"
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span className="text-slate-400">Quick set:</span>
                  <button
                    type="button"
                    onClick={() => handleSetQuickReminder(0)}
                    className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickReminder(1)}
                    className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickReminder(3)}
                    className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                  >
                    In 3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickReminder(7)}
                    className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                  >
                    Next Week
                  </button>
                </div>

                {/* Reminder Note */}
                <div>
                  <label htmlFor="modal-reminder-note" className="block text-[11px] font-semibold text-slate-300">
                    Follow-Up Purpose / Pop-up Message
                  </label>
                  <input
                    id="modal-reminder-note"
                    type="text"
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    placeholder="e.g. Call regarding enterprise contract review"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: Employee-Decided Follow-Up Meeting (Further Information) */}
          <div className="rounded-xl border border-sky-900/40 bg-sky-950/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                <Calendar className="h-4 w-4 text-sky-400" />
                <span>Follow-Up Meeting & Further Information <span className="text-[10px] text-sky-400/80 font-normal">(Employee Decided)</span></span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-sky-200">
                <input
                  type="checkbox"
                  checked={enableFollowUp}
                  onChange={(e) => setEnableFollowUp(e.target.checked)}
                  className="rounded border-sky-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
                />
                <span>Set Follow-Up Meeting</span>
              </label>
            </div>

            {enableFollowUp && (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Follow-up Date */}
                  <div>
                    <label htmlFor="modal-followup-date" className="block text-[11px] font-semibold text-slate-300">
                      Follow-Up Date <span className="text-[10px] text-sky-400 font-normal">(Employee Decision)</span>
                    </label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-sky-400" />
                      <input
                        id="modal-followup-date"
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Follow-up Time */}
                  <div>
                    <label htmlFor="modal-followup-time" className="block text-[11px] font-semibold text-slate-300">
                      Meeting / Call Time
                    </label>
                    <div className="relative mt-1">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-sky-400" />
                      <input
                        id="modal-followup-time"
                        type="text"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                        placeholder="11:00 AM"
                        className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Follow-up Purpose / Meeting Information */}
                <div>
                  <label htmlFor="modal-followup-purpose" className="block text-[11px] font-semibold text-slate-300">
                    Meeting Purpose / Information to Clarify <span className="text-[10px] text-slate-400 font-normal">(Decided by Employee)</span>
                  </label>
                  <input
                    id="modal-followup-purpose"
                    type="text"
                    value={followUpPurpose}
                    onChange={(e) => setFollowUpPurpose(e.target.value)}
                    placeholder="e.g. Meeting to gather further specifications, stakeholders, and timeline"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-[10px]">
                    <span className="text-slate-500">Employee presets:</span>
                    {[
                      'Meeting to know further information',
                      'Executive discovery & demo session',
                      'Review commercial contract terms',
                      'Technical architecture deep-dive',
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setFollowUpPurpose(reason)}
                        className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white transition-colors"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Client Case & Case History */}
          <div className="rounded-xl border border-slate-800 bg-[#1f2937]/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <History className="h-4 w-4 text-[#6366f1]" />
                <span>Client Case & Interaction Log</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {caseHistoryList.length} previous cases
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Case Action / Status */}
              <div className="sm:col-span-2">
                <label htmlFor="modal-case-action" className="block text-[11px] font-semibold text-slate-300">
                  Case Status / Action
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id="modal-case-action"
                    type="text"
                    value={caseAction}
                    onChange={(e) => setCaseAction(e.target.value)}
                    placeholder="e.g. called 7/9/2025"
                    className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                  />
                </div>
              </div>

              {/* Call Type (Specific to Client Case & Interaction Log) */}
              <div>
                <label htmlFor="modal-call-type" className="block text-[11px] font-semibold text-slate-300">
                  Call Type <span className="text-[10px] text-indigo-400 font-normal">(History & Timeline)</span>
                </label>
                <div className="mt-1">
                  <select
                    id="modal-call-type"
                    value={callType}
                    onChange={(e) => setCallType(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1] text-xs"
                  >
                    <option value="Outbound Call">Outbound Call</option>
                    <option value="Inbound Call">Inbound Call</option>
                    <option value="Follow-up Call">Follow-up Call</option>
                    <option value="Discovery Call">Discovery Call</option>
                    <option value="Meeting / Demo Call">Meeting / Demo Call</option>
                    <option value="WhatsApp Call">WhatsApp Call</option>
                    <option value="Closing Call">Closing Call</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Case Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="text-slate-500">Presets:</span>
              <button
                type="button"
                onClick={() => setCaseAction('called 7/9/2025')}
                className="rounded bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-indigo-300 hover:bg-indigo-500/20 font-mono"
              >
                called 7/9/2025
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const formatted = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
                  setCaseAction(`called ${formatted}`);
                }}
                className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white"
              >
                called today
              </button>
              <button
                type="button"
                onClick={() => {
                  setCaseAction('Follow-up call conducted');
                  setCallType('Follow-up Call');
                }}
                className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white"
              >
                Follow-up call
              </button>
              <button
                type="button"
                onClick={() => {
                  setCaseAction('Discovery call completed');
                  setCallType('Discovery Call');
                }}
                className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white"
              >
                Discovery call
              </button>
              <button
                type="button"
                onClick={() => setCaseAction('WhatsApp proposal sent')}
                className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white"
              >
                WhatsApp proposal sent
              </button>
              <button
                type="button"
                onClick={() => {
                  setCaseAction('Executive demo meeting');
                  setCallType('Meeting / Demo Call');
                }}
                className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white"
              >
                Executive demo
              </button>
            </div>

            {/* Case Notes */}
            <div>
              <label htmlFor="modal-case-notes" className="block text-[11px] font-semibold text-slate-400">
                Case Details / Summary Note (Optional)
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="modal-case-notes"
                  type="text"
                  value={caseNotes}
                  onChange={(e) => setCaseNotes(e.target.value)}
                  placeholder="Notes from interaction or outcome..."
                  className="flex-1 rounded-lg border border-slate-700 bg-[#1f2937] py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCaseHistoryItem}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Log Case</span>
                </button>
              </div>
            </div>

            {/* Case History Timeline */}
            {caseHistoryList.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Case History Records
                </p>
                {caseHistoryList.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-start justify-between rounded-lg border border-slate-800 bg-[#111827]/70 p-2 text-[11px]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-medium text-slate-200 flex-wrap">
                        <span className="text-indigo-400 font-semibold">{ch.title}</span>
                        {ch.callType && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {ch.callType}
                          </span>
                        )}
                        <span className="text-slate-500 font-mono text-[10px]">by {ch.user}</span>
                      </div>
                      {ch.notes && <p className="text-slate-400 text-[10px] mt-0.5">{ch.notes}</p>}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                      {ch.dayName ? `${ch.dayName}, ` : ''}{ch.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Deal Value & Assigned Sales Agent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Deal Value */}
            <div>
              <label htmlFor="modal-deal-value" className="block font-semibold text-slate-300">
                Deal Value (£ GBP)
              </label>
              <div className="relative mt-1">
                <PoundSterling className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                <input
                  id="modal-deal-value"
                  type="number"
                  min="0"
                  step="1000"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  placeholder="50000"
                  className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1] font-mono"
                />
              </div>
            </div>

            {/* Assigned Team Member */}
            <div>
              <label htmlFor="modal-assigned-agent" className="block font-semibold text-slate-300">
                Assigned Team Member
              </label>
              <select
                id="modal-assigned-agent"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 px-3 text-white focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
              >
                {salesAgentOptions.map((agent) => (
                  <option key={agent.name} value={agent.name}>
                    {agent.name} ({agent.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo / Document Upload Section */}
          <div className="rounded-xl border border-slate-800 bg-[#1f2937]/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <ImageIcon className="h-4 w-4 text-indigo-400" />
                <span>Client Photo / Contract Document</span>
              </div>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrl('');
                    setPhotoName('');
                  }}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {photoUrl ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-700/80 bg-[#111827] p-2.5">
                <img
                  src={photoUrl}
                  alt={photoName || 'Client Photo'}
                  className="h-16 w-16 rounded-md object-cover border border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{photoName || 'Uploaded Image'}</p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Photo attached successfully</p>
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="customer-photo-input"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-[#111827]/60 p-4 text-center cursor-pointer hover:border-indigo-500 hover:bg-[#111827] transition-all"
                >
                  <Upload className="h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-300">Click to upload photo or drag & drop</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, or WebP (contract scan or customer avatar)</span>
                  <input
                    id="customer-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setPhotoName(file.name);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (typeof event.target?.result === 'string') {
                          setPhotoUrl(event.target.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
                {/* Preset sample avatars for instant one-click testing */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2 text-[10px]">
                  <span className="text-slate-500">Sample presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80');
                      setPhotoName('executive_headshot.jpg');
                    }}
                    className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white"
                  >
                    Executive Headshot
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80');
                      setPhotoName('corporate_hq_office.jpg');
                    }}
                    className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300 hover:text-white"
                  >
                    Office HQ Photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="modal-notes" className="block font-semibold text-slate-300">
              Account Executive Notes
            </label>
            <div className="relative mt-1">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <textarea
                id="modal-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enterprise requirements, decision maker status, procurement milestones..."
                className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2 pl-9 pr-3 text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-600 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isEditing ? 'Save Changes' : 'Create Client Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

