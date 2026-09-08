import React, { useRef, useState } from 'react';
import {
  X,
  FileCode,
  HardDrive,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  FolderOpen,
  Calendar,
  Clock,
  Shield,
  Layers,
  Database,
  Check,
  AlertCircle,
  Unlink,
  Trash2,
  Link,
  Code2,
  Copy,
  ExternalLink,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { SyncState, CustomerRecord, SheetUser } from '../types';
import {
  exportFullBackupJSON,
  exportCustomersAsCSV,
  parseImportedJSON,
  saveCachedCustomers,
  appendAuditLog,
  getCachedCustomers,
} from '../services/fileStorage';
import { getHistoryTimeBreakdown } from '../utils/dateTime';

interface SheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: SyncState;
  currentUser?: SheetUser;
  onTriggerSync: () => void;
  onResetSeedData: () => void;
  onCustomersImported?: (newCustomers: CustomerRecord[]) => void;
  onDisconnectDatabase?: () => void;
  onClearAllRecords?: () => void;
  onReconnectDatabase?: (sourceName: string, sheetId?: string) => void;
}

const UK_GOOGLE_SHEETS_CODE = `/**
 * =========================================================================
 * OBSIDIAN CRM - UK GOOGLE SHEETS APPS SCRIPT ENGINE (v4.0 UK)
 * =========================================================================
 * Instructions for UK Google Sheets:
 * 1. Open your Google Sheet in https://sheets.google.com
 * 2. Click File > Settings > Set Locale to "United Kingdom" (Currency: GBP £)
 * 3. Go to Extensions > Apps Script
 * 4. Paste this code, click Save, then Deploy > New deployment
 * 5. Type: "Web App" | Execute as: "Me" | Who has access: "Anyone"
 * 6. Copy the Web App URL into Obsidian CRM.
 * =========================================================================
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Customers") || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ records: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var records = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    records.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    locale: "en_GB",
    currency: "GBP",
    countryCode: "+44",
    records: records
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Customers") || ss.getSheets()[0];
    
    if (body.action === "SAVE_CUSTOMER") {
      var rec = body.record;
      var data = sheet.getDataRange().getValues();
      var foundRow = -1;
      
      for (var r = 1; r < data.length; r++) {
        if (data[r][7] === rec.customerId || data[r][0] === rec.companyName) {
          foundRow = r + 1;
          break;
        }
      }
      
      var nowUK = Utilities.formatDate(new Date(), "Europe/London", "dd/MM/yyyy HH:mm");
      var rowData = [
        rec.companyName || "",
        rec.contactPerson || "",
        rec.email || "",
        rec.phone || "+44",
        rec.whatsappPhone || "+44",
        rec.type || "Enterprise",
        rec.statusStage || "Lead",
        Number(rec.dealValue) || 0,
        rec.notes || "",
        rec.customerId || "",
        rec.dealId || "",
        rec.newLead ? "Yes" : "No",
        rec.assignedTo || "admin",
        rec.createdDayName || "",
        rec.createdDate || nowUK,
        JSON.stringify(rec.history || [])
      ];
      
      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "UK Sheet updated" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const SheetSyncModal: React.FC<SheetSyncModalProps> = ({
  isOpen,
  onClose,
  syncState,
  currentUser,
  onTriggerSync,
  onResetSeedData,
  onCustomersImported,
  onDisconnectDatabase,
  onClearAllRecords,
  onReconnectDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'database' | 'uk_sheets_code'>('database');
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [customSheetId, setCustomSheetId] = useState('');
  const [showConnectForm, setShowConnectForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'Admin';
  const nowBreakdown = getHistoryTimeBreakdown(new Date().toISOString());
  const isConnected = syncState.isDatabaseConnected !== false && syncState.source !== 'disconnected';

  const handleExportJSON = () => {
    exportFullBackupJSON();
    setImportMessage({
      type: 'success',
      text: 'Full CRM file backup JSON downloaded with day names and history timestamps!',
    });
  };

  const handleExportCSV = () => {
    const custs = getCachedCustomers();
    exportCustomersAsCSV(custs, `crm_accounts_uk_${new Date().toISOString().slice(0, 10)}.csv`);
    setImportMessage({
      type: 'success',
      text: 'Customer records CSV downloaded with day names and formatted dates (UK format)!',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseImportedJSON(content);
      if (res.success && res.records) {
        saveCachedCustomers(res.records);
        appendAuditLog({
          action: 'FILE_IMPORT',
          details: `Imported ${res.records.length} customer records from file: ${file.name}`,
          userName: currentUser?.userName || 'Admin',
          userEmail: currentUser?.email || 'admin@gmail.com',
          userRole: currentUser?.role || 'Admin',
        });
        if (onCustomersImported) {
          onCustomersImported(res.records);
        }
        setImportMessage({
          type: 'success',
          text: `Successfully imported ${res.records.length} accounts from ${file.name}!`,
        });
      } else {
        setImportMessage({
          type: 'error',
          text: res.error || 'Failed to parse the imported file.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(UK_GOOGLE_SHEETS_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConfirmDisconnect = () => {
    if (onDisconnectDatabase) {
      onDisconnectDatabase();
      setShowDisconnectConfirm(false);
      setImportMessage({
        type: 'success',
        text: 'Database successfully disconnected and removed by Admin.',
      });
    }
  };

  const handleConfirmClearRecords = () => {
    if (onClearAllRecords) {
      onClearAllRecords();
      setShowClearConfirm(false);
      setImportMessage({
        type: 'success',
        text: 'All client database records cleared by Admin.',
      });
    }
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetId.trim()) return;
    if (onReconnectDatabase) {
      onReconnectDatabase('Google Sheets UK Custom', customSheetId.trim());
      setShowConnectForm(false);
      setCustomSheetId('');
      setImportMessage({
        type: 'success',
        text: `Connected to Google Sheets: ${customSheetId.trim()}`,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-storage-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 id="file-storage-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Database & Google Sheets Repository</span>
                <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  🇬🇧 UK Mode (£ GBP)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Persistence Engine: <span className="font-mono text-indigo-400">Google Sheets & Local JSON (en_GB)</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'database'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            <span>Connected Database</span>
          </button>
          <button
            onClick={() => setActiveTab('uk_sheets_code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'uk_sheets_code'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="h-3.5 w-3.5 text-amber-400" />
            <span>🇬🇧 UK Google Sheets Code</span>
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-xs">
          {/* Feedback message */}
          {importMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                importMessage.type === 'success'
                  ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
                  : 'border-rose-800/60 bg-rose-950/40 text-rose-300'
              }`}
            >
              {importMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>{importMessage.text}</span>
            </div>
          )}

          {activeTab === 'database' ? (
            <>
              {/* Database Status Card */}
              <div className="rounded-xl border border-slate-800 bg-[#1f2937]/60 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-2.5 w-2.5 rounded-full ${
                          isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-semibold text-white">
                        {isConnected ? 'Database Connected' : 'Database Disconnected / Removed'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 font-mono text-[10px] border border-indigo-500/20">
                        {nowBreakdown.dayName}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1">
                      {isConnected
                        ? `${syncState.totalSyncedRows} customer records linked • Date: ${nowBreakdown.date} (${nowBreakdown.time})`
                        : 'Active connection was removed by an Admin. Records remain in offline fallback cache.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={onTriggerSync}
                      disabled={syncState.isSyncing}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
                      <span>{syncState.isSyncing ? 'Syncing...' : 'Reload Data'}</span>
                    </button>
                  </div>
                </div>

                {/* Admin Only Database Connection Controls */}
                {isAdmin && (
                  <div className="pt-3 border-t border-slate-800/80 mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-purple-400" />
                        <span>Admin Database Controls</span>
                      </span>
                      <span className="text-[10px] text-purple-400 font-mono">Role: Executive Admin</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isConnected ? (
                        <button
                          id="btn-remove-database"
                          type="button"
                          onClick={() => setShowDisconnectConfirm(true)}
                          className="flex items-center gap-1.5 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/50 hover:text-white transition-colors"
                        >
                          <Unlink className="h-3.5 w-3.5" />
                          <span>Remove / Disconnect Database</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onReconnectDatabase) {
                              onReconnectDatabase('Google Sheets & Local JSON (UK en_GB)', 'customers.json');
                              setImportMessage({
                                type: 'success',
                                text: 'Database connection restored by Admin.',
                              });
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 hover:text-white transition-colors"
                        >
                          <Link className="h-3.5 w-3.5" />
                          <span>Reconnect Database</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowConnectForm(!showConnectForm)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <Globe className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Link New Sheet ID</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#111827] px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:border-rose-900 transition-colors"
                        title="Clear all client accounts from database"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Clear Client Records</span>
                      </button>
                    </div>

                    {showConnectForm && (
                      <form onSubmit={handleConnectSubmit} className="pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={customSheetId}
                          onChange={(e) => setCustomSheetId(e.target.value)}
                          placeholder="Enter Google Sheet ID or URL..."
                          className="flex-1 rounded-lg border border-slate-700 bg-[#111827] py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:border-[#6366f1] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                        >
                          Connect
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Disconnect Confirmation Alert Modal */}
              {showDisconnectConfirm && (
                <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    <span>Confirm Database Disconnection</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Are you sure you want to disconnect and remove this database connection? The application will unbind from the active data source. Offline cached records will remain locally unless cleared.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDisconnectConfirm(false)}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDisconnect}
                      className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                    >
                      Yes, Remove Database
                    </button>
                  </div>
                </div>
              )}

              {/* Clear Records Confirmation Modal */}
              {showClearConfirm && (
                <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <Trash2 className="h-4 w-4 text-rose-400" />
                    <span>Clear All Customer Records</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Are you sure you want to wipe and clear all customer accounts from the active database? This resets the customer table to 0 records. (You can re-import or reset to defaults at any time).
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmClearRecords}
                      className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                    >
                      Wipe All Records
                    </button>
                  </div>
                </div>
              )}

              {/* File Actions Card */}
              <div className="rounded-xl border border-slate-800 bg-[#1f2937]/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-400" />
                    <span className="font-bold text-white">Import & Export Operations</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">🇬🇧 UK Formatted</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Export your CRM database as a structured JSON backup or CSV spreadsheet formatted for the UK (£ GBP valuations, UK phone codes, and day names).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-700/60 bg-indigo-950/40 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/50 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Full Backup (.json)</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export UK CSV (.csv)</span>
                  </button>

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-emerald-700/60 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Import Data File (.json)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bundled Files Structure Card */}
              <div className="rounded-xl border border-slate-800 bg-[#1f2937]/40 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-white">Project Data Specifications (UK Ready)</span>
                </div>
                <div className="space-y-1.5 pt-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded border border-slate-800 bg-[#111827]">
                    <span className="text-indigo-400">src/data/customers.json</span>
                    <span className="text-slate-400">Customer deals (£ GBP), +44 phones & history</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border border-slate-800 bg-[#111827]">
                    <span className="text-emerald-400">src/data/users.json</span>
                    <span className="text-slate-400">User accounts, Admin RBAC & UK departments</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border border-slate-800 bg-[#111827]">
                    <span className="text-amber-400">src/data/auditLogs.json</span>
                    <span className="text-slate-400">Audit trail with dayName & formatted timestamps</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* UK Google Sheets Apps Script Code Panel */
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🇬🇧</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">UK Google Sheets Apps Script Setup</h3>
                      <p className="text-[11px] text-slate-400">
                        Pre-configured for United Kingdom locale (en_GB), British Pounds (£ GBP), and +44 phone formatting.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                        <span>Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy UK Script</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <p className="font-semibold text-indigo-300">Quick Integration Steps:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
                    <li>Create or open your Google Sheet in the UK (<span className="text-indigo-300">sheets.google.com</span>).</li>
                    <li>Set <strong className="text-slate-200">File &gt; Settings &gt; Locale to United Kingdom</strong>.</li>
                    <li>Open <strong className="text-slate-200">Extensions &gt; Apps Script</strong> and paste the code below.</li>
                    <li>Click <strong className="text-slate-200">Deploy &gt; New deployment &gt; Web app</strong> (Access: Anyone).</li>
                    <li>Paste the resulting Web App URL in Obsidian CRM.</li>
                  </ol>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-t-lg bg-[#0b0f19] border-t border-x border-slate-800 text-[10px] text-slate-400 font-mono">
                    <span>Google Apps Script (UK Code)</span>
                    <span className="text-emerald-400">en_GB • GBP (£) • +44</span>
                  </div>
                  <pre className="max-h-64 overflow-y-auto rounded-b-lg border border-slate-800 bg-[#0b0f19] p-3 font-mono text-[11px] text-slate-300 selection:bg-indigo-600">
                    <code>{UK_GOOGLE_SHEETS_CODE}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={onResetSeedData}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5"
            title="Reset storage to original bundled files"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset to Bundled File Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
