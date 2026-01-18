import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import * as fs from 'fs';

dotenv.config();

async function getKalshiBalance() {
    try {
        if (!process.env.API_KEY || !process.env.RSA_PRIVATE_KEY) {
            console.error("Missing Kalshi API credentials. Please check your .env file.");
            return { data: null, error: "Missing Kalshi API credentials." };
        }

        const apiKey = process.env.API_KEY;
        const privateKey = fs.readFileSync(process.env.RSA_PRIVATE_KEY, 'utf8');
        const timestamp = Date.now().toString();
        const method = 'GET';
        const resourcePath = '/trade-api/v2/portfolio/balance';
        const body = ''; // No body for a GET request

        const stringToSign = `${timestamp}${method}${resourcePath}${body}`;

        const signer = crypto.createSign('RSA-SHA256');
        signer.update(stringToSign);
        signer.end();
        const signature = signer.sign(privateKey, 'base64');

        const options = {
            method: 'GET',
            headers: {
                'KALSHI-ACCESS-KEY': apiKey,
                'KALSHI-ACCESS-SIGNATURE': signature,
                'KALSHI-ACCESS-TIMESTAMP': timestamp
            }
        };

        const response = await fetch('https://api.elections.kalshi.com/trade-api/v2/portfolio/balance', options);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error fetching Kalshi balance:', errorText);
            return { data: null, error: `Failed to fetch Kalshi balance: ${response.statusText} - ${errorText}` };
        }

        const balanceResponse = await response.json();

        if (balanceResponse && typeof balanceResponse.balance === 'number') {
            return {
                data: {
                    balance: balanceResponse.balance / 100
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

async function placeKalshiOrder(orderParams: any) {
    try {
        if (!process.env.API_KEY || !process.env.RSA_PRIVATE_KEY) {
            console.error("Missing Kalshi API credentials. Please check your .env file.");
            return { data: null, error: "Missing Kalshi API credentials." };
        }

        const apiKey = process.env.API_KEY;
        const privateKey = fs.readFileSync(process.env.RSA_PRIVATE_KEY, 'utf8');
        const timestamp = Date.now().toString();
        const method = 'POST';
        const resourcePath = '/trade-api/v2/portfolio/orders';
        const body = JSON.stringify(orderParams);

        const stringToSign = `${timestamp}${method}${resourcePath}${body}`;

        const signer = crypto.createSign('RSA-SHA256');
        signer.update(stringToSign);
        signer.end();
        const signature = signer.sign(privateKey, 'base64');

        const options = {
            method: 'POST',
            headers: {
                'KALSHI-ACCESS-KEY': apiKey,
                'KALSHI-ACCESS-SIGNATURE': signature,
                'KALSHI-ACCESS-TIMESTAMP': timestamp,
                'Content-Type': 'application/json'
            },
            body: body
        };

        const response = await fetch('https://api.elections.kalshi.com/trade-api/v2/portfolio/orders', options);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error placing Kalshi order:', errorText);
            return { data: null, error: `Failed to place Kalshi order: ${response.statusText} - ${errorText}` };
        }

        const orderResponse = await response.json();

        if (orderResponse && orderResponse.order) {
            return {
                data: orderResponse,
                error: null,
            };
        } else {
             return { data: null, error: 'Failed to place order with Kalshi API. Invalid response from server.' };
        }
    } catch (error) {
        console.error('Error placing Kalshi order:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { data: null, error: `Failed to place Kalshi order: ${errorMessage}` };
    }
}


export { getKalshiBalance, placeKalshiOrder };