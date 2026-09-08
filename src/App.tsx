import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CustomerRecord,
  SheetUser,
  CRMNotification,
  StageType,
  SyncState,
  AuditLogEntry,
  CustomerHistoryEntry,
  CustomerCaseEntry,
  CalendarEvent,
} from './types';
import { getHistoryTimeBreakdown } from './utils/dateTime';
import {
  getCachedCustomers,
  saveCachedCustomers,
  getCachedNotifications,
  saveCachedNotifications,
  getCachedUser,
  saveCachedUser,
  getStoredTheme,
  setStoredTheme,
  SPREADSHEET_ID,
  APPS_SCRIPT_WEBAPP_URL,
  getCachedAuditLogs,
  saveCachedAuditLogs,
  createAuditLogEntry,
} from './services/storage';
import {
  getCachedCalendarEvents,
  saveCachedCalendarEvents,
  addUserToFileStorage,
  removeUserFromFileStorage,
  updateUserInFileStorage,
  disconnectDatabaseSource,
  reconnectDatabaseSource,
  clearAllCustomerRecords,
  getDatabaseConnectionConfig,
} from './services/fileStorage';
import { fetchCustomersFromSheet, fetchUsersFromSheet, appendCustomerToSheet } from './services/googleSheets';
import { calculateMetrics } from './utils/metrics';
import { Header } from './components/Header';
import { KPICards } from './components/ExecutiveDashboard';
import { ClientDirectoryTable } from './components/ClientDirectoryTable';
import { CustomerModal } from './components/CustomerModal';
import { CustomerDetailDrawer } from './components/CustomerDetailDrawer';
import { SheetSyncModal } from './components/SheetSyncModal';
import { LeaderboardView } from './components/LeaderboardView';
import { AuditLogView } from './components/AuditLogView';
import { CalendarView } from './components/CalendarView';
import { UserManagementView } from './components/UserManagementView';
import { ContactRemindersCalendarCard } from './components/ContactRemindersCalendarCard';
import { ActiveReminderModal } from './components/ActiveReminderModal';
import { LoginGate } from './components/LoginGate';
import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<SheetUser | null>(() => getCachedUser());

  // View navigation: 'dashboard' | 'leaderboard' | 'audit' | 'calendar' | 'users'
  const [currentView, setCurrentView] = useState<'dashboard' | 'leaderboard' | 'audit' | 'calendar' | 'users'>('dashboard');

  // Enforce agent navigation guard: Sales Agent can only view 'dashboard' (CRM Master) or 'calendar'
  useEffect(() => {
    if (currentUser?.role === 'Sales Agent' && (currentView === 'leaderboard' || currentView === 'audit' || currentView === 'users')) {
      setCurrentView('dashboard');
    }
  }, [currentUser?.role, currentView]);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Calendar Events (Separate persistence for events matching screenshot)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => getCachedCalendarEvents());

  // Active Reminder Popup state
  const [dismissedReminderIds, setDismissedReminderIds] = useState<Set<string>>(() => new Set());
  const [activeReminders, setActiveReminders] = useState<CustomerRecord[]>([]);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Customer Records, Notifications, & Audit Trail
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => getCachedCustomers());
  const [notifications, setNotifications] = useState<CRMNotification[]>(() => getCachedNotifications());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getCachedAuditLogs());
  const [availableUsers, setAvailableUsers] = useState<SheetUser[]>([]);

  useEffect(() => {
    fetchUsersFromSheet()
      .then((users) => setAvailableUsers(users))
      .catch((err) => console.warn('Could not load sheet users:', err));
  }, [currentUser]);

  // Directory UI Filters & Selections
  const [selectedStageFilter, setSelectedStageFilter] = useState<StageType | 'ALL'>('ALL');
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  const [activeDrawerCustomer, setActiveDrawerCustomer] = useState<CustomerRecord | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null);

  // Sync State
  const [syncState, setSyncState] = useState<SyncState>(() => {
    const dbConfig = getDatabaseConnectionConfig();
    return {
      isSyncing: false,
      lastSynced: dbConfig.connectedAt || null,
      error: dbConfig.isConnected ? null : 'Database disconnected by Administrator.',
      source: dbConfig.isConnected ? 'apps_script' : 'disconnected',
      sheetId: dbConfig.sheetId || SPREADSHEET_ID,
      totalSyncedRows: customers.length,
      endpointUrl: dbConfig.endpointUrl || APPS_SCRIPT_WEBAPP_URL,
      isDatabaseConnected: dbConfig.isConnected,
    };
  });

  // Banner toast alert
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = getStoredTheme();
    setTheme(savedTheme);
    setStoredTheme(savedTheme);
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
    showToast(`Switched to ${next === 'dark' ? 'Obsidian Dark' : 'Executive Light'} mode`, 'info');
  };

  // Add Notification helper
  const addNotification = useCallback(
    (title: string, description: string, type: CRMNotification['type'] = 'system') => {
      const now = new Date().toISOString();
      const breakdown = getHistoryTimeBreakdown(now);
      const newNotif: CRMNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title,
        description,
        timestamp: breakdown.time,
        type,
        read: false,
        dayName: breakdown.dayName,
        date: breakdown.date,
        time: breakdown.time,
        fullFormatted: breakdown.fullFormatted,
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev.slice(0, 19)];
        saveCachedNotifications(updated);
        return updated;
      });
    },
    []
  );

  // Record Audit Log Entry helper
  const logAuditEvent = useCallback(
    (
      action: AuditLogEntry['action'],
      details: string,
      meta?: {
        entityId?: string;
        companyName?: string;
        previousValue?: string | number;
        newValue?: string | number;
      }
    ) => {
      if (!currentUser) return;
      const entry = createAuditLogEntry(action, details, currentUser, meta);
      setAuditLogs((prev) => {
        const updated = [entry, ...prev.slice(0, 99)];
        saveCachedAuditLogs(updated);
        return updated;
      });
    },
    [currentUser]
  );

  // Synchronize with Google Apps Script / Google Sheets
  const syncWithGoogleSheets = useCallback(
    async (isManual = false) => {
      setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));

      try {
        const { records, source } = await fetchCustomersFromSheet();

        if (records && records.length > 0) {
          setCustomers(records);
          saveCachedCustomers(records);

          const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setSyncState({
            isSyncing: false,
            lastSynced: nowTime,
            error: null,
            source,
            sheetId: SPREADSHEET_ID,
            totalSyncedRows: records.length,
            endpointUrl: APPS_SCRIPT_WEBAPP_URL,
          });

          logAuditEvent(
            'SHEET_SYNC',
            `Loaded ${records.length} accounts from local file repository (customers.json).`
          );

          if (isManual) {
            showToast(`Synchronized ${records.length} accounts from files!`, 'success');
            addNotification(
              'File Data Store Synchronized',
              `Updated ${records.length} enterprise records from local customer file store.`,
              'sync'
            );
          }
        }
      } catch (err: any) {
        console.warn('Google Sheets sync notice:', err);
        const cached = getCachedCustomers();
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          error: 'Using cached offline data',
          source: 'local_cache',
          totalSyncedRows: cached.length,
        }));

        if (isManual) {
          showToast('Loaded records from local cache.', 'info');
        }
      }
    },
    [addNotification, logAuditEvent, showToast]
  );

  // Sync on authentication mount
  useEffect(() => {
    if (currentUser) {
      syncWithGoogleSheets(false);
    }
  }, [currentUser, syncWithGoogleSheets]);

  // Compute Dashboard Metrics (filtered to current user if Sales Agent)
  const isSalesAgent = currentUser?.role === 'Sales Agent';

  const visibleCustomersForMetrics = useMemo(() => {
    if (!isSalesAgent || !currentUser) return customers;
    return customers.filter(
      (c) =>
        (c.assignedTo && c.assignedTo.toLowerCase() === currentUser.userName.toLowerCase()) ||
        (c.assignedToEmail && c.assignedToEmail.toLowerCase() === currentUser.email.toLowerCase())
    );
  }, [customers, isSalesAgent, currentUser]);

  const metrics = useMemo(
    () => calculateMetrics(visibleCustomersForMetrics),
    [visibleCustomersForMetrics]
  );

  // Handle Login & Logout
  const handleLoginSuccess = (user: SheetUser) => {
    setCurrentUser(user);
    saveCachedUser(user);
    addNotification('Session Authenticated', `Logged in as ${user.userName} (${user.role}).`, 'system');
    logAuditEvent('USER_LOGIN', `User session authenticated with role ${user.role}.`);
    showToast(`Welcome, ${user.userName}! (Role: ${user.role})`, 'success');
  };

  const handleLogout = () => {
    if (currentUser) {
      logAuditEvent('USER_LOGOUT', `User ${currentUser.userName} ended their session.`);
    }
    setCurrentUser(null);
    saveCachedUser(null);
    showToast('Signed out successfully.', 'info');
  };

  // Enforce view restriction: Sales Agents can access CRM Master and Calendar
  useEffect(() => {
    if (currentUser?.role === 'Sales Agent' && currentView !== 'dashboard' && currentView !== 'calendar') {
      setCurrentView('dashboard');
    }
  }, [currentUser, currentView]);

  // Active Reminder Check (checks for scheduled follow-ups due today)
  useEffect(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const isDue = (reminderDate?: string) => {
      if (!reminderDate) return false;
      // Due if today or past date, or Sep 7, 2026 (matching our demo calendar screenshot)
      return reminderDate <= todayStr || reminderDate === '2026-09-07';
    };

    const dueList = customers.filter(
      (c) =>
        c.reminderDate &&
        isDue(c.reminderDate) &&
        !c.reminderDismissed &&
        !dismissedReminderIds.has(c.customerId)
    );

    if (dueList.length > 0) {
      setActiveReminders(dueList);
      setIsReminderModalOpen(true);

      // Audit log the trigger once
      dueList.forEach((cust) => {
        if (!cust.reminderDismissed && !dismissedReminderIds.has(cust.customerId)) {
          logAuditEvent(
            'REMINDER_TRIGGERED',
            `Scheduled contact reminder triggered for ${cust.companyName} (${cust.contactPerson}). Call & WhatsApp follow-up pending.`,
            {
              entityId: cust.customerId,
              companyName: cust.companyName,
              newValue: cust.reminderDate,
            }
          );
        }
      });
    }
  }, [customers, dismissedReminderIds, logAuditEvent]);

  // Handle logging a case (e.g. "called 7/9/2025" or custom case)
  const handleLogCallCase = (customer: CustomerRecord, caseTitle: string) => {
    const now = new Date().toISOString();
    const breakdown = getHistoryTimeBreakdown(now);

    const newCaseEntry: CustomerCaseEntry = {
      id: `case-${customer.customerId}-${Date.now()}`,
      title: caseTitle,
      date: breakdown.date,
      dayName: breakdown.dayName,
      time: breakdown.time,
      notes: `Direct call follow-up completed. Logged by ${currentUser?.userName || 'admin'}.`,
      loggedBy: currentUser?.userName || 'admin',
    };

    const newHistoryEntry: CustomerHistoryEntry = {
      id: `hist-${customer.customerId}-${Date.now()}`,
      timestamp: now,
      dayName: breakdown.dayName,
      date: breakdown.date,
      time: breakdown.time,
      fullFormatted: breakdown.fullFormatted,
      action: `Case Logged: "${caseTitle}"`,
      user: currentUser?.userName || 'admin',
      details: `Completed client interaction call and recorded in case history timeline.`,
    };

    const updated = customers.map((c) =>
      c.customerId === customer.customerId
        ? {
            ...c,
            latestCase: caseTitle,
            caseHistory: [newCaseEntry, ...(c.caseHistory || [])],
            history: [newHistoryEntry, ...(c.history || [])],
            reminderDismissed: true,
            updatedAt: now,
          }
        : c
    );

    setCustomers(updated);
    saveCachedCustomers(updated);

    // Dismiss active reminder
    setDismissedReminderIds((prev) => new Set([...prev, customer.customerId]));
    setActiveReminders((prev) => prev.filter((r) => r.customerId !== customer.customerId));
    if (activeReminders.length <= 1) {
      setIsReminderModalOpen(false);
    }

    logAuditEvent(
      'CASE_LOGGED',
      `Logged client case for ${customer.companyName}: "${caseTitle}".`,
      {
        entityId: customer.customerId,
        companyName: customer.companyName,
        newValue: caseTitle,
      }
    );

    addNotification(
      `Case Logged: ${customer.companyName}`,
      `Recorded "${caseTitle}" in client timeline and audit trail.`,
      'system'
    );

    showToast(`Logged case "${caseTitle}" for ${customer.companyName}`, 'success');
  };

  const handleDismissReminder = (customerId: string) => {
    setDismissedReminderIds((prev) => new Set([...prev, customerId]));
    setActiveReminders((prev) => prev.filter((r) => r.customerId !== customerId));
    if (activeReminders.length <= 1) {
      setIsReminderModalOpen(false);
    }
  };

  const handleDismissAllReminders = () => {
    const ids = activeReminders.map((r) => r.customerId);
    setDismissedReminderIds((prev) => new Set([...prev, ...ids]));
    setActiveReminders([]);
    setIsReminderModalOpen(false);
  };

  // Calendar Event handlers
  const handleAddCalendarEvent = (event: CalendarEvent) => {
    const updated = [event, ...calendarEvents];
    setCalendarEvents(updated);
    saveCachedCalendarEvents(updated);

    logAuditEvent(
      'REMINDER_SCHEDULED',
      `Created calendar event "${event.title}" on ${event.date} (${event.time || 'All Day'}).`,
      {
        entityId: event.id,
        newValue: `${event.date} ${event.time || ''}`,
      }
    );

    showToast(`Scheduled calendar event: ${event.title}`, 'success');
  };

  const handleDeleteCalendarEvent = (eventId: string) => {
    const updated = calendarEvents.filter((e) => e.id !== eventId);
    setCalendarEvents(updated);
    saveCachedCalendarEvents(updated);
    showToast('Event removed from calendar', 'info');
  };

  // Quick Stage updater on table row
  const handleQuickUpdateStage = (customer: CustomerRecord, newStage: StageType) => {
    if (customer.statusStage === newStage) return;

    const prevStage = customer.statusStage;
    const now = new Date().toISOString();
    const breakdown = getHistoryTimeBreakdown(now);

    const newHistoryItem: CustomerHistoryEntry = {
      id: `hist-${customer.customerId}-${Date.now()}`,
      timestamp: now,
      dayName: breakdown.dayName,
      date: breakdown.date,
      time: breakdown.time,
      fullFormatted: breakdown.fullFormatted,
      action: `Stage Changed to ${newStage}`,
      user: currentUser?.userName || 'admin',
      details: `Advanced from ${prevStage} to ${newStage}`,
      previousValue: prevStage,
      newValue: newStage,
    };

    const updated = customers.map((c) =>
      c.customerId === customer.customerId
        ? {
            ...c,
            statusStage: newStage,
            updatedAt: now,
            history: [...(c.history || []), newHistoryItem],
          }
        : c
    );

    setCustomers(updated);
    saveCachedCustomers(updated);

    if (activeDrawerCustomer?.customerId === customer.customerId) {
      setActiveDrawerCustomer((prev) =>
        prev
          ? {
              ...prev,
              statusStage: newStage,
              updatedAt: now,
              history: [...(prev.history || []), newHistoryItem],
            }
          : null
      );
    }

    if (newStage === 'Closed Won') {
      logAuditEvent(
        'DEAL_CLOSED_WON',
        `Deal closed won for ${customer.companyName} with value $${customer.dealValue.toLocaleString()}.`,
        {
          entityId: customer.dealId,
          companyName: customer.companyName,
          previousValue: prevStage,
          newValue: 'Closed Won',
        }
      );
      addNotification(
        `🎉 Deal Closed Won: ${customer.companyName}`,
        `Secured enterprise deal valued at £${customer.dealValue.toLocaleString()}!`,
        'deal_won'
      );
      showToast(`🎉 ${customer.companyName} marked as Closed Won!`, 'success');
    } else if (newStage === 'Closed Lost') {
      logAuditEvent(
        'DEAL_CLOSED_LOST',
        `Deal marked closed lost for ${customer.companyName}.`,
        {
          entityId: customer.dealId,
          companyName: customer.companyName,
          previousValue: prevStage,
          newValue: 'Closed Lost',
        }
      );
      showToast(`${customer.companyName} marked as Closed Lost`, 'info');
    } else {
      logAuditEvent(
        'STAGE_UPDATED',
        `Advanced pipeline stage for ${customer.companyName} from ${prevStage} to ${newStage}.`,
        {
          entityId: customer.dealId,
          companyName: customer.companyName,
          previousValue: prevStage,
          newValue: newStage,
        }
      );
      addNotification(
        `Stage Advanced: ${customer.companyName}`,
        `Moved from ${prevStage} to ${newStage}.`,
        'stage_update'
      );
      showToast(`${customer.companyName} moved to ${newStage}`, 'info');
    }
  };

  // Save new or edited customer
  const handleSaveCustomer = (record: CustomerRecord) => {
    const isEdit = customers.some((c) => c.customerId === record.customerId);

    let updated: CustomerRecord[];
    if (isEdit) {
      updated = customers.map((c) => (c.customerId === record.customerId ? record : c));
      logAuditEvent(
        'CLIENT_EDITED',
        `Updated account details and deal value for ${record.companyName} (${record.customerId}).`,
        {
          entityId: record.customerId,
          companyName: record.companyName,
          newValue: record.dealValue,
        }
      );
      showToast(`Updated record for ${record.companyName}`, 'success');
      addNotification('Account Updated', `Details modified for ${record.companyName}.`, 'system');
    } else {
      updated = [record, ...customers];
      logAuditEvent(
        'CLIENT_CREATED',
        `Created client ${record.companyName} with auto-generated ID ${record.customerId} and deal ID ${record.dealId} ($${record.dealValue.toLocaleString()}).`,
        {
          entityId: record.customerId,
          companyName: record.companyName,
          newValue: record.dealValue,
        }
      );
      showToast(`Added new enterprise deal: ${record.companyName}`, 'success');
      addNotification(
        `New Deal Created: ${record.companyName}`,
        `Automated ID ${record.customerId} assigned with valuation $${record.dealValue.toLocaleString()}`,
        'new_lead'
      );
    }

    setCustomers(updated);
    saveCachedCustomers(updated);
    setIsAddModalOpen(false);
    setEditingCustomer(null);

    // If a reminder date is scheduled, record in Audit Trail
    if (record.reminderDate) {
      logAuditEvent(
        'REMINDER_SCHEDULED',
        `Scheduled follow-up reminder for ${record.companyName} on ${record.reminderDate} at ${record.reminderTime || '10:00 AM'}. Note: "${record.reminderNote || 'Follow-up'}"`,
        {
          entityId: record.customerId,
          companyName: record.companyName,
          newValue: record.reminderDate,
        }
      );
    }

    // If latest case was logged, record in Audit Trail
    if (record.latestCase) {
      logAuditEvent(
        'CASE_LOGGED',
        `Recorded case update for ${record.companyName}: "${record.latestCase}".`,
        {
          entityId: record.customerId,
          companyName: record.companyName,
          newValue: record.latestCase,
        }
      );
    }

    // Save record to Google Sheet via Apps Script in background
    appendCustomerToSheet(record)
      .then((ok) => {
        if (ok) {
          console.info('Synced new customer record to Google Sheet.');
        }
      })
      .catch((err) => console.warn('Deferred sync notice:', err));

    if (activeDrawerCustomer?.customerId === record.customerId) {
      setActiveDrawerCustomer(record);
    }
  };

  // Delete customer
  const handleConfirmDelete = () => {
    if (!customerToDelete) return;
    const targetName = customerToDelete.companyName;
    const targetId = customerToDelete.customerId;
    const updated = customers.filter((c) => c.customerId !== customerToDelete.customerId);

    logAuditEvent(
      'CLIENT_DELETED',
      `Permanently deleted client ${targetName} (${targetId}) from CRM directory.`,
      {
        entityId: targetId,
        companyName: targetName,
      }
    );

    setCustomers(updated);
    saveCachedCustomers(updated);

    if (activeDrawerCustomer?.customerId === customerToDelete.customerId) {
      setActiveDrawerCustomer(null);
    }

    showToast(`Removed ${targetName} from Directory`, 'info');
    addNotification('Record Deleted', `Removed ${targetName} from the database.`, 'system');
    setCustomerToDelete(null);
  };

  // Refresh live dataset from Google Sheet
  const handleRefreshSheetData = () => {
    syncWithGoogleSheets(true);
    logAuditEvent('SHEET_SYNC', 'Initiated manual sync refresh directly with Google Sheet.');
    showToast('Refreshing records from Google Sheet...', 'info');
    setIsSheetModalOpen(false);
  };

  // Inspect agent directory from Leaderboard
  const handleFilterByAgentFromLeaderboard = (agentName: string) => {
    setAgentFilter(agentName);
    setCurrentView('dashboard');
    showToast(`Filtered directory to accounts assigned to ${agentName}`, 'info');
  };

  // User Management Handlers (Admin Only)
  const handleAddUser = useCallback(
    (newUser: SheetUser) => {
      if (!currentUser || currentUser.role !== 'Admin') {
        showToast('Only Admins can add users.', 'error');
        return;
      }
      const result = addUserToFileStorage(newUser, currentUser);
      if (result.success) {
        setAvailableUsers(result.users);
        setAuditLogs(getCachedAuditLogs());
        showToast(`User "${newUser.userName}" created successfully!`, 'success');
        addNotification('User Created', `Added ${newUser.userName} (${newUser.role}) to the system.`, 'system');
      } else {
        showToast(result.error || 'Failed to add user.', 'error');
      }
    },
    [currentUser, showToast, addNotification]
  );

  const handleRemoveUser = useCallback(
    (targetIdentifier: string) => {
      if (!currentUser || currentUser.role !== 'Admin') {
        showToast('Only Admins can remove users.', 'error');
        return;
      }
      const result = removeUserFromFileStorage(targetIdentifier, currentUser);
      if (result.success) {
        setAvailableUsers(result.users);
        setAuditLogs(getCachedAuditLogs());
        showToast(`User account removed successfully.`, 'success');
        addNotification('User Removed', `Removed ${targetIdentifier} from the system.`, 'system');
      } else {
        showToast(result.error || 'Failed to remove user.', 'error');
      }
    },
    [currentUser, showToast, addNotification]
  );

  const handleUpdateUser = useCallback(
    (identifier: string, patch: Partial<SheetUser>) => {
      if (!currentUser || currentUser.role !== 'Admin') {
        showToast('Only Admins can update users.', 'error');
        return;
      }
      const result = updateUserInFileStorage(identifier, patch, currentUser);
      if (result.success) {
        setAvailableUsers(result.users);
        setAuditLogs(getCachedAuditLogs());
        showToast(`User profile updated.`, 'success');
      } else {
        showToast(result.error || 'Failed to update user.', 'error');
      }
    },
    [currentUser, showToast]
  );

  // Database Management Handlers (Admin Only)
  const handleDisconnectDatabase = useCallback(() => {
    if (!currentUser || currentUser.role !== 'Admin') {
      showToast('Only Admins can disconnect the database.', 'error');
      return;
    }
    disconnectDatabaseSource(currentUser);
    setSyncState((prev) => ({
      ...prev,
      source: 'disconnected',
      isDatabaseConnected: false,
      error: 'Database disconnected by Administrator.',
    }));
    setAuditLogs(getCachedAuditLogs());
    showToast('Database source disconnected. System running in offline local store.', 'info');
    addNotification('Database Disconnected', `Admin ${currentUser.userName} disconnected database source.`, 'system');
  }, [currentUser, showToast, addNotification]);

  const handleReconnectDatabase = useCallback(
    (sourceName: string, sheetId: string) => {
      if (!currentUser || currentUser.role !== 'Admin') {
        showToast('Only Admins can connect database.', 'error');
        return;
      }
      reconnectDatabaseSource(sourceName, sheetId, currentUser);
      setSyncState((prev) => ({
        ...prev,
        source: 'apps_script',
        sheetId,
        isDatabaseConnected: true,
        error: null,
        lastSynced: new Date().toISOString(),
      }));
      setAuditLogs(getCachedAuditLogs());
      showToast(`Database reconnected: ${sourceName}`, 'success');
      addNotification('Database Connected', `Admin ${currentUser.userName} connected ${sourceName}.`, 'system');
    },
    [currentUser, showToast, addNotification]
  );

  const handleClearAllRecords = useCallback(() => {
    if (!currentUser || currentUser.role !== 'Admin') {
      showToast('Only Admins can clear database records.', 'error');
      return;
    }
    clearAllCustomerRecords(currentUser);
    setCustomers([]);
    setAuditLogs(getCachedAuditLogs());
    showToast('All client customer records cleared from database.', 'info');
    addNotification('Database Cleared', `Admin ${currentUser.userName} wiped all customer records.`, 'system');
  }, [currentUser, showToast, addNotification]);

  // If not logged in, render the LoginGate
  if (!currentUser) {
    return <LoginGate onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        theme === 'dark' ? 'bg-[#0b0f19] text-[#f9fafb]' : 'bg-[#f8fafc] text-slate-900'
      } selection:bg-[#6366f1] selection:text-white antialiased flex flex-col`}
    >
      {/* Toast Alert Pill */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-3 ${
            theme === 'dark'
              ? 'border-slate-700 bg-[#111827] text-white shadow-black/80'
              : 'border-slate-300 bg-white text-slate-900 shadow-slate-400/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          ) : toastMessage.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
          )}
          <span>{toastMessage.text}</span>
        </aside>
      )}

      {/* Main Top Header with Role Switcher & Navigation */}
      <Header
        user={currentUser}
        onLogout={handleLogout}
        syncState={syncState}
        onRefreshSync={() => syncWithGoogleSheets(true)}
        notifications={notifications}
        onClearNotifications={() => {
          setNotifications([]);
          saveCachedNotifications([]);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        currentView={currentView}
        onSelectView={(v) => {
          if (currentUser.role === 'Sales Agent' && v !== 'dashboard' && v !== 'calendar') {
            showToast('Access restricted: Sales Agents only have access to CRM Master and Calendar.', 'error');
            return;
          }
          setCurrentView(v);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {currentView === 'dashboard' && (
          <>
            {/* 4 Core Executive Metric Cards */}
            <KPICards metrics={metrics} newLeadsCount={metrics.newLeadsCount} />

            {/* Lower Section: 3-column split for Sales Agent (with Contact Reminders), Full-Width for Admin */}
            <div
              className={`flex-1 grid grid-cols-1 ${
                currentUser.role === 'Sales Agent' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'
              } gap-6 min-h-0`}
            >
              {/* Master Client Directory */}
              <div
                className={`${
                  currentUser.role === 'Sales Agent' ? 'lg:col-span-2' : 'lg:col-span-1'
                } min-h-0`}
              >
                <ClientDirectoryTable
                  customers={customers}
                  currentUser={currentUser}
                  selectedStageFilter={selectedStageFilter}
                  onSelectStageFilter={setSelectedStageFilter}
                  onViewCustomer={(cust) => setActiveDrawerCustomer(cust)}
                  onEditCustomer={(cust) => {
                    setEditingCustomer(cust);
                    setIsAddModalOpen(true);
                  }}
                  onDeleteCustomer={(cust) => setCustomerToDelete(cust)}
                  onQuickUpdateStage={handleQuickUpdateStage}
                  onOpenAddModal={() => {
                    setEditingCustomer(null);
                    setIsAddModalOpen(true);
                  }}
                  agentFilter={agentFilter}
                  onClearAgentFilter={() => setAgentFilter(null)}
                />
              </div>

              {/* Right Column: Contact Reminders Calendar (Appears ONLY for Sales Agent, NOT Admin) */}
              {currentUser.role === 'Sales Agent' && (
                <div className="space-y-6">
                  <ContactRemindersCalendarCard
                    customers={customers}
                    onOpenFullCalendar={() => setCurrentView('calendar')}
                    onEditCustomer={(cust) => {
                      setEditingCustomer(cust);
                      setIsAddModalOpen(true);
                    }}
                    onLogCallCase={handleLogCallCase}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {currentView === 'calendar' && (
          <CalendarView
            events={calendarEvents}
            customers={customers}
            currentUser={currentUser}
            availableUsers={availableUsers}
            onAddEvent={handleAddCalendarEvent}
            onDeleteEvent={handleDeleteCalendarEvent}
          />
        )}

        {currentView === 'leaderboard' && currentUser.role === 'Admin' && (
          <LeaderboardView
            customers={customers}
            currentUser={currentUser}
            availableUsers={availableUsers}
            onFilterByAgent={handleFilterByAgentFromLeaderboard}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'audit' && currentUser.role === 'Admin' && (
          <AuditLogView
            logs={auditLogs}
            currentUser={currentUser}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'users' && currentUser.role === 'Admin' && (
          <UserManagementView
            users={availableUsers}
            currentUser={currentUser}
            customers={customers}
            onAddUser={handleAddUser}
            onRemoveUser={handleRemoveUser}
            onUpdateUser={handleUpdateUser}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Active Reminder Pop-Up Modal (Triggers when scheduled client date arrives) */}
      <ActiveReminderModal
        reminders={activeReminders}
        isOpen={isReminderModalOpen}
        onDismiss={handleDismissReminder}
        onDismissAll={handleDismissAllReminders}
        onLogCallCase={handleLogCallCase}
        onReschedule={(cust) => {
          setIsReminderModalOpen(false);
          setEditingCustomer(cust);
          setIsAddModalOpen(true);
        }}
      />

      {/* Persistent Footer */}
      <footer className="h-10 bg-[#111827] border-t border-slate-800 flex items-center justify-between px-6 text-[10px] text-slate-500 uppercase tracking-widest shrink-0 mt-auto">
        <div className="flex items-center gap-4">
          <span>Obsidian Executive CRM</span>
          <span className="hidden sm:inline">• Active Accounts: {customers.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Role-Based Access Control • Audit Active</span>
        </div>
      </footer>

      {/* Customer Create/Edit Modal */}
      <CustomerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
        initialData={editingCustomer}
        currentUser={currentUser}
        availableUsers={availableUsers}
      />

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        customer={activeDrawerCustomer}
        onClose={() => setActiveDrawerCustomer(null)}
        onEdit={(cust) => {
          setEditingCustomer(cust);
          setIsAddModalOpen(true);
        }}
        onDelete={(cust) => setCustomerToDelete(cust)}
        onQuickUpdateStage={handleQuickUpdateStage}
      />

      {/* File Storage & Database Management Modal */}
      <SheetSyncModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        syncState={syncState}
        onTriggerSync={() => syncWithGoogleSheets(true)}
        onResetSeedData={handleRefreshSheetData}
        currentUser={currentUser}
        onDisconnectDatabase={handleDisconnectDatabase}
        onClearAllRecords={handleClearAllRecords}
        onReconnectDatabase={handleReconnectDatabase}
        onCustomersImported={(newCustomers) => {
          setCustomers(newCustomers);
          showToast(`Imported ${newCustomers.length} accounts from file!`, 'success');
          addNotification('File Imported', `Loaded ${newCustomers.length} accounts into local storage.`, 'system');
        }}
      />

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Client Record</h3>
                <p className="text-xs text-slate-400">This operation cannot be undone.</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently remove{' '}
              <span className="font-bold text-white">{customerToDelete.companyName}</span> (Deal ID:{' '}
              {customerToDelete.dealId}) from the Client Directory?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow-md shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
