export type StageType = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export type UserRole = 'Admin' | 'Sales Agent';

export interface CustomerHistoryEntry {
  id: string;
  timestamp: string; // ISO string
  dayName: string; // e.g. "Monday", "Tuesday"
  date: string; // e.g. "Sep 7, 2026"
  time: string; // e.g. "05:44 PM"
  fullFormatted: string; // e.g. "Monday, Sep 7, 2026 • 05:44 PM"
  action: string;
  user: string;
  details?: string;
  previousValue?: string | number;
  newValue?: string | number;
  callType?: string; // e.g. "Outbound Call", "Inbound Call", "Follow-up Meeting", etc.
}

export interface CustomerCaseEntry {
  id: string;
  timestamp?: string; // ISO string
  dayName?: string; // e.g. "Monday"
  date: string; // e.g. "7/9/2025" or "Sep 7, 2026"
  time?: string; // e.g. "02:30 PM"
  title: string; // e.g. "called 7/9/2025"
  caseType?: 'call' | 'whatsapp' | 'meeting' | 'note' | 'proposal';
  callType?: string; // e.g. "Outbound Call", "Inbound Call", "Discovery Call", "Meeting / Demo"
  user?: string;
  loggedBy?: string;
  notes?: string;
}

export interface CustomerRecord {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string; // Call Phone Number
  whatsappPhone?: string; // WhatsApp Phone Number
  type?: string; // Customer Type decided by employee (e.g. "Enterprise", "VIP", "SMB", etc.)
  customerType?: string;
  statusStage: StageType;
  dealValue: number;
  notes: string;
  customerId: string;
  dealId: string;
  newLead: boolean;
  assignedTo?: string; // Sales Agent name or email
  assignedToEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  createdDayName?: string; // e.g. "Monday"
  createdDate?: string; // e.g. "Sep 7, 2026"
  createdTime?: string; // e.g. "09:15 AM"
  history?: CustomerHistoryEntry[];
  // Reminders & Follow-up Calendar
  reminderDate?: string; // e.g. "2026-09-07"
  reminderTime?: string; // e.g. "14:00"
  reminderNote?: string;
  reminderDismissed?: boolean;
  // Follow Up Date & Meeting (Decided by employee for further information / meetings)
  followUpDate?: string; // e.g. "2026-09-12"
  followUpTime?: string; // e.g. "11:00 AM"
  followUpPurpose?: string; // e.g. "Meeting to know further information", "Executive Demo", etc.
  // Case Tracking & History
  latestCase?: string; // e.g. "called 7/9/2025"
  latestCallType?: string; // e.g. "Outbound Call"
  caseHistory?: CustomerCaseEntry[];
  // Uploaded photo / document
  photoUrl?: string;
  photoName?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  time?: string; // e.g. "10:00 AM"
  type: 'event' | 'task' | 'milestone' | 'reminder';
  category: 'my_events' | 'tasks' | 'milestones' | 'reminders';
  assignedTo?: string;
  customerId?: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  whatsappPhone?: string;
  notes?: string;
  completed?: boolean;
}

export interface CRMUser {
  userName: string;
  email: string;
  password?: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
}

export type SheetUser = CRMUser;

export interface CRMNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  dayName?: string;
  date?: string;
  time?: string;
  fullFormatted?: string;
  type: 'deal_won' | 'stage_update' | 'new_lead' | 'sync' | 'system' | 'file_save' | 'file_import';
  read: boolean;
}

export interface DashboardMetrics {
  totalAccounts: number;
  activePipelineValue: number;
  totalDealVolume: number;
  closedWonValue: number;
  closedLostValue: number;
  conversionRate: number; // percentage
  averageDealSize: number;
  newLeadsCount: number;
  stageBreakdown: {
    [key in StageType]: {
      count: number;
      value: number;
      percentage: number;
    };
  };
}

export interface FileStorageState {
  isSaving: boolean;
  lastSaved: string | null;
  lastSavedDayName?: string | null;
  error: string | null;
  source: 'local_file' | 'imported_file' | 'local_cache';
  fileName: string;
  totalRecords: number;
  backupPath?: string;
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: string | null;
  error: string | null;
  source: 'apps_script' | 'google_sheets' | 'local_cache' | 'local_file' | 'json_file' | 'disconnected';
  sheetId?: string;
  totalSyncedRows: number;
  endpointUrl?: string;
  fileName?: string;
  dayName?: string;
  isDatabaseConnected?: boolean;
  connectedAt?: string;
  disconnectedAt?: string;
}

export type AuditActionType =
  | 'CLIENT_CREATED'
  | 'STAGE_UPDATED'
  | 'DEAL_CLOSED_WON'
  | 'DEAL_CLOSED_LOST'
  | 'CLIENT_EDITED'
  | 'CLIENT_DELETED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'USER_UPDATED'
  | 'DATABASE_DISCONNECTED'
  | 'DATABASE_CLEARED'
  | 'DATABASE_CONNECTED'
  | 'SHEET_SYNC'
  | 'FILE_STORAGE_INIT'
  | 'FILE_EXPORT'
  | 'FILE_IMPORT'
  | 'FILE_RESET'
  | 'REMINDER_SCHEDULED'
  | 'REMINDER_TRIGGERED'
  | 'CASE_LOGGED';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  dayName: string; // e.g. "Monday"
  formattedDate: string; // e.g. "Sep 7, 2026"
  formattedTime: string; // e.g. "05:44 PM"
  formattedFull: string; // e.g. "Monday, Sep 7, 2026 • 05:44 PM"
  action: AuditActionType;
  details: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  entityId?: string; // customerId or dealId
  companyName?: string;
  previousValue?: string | number;
  newValue?: string | number;
}

export interface AgentLeaderboardStats {
  agentName: string;
  agentEmail: string;
  totalAccounts: number;
  closedWonDeals: number;
  closedWonValue: number;
  activePipelineValue: number;
  winRate: number; // percentage
  averageDealSize: number;
  rank: number;
}

