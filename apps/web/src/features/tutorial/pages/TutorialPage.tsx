import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth.store';
import { supabase } from '../../../lib/supabase';
import { Card, Button } from '@xyntra/ui';
import {
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  KeyRound,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export function TutorialPage() {
  const { user, profile, business, setProfile } = useAuthStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  const role = profile.role || 'Cashier';

  // Role-specific Tutorial Step Configurations
  const adminSteps = [
    {
      id: 'admin_welcome',
      title: 'Welcome to Your Business Workspace',
      badge: 'Admin Step 1 of 5',
      description:
        'As the Business Owner (Admin), you have complete control over workspace settings, staff access codes, store taxes, and real-time revenue analytics.',
      takeaways: [
        'Your Workspace ID can be shared with staff for quick access.',
        'Only Admins can modify store currency, tax rates, and business details.',
        'Manage store-wide low stock alert thresholds.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3 font-sans">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="text-slate-400">Workspace Name:</span>
            <span className="font-bold text-blue-400">{business?.name || 'My Store Workspace'}</span>
          </div>
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="text-slate-400">Currency & Tax:</span>
            <span className="font-bold text-emerald-400">{business?.currency || 'NGN'} (₦) • Tax: {business?.tax_rate || 7.5}%</span>
          </div>
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
            💡 <strong>Pro Tip:</strong> Invite Managers and Cashiers from the Staff menu using 6-digit one-time access codes.
          </div>
        </div>
      ),
    },
    {
      id: 'admin_taxes',
      title: 'Store & Tax Configuration',
      badge: 'Admin Step 2 of 5',
      description:
        'Configure your store tax rate, tax identification (VAT) number, currency formatting, and customized receipt headers and footers.',
      takeaways: [
        'Enable or disable POS checkout sales tax calculation with 1 click.',
        'Customize receipt headers (e.g. "Welcome to Xyntra Store!") and footers.',
        'Choose whether cashier names appear on customer receipt prints.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Checkout Sales Tax</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Enabled (7.5%)</span>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">Receipt Header Preview:</p>
            <p className="font-mono text-slate-200">"Thank you for shopping with us!"</p>
          </div>
        </div>
      ),
    },
    {
      id: 'admin_staff',
      title: 'Staff Management & One-Time Access Codes',
      badge: 'Admin Step 3 of 5',
      description:
        'Add team members seamlessly without exposing database credentials. Generate 6-digit one-time access codes (e.g., 492810) and approve pending access requests.',
      takeaways: [
        'Invite Cashiers and Managers with role-based permissions.',
        'New staff enter the 6-digit code during signup.',
        'Review and approve or reject staff access requests from the Staff Management table.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-400" />
              <div>
                <p className="font-bold text-white">Generated Access Code</p>
                <p className="text-[10px] text-slate-400">Role: Cashier</p>
              </div>
            </div>
            <span className="font-mono text-sm font-extrabold text-blue-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
              492810
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'admin_inventory',
      title: 'Inventory & Low Stock Alerts',
      badge: 'Admin Step 4 of 5',
      description:
        'Keep track of your catalog stock levels, cost prices, selling prices, categories, and automated low-stock warnings.',
      takeaways: [
        'Set custom low-stock thresholds (e.g. 5 units).',
        'Receive automated in-app notifications when stock runs low.',
        'Track stock value and profit margins per item.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Wireless Barcode Scanner</span>
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 font-bold rounded">2 Units Left (Low Stock)</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full w-[20%]" />
          </div>
        </div>
      ),
    },
    {
      id: 'admin_reports',
      title: 'Sales Analytics & "Who Sold What" Tracking',
      badge: 'Admin Step 5 of 5',
      description:
        'Access live sales performance charts, revenue breakdowns, top-selling products, and exact cashier sales attribution ("Who Sold What").',
      takeaways: [
        'Filter revenue by Today, Yesterday, Last 7 Days, or Custom Date Ranges.',
        'See exact revenue generated by each Cashier and Manager.',
        'Export detailed CSV sales reports anytime.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-300">Staff Sales Leaderboard</span>
            <span className="text-emerald-400">Total Store Revenue: ₦450,000</span>
          </div>
          <div className="p-2 bg-slate-800 rounded flex justify-between">
            <span>Jane Cashier</span>
            <span className="font-bold text-blue-400">₦280,000 (14 sales)</span>
          </div>
        </div>
      ),
    },
  ];

  const managerSteps = [
    {
      id: 'mgr_welcome',
      title: 'Welcome to Store Operational Management',
      badge: 'Manager Step 1 of 5',
      description:
        'As a Store Manager, you oversee inventory stock transfers, cashier sales operations, customer accounts, and return authorizations.',
      takeaways: [
        'Supervise daily store sales and transactions.',
        'Manage inventory quantities, categories, and stock reorders.',
        'Track staff shift attendance logs.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Manager Account:</span>
            <span className="font-bold text-emerald-400">{profile.name}</span>
          </div>
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
            ✓ Operational supervision privileges active.
          </div>
        </div>
      ),
    },
    {
      id: 'mgr_inventory',
      title: 'Stock Control & Location Transfers',
      badge: 'Manager Step 2 of 5',
      description:
        'Monitor stock levels, edit product details, adjust stock counts, and initiate inventory transfers between warehouse and sales counter.',
      takeaways: [
        'Log inventory restocks and quantity adjustments.',
        'Transfer stock between store locations with notes.',
        'View low stock alert warnings in real time.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span>Transfer: Main Warehouse ➔ POS Register</span>
            <span className="font-bold text-blue-400">+15 Units</span>
          </div>
        </div>
      ),
    },
    {
      id: 'mgr_who_sold_what',
      title: 'Sales Supervision & Cashier Tracking',
      badge: 'Manager Step 3 of 5',
      description:
        'View all completed transactions and filter by cashier name to audit who processed each sale and monitor register performance.',
      takeaways: [
        'Verify cashier sales attribution ("Who Sold What").',
        'Review payment methods (Cash, Card, Transfer, Paystack).',
        'Inspect sales audit logs for any discrepancies.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Receipt #REC-1092</span>
            <span className="text-blue-400 font-bold">Cashier: John Doe</span>
          </div>
          <div className="p-2 bg-slate-800 rounded font-mono text-emerald-400">
            Total: ₦18,500 (Card)
          </div>
        </div>
      ),
    },
    {
      id: 'mgr_customers',
      title: 'Customer Loyalty & Store Credit',
      badge: 'Manager Step 4 of 5',
      description:
        'Manage customer profiles, assign loyalty rewards points, and issue store credit for customer accounts.',
      takeaways: [
        'Register new customers and view purchase history.',
        'Award loyalty points automatically during checkout.',
        'Issue store credit for customer refunds or trade-ins.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span>Customer: Alex Morgan</span>
            <span className="font-bold text-purple-400">Loyalty: 120 Points</span>
          </div>
        </div>
      ),
    },
    {
      id: 'mgr_shifts',
      title: 'Staff Shift Attendance & Returns',
      badge: 'Manager Step 5 of 5',
      description:
        'Supervise staff clock-in/clock-out attendance logs and process customer returns with options to restock inventory.',
      takeaways: [
        'View live staff attendance status (Clocked In vs. Off Duty).',
        'Process customer sales returns and issue refunds.',
        'Choose whether returned items are restocked automatically into inventory.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span>Return Request #RET-84</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded">Restocked to Inventory</span>
          </div>
        </div>
      ),
    },
  ];

  const cashierSteps = [
    {
      id: 'cashier_welcome',
      title: 'Welcome to Fast POS Checkout',
      badge: 'Cashier Step 1 of 5',
      description:
        'As a Store Cashier, your main focus is serving walk-in and regular customers quickly with fast checkout, barcode scanning, and receipt printing.',
      takeaways: [
        'Clock in for your shift at the start of your workday.',
        'Search products by barcode or name for quick cart additions.',
        'Process multiple payment methods effortlessly.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Cashier Terminal:</span>
            <span className="font-bold text-blue-400">{profile.name}</span>
          </div>
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
            ⚡ Optimized for speed and accuracy during peak customer traffic.
          </div>
        </div>
      ),
    },
    {
      id: 'cashier_shift',
      title: 'Shift Clock-In & Attendance',
      badge: 'Cashier Step 2 of 5',
      description:
        'Start your workday by clicking "Clock In & Start Shift". Your working hours will be logged automatically for store attendance.',
      takeaways: [
        'Always clock in before processing your first sale.',
        'Clock out at the end of your shift to finalize your active duration.',
        'Your shift hours are visible to managers.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-emerald-300">Shift Status: Clocked In (Active)</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'cashier_pos',
      title: 'POS Cart & Barcode Scanning',
      badge: 'Cashier Step 3 of 5',
      description:
        'Scan product barcodes or click item tiles to add them to the customer cart. Adjust quantities or apply item discounts seamlessly.',
      takeaways: [
        'Use barcode scanners or manual search for instant catalog lookup.',
        'Keyboard Shortcut: Press F2 for quick cart discount entry.',
        'Press Save Draft to park carts for customers who need to pick more items.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between p-2 bg-slate-800 rounded">
            <span>Product: Premium Coffee Beans x 2</span>
            <span className="font-bold text-white">₦12,000</span>
          </div>
        </div>
      ),
    },
    {
      id: 'cashier_payments',
      title: 'Multi-Payment & Checkout',
      badge: 'Cashier Step 4 of 5',
      description:
        'Accept payment via Cash, Card Terminal, Bank Transfer, or Paystack QR code. Calculate change due automatically.',
      takeaways: [
        'Select payment provider (Cash, Card, Transfer, Paystack).',
        'Enter customer tender amount to compute change.',
        'Click Complete Sale to finalize transaction.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded">
            <span>Payment Method: Bank Transfer</span>
            <span className="font-bold text-emerald-400">Paid ₦12,000</span>
          </div>
        </div>
      ),
    },
    {
      id: 'cashier_receipts',
      title: 'Print & Digital Receipts',
      badge: 'Cashier Step 5 of 5',
      description:
        'Print thermal receipts or send digital receipts to customer email instantly after checkout.',
      takeaways: [
        'Automatic thermal receipt printing popup.',
        'Customer receipt contains store logo, header, and line items.',
        'Your cashier name appears on the receipt for transparency.',
      ],
      interactiveWidget: (
        <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs text-center font-mono">
          <p className="font-bold text-blue-400">*** XyntraPOS Receipt ***</p>
          <p className="text-slate-400">Cashier: {profile.name}</p>
          <p className="text-emerald-400 font-bold">STATUS: PAID</p>
        </div>
      ),
    },
  ];

  const steps = role === 'Admin' ? adminSteps : role === 'Manager' ? managerSteps : cashierSteps;
  const activeStep = steps[currentStep] || steps[0];
  const isLastStep = currentStep === steps.length - 1;

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleCompleteTutorial = async () => {
    const key = `xyntra_tutorial_completed_${profile.id}`;
    localStorage.setItem(key, 'true');

    try {
      await supabase
        .from('profiles')
        .update({ has_completed_tutorial: true })
        .eq('id', profile.id);

      setProfile({ ...profile, has_completed_tutorial: true });
    } catch (e) {
      console.warn('Tutorial completion flag update notice:', e);
    }

    toast.success(`Welcome to XyntraPOS! Your ${role} workspace is ready.`);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-blue-600">
      {/* Top Bar Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 font-extrabold text-lg">
            X
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
              Xyntra<span className="text-blue-500">POS</span> Interactive Tutorial
            </h1>
            <p className="text-xs text-slate-400">Compulsory onboarding walkthrough for new store members</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {role} TUTORIAL
          </span>
        </div>
      </div>

      {/* Main Interactive Step Card */}
      <div className="max-w-3xl w-full mx-auto my-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>{activeStep.badge}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Completed</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                Step {currentStep + 1} of {steps.length}
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{activeStep.title}</h2>
            </div>
            <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 shrink-0">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{activeStep.description}</p>

          {/* Key Operational Takeaways */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Takeaways:</p>
            <div className="space-y-2">
              {activeStep.takeaways.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Feature Demo Widget */}
          <div className="pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Live Feature Preview Widget:</p>
            {activeStep.interactiveWidget}
          </div>
        </Card>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="max-w-4xl w-full mx-auto pt-6 border-t border-slate-800 flex items-center justify-between">
        <Button
          onClick={handlePrevStep}
          disabled={currentStep === 0}
          variant="secondary"
          className="h-11 px-5 text-slate-300 bg-slate-900 hover:bg-slate-800 border-slate-800"
        >
          <ChevronLeft className="h-4 w-4 mr-1.5" /> Previous
        </Button>

        {isLastStep ? (
          <Button
            onClick={handleCompleteTutorial}
            className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 animate-bounce"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" /> Complete Tutorial & Launch Workspace
          </Button>
        ) : (
          <Button
            onClick={handleNextStep}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
          >
            Next Step <ChevronRight className="h-4 w-4 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default TutorialPage;
