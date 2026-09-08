import { CustomerRecord, SheetUser, CRMNotification, AuditLogEntry, AuditActionType } from '../types';
import {
  getCachedCustomers as getFileCustomers,
  saveCachedCustomers as saveFileCustomers,
  getCachedUsers as getFileUsers,
  saveCachedUsers as saveFileUsers,
  getCachedAuditLogs as getFileAuditLogs,
  saveCachedAuditLogs as saveFileAuditLogs,
  createAuditLogEntry as createFileAuditLog,
  createCustomerHistoryEntry,
  authenticateUserWithFiles,
  exportCustomersAsJSON,
  exportFullBundleAsJSON,
  exportCustomersAsCSV,
  parseImportedJSON,
  resetToFileDefaults,
  STORAGE_KEY_AUTH_USER,
  STORAGE_KEY_THEME,
} from './fileStorage';
import { getHistoryTimeBreakdown } from '../utils/dateTime';

export {
  createCustomerHistoryEntry,
  authenticateUserWithFiles,
  exportCustomersAsJSON,
  exportFullBundleAsJSON,
  exportCustomersAsCSV,
  parseImportedJSON,
  resetToFileDefaults,
};

export const SPREADSHEET_ID = 'customers.json';
export const APPS_SCRIPT_WEBAPP_URL = 'Local File System';

export const STORAGE_KEY_CUSTOMERS = 'executive_crm_file_customers_v4';
export const STORAGE_KEY_USERS = 'executive_crm_file_users_v4';
export const STORAGE_KEY_NOTIFICATIONS = 'executive_crm_notifications_v4';
export const STORAGE_KEY_AUDIT_LOGS = 'executive_crm_file_audit_v4';

const initBreakdown = getHistoryTimeBreakdown(new Date());

export const INITIAL_NOTIFICATIONS: CRMNotification[] = [
  {
    id: 'notif-file-init',
    title: 'Local File Storage Active',
    description: 'Enterprise data loaded directly from customers.json & users.json with day & date history tracking.',
    timestamp: `${initBreakdown.dayName}, ${initBreakdown.date} • ${initBreakdown.time}`,
    dayName: initBreakdown.dayName,
    date: initBreakdown.date,
    type: 'file_save',
    read: false,
  },
];

export function getCachedCustomers(): CustomerRecord[] {
  return getFileCustomers();
}

export function saveCachedCustomers(records: CustomerRecord[]): void {
  saveFileCustomers(records);
}

export function getCachedUsers(): SheetUser[] {
  return getFileUsers();
}

export function saveCachedUsers(users: SheetUser[]): void {
  saveFileUsers(users);
}

export function getCachedAuditLogs(): AuditLogEntry[] {
  return getFileAuditLogs();
}

export function saveCachedAuditLogs(logs: AuditLogEntry[]): void {
  saveFileAuditLogs(logs);
}

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
  return createFileAuditLog(action, details, user, meta);
}

export function getCachedNotifications(): CRMNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) {
      saveCachedNotifications(INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }

    if (raw.includes('Google Sheet Connected') || raw.includes('customers!A:J')) {
      localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
      saveCachedNotifications(INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveCachedNotifications(notifications: CRMNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  } catch (err) {
    console.error('Failed to write notifications to localStorage:', err);
  }
}

export function getCachedUser(): SheetUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCachedUser(user: SheetUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
  } catch (err) {
    console.error('Failed to update auth session in localStorage:', err);
  }
}

export function getStoredTheme(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored === 'light') return 'light';
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function setStoredTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (err) {
    console.error('Failed to set theme in localStorage:', err);
  }
}

