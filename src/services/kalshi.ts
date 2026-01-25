
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { KalshiBalanceResult } from '../models/kalshi.js';

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
        
        if (responseData && typeof responseData.balance === 'number') {
            return {
                data: {
                    balance: responseData.balance
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

export async function getKalshiMarkets(event_ticker: string) {
    try {
        const options = {method: 'GET'};
        const response = await fetch(`https://api.elections.kalshi.com/trade-api/v2/markets?event_ticker=${event_ticker}`, options);
        const data = await response.json();
        let markets = data.markets;
        markets.forEach((market) => {
            market.value = Number(market.ticker.match(/\d+\.?\d$/));
            market.is_bin = market.ticker.toLowerCase().match(/b\d/);
        });
        markets.sort((a, b) => a.value - b.value);
        markets.forEach((market, ndx) => {
            if(ndx == 0){
                market.upper = market.value - 1;
            } else {
                if(market.is_bin){
                    market.lower = Math.floor(market.value);
                    market.upper = Math.ceil(market.value);
                } else {
                    market.lower = market.value + 1;
                }
            }
        });
        return { data: data, error: null };
    } catch (error) {
        console.error(`Error fetching Kalshi markets for ${event_ticker}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { data: null, error: `Failed to fetch Kalshi markets: ${errorMessage}` };
    }
}


export async function placeKalshiOrder(orderParams: any) {
    // try {
        if (!process.env.API_KEY || !process.env.RSA_PRIVATE_KEY) {
            console.error("Missing Kalshi API credentials. Please check your .env file.");
            return { data: null, error: "Missing Kalshi API credentials." };
        }

        const apiKey = process.env.API_KEY;
        const privateKey = fs.readFileSync(process.env.RSA_PRIVATE_KEY, 'utf8');
        const timestamp = Date.now().toString();
        const resourcePath = '/trade-api/v2/portfolio/orders';

        const body = JSON.stringify({
            ...orderParams,
            client_order_id: crypto.randomUUID().toString(),
        });

        const method = 'POST';
        
        const stringToSign = `${timestamp}${method}${resourcePath}`;

        const signature = signPssText(privateKey, stringToSign);
        const options = {
            method: method,
            headers: {
                'KALSHI-ACCESS-KEY': apiKey,
                'KALSHI-ACCESS-SIGNATURE': signature,
                'KALSHI-ACCESS-TIMESTAMP': timestamp,
                'Content-Type': 'application/json'
            },
            body: body
        };

        const response = await fetch(`https://api.elections.kalshi.com${resourcePath}`, options);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error placing Kalshi order:', errorText);
            return { data: null, error: `Failed to place Kalshi order: ${response.statusText} - ${errorText}` };
        }

        const orderResponse = await response.json();

        if (orderResponse) {
            return {
                data: orderResponse,
                error: null,
            };
        } else {
             return { data: null, error: 'Failed to place order with Kalshi API. Invalid response from server.' };
        }
    // } catch (error) {
    //     console.error('Error placing Kalshi order:', error);
    //     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    //     return { data: null, error: `Failed to place Kalshi order: ${errorMessage}` };
    // }
}
