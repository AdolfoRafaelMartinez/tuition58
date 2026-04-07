
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { KalshiBalanceResult, Market, MarketPriceHistory } from '../models/kalshi.js';

dotenv.config();

function loadPrivateKeyFromFile(filePath: string) {
    const absolutePath = path.resolve(filePath);
    const privateKeyPem = fs.readFileSync(absolutePath, 'utf8');
    return privateKeyPem;
}

function signPssText(privateKeyPem: string, text: string): string {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(text);
    sign.end();

    const signature = sign.sign({
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    });

    return signature.toString('base64');
}

export async function getKalshiBalance(): Promise<KalshiBalanceResult> {
    try {
        if (!process.env.API_KEY || !process.env.RSA_PRIVATE_KEY) {
            console.error("Missing Kalshi API credentials. Please check your .env file.");
            return { data: null, error: "Missing Kalshi API credentials." };
        }

        const currentTimeMilliseconds = Date.now();
        const timestampStr = currentTimeMilliseconds.toString();

        const privateKeyPem = loadPrivateKeyFromFile(process.env.RSA_PRIVATE_KEY);

        const method = "GET";
        const baseUrl = 'https://api.elections.kalshi.com'
        const url_path = '/trade-api/v2/portfolio/balance';

        const pathWithoutQuery = url_path.split('?')[0];
        const msgString = timestampStr + method + pathWithoutQuery;
        const sig = signPssText(privateKeyPem, msgString);

        const headers = {
            'KALSHI-ACCESS-KEY': process.env.API_KEY,
            'KALSHI-ACCESS-SIGNATURE': sig,
            'KALSHI-ACCESS-TIMESTAMP': timestampStr
        };

        const response = await fetch(baseUrl + url_path, { headers });
        const responseData = await response.json();

        if (responseData) {
            return {
                data: {
                    balance: responseData.balance,
                    portfolio_value: responseData.portfolio_value
                },
                error: null,
            };
        } else {
            return { data: null, error: 'Failed to retrieve a valid balance from Kalshi API.' };
        }
    } catch (error) {
        console.error('Error fetching Kalshi balance:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { data: null, error: `Failed to fetch Kalshi balance: ${errorMessage}` };
    }
}

export async function getKalshiLimits() {
    try {
        if (!process.env.API_KEY || !process.env.RSA_PRIVATE_KEY) {
            console.error("Missing Kalshi API credentials. Please check your .env file.");
            return { data: null, error: "Missing Kalshi API credentials." };
        }

        const currentTimeMilliseconds = Date.now();
        const timestampStr = currentTimeMilliseconds.toString();

        const privateKeyPem = loadPrivateKeyFromFile(process.env.RSA_PRIVATE_KEY);

        const method = "GET";
        const baseUrl = 'https://api.elections.kalshi.com'
        const url_path = '/trade-api/v2/account/limits';

        const pathWithoutQuery = url_path.split('?')[0];
        const msgString = timestampStr + method + pathWithoutQuery;
        const sig = signPssText(privateKeyPem, msgString);

        const headers = {
            'KALSHI-ACCESS-KEY': process.env.API_KEY,
            'KALSHI-ACCESS-SIGNATURE': sig,
            'KALSHI-ACCESS-TIMESTAMP': timestampStr
        };

        const response = await fetch(baseUrl + url_path, { headers });
        const responseData = await response.json();

        return { data: responseData, error: null };

    } catch (error) {
        console.error('Error fetching Kalshi limits:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { data: null, error: `Failed to fetch Kalshi limits: ${errorMessage}` };
    }
}

export async function getKalshiPositions() {
    try {
        if (!process.env.API_KEY || !process.env.RSA_PRIVATE_KEY) {
            console.error("Missing Kalshi API credentials. Please check your .env file.");
            return { data: null, error: "Missing Kalshi API credentials." };
        }

        const currentTimeMilliseconds = Date.now();
        const timestampStr = currentTimeMilliseconds.toString();

        const privateKeyPem = loadPrivateKeyFromFile(process.env.RSA_PRIVATE_KEY);

        const method = "GET";
        const baseUrl = 'https://api.elections.kalshi.com'
        const url_path = '/trade-api/v2/portfolio/positions?limit=100';

        // Strip query parameters from path before signing
        const pathWithoutQuery = url_path.split('?')[0];
        const msgString = timestampStr + method + pathWithoutQuery;
        const sig = signPssText(privateKeyPem, msgString);

        const headers = {
            'KALSHI-ACCESS-KEY': process.env.API_KEY,
            'KALSHI-ACCESS-SIGNATURE': sig,
            'KALSHI-ACCESS-TIMESTAMP': timestampStr
        };

        const response = await fetch(baseUrl + url_path, { headers });
        const responseData = await response.json();

        function truncateNumbers(obj: any): any {
            if (typeof obj === 'number') return Math.trunc(obj);
            if (Array.isArray(obj)) return obj.map(truncateNumbers);
            if (obj !== null && typeof obj === 'object') {
                const newObj: any = {};
                for (const key in obj) {
                    newObj[key] = truncateNumbers(obj[key]);
                }
                return newObj;
            }
            return obj;
        }

        return { data: truncateNumbers(responseData), error: null };

    } catch (error) {
        console.error('Error fetching Kalshi positions:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { data: null, error: `Failed to fetch Kalshi positions: ${errorMessage}` };
    }
}

export async function getKalshiMarkets(event_ticker: string, marketPriceHistory: any = {}) {
    try {
        const options = { method: 'GET' };
        const response = await fetch(`https://api.elections.kalshi.com/trade-api/v2/markets?event_ticker=${event_ticker}`, options);
        const data = await response.json();
        let markets = data.markets;
        markets.forEach((market: any) => {
            market.bin_value = Number(market.ticker.match(/\d+\.?\d$/));
            market.is_bin = market.ticker.toLowerCase().match(/b\d/);
        });
        markets.sort((a: { bin_value: number; }, b: { bin_value: number; }) => a.bin_value - b.bin_value);

        let marketRows: any[] = markets.map((market: any, ndx: number) => {
            if (ndx == 0) {
                market.upper = market.bin_value - 1;
            } else {
                if (market.is_bin) {
                    market.lower = Math.floor(market.bin_value);
                    market.upper = Math.ceil(market.bin_value);
                } else {
                    market.lower = market.bin_value + 1;
                }
            }

            const currentPrice = Math.trunc(market.last_price_dollars * 100);
            const history = marketPriceHistory[market.ticker] || [];

            const lastHistoricalPrice = history.length > 0 ? history[history.length - 1].price : currentPrice;
            let priceChange = currentPrice - lastHistoricalPrice;

            return {
                ticker: market.ticker,
                range: `${market.lower === undefined ? 'N/A' : market.lower} to ${market.upper === undefined ? 'N/A' : market.upper}`,
                price: currentPrice,
                priceChange: priceChange,
                priceChangeClass: priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : 'neutral',
                priceChangeIcon: priceChange > 0 ? '<span class="triangle-up">&#9650;</span>' : priceChange < 0 ? '<span class="triangle-down">&#9660;</span>' : '',
                priceChangeDisplay: Math.abs(priceChange),
                bought_price: null, sold_price: null, buy_indices: [], sell_indices: [], 
                allPrices: history.map((p: any) => p.price).concat([currentPrice]),
                earned: 0
            };
        });

        const maxPrice = Math.max(...marketRows.map(row => row.price));
        let leaderTicker = null;
        if (maxPrice > 0) {
            const leaders = marketRows.filter(row => row.price === maxPrice);
            if (leaders.length > 0) {
                leaderTicker = leaders[leaders.length -1].ticker;
            }
        }

        marketRows.forEach(row => {
            row.leader = row.ticker === leaderTicker;
            const historyPrices = row.allPrices.slice(0, -1);

            if (row.leader) {
                row.earned = row.priceChange;
            } else {
                if (historyPrices.length > 0) {
                    const initial_price = historyPrices[0];
                    const currentPrice = row.price;
                    if (currentPrice > initial_price) {
                        row.earned = 0;
                    } else {
                        row.earned = initial_price;
                    }
                } else {
                    row.earned = 0;
                }
            }
        });

        data.marketRows = marketRows;
        return { data: data, error: null };
    } catch (error) {
        console.error(`Error fetching Kalshi markets for ${event_ticker}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { data: null, error: `Failed to fetch Kalshi markets: ${errorMessage}` };
    }
}

export async function placeKalshiOrder(orderParams: any) {
    try {
        const { ticker, action, side, price, count } = orderParams;

        // This is a mock implementation that simulates placing an order.
        console.log(`Mock order placed: ${action} ${count} contract(s) of ${ticker} at ${price} cents on side ${side}`);

        const client_order_id = crypto.randomUUID().toString();
        const mockOrderResponse = {
            order: {
                action: action,
                client_order_id: client_order_id,
                count: count,
                creation_time: new Date().toISOString(),
                no_price: side === 'no' ? 100 - price : undefined,
                order_id: `mock_order_${client_order_id}`,
                side: side,
                status: "created",
                ticker: ticker,
                type: 'limit',
                yes_price: side === 'yes' ? price : undefined
            }
        };

        return {
            data: mockOrderResponse,
            error: null,
        };

    } catch (error) {
        console.error('Error creating mock Kalshi order:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { data: null, error: `Failed to create mock Kalshi order: ${errorMessage}` };
    }
}
