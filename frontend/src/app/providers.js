import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ApiError } from '@shared/api/client';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // 1 minute
            retry: (failureCount, error) => {
                if (error instanceof ApiError && error.statusCode === 401)
                    return false;
                return failureCount < 1;
            },
            refetchOnWindowFocus: false,
        },
    },
});
export function Providers({ children }) {
    return (_jsxs(QueryClientProvider, { client: queryClient, children: [children, import.meta.env.DEV && _jsx(ReactQueryDevtools, { initialIsOpen: false })] }));
}
