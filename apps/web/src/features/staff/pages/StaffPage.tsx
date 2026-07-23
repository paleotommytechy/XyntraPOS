import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileDesktopRedirect } from '../../../components/mobile/MobileDesktopRedirect';
import { XyntraSpinner } from '../../../components/XyntraSpinner';
import { staffApi, type InviteStaffPayload } from '../services/staff.api';
import { usePermissions } from '../hooks/usePermissions';
import type { UserProfile, EmployeeShift, AuditLogItem, StaffInvitation } from '@xyntra/types';
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Input } from '@xyntra/ui';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Briefcase, 
  User, 
  RefreshCw, 
  Mail, 
  Phone, 
  CheckCircle, 
  XCircle,
  ShieldAlert,
  Search,
  Clock,
  Shield,
  Copy,
  Key,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { ShiftClockWidget } from '../components/ShiftClockWidget';
import { AuditLogsTab } from '../components/AuditLogsTab';

export function StaffPage() {
  const { isMobileMode } = useIsMobile();
  const { business, profile: currentProfile } = useAuthStore();

  if (isMobileMode) {
    return <MobileDesktopRedirect featureName="Staff & Team Role Management" />;
  }
  const { canManageStaff } = usePermissions();

  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [invitationsList, setInvitationsList] = useState<StaffInvitation[]>([]);
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'team' | 'shifts' | 'audit'>('team');

  // Invite modal & generated code state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCodeInfo, setGeneratedCodeInfo] = useState<{
    code: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const [inviteForm, setInviteForm] = useState<InviteStaffPayload>({
    email: '',
    name: '',
    phone: '',
    role: 'Cashier',
  });

  useEffect(() => {
    if (business?.id) {
      loadStaffData();
    }
  }, [business?.id]);

  const loadStaffData = async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const [members, invs, shiftData, auditData] = await Promise.all([
        staffApi.getStaffMembers(business.id),
        staffApi.getStaffInvitations(business.id),
        staffApi.getEmployeeShifts(business.id),
        staffApi.getAuditLogs(business.id),
      ]);

      if (currentProfile && !members.some((p) => p.id === currentProfile.id)) {
        members.unshift(currentProfile);
      }

      setStaffList(members);
      setInvitationsList(invs);
      setShifts(shiftData);
      setAuditLogs(auditData);
    } catch (err) {
      toast.error('Failed to load staff team members');
      if (currentProfile) {
        setStaffList([currentProfile]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!business?.id || !currentProfile?.id) return;
    try {
      await staffApi.clockInShift(business.id, currentProfile.id);
      toast.success('Clocked in shift successfully!');
      loadStaffData();
    } catch (err) {
      toast.error('Failed to clock in shift.');
    }
  };

  const handleClockOut = async (shiftId: string) => {
    try {
      await staffApi.clockOutShift(shiftId);
      toast.success('Clocked out shift successfully!');
      loadStaffData();
    } catch (err) {
      toast.error('Failed to clock out shift.');
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    if (!inviteForm.email || !inviteForm.name) {
      toast.error('Please provide name and email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await staffApi.inviteStaffMember(business.id, inviteForm);
      toast.success(`One-Time Code generated for ${inviteForm.name}!`);
      
      setInvitationsList((prev) => [result.invitation, ...prev]);
      
      setGeneratedCodeInfo({
        code: result.inviteCode,
        name: inviteForm.name,
        email: inviteForm.email,
        role: inviteForm.role,
      });

      setInviteForm({ email: '', name: '', phone: '', role: 'Cashier' });
    } catch (err) {
      toast.error('Failed to generate staff invitation code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveInvitation = async (inv: StaffInvitation) => {
    try {
      await staffApi.approveStaffInvitation(inv.id, inv.email, inv.role);
      toast.success(`Approved ${inv.name}! They now have active ${inv.role} access.`);
      loadStaffData();
    } catch (err) {
      toast.error('Failed to approve staff member');
    }
  };

  const handleRejectInvitation = async (inv: StaffInvitation) => {
    try {
      await staffApi.rejectStaffInvitation(inv.id, inv.email);
      toast.success(`Invitation for ${inv.name} cancelled.`);
      loadStaffData();
    } catch (err) {
      toast.error('Failed to cancel invitation');
    }
  };

  const handleRoleChange = async (profileId: string, newRole: 'Admin' | 'Manager' | 'Cashier') => {
    try {
      await staffApi.updateStaffRole(profileId, newRole);
      setStaffList((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      );
      toast.success('Staff role updated');
    } catch (err) {
      toast.error('Failed to update staff role');
    }
  };

  const handleToggleStatus = async (profileId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'Inactive' ? 'Active' : 'Inactive';
    try {
      await staffApi.updateStaffStatus(profileId, nextStatus);
      setStaffList((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, status: nextStatus } : p))
      );
      toast.success(`Staff status changed to ${nextStatus}`);
    } catch (err) {
      toast.error('Failed to update staff status');
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm))
  );

  const adminCount = staffList.filter((s) => s.role === 'Admin').length;
  const managerCount = staffList.filter((s) => s.role === 'Manager').length;
  const cashierCount = staffList.filter((s) => s.role === 'Cashier').length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </span>
        );
      case 'Manager':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <Briefcase className="h-3.5 w-3.5" />
            Manager
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <User className="h-3.5 w-3.5" />
            Cashier
          </span>
        );
    }
  };

  if (!canManageStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center p-6">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Staff and team management requires Administrator privileges. Please contact your store administrator to modify staff access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Staff Team & Shift Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage team access roles, clock-in shift attendance, and review system audit logs.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadStaffData} variant="secondary" className="h-10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsInviteModalOpen(true)} className="h-10 bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'team'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members ({staffList.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'shifts'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Shift Attendance Logs
          </div>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            System Audit Logs
          </div>
        </button>
      </div>

      {/* Tab: Team Members */}
      {activeTab === 'team' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Staff Role Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Team</span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{staffList.length}</h3>
              </div>
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider block">Admins</span>
                <h3 className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">{adminCount}</h3>
              </div>
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">Managers</span>
                <h3 className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">{managerCount}</h3>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                <Briefcase className="h-5 w-5" />
              </div>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">Cashiers</span>
                <h3 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">{cashierCount}</h3>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                <User className="h-5 w-5" />
              </div>
            </Card>
          </div>

          {/* Pending Invitations & Join Requests Table Card */}
          {invitationsList.length > 0 && (
            <Card className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                    <Clock className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Pending Invitations & Access Approvals</h3>
                    <p className="text-xs text-slate-300">Staff members with invite codes or awaiting owner approval</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {invitationsList.length} Pending
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300">Invited Person</TableHead>
                    <TableHead className="text-slate-300">Invite Code</TableHead>
                    <TableHead className="text-slate-300">Assigned Role</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-right text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitationsList.map((inv) => (
                    <TableRow key={inv.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>
                        <div>
                          <div className="font-semibold text-sm text-white">{inv.name}</div>
                          <div className="text-xs text-slate-400">{inv.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold tracking-wider bg-slate-800 px-2 py-1 rounded border border-slate-700 text-blue-300">
                            {inv.token || 'N/A'}
                          </span>
                          {inv.token && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(inv.token || '');
                                toast.success('Invite code copied to clipboard!');
                              }}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="Copy Invite Code"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(inv.role)}</TableCell>
                      <TableCell>
                        {inv.status === 'Awaiting Approval' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full font-semibold border border-amber-500/30">
                            <Clock className="h-3 w-3 animate-spin" />
                            Awaiting Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-full font-semibold border border-blue-500/30">
                            <Key className="h-3 w-3" />
                            Pending Invite Code
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleApproveInvitation(inv)}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3"
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectInvitation(inv)}
                            variant="secondary"
                            className="h-8 text-xs text-slate-300 hover:text-white bg-slate-800 border-slate-700 px-2.5"
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Staff Table Card */}
          <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Showing {filteredStaff.length} of {staffList.length} staff members
              </span>
            </div>

            {isLoading ? (
              <div className="py-8">
                <XyntraSpinner size="sm" />
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No staff members found matching your search.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-bold flex items-center justify-center text-sm uppercase shrink-0">
                            {staff.name ? staff.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-sm">
                              {staff.name} {currentProfile?.id === staff.id && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-normal ml-1">You</span>}
                            </div>
                            <div className="text-xs text-slate-400">{staff.email || 'No email registered'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          {staff.email && (
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{staff.email}</span>
                            </div>
                          )}
                          {staff.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{staff.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(staff.role)}</TableCell>
                      <TableCell>
                        {staff.status === 'Inactive' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            <XCircle className="h-3 w-3 text-slate-400" />
                            Inactive
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(staff.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {currentProfile?.id !== staff.id && (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={staff.role}
                              onChange={(e) => handleRoleChange(staff.id, e.target.value as any)}
                              className="text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded px-2 py-1 focus:outline-none"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Manager">Manager</option>
                              <option value="Cashier">Cashier</option>
                            </select>

                            <Button
                              onClick={() => handleToggleStatus(staff.id, staff.status)}
                              variant="secondary"
                              className="h-7 text-[11px] px-2"
                            >
                              {staff.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* Tab: Shift Attendance */}
      {activeTab === 'shifts' && (
        <div className="animate-in fade-in duration-200">
          <ShiftClockWidget
            shifts={shifts}
            staffMembers={staffList}
            isLoading={isLoading}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
          />
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="animate-in fade-in duration-200">
          <AuditLogsTab logs={auditLogs} isLoading={isLoading} />
        </div>
      )}

      {/* Invite Staff Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                {generatedCodeInfo ? 'One-Time Staff Access Code' : 'Add Staff Member & Generate Code'}
              </h3>
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setGeneratedCodeInfo(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {generatedCodeInfo ? (
              <div className="space-y-4 py-2">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Role Pre-Assigned: {generatedCodeInfo.role}
                  </p>
                  <p>
                    Staff member <strong>{generatedCodeInfo.name}</strong> (<code>{generatedCodeInfo.email}</code>) can now join your store using this one-time code.
                  </p>
                </div>

                <div className="space-y-1 text-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    One-Time Staff Access Code
                  </label>
                  <div className="flex items-center justify-between gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-mono text-xl font-black text-blue-600 dark:text-blue-400 tracking-wider select-all">
                      {generatedCodeInfo.code}
                    </span>
                    <Button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCodeInfo.code);
                        toast.success('One-Time Staff Code copied to clipboard!');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5"
                    >
                      Copy Code
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">How to share:</p>
                  <p>
                    Hand or message this code to <strong>{generatedCodeInfo.name}</strong>. When they register/sign in with email <code>{generatedCodeInfo.email}</code>, entering this code will automatically grant them their assigned <strong>{generatedCodeInfo.role}</strong> access.
                  </p>
                </div>

                <div className="flex justify-end pt-2 border-t dark:border-slate-800">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      setGeneratedCodeInfo(null);
                    }}
                    className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <Input
                  label="Staff Member Full Name *"
                  placeholder="e.g. Sarah Connor"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  required
                />

                <Input
                  label="Registered Email Address *"
                  type="email"
                  placeholder="sarah@store.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                />

                <Input
                  label="Phone Number (Optional)"
                  placeholder="+234 800 000 0000"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                />

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Assigned Staff Role *
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cashier">Cashier (Sales & POS Checkout access)</option>
                    <option value="Manager">Manager (Inventory, Products & Reports)</option>
                    <option value="Admin">Administrator (Full Access)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsInviteModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                    {isSubmitting ? 'Generating Code...' : 'Generate One-Time Code'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default StaffPage;
