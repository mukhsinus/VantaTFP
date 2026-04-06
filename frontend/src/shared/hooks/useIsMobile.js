import { useEffect, useState } from 'react';
const MOBILE_BREAKPOINT = 768;
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(true); // Default to true for SSR
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        // Set initial value on mount
        const getIsMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
        setIsMobile(getIsMobile());
        setHasMounted(true);
        // Handle resize
        const onResize = () => {
            setIsMobile(getIsMobile());
        };
        window.addEventListener('resize', onResize, { passive: true });
        return () => window.removeEventListener('resize', onResize);
    }, []);
    // Return true during SSR/before mount to avoid hydration mismatch
    return !hasMounted ? true : isMobile;
}
