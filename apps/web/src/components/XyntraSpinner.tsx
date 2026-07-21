interface XyntraSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'full';
  label?: string;
  className?: string;
}

export function XyntraSpinner({ size = 'md', label = 'XyntraPOS', className = '' }: XyntraSpinnerProps) {
  if (size === 'full') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative">
            <img
              src="/logo.png"
              alt="XyntraPOS"
              className="h-16 w-16 object-contain rounded-2xl xyntra-logo-glow"
            />
          </div>
          <div className="flex items-center gap-1.5 font-bold text-2xl tracking-tight text-white">
            <span className="xyntra-loader-text">{label}</span>
            <div className="flex gap-1 items-center ml-1">
              <span className="h-2 w-2 bg-blue-500 rounded-full xyntra-dot-1"></span>
              <span className="h-2 w-2 bg-blue-400 rounded-full xyntra-dot-2"></span>
              <span className="h-2 w-2 bg-blue-300 rounded-full xyntra-dot-3"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const logoSizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const textSizes = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt="XyntraPOS"
        className={`${logoSizes[size]} object-contain rounded-xl xyntra-logo-glow`}
      />
      <div className={`flex items-center gap-1 tracking-tight ${textSizes[size]}`}>
        <span className="xyntra-loader-text">{label}</span>
        <div className="flex gap-1 items-center ml-0.5">
          <span className="h-1.5 w-1.5 bg-blue-500 rounded-full xyntra-dot-1"></span>
          <span className="h-1.5 w-1.5 bg-blue-400 rounded-full xyntra-dot-2"></span>
          <span className="h-1.5 w-1.5 bg-blue-300 rounded-full xyntra-dot-3"></span>
        </div>
      </div>
    </div>
  );
}

export default XyntraSpinner;
