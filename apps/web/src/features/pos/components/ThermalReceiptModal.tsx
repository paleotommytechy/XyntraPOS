import { useRef, useState } from 'react';
import { Dialog, Button } from '@xyntra/ui';
import { Printer, Check, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction } from '@xyntra/types';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  currency?: string;
}

export function ThermalReceiptModal({
  isOpen,
  onClose,
  transaction,
  businessName = 'XyntraPOS Merchant',
  businessAddress,
  businessPhone,
  currency = 'NGN',
}: ThermalReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [copiedEscPos, setCopiedEscPos] = useState(false);

  if (!transaction) return null;

  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : `${currency} `;
  const formattedDate = new Date(transaction.created_at || Date.now()).toLocaleString();

  // Generate ESC/POS raw text representation for hardware thermal printers
  const generateEscPosText = (): string => {
    let esc = '';
    esc += `\x1B\x40`; // Initialize printer
    esc += `\x1B\x61\x01`; // Center align
    esc += `${businessName.toUpperCase()}\n`;
    if (businessAddress) esc += `${businessAddress}\n`;
    if (businessPhone) esc += `TEL: ${businessPhone}\n`;
    esc += `--------------------------------\n`;
    esc += `RECEIPT: ${transaction.receipt_number || transaction.id.slice(0, 8)}\n`;
    esc += `DATE: ${formattedDate}\n`;
    esc += `--------------------------------\n`;
    esc += `\x1B\x61\x00`; // Left align

    (transaction.items || []).forEach((item: any) => {
      const pName = (item.product?.name || item.name || 'Item').slice(0, 18).padEnd(18, ' ');
      const qty = `${item.quantity}x`.padStart(4, ' ');
      const amt = `${symbol}${(item.total || item.unit_price * item.quantity).toLocaleString()}`.padStart(10, ' ');
      esc += `${pName}${qty}${amt}\n`;
    });

    esc += `--------------------------------\n`;
    esc += `SUBTOTAL:`.padEnd(20, ' ') + `${symbol}${(transaction.subtotal || transaction.total).toLocaleString()}\n`;
    if (transaction.discount > 0) {
      esc += `DISCOUNT:`.padEnd(20, ' ') + `-${symbol}${transaction.discount.toLocaleString()}\n`;
    }
    if (transaction.tax > 0) {
      esc += `TAX:`.padEnd(20, ' ') + `+${symbol}${transaction.tax.toLocaleString()}\n`;
    }
    esc += `\x1B\x45\x01`; // Emphasized text ON
    esc += `TOTAL:`.padEnd(20, ' ') + `${symbol}${transaction.total.toLocaleString()}\n`;
    esc += `\x1B\x45\x00`; // Emphasized text OFF
    esc += `--------------------------------\n`;
    esc += `PAYMENT: ${transaction.payment_status || 'Paid'}\n`;
    esc += `\x1B\x61\x01`; // Center align
    esc += `\nThank you for shopping with us!\n`;
    esc += `Powered by XyntraPOS\n\n\n`;
    esc += `\x1D\x56\x41\x03`; // Cut paper
    return esc;
  };

  const handlePrintThermal = () => {
    const printContent = receiptRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt ${transaction.receipt_number || transaction.id}</title>
            <style>
              @page { margin: 0; size: ${paperWidth} auto; }
              body {
                font-family: 'Courier New', Courier, monospace;
                width: ${paperWidth};
                margin: 0 auto;
                padding: 10px;
                font-size: 11px;
                color: #000;
                background: #fff;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .uppercase { text-transform: uppercase; }
              .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
              table { width: 100%; border-collapse: collapse; margin: 6px 0; }
              td, th { padding: 2px 0; vertical-align: top; }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCopyEscPos = () => {
    const escText = generateEscPosText();
    navigator.clipboard.writeText(escText);
    setCopiedEscPos(true);
    toast.success('ESC/POS thermal raw command copied to clipboard');
    setTimeout(() => setCopiedEscPos(false), 2000);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Receipt Print & Export Center">
      <div className="space-y-4">
        {/* Paper Size selector toolbar */}
        <div className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-300">Thermal Format:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-3 py-1 rounded-lg transition-all ${
                paperWidth === '80mm'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              80mm Standard
            </button>
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-3 py-1 rounded-lg transition-all ${
                paperWidth === '58mm'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              58mm Mini
            </button>
          </div>
        </div>

        {/* Thermal Receipt Preview Box */}
        <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-white text-black font-mono text-xs shadow-inner max-h-96 overflow-y-auto">
          <div ref={receiptRef} className={`mx-auto ${paperWidth === '58mm' ? 'max-w-[200px]' : 'max-w-[280px]'}`}>
            <div className="text-center space-y-0.5">
              <h3 className="font-bold text-sm uppercase">{businessName}</h3>
              {businessAddress && <p className="text-[10px] text-slate-600">{businessAddress}</p>}
              {businessPhone && <p className="text-[10px] text-slate-600">TEL: {businessPhone}</p>}
            </div>

            <div className="border-b border-dashed border-black my-2" />

            <div className="text-[10px] space-y-0.5">
              <p><span className="font-bold">Receipt #:</span> {transaction.receipt_number || transaction.id.slice(0, 8)}</p>
              <p><span className="font-bold">Date:</span> {formattedDate}</p>
              <p><span className="font-bold">Status:</span> {transaction.payment_status || 'Paid'}</p>
            </div>

            <div className="border-b border-dashed border-black my-2" />

            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {(transaction.items || []).map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-1 pr-1 truncate max-w-[120px]">{item.product?.name || item.name || 'Product Item'}</td>
                    <td className="text-center py-1">{item.quantity}</td>
                    <td className="text-right py-1 font-bold">
                      {symbol}{(item.total || item.unit_price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-b border-dashed border-black my-2" />

            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{symbol}{(transaction.subtotal || transaction.total).toLocaleString()}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{symbol}{transaction.discount.toLocaleString()}</span>
                </div>
              )}
              {transaction.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>+{symbol}{transaction.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                <span>TOTAL:</span>
                <span>{symbol}{transaction.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-black my-3" />

            <div className="text-center text-[10px] space-y-1">
              <p className="font-bold">Thank you for your business!</p>
              <p className="text-[9px] text-slate-500">Powered by XyntraPOS</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={handlePrintThermal} className="flex-1 flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" />
            <span>Print Thermal Receipt</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleCopyEscPos}
            className="flex items-center justify-center gap-2"
          >
            {copiedEscPos ? <Check className="w-4 h-4 text-green-600" /> : <FileCode className="w-4 h-4 text-slate-500" />}
            <span>{copiedEscPos ? 'Copied' : 'ESC/POS Raw'}</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
