import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@entities/reports/reports.api';
import { reportsKeys } from './reports.query-keys';
import { toast } from '@app/store/toast.store';
export function useReportHistory(type, options) {
    return useQuery({
        queryKey: reportsKeys.history(type),
        queryFn: () => reportsApi.history({ type }),
        enabled: options?.enabled ?? true,
    });
}
export function useGenerateReport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: reportsKeys.generate(),
        mutationFn: (payload) => reportsApi.generate(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reportsKeys.all });
            toast.success('Report generated', 'Your report is ready and saved in history.');
        },
    });
}
export function useExportReport() {
    return useMutation({
        mutationFn: async (payload) => {
            const blob = await reportsApi.export(payload);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${payload.type.toLowerCase()}-report.${payload.format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            toast.success('Export started', 'Report file has been downloaded.');
        },
    });
}
