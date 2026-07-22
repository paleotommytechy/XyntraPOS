import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { XyntraSpinner } from '../../../components/XyntraSpinner';
import { staffApi, type InviteStaffPayload } from '../services/staff.api';
import { usePermissions } from '../hooks/usePermissions';
import type { UserProfile } from '@xyntra/types';
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
  Search
} from 'lucide-react';
import { toast } from 'sonner';

export function StaffPage() {
  const { business, profile: currentProfile } = useAuthStore();
  const { canManageStaff } = usePermissions();

  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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
      loadStaff();
    }
  }, [business?.id]);

  const loadStaff = async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const data = await staffApi.getStaffMembers(business.id);
      
      // Fallback: If current user profile isn't in returned list (due to fresh setup), include it
      if (currentProfile && !data.some(p => p.id === currentProfile.id)) {
        data.unshift(currentProfile);
      }
      
      setStaffList(data);
    } catch (err) {
      toast.error('Failed to load staff team members');
      if (currentProfile) {
        setStaffList([currentProfile]);
      }
    } finally {
      setIsLoading(false);
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
      
      setStaffList((prev) => [result.profile, ...prev]);
      
      // Store generated code info to show success modal step
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Staff Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Invite team members, assign permissions, and manage store staff access.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadStaff} variant="secondary" className="h-10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsInviteModalOpen(true)} className="h-10 bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
        </div>
      </div>

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

      {/* Staff Table Card */}
      <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm space-y-4">
        {/* Search Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredStaff.length} of {staffList.length} staff members
          </span>
        </div>

        {/* Table */}
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
                      <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-bold flex items-center justify-center text-sm uppercase">
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
                        {/* Change Role Selection */}
                        <select
                          value={staff.role}
                          onChange={(e) => handleRoleChange(staff.id, e.target.value as any)}
                          className="text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded px-2 py-1 focus:outline-none"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Manager">Manager</option>
                          <option value="Cashier">Cashier</option>
                        </select>

                        {/* Status toggle button */}
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
              /* SUCCESS CODE DISPLAY VIEW */
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
              /* INPUT FORM VIEW */
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
