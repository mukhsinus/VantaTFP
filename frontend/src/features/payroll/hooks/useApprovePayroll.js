import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi } from '@entities/payroll/payroll.api';
import { ApiError } from '@shared/api/client';
import i18n from '@shared/i18n/i18n';
import { toast } from '@app/store/toast.store';
import { payrollKeys } from './payroll.query-keys';
export function useApprovePayroll() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (payrollId) => payrollApi.approve(payrollId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payrollKeys.lists() });
            toast.success(i18n.t('status.approved'), i18n.t('payroll.title'));
        },
        onError: (error) => {
            if (error instanceof ApiError) {
                toast.error(i18n.t('errors.generic.requestFailed', { statusCode: error.statusCode }), error.message);
            }
            else {
                toast.error(i18n.t('errors.generic.unexpected'), i18n.t('errors.generic.network'));
            }
        },
    });
    return {
        approvePayroll: (payrollId) => mutation.mutate(payrollId),
        isPending: mutation.isPending,
    };
}
