import { Clock, Play, Square, UserCheck, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import type { EmployeeShift, UserProfile } from '@xyntra/types';
import { usePermissions } from '../hooks/usePermissions';

interface ShiftClockWidgetProps {
  shifts: EmployeeShift[];
  staffMembers?: UserProfile[];
  isLoading: boolean;
  onClockIn: () => Promise<void>;
  onClockOut: (shiftId: string) => Promise<void>;
}

export function ShiftClockWidget({
  shifts,
  staffMembers = [],
  isLoading,
  onClockIn,
  onClockOut,
}: ShiftClockWidgetProps) {
  const { isAdmin } = usePermissions();
  const activeShift = shifts.find((s) => !s.clock_out);

  // Group active shift status by staff user ID for Admin Overview
  const activeShiftByUserMap = new Map<string, EmployeeShift>();
  shifts.forEach((s) => {
    if (!s.clock_out && s.user_id) {
      activeShiftByUserMap.set(s.user_id, s);
    }
  });

  return (
    <div className="space-y-6">
      {/* Admin Live Shift Attendance Status Overview */}
      {isAdmin && staffMembers.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Live Staff Attendance Matrix</h3>
                <p className="text-xs text-slate-300">Real-time shift attendance status for all store team members</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {activeShiftByUserMap.size} Currently On Shift
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {staffMembers.map((staff) => {
              const staffActiveShift = activeShiftByUserMap.get(staff.id);
              return (
                <div
                  key={staff.id}
                  className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs uppercase text-slate-200 shrink-0">
                      {staff.name ? staff.name.charAt(0) : 'U'}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-xs text-white truncate">{staff.name}</p>
                      <p className="text-[10px] text-slate-400">{staff.role}</p>
                    </div>
                  </div>
                  {staffActiveShift ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      Clocked In
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 shrink-0">
                      <XCircle className="h-3 w-3 text-slate-500" />
                      Off Duty
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal Clock in/out action banner */}
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
              Your Attendance Status: {activeShift ? 'Clocked In (Active)' : 'Clocked Out'}
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
            Shift Attendance Logs & Records
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
                      {shift.clock_out ? 'Completed' : 'Active Shift'}
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
