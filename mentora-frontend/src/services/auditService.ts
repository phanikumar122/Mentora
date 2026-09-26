export interface AuditLogItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  timestamp: number;
  type?: 'SUCCESS' | 'DANGER' | 'INFO' | 'SYSTEM' | 'BACKUP' | 'REPORT';
  user?: string;
}

const STORAGE_KEY = 'mentora_system_audit_logs';

const DEFAULT_LOGS: AuditLogItem[] = [
  {
    id: 'def-1',
    action: 'Admin Portal Active',
    detail: 'System Security Engine Initialization Complete',
    time: 'Just now',
    timestamp: Date.now(),
    type: 'SYSTEM',
  },
  {
    id: 'def-2',
    action: 'Database Health Check',
    detail: 'Primary Database & JPA Subsystem Verified Active',
    time: '5 mins ago',
    timestamp: Date.now() - 5 * 60 * 1000,
    type: 'SUCCESS',
  },
  {
    id: 'def-3',
    action: 'Attendance Sync Service',
    detail: '90-Day Continuous Analytics Engine Live',
    time: '12 mins ago',
    timestamp: Date.now() - 12 * 60 * 1000,
    type: 'SYSTEM',
  },
];

export const getAuditLogs = (): AuditLogItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read audit logs from storage:', e);
  }
  return DEFAULT_LOGS;
};

export const addAuditLog = (log: {
  action: string;
  detail: string;
  time?: string;
  type?: 'SUCCESS' | 'DANGER' | 'INFO' | 'SYSTEM' | 'BACKUP' | 'REPORT';
  user?: string;
}): AuditLogItem => {
  const now = new Date();
  const timeStr = log.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const newItem: AuditLogItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action: log.action,
    detail: log.detail,
    time: timeStr,
    timestamp: now.getTime(),
    type: log.type || 'INFO',
    user: log.user,
  };

  try {
    const existing = getAuditLogs();
    const updated = [newItem, ...existing].slice(0, 50); // Keep last 50 audit logs
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('mentora_audit_log_added', { detail: newItem }));
  } catch (e) {
    console.error('Failed to save audit log:', e);
  }

  return newItem;
};

export const clearAuditLogs = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('mentora_audit_log_added'));
  } catch (e) {
    console.error('Failed to clear audit logs:', e);
  }
};
