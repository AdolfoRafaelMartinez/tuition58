import * as dotenv from 'dotenv';
import { Configuration, PortfolioApi } from 'kalshi-typescript';

dotenv.config();

async function getKalshiBalance() {
    try {
        if (!process.env.API_KEY || !process.env.RSA_PRIVATE_KEY) {
            console.error("Missing Kalshi API credentials. Please check your .env file.");
            return { data: null, error: "Missing Kalshi API credentials." };
        }

        const config = new Configuration({
            apiKey: process.env.API_KEY,
            privateKeyPath: process.env.RSA_PRIVATE_KEY,
            basePath: 'https://api.elections.kalshi.com/trade-api/v2'
        });

        const portfolioApi = new PortfolioApi(config);
        const balanceResponse = await portfolioApi.getBalance();

        if (balanceResponse && balanceResponse.data && typeof balanceResponse.data.balance === 'number') {
            return {
                data: {
                    balance: balanceResponse.data.balance / 100
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

export { getKalshiBalance };
