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
        (cust.assignedTo && cust.assignedTo.toLowerCase().includes(term))
      );
    });
  }, [customers, isSalesAgent, currentUser, agentFilter, selectedStageFilter, onlyNewLeads, searchTerm]);

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
      className="rounded-xl border border-slate-800 bg-[#1f2937] shadow-xl flex flex-col min-h-0 overflow-hidden"
    >
      {/* RBAC Notice Banner for Sales Agent */}
      {isSalesAgent && (
        <div className="bg-sky-950/40 border-b border-sky-800/40 px-4 py-2 flex items-center justify-between text-xs text-sky-300">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-400" />
            <span>
              <strong>Sales Agent View:</strong> Displaying accounts assigned to{' '}
              <span className="font-semibold text-white">{currentUser.userName}</span> ({filteredCustomers.length} accounts).
            </span>
          </div>
          <span className="text-[10px] text-sky-400 font-mono">RBAC Enforced</span>
        </div>
      )}

      {/* Admin Filter by Agent Banner */}
      {!isSalesAgent && agentFilter && (
        <div className="bg-indigo-950/40 border-b border-indigo-800/40 px-4 py-2 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-400" />
            <span>
              Filtered by Agent: <strong className="text-white">{agentFilter}</strong> (
              {filteredCustomers.length} accounts found)
            </span>
          </div>
          {onClearAgentFilter && (
            <button
              onClick={onClearAgentFilter}
              className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white bg-indigo-900/60 px-2 py-0.5 rounded transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      )}

      {/* Table Top Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[#111827]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            id="client-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search accounts by company, contact, or ID..."
            className="w-full rounded-lg border border-slate-700 bg-[#1f2937] py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#1f2937] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors shadow-sm"
            title="Export filtered records to CSV format"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="add-client-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Stage Filter Pills */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-[#111827]/60 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Stage:
          </span>
          <button
            onClick={() => {
              onSelectStageFilter('ALL');
              setCurrentPage(1);
            }}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              selectedStageFilter === 'ALL'
                ? 'bg-[#6366f1] text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
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
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selectedStageFilter === st
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
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
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              onlyNewLeads
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>New Leads</span>
          </button>
        </div>
      </div>

      {/* Structured Database Data Table */}
      <div className="overflow-x-auto">
        <table id="client-master-table" className="w-full text-left border-collapse text-xs text-slate-300">
          <thead className="sticky top-0 bg-[#111827] text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th scope="col" className="p-3 w-8">
                <input
                  type="checkbox"
                  checked={
                    paginatedCustomers.length > 0 &&
                    selectedIds.length === paginatedCustomers.length
                  }
                  onChange={toggleSelectAll}
                  aria-label="Select all customers on page"
                  className="rounded border-slate-700 bg-slate-800 text-[#6366f1] focus:ring-[#6366f1]"
                />
              </th>
              <th
                scope="col"
                className="p-3 font-semibold cursor-pointer select-none hover:text-white"
                onClick={() => handleSort('companyName')}
              >
                <div className="flex items-center gap-1">
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
                className="p-3 font-semibold cursor-pointer select-none hover:text-white"
                onClick={() => handleSort('contactPerson')}
              >
                <div className="flex items-center gap-1">
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
              <th scope="col" className="p-3 font-semibold">
                Assigned Agent
              </th>
              <th
                scope="col"
                className="p-3 font-semibold cursor-pointer select-none hover:text-white"
                onClick={() => handleSort('statusStage')}
              >
                <div className="flex items-center gap-1">
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
                className="p-3 font-semibold cursor-pointer select-none hover:text-white"
                onClick={() => handleSort('createdDate')}
              >
                <div className="flex items-center gap-1">
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
                className="p-3 font-semibold cursor-pointer select-none hover:text-white text-right"
                onClick={() => handleSort('dealValue')}
              >
                <div className="flex items-center justify-end gap-1">
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
              <th scope="col" className="p-3 font-semibold text-center w-16">
                Status
              </th>
              <th scope="col" className="p-3 font-semibold text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="text-sm text-slate-300 divide-y divide-slate-800">
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-7 w-7 text-slate-500" />
                    <p className="text-xs font-medium text-slate-300">
                      No matching records found
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Try adjusting your search criteria or stage filter.
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
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isSelected ? 'bg-indigo-950/30' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(customer.customerId)}
                        aria-label={`Select ${customer.companyName}`}
                        className="rounded border-slate-700 bg-slate-800 text-[#6366f1] focus:ring-[#6366f1]"
                      />
                    </td>

                    {/* Company Name & Auto IDs */}
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewCustomer(customer)}
                          className="font-semibold text-slate-100 hover:text-[#6366f1] transition-colors text-left"
                        >
                          {customer.companyName}
                        </button>
                        {customer.newLead && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[10px] text-slate-500 font-mono">
                        <span>{customer.customerId}</span>
                        <span>•</span>
                        <span className="text-indigo-400">{customer.dealId}</span>
                        {(customer.type || customer.customerType) && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 font-sans">{customer.type || customer.customerType}</span>
                          </>
                        )}
                        {customer.photoUrl && (
                          <span className="text-indigo-400 ml-0.5" title={customer.photoName || 'Photo attached'}>
                            📷
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Contact Person & Email */}
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-slate-200">{customer.contactPerson || 'Unassigned'}</span>
                        <span className="text-[10px] text-slate-500">
                          {customer.email || customer.phone || 'No email'}
                        </span>
                      </div>
                    </td>

                    {/* Assigned Sales Agent */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-[#6366f1]">
                          {(customer.assignedTo || 'Unassigned').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs text-slate-300">
                          {customer.assignedTo || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Status Stage with Inline Selector */}
                    <td className="p-3">
                      <div className="relative inline-block">
                        <select
                          value={customer.statusStage}
                          onChange={(e) =>
                            onQuickUpdateStage(customer, e.target.value as StageType)
                          }
                          aria-label={`Change stage for ${customer.companyName}`}
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border focus:outline-none cursor-pointer ${stageCfg.badgeBg}`}
                        >
                          {ALL_STAGES.map((st) => (
                            <option
                              key={st}
                              value={st}
                              className="bg-[#111827] text-white py-1"
                            >
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* History / Date Column */}
                    <td className="p-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold text-[10px] border border-indigo-500/20 whitespace-nowrap">
                            {day}
                          </span>
                          <span className="text-xs text-slate-200 font-medium whitespace-nowrap">
                            {dateStr}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {timeStr}
                        </span>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="p-3 text-right font-mono font-medium text-slate-100">
                      {formatCurrency(customer.dealValue)}
                    </td>

                    {/* Status Dot */}
                    <td className="p-3 text-center">
                      <div
                        className={`w-2 h-2 rounded-full mx-auto ${
                          customer.newLead ? 'bg-red-400 animate-pulse' : stageCfg.dotColor
                        }`}
                        title={customer.newLead ? 'New Lead (Pulse)' : customer.statusStage}
                      />
                    </td>

                    {/* Row Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewCustomer(customer)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-[#6366f1] transition-colors"
                          title="View customer details"
                          aria-label={`View details of ${customer.companyName}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onEditCustomer(customer)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          title="Edit client record"
                          aria-label={`Edit ${customer.companyName}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCustomer(customer)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title="Delete client record"
                          aria-label={`Delete ${customer.companyName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-t border-slate-800/80 gap-3 text-xs text-slate-400">
        <div>
          Showing{' '}
          <span className="font-semibold text-white">
            {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-white">
            {Math.min(currentPage * pageSize, filteredCustomers.length)}
          </span>{' '}
          of <span className="font-semibold text-white">{filteredCustomers.length}</span>{' '}
          accounts
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-700 bg-[#111827] px-3 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            Previous
          </button>
          <span className="font-mono text-slate-300">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-slate-700 bg-[#111827] px-3 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};
