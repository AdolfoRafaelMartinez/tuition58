
export interface KalshiBalance {
    balance: number;
    portfolio_value: number;
}

export interface KalshiBalanceResult {
    data: KalshiBalance | null;
    error: string | null;
}
