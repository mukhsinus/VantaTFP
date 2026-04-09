export interface BillingLimitView {
  users: number | null;
  tasks: number | null;
  apiRatePerHour: number;
}

export interface BillingSnapshotDto {
  tenantId: string;
  planName: string;
  limits: BillingLimitView;
  usage: {
    users: number;
    tasks: number;
    apiRatePerHour: number;
  };
}
