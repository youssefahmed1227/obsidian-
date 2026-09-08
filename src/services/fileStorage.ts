import { CustomerRecord, SheetUser, AuditLogEntry, AuditActionType, CustomerHistoryEntry, CalendarEvent, CustomerCaseEntry } from '../types';
import rawCustomers from '../data/customers.json';
import rawUsers from '../data/users.json';
import rawAuditLogs from '../data/auditLogs.json';
import { getHistoryTimeBreakdown, safeDate } from '../utils/dateTime';

export const STORAGE_KEY_CUSTOMERS = 'executive_crm_file_customers_v4';
export const STORAGE_KEY_USERS = 'executive_crm_file_users_v4';
export const STORAGE_KEY_AUDIT_LOGS = 'executive_crm_file_audit_v4';
export const STORAGE_KEY_AUTH_USER = 'executive_crm_auth_user_v4';
export const STORAGE_KEY_NOTIFICATIONS = 'executive_crm_notifications_v4';
export const STORAGE_KEY_THEME = 'executive_crm_theme_mode';
export const STORAGE_KEY_CALENDAR_EVENTS = 'executive_crm_calendar_events_v4';

/**
 * Normalizes a CustomerRecord to guarantee date and day name history fields are present.
 */
export function normalizeCustomerRecord(rec: any, index = 0): CustomerRecord {
  const createdAt = rec.createdAt || new Date(Date.now() - (index * 86400000)).toISOString();
  const createdBreakdown = getHistoryTimeBreakdown(createdAt);

  const updatedAt = rec.updatedAt || new Date().toISOString();

  let history: CustomerHistoryEntry[] = Array.isArray(rec.history) && rec.history.length > 0 ? rec.history : [];

  if (history.length === 0) {
    history = [
      {
        id: `hist-${rec.customerId || index}-init`,
        timestamp: createdAt,
        dayName: createdBreakdown.dayName,
        date: createdBreakdown.date,
        time: createdBreakdown.time,
        fullFormatted: createdBreakdown.fullFormatted,
        action: 'Account Created',
        user: rec.assignedTo || 'admin',
        details: rec.notes || 'Initial record created.',
        newValue: rec.statusStage || 'Lead',
      },
    ];
  } else {
    // Ensure every history item has dayName and date
    history = history.map((h, hIdx) => {
      const hBreakdown = getHistoryTimeBreakdown(h.timestamp);
      return {
        id: h.id || `hist-${rec.customerId || index}-${hIdx}`,
        timestamp: h.timestamp || hBreakdown.timestamp,
        dayName: h.dayName || hBreakdown.dayName,
        date: h.date || hBreakdown.date,
        time: h.time || hBreakdown.time,
        fullFormatted: h.fullFormatted || hBreakdown.fullFormatted,
        action: h.action || 'Activity recorded',
        user: h.user || rec.assignedTo || 'admin',
        details: h.details || '',
        previousValue: h.previousValue,
        newValue: h.newValue,
        callType: h.callType || (h.action?.toLowerCase().includes('call') ? 'Outbound Call' : undefined),
      };
    });
  }

  // Case history normalization
  const caseHistory: CustomerCaseEntry[] = Array.isArray(rec.caseHistory)
    ? rec.caseHistory.map((c: any, cIdx: number) => {
        const cBreakdown = getHistoryTimeBreakdown(c.timestamp || new Date().toISOString());
        return {
          id: c.id || `case-${rec.customerId || index}-${cIdx}`,
          timestamp: c.timestamp || cBreakdown.timestamp,
          dayName: c.dayName || cBreakdown.dayName,
          date: c.date || cBreakdown.date,
          time: c.time || cBreakdown.time,
          title: c.title || 'Client Interaction',
          caseType: c.caseType || 'call',
          callType: c.callType || (c.title?.toLowerCase().includes('call') ? 'Outbound Call' : 'Follow-up Call'),
          user: c.user || rec.assignedTo || 'admin',
          loggedBy: c.loggedBy || c.user || rec.assignedTo || 'admin',
          notes: c.notes || '',
        };
      })
    : [];

  // If a latest case or note mentions calling, ensure it's recorded
  const phone = rec.phone || '+44 20 7946 0192';
  const whatsappPhone = rec.whatsappPhone || (rec.phone ? rec.phone.replace(/[^0-9+]/g, '') : '+442079460192');
  const customerType = rec.type || rec.customerType || 'Enterprise';

  return {
    companyName: rec.companyName || 'Unnamed Account',
    contactPerson: rec.contactPerson || 'Primary Contact',
    email: rec.email || '',
    phone,
    whatsappPhone,
    type: customerType,
    customerType,
    statusStage: rec.statusStage || 'Lead',
    dealValue: Number(rec.dealValue) || 0,
    notes: rec.notes || '',
    customerId: rec.customerId || `CUST-${1000 + index}`,
    dealId: rec.dealId || `DEAL-${9000 + index}`,
    newLead: Boolean(rec.newLead),
    assignedTo: rec.assignedTo || 'admin',
    assignedToEmail: rec.assignedToEmail || 'admin@gmail.com',
    createdAt,
    updatedAt,
    createdDayName: rec.createdDayName || createdBreakdown.dayName,
    createdDate: rec.createdDate || createdBreakdown.date,
    createdTime: rec.createdTime || createdBreakdown.time,
    history,
    reminderDate: rec.reminderDate || undefined,
    reminderTime: rec.reminderTime || undefined,
    reminderNote: rec.reminderNote || undefined,
    reminderDismissed: Boolean(rec.reminderDismissed),
    followUpDate: rec.followUpDate || undefined,
    followUpTime: rec.followUpTime || undefined,
    followUpPurpose: rec.followUpPurpose || undefined,
    latestCase: rec.latestCase || (caseHistory[0]?.title || undefined),
    latestCallType: rec.latestCallType || (caseHistory[0]?.callType || (rec.latestCase?.toLowerCase().includes('call') ? 'Outbound Call' : undefined)),
    caseHistory,
    photoUrl: rec.photoUrl || undefined,
    photoName: rec.photoName || undefined,
  };
}

/**
 * Loads customer records from local storage cache, falling back to the bundled customers.json file.
 */
export function getCachedCustomers(): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => normalizeCustomerRecord(item, idx));
      }
    }
  } catch (err) {
    console.warn('Failed reading customers from localStorage, loading from customers.json:', err);
  }

  // Load from local file
  const initial = (rawCustomers as any[]).map((item, idx) => normalizeCustomerRecord(item, idx));
  saveCachedCustomers(initial);
  return initial;
}

export function saveCachedCustomers(records: CustomerRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save customers to localStorage:', err);
  }
}

/**
 * Loads CRM users from local cache or fallback to users.json file.
 */
export function getCachedUsers(): SheetUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed reading users from localStorage, loading from users.json:', err);
  }

  const initial = rawUsers as SheetUser[];
  saveCachedUsers(initial);
  return initial;
}

export function saveCachedUsers(users: SheetUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to localStorage:', err);
  }
}

/**
 * Normalizes an AuditLogEntry to ensure dayName, formattedDate, formattedTime are present.
 */
export function normalizeAuditLog(entry: any, index = 0): AuditLogEntry {
  const breakdown = getHistoryTimeBreakdown(entry.timestamp);

  return {
    id: entry.id || `audit-${Date.now()}-${index}`,
    timestamp: breakdown.timestamp,
    dayName: entry.dayName || breakdown.dayName,
    formattedDate: entry.formattedDate || breakdown.date,
    formattedTime: entry.formattedTime || breakdown.time,
    formattedFull: entry.formattedFull || breakdown.fullFormatted,
    action: entry.action || 'STAGE_UPDATED',
    details: entry.details || '',
    userName: entry.userName || 'admin',
    userEmail: entry.userEmail || 'admin@gmail.com',
    userRole: entry.userRole || 'Admin',
    entityId: entry.entityId,
    companyName: entry.companyName,
    previousValue: entry.previousValue,
    newValue: entry.newValue,
  };
}

/**
 * Loads audit logs from local cache or fallback to auditLogs.json file.
 */
export function getCachedAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => normalizeAuditLog(item, idx));
      }
    }
  } catch (err) {
    console.warn('Failed reading audit logs from localStorage, loading from auditLogs.json:', err);
  }

  const initial = (rawAuditLogs as any[]).map((item, idx) => normalizeAuditLog(item, idx));
  saveCachedAuditLogs(initial);
  return initial;
}

export function saveCachedAuditLogs(logs: AuditLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(logs.slice(0, 150)));
  } catch (err) {
    console.error('Failed to save audit logs to localStorage:', err);
  }
}

/**
 * Factory to create a fully tracked AuditLogEntry with Day Name, Date, and Time.
 */
export function createAuditLogEntry(
  action: AuditActionType,
  details: string,
  user: SheetUser,
  meta?: {
    entityId?: string;
    companyName?: string;
    previousValue?: string | number;
    newValue?: string | number;
  }
): AuditLogEntry {
  const breakdown = getHistoryTimeBreakdown(new Date());

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: breakdown.timestamp,
    dayName: breakdown.dayName,
    formattedDate: breakdown.date,
    formattedTime: breakdown.time,
    formattedFull: breakdown.fullFormatted,
    action,
    details,
    userName: user.userName,
    userEmail: user.email,
    userRole: user.role,
    entityId: meta?.entityId,
    companyName: meta?.companyName,
    previousValue: meta?.previousValue,
    newValue: meta?.newValue,
  };
}

/**
 * Appends an audit log entry directly to cached file storage.
 */
export function appendAuditLog(params: {
  action: AuditActionType;
  details: string;
  userName: string;
  userEmail: string;
  userRole: 'Admin' | 'Sales Agent';
  entityId?: string;
  companyName?: string;
}): void {
  const currentLogs = getCachedAuditLogs();
  const entry = createAuditLogEntry(
    params.action,
    params.details,
    {
      userName: params.userName,
      email: params.userEmail,
      role: params.userRole,
    } as SheetUser,
    {
      entityId: params.entityId,
      companyName: params.companyName,
    }
  );
  saveCachedAuditLogs([entry, ...currentLogs]);
}

/**
 * Factory to append a CustomerHistoryEntry with Day Name, Date, and Time.
 */
export function createCustomerHistoryEntry(
  action: string,
  user: string,
  details?: string,
  meta?: { previousValue?: string | number; newValue?: string | number }
): CustomerHistoryEntry {
  const breakdown = getHistoryTimeBreakdown(new Date());

  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: breakdown.timestamp,
    dayName: breakdown.dayName,
    date: breakdown.date,
    time: breakdown.time,
    fullFormatted: breakdown.fullFormatted,
    action,
    user,
    details,
    previousValue: meta?.previousValue,
    newValue: meta?.newValue,
  };
}

/**
 * Authenticates against users stored in the files.
 */
export function authenticateUserWithFiles(identifier: string, pass: string): SheetUser | null {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = pass.trim();

  const users = getCachedUsers();
  const matched = users.find(
    (u) =>
      (u.email.toLowerCase() === cleanId || u.userName.toLowerCase() === cleanId) &&
      (u.password === cleanPass || String(u.password) === cleanPass)
  );

  return matched || null;
}

/**
 * File Export: Trigger browser download of customers.json
 */
export function exportCustomersAsJSON(records: CustomerRecord[], fileName = 'customers.json'): void {
  const jsonStr = JSON.stringify(records, null, 2);
  downloadBlob(jsonStr, fileName, 'application/json');
}

/**
 * File Export: Trigger browser download of complete CRM bundle
 */
export function exportFullBundleAsJSON(
  data: {
    customers: CustomerRecord[];
    users: SheetUser[];
    auditLogs: AuditLogEntry[];
  },
  fileName = `executive_crm_data_backup_${new Date().toISOString().slice(0, 10)}.json`
): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    breakdown: getHistoryTimeBreakdown(new Date()),
    ...data,
  };
  downloadBlob(JSON.stringify(payload, null, 2), fileName, 'application/json');
}

/**
 * File Export: Trigger browser download of CSV with Day Name and History Time
 */
export function exportCustomersAsCSV(records: CustomerRecord[], fileName = 'customers.csv'): void {
  const headers = [
    'Customer ID',
    'Deal ID',
    'Company Name',
    'Contact Person',
    'Email',
    'Phone',
    'Status Stage',
    'Deal Value',
    'New Lead',
    'Assigned Agent',
    'Created Day Name',
    'Created Date',
    'Created Time',
    'Created Timestamp (ISO)',
    'Last Updated (ISO)',
    'Notes',
  ];

  const rows = records.map((c) => {
    const cTime = getHistoryTimeBreakdown(c.createdAt);
    return [
      `"${c.customerId}"`,
      `"${c.dealId}"`,
      `"${c.companyName.replace(/"/g, '""')}"`,
      `"${c.contactPerson.replace(/"/g, '""')}"`,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.phone.replace(/"/g, '""')}"`,
      `"${c.statusStage}"`,
      c.dealValue,
      c.newLead ? 'Yes' : 'No',
      `"${c.assignedTo || 'Unassigned'}"`,
      `"${c.createdDayName || cTime.dayName}"`,
      `"${c.createdDate || cTime.date}"`,
      `"${c.createdTime || cTime.time}"`,
      `"${c.createdAt || cTime.timestamp}"`,
      `"${c.updatedAt || new Date().toISOString()}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, fileName, 'text/csv;charset=utf-8;');
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * File Import: Parse JSON text into CustomerRecord array with normalization.
 */
export function parseImportedJSON(jsonText: string): {
  success: boolean;
  records?: CustomerRecord[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonText);
    let list: any[] = [];

    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (parsed && Array.isArray(parsed.customers)) {
      list = parsed.customers;
    } else {
      return { success: false, error: 'JSON does not contain an array of customer records.' };
    }

    const normalized = list.map((item, idx) => normalizeCustomerRecord(item, idx));
    return { success: true, records: normalized };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Invalid JSON format.' };
  }
}

/**
 * Full Database File Backup: Export JSON of all customers, users, and audit logs with history time.
 */
export function exportFullBackupJSON(): void {
  const customers = getCachedCustomers();
  const users = getCachedUsers();
  const auditLogs = getCachedAuditLogs();
  const now = new Date().toISOString();
  const backup = {
    exportedAt: now,
    timeBreakdown: getHistoryTimeBreakdown(now),
    version: '4.0.0',
    storageMode: 'local_files',
    counts: {
      customers: customers.length,
      users: users.length,
      auditLogs: auditLogs.length,
    },
    customers,
    users,
    auditLogs,
  };
  const jsonStr = JSON.stringify(backup, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(jsonStr, `crm_file_backup_${dateStr}.json`, 'application/json');
}

/**
 * Resets local database back to bundled data files.
 */
export function resetToFileDefaults(): {
  customers: CustomerRecord[];
  users: SheetUser[];
  auditLogs: AuditLogEntry[];
} {
  const customers = (rawCustomers as any[]).map((item, idx) => normalizeCustomerRecord(item, idx));
  const users = rawUsers as SheetUser[];
  const auditLogs = (rawAuditLogs as any[]).map((item, idx) => normalizeAuditLog(item, idx));

  saveCachedCustomers(customers);
  saveCachedUsers(users);
  saveCachedAuditLogs(auditLogs);

  return { customers, users, auditLogs };
}

export const STORAGE_KEY_DB_CONFIG = 'executive_crm_database_config_v4';

export interface DatabaseConnectionConfig {
  isConnected: boolean;
  sourceName: string;
  sheetId?: string;
  endpointUrl?: string;
  locale: 'en-GB' | 'en-US';
  currency: 'GBP' | 'USD';
  connectedAt?: string;
  disconnectedAt?: string;
  disconnectedBy?: string;
}

export function getDatabaseConnectionConfig(): DatabaseConnectionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DB_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read database config:', err);
  }

  const defaultConfig: DatabaseConnectionConfig = {
    isConnected: true,
    sourceName: 'Google Sheets & Local JSON (UK en_GB)',
    sheetId: 'customers.json',
    endpointUrl: 'https://script.google.com/macros/s/AKfycbz_UK_CRM_ENGINE/exec',
    locale: 'en-GB',
    currency: 'GBP',
    connectedAt: '2026-09-07T09:00:00.000Z',
  };
  saveDatabaseConnectionConfig(defaultConfig);
  return defaultConfig;
}

export function saveDatabaseConnectionConfig(config: DatabaseConnectionConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_DB_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save database config:', err);
  }
}

/**
 * Disconnect and remove the currently connected database (Admin only)
 */
export function disconnectDatabaseSource(currentAdmin: SheetUser): DatabaseConnectionConfig {
  const current = getDatabaseConnectionConfig();
  const now = new Date().toISOString();
  const updated: DatabaseConnectionConfig = {
    ...current,
    isConnected: false,
    sourceName: 'Disconnected / No Database Linked',
    disconnectedAt: now,
    disconnectedBy: currentAdmin.userName,
  };
  saveDatabaseConnectionConfig(updated);

  appendAuditLog({
    action: 'DATABASE_DISCONNECTED',
    details: `Admin ${currentAdmin.userName} (${currentAdmin.email}) disconnected and removed the active database source.`,
    userName: currentAdmin.userName,
    userEmail: currentAdmin.email,
    userRole: currentAdmin.role,
  });

  return updated;
}

/**
 * Reconnect or link a new database source (Admin only)
 */
export function reconnectDatabaseSource(
  sourceName: string,
  sheetId = 'customers.json',
  endpointUrl = '',
  currentAdmin?: SheetUser
): DatabaseConnectionConfig {
  const now = new Date().toISOString();
  const updated: DatabaseConnectionConfig = {
    isConnected: true,
    sourceName,
    sheetId,
    endpointUrl: endpointUrl || 'https://script.google.com/macros/s/AKfycbz_UK_CRM_ENGINE/exec',
    locale: 'en-GB',
    currency: 'GBP',
    connectedAt: now,
  };
  saveDatabaseConnectionConfig(updated);

  if (currentAdmin) {
    appendAuditLog({
      action: 'DATABASE_CONNECTED',
      details: `Admin ${currentAdmin.userName} connected database: ${sourceName} (${sheetId})`,
      userName: currentAdmin.userName,
      userEmail: currentAdmin.email,
      userRole: currentAdmin.role,
    });
  }

  return updated;
}

/**
 * Wipe/clear all customer records in the database (Admin only)
 */
export function clearAllCustomerRecords(currentAdmin: SheetUser): void {
  saveCachedCustomers([]);
  appendAuditLog({
    action: 'DATABASE_CLEARED',
    details: `Admin ${currentAdmin.userName} cleared all client customer records from the active database.`,
    userName: currentAdmin.userName,
    userEmail: currentAdmin.email,
    userRole: currentAdmin.role,
  });
}

/**
 * Add a new user to the CRM (Admin only)
 */
export function addUserToFileStorage(
  newUser: SheetUser,
  currentAdmin: SheetUser
): { success: boolean; error?: string; users: SheetUser[] } {
  const users = getCachedUsers();
  const cleanUserName = newUser.userName.trim();
  const cleanEmail = newUser.email.trim().toLowerCase();

  if (!cleanUserName || !cleanEmail || !newUser.password) {
    return { success: false, error: 'Username, email, and password are required.', users };
  }

  const existingName = users.find(
    (u) => u.userName.toLowerCase() === cleanUserName.toLowerCase()
  );
  if (existingName) {
    return { success: false, error: `Username "${cleanUserName}" is already registered.`, users };
  }

  const existingEmail = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return { success: false, error: `Email "${cleanEmail}" is already registered.`, users };
  }

  const userToAdd: SheetUser = {
    userName: cleanUserName,
    email: cleanEmail,
    password: newUser.password.trim(),
    role: newUser.role || 'Sales Agent',
    department: newUser.department?.trim() || 'Sales Operations (UK)',
  };

  const updatedUsers = [...users, userToAdd];
  saveCachedUsers(updatedUsers);

  appendAuditLog({
    action: 'USER_CREATED',
    details: `Admin ${currentAdmin.userName} registered new user: ${userToAdd.userName} (${userToAdd.role}) in ${userToAdd.department}`,
    userName: currentAdmin.userName,
    userEmail: currentAdmin.email,
    userRole: currentAdmin.role,
  });

  return { success: true, users: updatedUsers };
}

/**
 * Remove a user from the CRM (Admin only)
 */
export function removeUserFromFileStorage(
  targetIdentifier: string,
  currentAdmin: SheetUser
): { success: boolean; error?: string; users: SheetUser[] } {
  const users = getCachedUsers();
  const cleanId = targetIdentifier.trim().toLowerCase();

  const targetUser = users.find(
    (u) => u.userName.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
  );

  if (!targetUser) {
    return { success: false, error: 'User not found.', users };
  }

  // Guard: Cannot remove yourself
  if (
    targetUser.userName.toLowerCase() === currentAdmin.userName.toLowerCase() ||
    targetUser.email.toLowerCase() === currentAdmin.email.toLowerCase()
  ) {
    return { success: false, error: 'You cannot remove your own active Admin account.', users };
  }

  // Guard: Cannot remove last remaining Admin
  if (targetUser.role === 'Admin') {
    const adminCount = users.filter((u) => u.role === 'Admin').length;
    if (adminCount <= 1) {
      return { success: false, error: 'Cannot remove the only remaining Admin account.', users };
    }
  }

  const updatedUsers = users.filter(
    (u) => u.userName.toLowerCase() !== cleanId && u.email.toLowerCase() !== cleanId
  );
  saveCachedUsers(updatedUsers);

  appendAuditLog({
    action: 'USER_DELETED',
    details: `Admin ${currentAdmin.userName} removed user account: ${targetUser.userName} (${targetUser.role})`,
    userName: currentAdmin.userName,
    userEmail: currentAdmin.email,
    userRole: currentAdmin.role,
  });

  return { success: true, users: updatedUsers };
}

/**
 * Update an existing user (Admin only)
 */
export function updateUserInFileStorage(
  targetIdentifier: string,
  updates: Partial<SheetUser>,
  currentAdmin: SheetUser
): { success: boolean; error?: string; users: SheetUser[] } {
  const users = getCachedUsers();
  const cleanId = targetIdentifier.trim().toLowerCase();

  const index = users.findIndex(
    (u) => u.userName.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
  );

  if (index === -1) {
    return { success: false, error: 'User not found.', users };
  }

  const existing = users[index];
  const updatedUser: SheetUser = {
    ...existing,
    ...updates,
    userName: updates.userName?.trim() || existing.userName,
    email: updates.email?.trim().toLowerCase() || existing.email,
    role: updates.role || existing.role,
    department: updates.department !== undefined ? updates.department.trim() : existing.department,
    password: updates.password?.trim() || existing.password,
  };

  users[index] = updatedUser;
  saveCachedUsers(users);

  appendAuditLog({
    action: 'USER_UPDATED',
    details: `Admin ${currentAdmin.userName} updated user details for: ${updatedUser.userName}`,
    userName: currentAdmin.userName,
    userEmail: currentAdmin.email,
    userRole: currentAdmin.role,
  });

  return { success: true, users };
}

/**
 * Default seed events for the calendar (centered on September 2026).
 */
export function getDefaultCalendarEvents(): CalendarEvent[] {
  return [
    {
      id: 'evt-1',
      title: 'Call Eleanor Vance (Apex Cloud)',
      date: '2026-09-07',
      time: '10:00 AM',
      type: 'event',
      category: 'my_events',
      assignedTo: 'sarah.j',
      companyName: 'Apex Cloud Systems',
      contactPerson: 'Eleanor Vance',
      phone: '+1 (415) 882-9011',
      whatsappPhone: '+1 (415) 882-9011',
      notes: 'Review deployment schedule and Q4 terms.',
    },
    {
      id: 'evt-2',
      title: 'WhatsApp Check-in: Marcus Brody',
      date: '2026-09-08',
      time: '02:30 PM',
      type: 'reminder',
      category: 'reminders',
      assignedTo: 'michael.c',
      companyName: 'Nexus Global Logistics',
      contactPerson: 'Marcus Brody',
      phone: '+1 (312) 499-2310',
      whatsappPhone: '+1 (312) 499-2310',
      notes: 'Send updated enterprise proposal via WhatsApp.',
    },
    {
      id: 'evt-3',
      title: 'Quarterly Sales Pipeline Milestone',
      date: '2026-09-09',
      time: '05:00 PM',
      type: 'milestone',
      category: 'milestones',
      assignedTo: 'admin',
      notes: 'Executive board revenue benchmark review.',
    },
    {
      id: 'evt-4',
      title: 'Contract Signing & Security Audit Task',
      date: '2026-09-11',
      time: '11:00 AM',
      type: 'task',
      category: 'tasks',
      assignedTo: 'sarah.j',
      companyName: 'Crestline BioTech',
      contactPerson: 'Dr. Alistair Thorne',
      phone: '+1 (617) 502-8841',
      whatsappPhone: '+1 (617) 502-8841',
      notes: 'Finalize HIPAA and SOC2 compliance addendum.',
    },
    {
      id: 'evt-5',
      title: 'Demo Call: Vantage Financial',
      date: '2026-09-15',
      time: '03:00 PM',
      type: 'event',
      category: 'my_events',
      assignedTo: 'john.d',
      companyName: 'Vantage Financial',
      contactPerson: 'Sophia Chen',
      phone: '+1 (212) 774-3200',
      whatsappPhone: '+1 (212) 774-3200',
      notes: 'Walkthrough executive analytics dashboard.',
    },
  ];
}

/**
 * Loads cached calendar events from localStorage, falling back to defaults.
 */
export function getCachedCalendarEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALENDAR_EVENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed reading calendar events from localStorage:', err);
  }

  const defaults = getDefaultCalendarEvents();
  saveCachedCalendarEvents(defaults);
  return defaults;
}

/**
 * Saves calendar events to localStorage.
 */
export function saveCachedCalendarEvents(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CALENDAR_EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Failed saving calendar events to localStorage:', err);
  }
}

