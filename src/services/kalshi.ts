
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

        let potentialBuys = [];
        let potentialSells = [];

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
            const history = marketPriceHistory[market.ticker];
            let priceChange = 0;
            let bought_price: number | null = null;
            let sold_price: number | null = null;
            let earned_value = 0;
            let allPrices: number[] = [];
            let held = false;
            let buy_indices: number[] = [];
            let sell_indices: number[] = [];

            if (history && history.length > 0) {
                const previousPrice = history[history.length - 1].price;
                priceChange = currentPrice - previousPrice;

                allPrices = [...history.map((h: any) => h.price), currentPrice];

                let current_bought_price: number | null = null;

                for (let i = 1; i < allPrices.length; i++) {
                    const currentChange = allPrices[i] - allPrices[i - 1];

                    if (currentChange > 2) { // Buy signal
                        if (current_bought_price === null) {
                            buy_indices.push(i);
                            current_bought_price = allPrices[i];
                        }
                    } else if (currentChange < -2) { // Sell signal
                        if (current_bought_price !== null) {
                            sell_indices.push(i);
                            earned_value += allPrices[i] - current_bought_price;
                            current_bought_price = null;
                        }
                    }
                }

                if (current_bought_price !== null) {
                    if (allPrices.length > 1) {
                        held = true;
                    }
                    earned_value += allPrices[allPrices.length - 1] - current_bought_price;
                }

                for (let i = allPrices.length - 1; i > 0; i--) {
                    const currentChange = allPrices[i] - allPrices[i - 1];

                    if (bought_price === null && currentChange > 2) {
                        bought_price = allPrices[i];
                    }
                    if (sold_price === null && currentChange < -2) {
                        sold_price = allPrices[i];
                    }
                    if (bought_price !== null && sold_price !== null) {
                        break;
                    }
                }
            } else {
                allPrices = [currentPrice];
            }

            let signal = 'hold';
            if (allPrices.length >= 2) {
                const lastPrice = allPrices[allPrices.length - 1];
                const secondLastPrice = allPrices[allPrices.length - 2];

                const currentChange = lastPrice - secondLastPrice;

                if (currentChange > 2) {
                    potentialBuys.push({ ticker: market.ticker, price: currentPrice });
                } else if (currentChange < -2) {
                    potentialSells.push({ ticker: market.ticker, price: currentPrice });
                }
            } else if (allPrices.length === 1 && currentPrice > 0 && currentPrice < 50) {
                potentialBuys.push({ ticker: market.ticker, price: currentPrice });
            }

            const priceChangeDisplay = Math.abs(priceChange);

            return {
                ticker: market.ticker,
                range: `${market.lower === undefined ? 'N/A' : market.lower} to ${market.upper === undefined ? 'N/A' : market.upper}`,
                price: currentPrice,
                priceChangeClass: priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : 'neutral',
                priceChangeIcon: priceChange > 0 ? '<span class="triangle-up">&#9650;</span>' : priceChange < 0 ? '<span class="triangle-down">&#9660;</span>' : '',
                priceChangeDisplay,
                bought_price,
                sold_price,
                earned_value,
                held,
                buy_indices,
                sell_indices,
                signal,
                allPrices
            };
        });

        if (potentialBuys.length > 0) {
            const bestBuy = potentialBuys.reduce((prev, current) => (prev.price > current.price) ? prev : current);
            const bestBuyRow = marketRows.find(row => row.ticker === bestBuy.ticker);
            if (bestBuyRow) {
                bestBuyRow.signal = 'buy';
            }
        }

        if (potentialSells.length > 0) {
            const bestSell = potentialSells.reduce((prev, current) => (prev.price < current.price) ? prev : current);
            const bestSellRow = marketRows.find(row => row.ticker === bestSell.ticker);
            if (bestSellRow) {
                bestSellRow.signal = 'sell';
            }
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
        // It does not actually interact with the Kalshi API.
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
