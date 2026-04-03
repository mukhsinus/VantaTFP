import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const getIsMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
  const [isMobile, setIsMobile] = useState<boolean>(getIsMobile);

  useEffect(() => {
    const onResize = () => setIsMobile(getIsMobile());
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
}
