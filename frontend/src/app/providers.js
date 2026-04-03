import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
export function Providers({ children }) {
    return (_jsxs(QueryClientProvider, { client: queryClient, children: [children, import.meta.env.DEV && _jsx(ReactQueryDevtools, { initialIsOpen: false })] }));
}
