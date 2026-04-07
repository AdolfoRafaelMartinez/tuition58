export interface KalshiMarket {
    ticker: string;
    last_price_dollars: number;
}

export interface KalshiMarketResponse {
    markets: KalshiMarket[];
    marketRows: any[];
    portfolio_value: number;
}

export interface MarketPrice {
    time: Date;
    price: number;
}

export interface MarketPriceHistory {
    [ticker: string]: MarketPrice[];
}

export interface Market {
    ticker: string;
    price: number;
    priceChange: number;
    priceChangeClass: string;
    priceChangeIcon: string;
    priceChangeDisplay: number;
    leader: boolean;
}

export interface KalshiAPIResponse {
    markets: Market[];
}

export interface KalshiBalanceData {
    balance: number;
    portfolio_value: number;
}

export interface KalshiBalanceResult {
    data: KalshiBalanceData | null;
    error: string | null;
}