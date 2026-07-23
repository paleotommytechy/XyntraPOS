import { Clock, Play, Square, UserCheck } from 'lucide-react';
import type { EmployeeShift } from '@xyntra/types';

interface ShiftClockWidgetProps {
  shifts: EmployeeShift[];
  isLoading: boolean;
  onClockIn: () => Promise<void>;
  onClockOut: (shiftId: string) => Promise<void>;
}

export function ShiftClockWidget({
  shifts,
  isLoading,
  onClockIn,
  onClockOut,
}: ShiftClockWidgetProps) {
  const activeShift = shifts.find((s) => !s.clock_out);

  return (
    <div className="space-y-6">
      {/* Clock in/out action banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-2xl ${
              activeShift
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Shift Attendance Status: {activeShift ? 'Clocked In (Active)' : 'Clocked Out'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeShift
                ? `Started shift at ${new Date(activeShift.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'No active shift logged. Click below to start shift.'}
            </p>
          </div>
        </div>

        <div>
          {activeShift ? (
            <button
              onClick={() => onClockOut(activeShift.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Square className="h-4 w-4" />
              <span>Clock Out & End Shift</span>
            </button>
          ) : (
            <button
              onClick={onClockIn}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Play className="h-4 w-4" />
              <span>Clock In & Start Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* Recent Shifts Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
          <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-600" />
            Shift Attendance History
          </h4>
          <span className="text-xs text-slate-400">{shifts.length} Shift Logs</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading shift records...</div>
        ) : shifts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No shift logs found.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Clock In</th>
                <th className="px-4 py-3">Clock Out</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {shift.profile?.name || 'Staff Member'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(shift.clock_in).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {shift.clock_out ? new Date(shift.clock_out).toLocaleString() : 'Active Shift'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        shift.clock_out
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {shift.clock_out ? 'Completed' : 'Active'}
                    </span>
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
