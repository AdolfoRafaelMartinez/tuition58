
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
        markets.sort((a, b) => a.bin_value - b.bin_value);

        const risingBuys = [];
        const newBuys = [];
        const potentialSells = [];

        let marketRows = markets.map((market: any, ndx: number) => {
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

            const wasCheap = history.some((p: any) => p.price < 10);
            const isNowExpensive = currentPrice > 10;
            const wasExpensive = history.some((p: any) => p.price >= 10);
            const isNowAtLeast10 = currentPrice >= 10;

            let held = (wasExpensive && isNowAtLeast10) || (wasCheap && isNowExpensive);

            const lastHistoricalPrice = history.length > 0 ? history[history.length - 1].price : null;
            let priceChange = 0;
            if (lastHistoricalPrice !== null) {
                priceChange = currentPrice - lastHistoricalPrice;
            }

            if (lastHistoricalPrice !== null) {
                if (priceChange > 2) {
                    risingBuys.push({ ticker: market.ticker, price: currentPrice });
                } else if (priceChange < -2) {
                    potentialSells.push({ ticker: market.ticker, price: currentPrice });
                }
            } else if (history.length === 0 && currentPrice > 0 && currentPrice < 50) {
                newBuys.push({ ticker: market.ticker, price: currentPrice });
            }

            return {
                ticker: market.ticker,
                range: `${market.lower === undefined ? 'N/A' : market.lower} to ${market.upper === undefined ? 'N/A' : market.upper}`,
                price: currentPrice,
                priceChange: priceChange,
                priceChangeClass: priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : 'neutral',
                priceChangeIcon: priceChange > 0 ? '<span class="triangle-up">&#9650;</span>' : priceChange < 0 ? '<span class="triangle-down">&#9660;</span>' : '',
                priceChangeDisplay: Math.abs(priceChange),
                held: held,
                signal: history.length === 0 ? 'none' : 'hold',
                bought_price: null, sold_price: null, earned_value: 0, buy_indices: [], sell_indices: [], allPrices: []
            };
        });

        const strongBuys = risingBuys.filter(b => {
            const row = marketRows.find(r => r.ticker === b.ticker);
            return row && row.held;
        });

        if (strongBuys.length === 1) {
            const strongBuyTicker = strongBuys[0].ticker;
            marketRows.forEach(row => {
                if (row.ticker === strongBuyTicker) {
                    row.signal = 'buy';
                } else if (row.held) {
                    row.signal = 'sell';
                    if (row.priceChange === 0 && row.price > 10) {
                        row.held = false;
                    }
                }
            });
        } else {
            let sellSignals = [];
            marketRows.forEach(row => {
                if (row.held) {
                    const shouldSell = potentialSells.some(s => s.ticker === row.ticker);
                    if (shouldSell) {
                        row.signal = 'sell';
                        sellSignals.push(row.ticker);
                    }
                }
            });

            if (sellSignals.length > 0) {
                const potentialBuys = marketRows.filter(r => r.signal !== 'sell' && r.held);
                if (potentialBuys.length === 1) {
                    potentialBuys[0].signal = 'buy';
                }
            }

            const heldCount = marketRows.filter(r => r.held).length;
            if (heldCount === 0) {
                const totalPotentialBuys = risingBuys.length + newBuys.length;
                if (totalPotentialBuys === 1) {
                    const theBuy = risingBuys.length > 0 ? risingBuys[0] : newBuys[0];
                    const buyRow = marketRows.find(row => row.ticker === theBuy.ticker);
                    if (buyRow) {
                        buyRow.signal = 'buy';
                    }
                } else if (totalPotentialBuys > 1 && risingBuys.length === 0) {
                    newBuys.sort((a, b) => b.price - a.price);
                    const bestBuy = newBuys[0];
                    const bestBuyRow = marketRows.find(row => row.ticker === bestBuy.ticker);
                    if (bestBuyRow) {
                        bestBuyRow.signal = 'buy';
                    }
                }
            }
        }

        const maxPrice = Math.max(...marketRows.map((r: any) => r.price));
        const leadingCount = marketRows.filter((r: any) => r.price === maxPrice).length;
        const hasLeadingMarket = leadingCount === 1;
        const hasAnySells = marketRows.some((r: any) => r.signal === 'sell');

        if (!hasLeadingMarket && risingBuys.length === 0 && maxPrice > 10) {
            marketRows.forEach((row: any) => {
                row.signal = 'none';
                if (row.priceChange === 0 && row.price >= 10) {
                    row.held = false;
                }
            });
        }

        if (hasLeadingMarket && risingBuys.length === 0 && !hasAnySells && maxPrice > 10) {
            marketRows.forEach((row: any) => {
                if (row.price === maxPrice) {
                    row.signal = 'buy';
                } else {
                    row.signal = 'none';
                    if (row.priceChange === 0 && row.price >= 10) {
                        row.held = false;
                    }
                }
            });
        }

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
