import { CustomerRecord, SheetUser, StageType, UserRole } from '../types';
import {
  getCachedCustomers,
  saveCachedCustomers,
  getCachedUsers,
  saveCachedUsers,
  createCustomerHistoryEntry,
  authenticateUserWithFiles,
} from './fileStorage';
import { getHistoryTimeBreakdown } from '../utils/dateTime';

export const DEMO_ADMIN: SheetUser = {
  userName: 'admin',
  email: 'admin@gmail.com',
  password: '1234',
  role: 'Admin',
  department: 'Executive Leadership',
};

export const EXPECTED_CUSTOMER_HEADERS = [
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
  'Created Day Name',
  'Created Date',
];

export const EXPECTED_USER_HEADERS = ['user_name', 'email', 'password', 'role'];

/**
 * Loads customer records directly from local files / cache
 */
export async function fetchCustomersFromSheet(): Promise<{
  records: CustomerRecord[];
  isInitialized: boolean;
  rawRowCount: number;
  source: 'local_file';
}> {
  const records = getCachedCustomers();
  return {
    records,
    isInitialized: records.length > 0,
    rawRowCount: records.length,
    source: 'local_file',
  };
}

/**
 * Appends or saves a customer record to the local file store with history tracking
 */
export async function appendCustomerToSheet(record: CustomerRecord): Promise<boolean> {
  try {
    const existing = getCachedCustomers();
    const index = existing.findIndex(
      (c) => c.customerId === record.customerId || (c.companyName === record.companyName && c.companyName !== '')
    );

    const timeBreakdown = getHistoryTimeBreakdown(new Date());

    if (index >= 0) {
      const prev = existing[index];
      const history = prev.history || [];
      const newHistoryItem = createCustomerHistoryEntry(
        prev.statusStage !== record.statusStage
          ? `Stage changed from ${prev.statusStage} to ${record.statusStage}`
          : 'Customer Record Updated',
        record.assignedTo || 'admin',
        record.notes || 'Updated via file CRM.',
        { previousValue: prev.statusStage, newValue: record.statusStage }
      );

      existing[index] = {
        ...record,
        updatedAt: timeBreakdown.timestamp,
        history: [newHistoryItem, ...history],
      };
    } else {
      const initHistory = createCustomerHistoryEntry(
        'Account Created',
        record.assignedTo || 'admin',
        record.notes || 'New account created.',
        { newValue: record.statusStage }
      );

      const newRecord: CustomerRecord = {
        ...record,
        createdAt: timeBreakdown.timestamp,
        updatedAt: timeBreakdown.timestamp,
        createdDayName: timeBreakdown.dayName,
        createdDate: timeBreakdown.date,
        createdTime: timeBreakdown.time,
        history: [initHistory],
      };
      existing.unshift(newRecord);
    }

    saveCachedCustomers(existing);
    return true;
  } catch (err) {
    console.warn('Failed to save customer to file storage:', err);
    return false;
  }
}

/**
 * Fetch authenticated users from file storage
 */
export async function fetchUsersFromSheet(): Promise<SheetUser[]> {
  const users = getCachedUsers();
  return users.length > 0 ? users : [DEMO_ADMIN];
}

/**
 * Authenticate strictly against users stored in the files
 */
export async function authenticateUser(identifier: string, pass: string): Promise<SheetUser | null> {
  return authenticateUserWithFiles(identifier, pass);
}
