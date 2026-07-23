import { Shield, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import type { AuditLogItem } from '@xyntra/types';

interface AuditLogsTabProps {
  logs: AuditLogItem[];
  isLoading: boolean;
}

export function AuditLogsTab({ logs, isLoading }: AuditLogsTabProps) {
  const [query, setQuery] = useState('');

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(query.toLowerCase()) ||
      l.table_name.toLowerCase().includes(query.toLowerCase()) ||
      (l.profile?.name && l.profile.name.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search action, staff member, or module..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading audit log activity records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Shield className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            No audit activity entries recorded.
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User / Staff</th>
                <th className="px-4 py-3">Action Performed</th>
                <th className="px-4 py-3">Target Table</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {log.profile?.name || 'System / Service Role'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {log.table_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
