import { useState, useEffect } from 'react';

const DESKTOP_OVERRIDE_KEY = 'xyntra_pos_desktop_override';

export function useIsMobile(breakpoint = 768) {
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  const [desktopOverride, setDesktopOverrideState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(DESKTOP_OVERRIDE_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  const toggleDesktopOverride = (override?: boolean) => {
    const nextValue = override !== undefined ? override : !desktopOverride;
    setDesktopOverrideState(nextValue);
    if (typeof window !== 'undefined') {
      if (nextValue) {
        localStorage.setItem(DESKTOP_OVERRIDE_KEY, 'true');
      } else {
        localStorage.removeItem(DESKTOP_OVERRIDE_KEY);
      }
    }
  };

  // Active mobile mode is true ONLY IF screen is smaller than breakpoint AND user hasn't explicitly enabled desktop override
  const isMobileMode = isMobileScreen && !desktopOverride;

  return {
    isMobileScreen,
    isMobileMode,
    desktopOverride,
    toggleDesktopOverride,
  };
}
