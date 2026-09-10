import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  Building,
  Tag,
  AlertCircle,
  FileSpreadsheet,
  User,
  Shield,
  X,
  Calendar,
  Clock,
} from 'lucide-react';
import { CustomerRecord, StageType, SheetUser } from '../types';
import { formatCurrency, ALL_STAGES, STAGE_CONFIG } from '../utils/metrics';
import { getHistoryTimeBreakdown, safeDate } from '../utils/dateTime';

interface ClientDirectoryTableProps {
  customers: CustomerRecord[];
  currentUser: SheetUser;
  selectedStageFilter: StageType | 'ALL';
  onSelectStageFilter: (stage: StageType | 'ALL') => void;
  onViewCustomer: (customer: CustomerRecord) => void;
  onEditCustomer: (customer: CustomerRecord) => void;
  onDeleteCustomer: (customer: CustomerRecord) => void;
  onQuickUpdateStage: (customer: CustomerRecord, newStage: StageType) => void;
  onOpenAddModal: () => void;
  agentFilter?: string | null;
  onClearAgentFilter?: () => void;
}

type SortField = 'companyName' | 'dealValue' | 'statusStage' | 'contactPerson' | 'customerId' | 'createdDate';
type SortOrder = 'asc' | 'desc';

export const ClientDirectoryTable: React.FC<ClientDirectoryTableProps> = ({
  customers,
  currentUser,
  selectedStageFilter,
  onSelectStageFilter,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onQuickUpdateStage,
  onOpenAddModal,
  agentFilter,
  onClearAgentFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyNewLeads, setOnlyNewLeads] = useState(false);
  const [poultryTypeFilter, setPoultryTypeFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('dealValue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const isSalesAgent = currentUser.role === 'Sales Agent';

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'dealValue' ? 'desc' : 'asc');
    }
  };

  // Role-based visibility and filter logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      // RBAC Constraint for Sales Agent: only see their assigned accounts
      if (isSalesAgent) {
        const matchesUser =
          (cust.assignedTo && cust.assignedTo.toLowerCase() === currentUser.userName.toLowerCase()) ||
          (cust.assignedToEmail && cust.assignedToEmail.toLowerCase() === currentUser.email.toLowerCase());
        if (!matchesUser) return false;
      }

      // Explicit agent filter (from Leaderboard inspect click)
      if (agentFilter && !isSalesAgent) {
        if (cust.assignedTo?.toLowerCase() !== agentFilter.toLowerCase()) {
          return false;
        }
      }

      // Stage filter
      if (selectedStageFilter !== 'ALL' && cust.statusStage !== selectedStageFilter) {
        return false;
      }

      // New Leads filter
      if (onlyNewLeads && !cust.newLead) {
        return false;
      }

      // Poultry Type Filter
      if (poultryTypeFilter !== 'ALL') {
        const pType = (cust.poultryType || '').toLowerCase();
        if (!pType.includes(poultryTypeFilter.toLowerCase())) {
          return false;
        }
      }

      // Text search
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      return (
        cust.companyName.toLowerCase().includes(term) ||
        cust.contactPerson.toLowerCase().includes(term) ||
        cust.email.toLowerCase().includes(term) ||
        cust.phone.toLowerCase().includes(term) ||
        cust.notes.toLowerCase().includes(term) ||
        cust.customerId.toLowerCase().includes(term) ||
        cust.dealId.toLowerCase().includes(term) ||
        cust.statusStage.toLowerCase().includes(term) ||
        (cust.poultryType && cust.poultryType.toLowerCase().includes(term)) ||
        (cust.flockAge && cust.flockAge.toLowerCase().includes(term)) ||
        (cust.feedProducts && cust.feedProducts.toLowerCase().includes(term)) ||
        (cust.assignedTo && cust.assignedTo.toLowerCase().includes(term))
      );
    });
  }, [customers, isSalesAgent, currentUser, agentFilter, selectedStageFilter, onlyNewLeads, poultryTypeFilter, searchTerm]);

  const sortedCustomers = useMemo(() => {
    const list = [...filteredCustomers];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'dealValue') {
        comparison = a.dealValue - b.dealValue;
      } else if (sortField === 'companyName') {
        comparison = a.companyName.localeCompare(b.companyName);
      } else if (sortField === 'contactPerson') {
        comparison = a.contactPerson.localeCompare(b.contactPerson);
      } else if (sortField === 'statusStage') {
        comparison = a.statusStage.localeCompare(b.statusStage);
      } else if (sortField === 'customerId') {
        comparison = a.customerId.localeCompare(b.customerId);
      } else if (sortField === 'createdDate') {
        const timeA = safeDate(a.createdAt).getTime();
        const timeB = safeDate(b.createdAt).getTime();
        comparison = timeA - timeB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredCustomers, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCustomers.slice(start, start + pageSize);
  }, [sortedCustomers, currentPage, pageSize]);

  // Export to CSV with Date & Day Name tracking
  const handleExportCSV = () => {
    const headers = [
      'Company Name',
      'Contact Person',
      'Email',
      'Phone',
      'Status Stage',
      'Deal Value',
      'Notes',
      'customer_id',
      'deal_id',
      'new lead',
      'Assigned Agent',
      'Poultry Type (النوع)',
      'Bird Count (عدد الطيور)',
      'Flock Age (العمر)',
      'Feed Products (المنتجات)',
      'Created Day Name',
      'Created Date',
      'Created Time',
      'Full History Timestamp',
    ];

    const rows = sortedCustomers.map((c) => {
      const timeInfo = getHistoryTimeBreakdown(c.createdAt);
      return [
        `"${c.companyName.replace(/"/g, '""')}"`,
        `"${c.contactPerson.replace(/"/g, '""')}"`,
        `"${c.email.replace(/"/g, '""')}"`,
        `"${c.phone.replace(/"/g, '""')}"`,
        `"${c.statusStage}"`,
        c.dealValue,
        `"${c.notes.replace(/"/g, '""')}"`,
        `"${c.customerId}"`,
        `"${c.dealId}"`,
        c.newLead ? 'Yes' : 'No',
        `"${c.assignedTo || 'Unassigned'}"`,
        `"${(c.poultryType || '').replace(/"/g, '""')}"`,
        `"${c.birdCount !== undefined ? c.birdCount : ''}"`,
        `"${(c.flockAge || '').replace(/"/g, '""')}"`,
        `"${(c.feedProducts || '').replace(/"/g, '""')}"`,
        `"${c.createdDayName || timeInfo.dayName}"`,
        `"${c.createdDate || timeInfo.date}"`,
        `"${c.createdTime || timeInfo.time}"`,
        `"${c.createdAt || timeInfo.timestamp}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crm_client_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCustomers.map((c) => c.customerId));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section
      id="client-directory-section"
      aria-label="Master Client Directory"
      className="rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#111827] shadow-sm dark:shadow-xl flex flex-col min-h-0 overflow-hidden"
    >
      {/* Filter by Agent Banner */}
      {agentFilter && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-800/40 px-4 py-2.5 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-300">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              Filtered by Agent: <strong className="text-slate-900 dark:text-white font-bold">{agentFilter}</strong> (
              {filteredCustomers.length} accounts found)
            </span>
          </div>
          {onClearAgentFilter && (
            <button
              onClick={onClearAgentFilter}
              className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white bg-indigo-100/80 dark:bg-indigo-900/60 px-2.5 py-1 rounded-lg transition-colors font-medium"
            >
              <X className="h-3 w-3" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      )}

      {/* Table Top Bar */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/60 dark:bg-[#0f172a]/60">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            id="client-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search accounts by company, contact, or ID..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition-all shadow-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {selectedIds.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 mr-1 text-xs">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                {selectedIds.length} selected
              </span>
            </div>
          )}

          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xs hover:border-slate-300 dark:hover:border-slate-600 active:scale-95"
            title="Export filtered records to CSV format"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="add-client-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-[#6366f1] hover:bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:shadow-lg hover:shadow-indigo-600/30 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Stage Filter Pills */}
      <div className="px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-[#111827]/60 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
            Stage:
          </span>
          <button
            onClick={() => {
              onSelectStageFilter('ALL');
              setCurrentPage(1);
            }}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
              selectedStageFilter === 'ALL'
                ? 'bg-[#6366f1] text-white shadow-xs shadow-indigo-600/30'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({filteredCustomers.length})
          </button>

          {ALL_STAGES.map((st) => (
            <button
              key={st}
              onClick={() => {
                onSelectStageFilter(selectedStageFilter === st ? 'ALL' : st);
                setCurrentPage(1);
              }}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                selectedStageFilter === st
                  ? 'bg-[#6366f1] text-white shadow-xs shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}

          <button
            onClick={() => {
              setOnlyNewLeads(!onlyNewLeads);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
              onlyNewLeads
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3 w-3 text-amber-500 dark:text-amber-400" />
            <span>New Leads</span>
          </button>
        </div>

        {/* Poultry Type Quick Filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          <label htmlFor="poultry-filter-select" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span>🐔</span>
            <span className="hidden sm:inline">نوع الطيور:</span>
          </label>
          <select
            id="poultry-filter-select"
            value={poultryTypeFilter}
            onChange={(e) => {
              setPoultryTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-amber-300/80 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-900 dark:text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">كل أنواع الطيور (All Poultry)</option>
            <option value="تسمين">🐔 دجاج تسمين (Broilers)</option>
            <option value="بياض">🐔 دجاج بياض (Layers)</option>
            <option value="أمهات">🐔 أمهات دواجن (Breeders)</option>
            <option value="ساسو">🐔 دجاج ساسو (Sasso)</option>
            <option value="بلدي">🐔 دجاج بلدي (Baladi)</option>
            <option value="بط">🦆 بط (Ducks)</option>
            <option value="رومي">🦃 ديك رومي (Turkeys)</option>
          </select>
        </div>
      </div>

      {/* Structured Database Data Table */}
      <div className="overflow-x-auto">
        <table id="client-master-table" className="w-full text-left border-collapse text-xs text-slate-700 dark:text-slate-300">
          <thead className="sticky top-0 bg-slate-50/90 dark:bg-[#0d131f] text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800 select-none z-10">
            <tr>
              <th scope="col" className="p-3.5 w-10">
                <input
                  type="checkbox"
                  checked={
                    paginatedCustomers.length > 0 &&
                    selectedIds.length === paginatedCustomers.length
                  }
                  onChange={toggleSelectAll}
                  aria-label="Select all customers on page"
                  className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#6366f1] focus:ring-[#6366f1]"
                />
              </th>
              <th
                scope="col"
                className="p-3.5 font-bold cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={() => handleSort('companyName')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Company / IDs</span>
                  {sortField === 'companyName' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3 w-3 text-[#6366f1]" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-[#6366f1]" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="p-3.5 font-bold cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={() => handleSort('contactPerson')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Contact</span>
                  {sortField === 'contactPerson' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3 w-3 text-[#6366f1]" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-[#6366f1]" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </div>
              </th>
              {/* Poultry & Herbal Veterinary Column */}
              <th scope="col" className="p-3.5 font-bold text-emerald-700 dark:text-emerald-400">
                <div className="flex items-center gap-1">
                  <span>🌿</span>
                  <span>النوع / الطيور / الأدوية العشبية</span>
                </div>
              </th>
              <th scope="col" className="p-3.5 font-bold">
                Assigned Agent
              </th>
              <th
                scope="col"
                className="p-3.5 font-bold cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={() => handleSort('statusStage')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Stage</span>
                  {sortField === 'statusStage' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3 w-3 text-[#6366f1]" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-[#6366f1]" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="p-3.5 font-bold cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={() => handleSort('createdDate')}
              >
                <div className="flex items-center gap-1.5">
                  <span>History / Date</span>
                  {sortField === 'createdDate' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3 w-3 text-[#6366f1]" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-[#6366f1]" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="p-3.5 font-bold cursor-pointer select-none hover:text-slate-900 dark:hover:text-white text-right transition-colors"
                onClick={() => handleSort('dealValue')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Value (£)</span>
                  {sortField === 'dealValue' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3 w-3 text-[#6366f1]" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-[#6366f1]" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-30" />
                  )}
                </div>
              </th>
              <th scope="col" className="p-3.5 font-bold text-center w-16">
                Status
              </th>
              <th scope="col" className="p-3.5 font-bold text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 dark:text-slate-500">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No matching client records found
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                      Try clearing or adjusting your search term, changing the stage filter, or registering a new client.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((customer) => {
                const isSelected = selectedIds.includes(customer.customerId);
                const stageCfg = STAGE_CONFIG[customer.statusStage] || STAGE_CONFIG.Lead;
                const timeInfo = getHistoryTimeBreakdown(customer.createdAt);
                const day = customer.createdDayName || timeInfo.dayName;
                const dateStr = customer.createdDate || timeInfo.date;
                const timeStr = customer.createdTime || timeInfo.time;

                return (
                  <tr
                    key={customer.customerId}
                    className={`transition-colors duration-150 ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30'
                        : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(customer.customerId)}
                        aria-label={`Select ${customer.companyName}`}
                        className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#6366f1] focus:ring-[#6366f1]"
                      />
                    </td>

                    {/* Company Name & Auto IDs */}
                    <td className="p-3.5 font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewCustomer(customer)}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#6366f1] dark:hover:text-indigo-400 transition-colors text-left text-sm"
                        >
                          {customer.companyName}
                        </button>
                        {customer.newLead && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span className="font-semibold">{customer.customerId}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{customer.dealId}</span>
                        {(customer.type || customer.customerType) && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-slate-600 dark:text-slate-400 font-sans">
                              {customer.type || customer.customerType}
                            </span>
                          </>
                        )}
                        {customer.photoUrl && (
                          <span className="text-indigo-500 ml-0.5 text-xs" title={customer.photoName || 'Photo attached'}>
                            📷
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Contact Person & Email */}
                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {customer.contactPerson || 'Unassigned'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                          {customer.email || customer.phone || 'No email'}
                        </span>
                      </div>
                    </td>

                    {/* Poultry & Herbal Veterinary Specifications (🐔 النوع، 🔢 عدد الطيور، 📅 العمر، 🌿 الأدوية العشبية) */}
                    <td className="p-3.5">
                      <div className="flex flex-col gap-1 min-w-[210px] max-w-[260px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/90 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-500/30">
                            <span>🐔</span>
                            <span>{customer.poultryType || 'دجاج تسمين'}</span>
                          </span>

                          {customer.birdCount !== undefined && customer.birdCount !== '' && (
                            <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              🔢 {Number(customer.birdCount).toLocaleString()}
                            </span>
                          )}

                          {customer.flockAge && (
                            <span className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                              📅 {customer.flockAge}
                            </span>
                          )}
                        </div>

                        {customer.feedProducts && (
                          <div
                            className="text-[11px] text-slate-600 dark:text-slate-300 truncate flex items-center gap-1"
                            title={customer.feedProducts}
                          >
                            <span className="text-emerald-500 text-xs shrink-0">🌿</span>
                            <span className="truncate">{customer.feedProducts}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Assigned Sales Agent */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 flex items-center justify-center text-[10px] font-extrabold text-[#6366f1] dark:text-indigo-400">
                          {(customer.assignedTo || 'UN').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {customer.assignedTo || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Status Stage with Inline Selector */}
                    <td className="p-3.5">
                      <div className="relative inline-block">
                        <select
                          value={customer.statusStage}
                          onChange={(e) =>
                            onQuickUpdateStage(customer, e.target.value as StageType)
                          }
                          aria-label={`Change stage for ${customer.companyName}`}
                          className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-extrabold border focus:outline-none cursor-pointer transition-all shadow-2xs ${stageCfg.badgeBg}`}
                        >
                          {ALL_STAGES.map((st) => (
                            <option
                              key={st}
                              value={st}
                              className="bg-white dark:bg-[#111827] text-slate-900 dark:text-white py-1.5"
                            >
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* History / Date Column */}
                    <td className="p-3.5">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-500/20 whitespace-nowrap">
                            {day}
                          </span>
                          <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap">
                            {dateStr}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {timeStr}
                        </span>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(customer.dealValue)}
                    </td>

                    {/* Status Dot */}
                    <td className="p-3.5 text-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mx-auto shadow-xs ${
                          customer.newLead ? 'bg-amber-500 animate-pulse' : stageCfg.dotColor
                        }`}
                        title={customer.newLead ? 'New Lead (Pulse)' : customer.statusStage}
                      />
                    </td>

                    {/* Row Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewCustomer(customer)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-[#6366f1] transition-colors"
                          title="View customer details"
                          aria-label={`View details of ${customer.companyName}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditCustomer(customer)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Edit client record"
                          aria-label={`Edit ${customer.companyName}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteCustomer(customer)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Delete client record"
                          aria-label={`Delete ${customer.companyName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-t border-slate-200/80 dark:border-slate-800/80 gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-transparent">
        <div>
          Showing{' '}
          <span className="font-bold text-slate-900 dark:text-white">
            {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-bold text-slate-900 dark:text-white">
            {Math.min(currentPage * pageSize, filteredCustomers.length)}
          </span>{' '}
          of <span className="font-bold text-slate-900 dark:text-white">{filteredCustomers.length}</span>{' '}
          accounts
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] px-3.5 py-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all shadow-2xs"
          >
            Previous
          </button>
          <span className="font-mono font-semibold px-2 text-slate-700 dark:text-slate-300">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] px-3.5 py-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all shadow-2xs"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};
