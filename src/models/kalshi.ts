
export interface KalshiBalance {
    balance: number;
}

export interface KalshiBalanceResult {
    data: KalshiBalance | null;
    error: string | null;
}
