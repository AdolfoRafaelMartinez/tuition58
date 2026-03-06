export interface KalshiBalance {
    balance: number;
    portfolio_value: number;
}

export interface KalshiBalanceResult {
    data: KalshiBalance | null;
    error: string | null;
}

export interface Market {
    ticker: string;
    last_price: number;
    yes_ask: number;
    yes_bid: number;
    [key: string]: any;
}

export interface MarketPriceHistory {
    [ticker: string]: { time: Date; price: number }[];
}

export type Recommendation = 'buy' | 'sell' | '';
