
import { generateRecommendations } from '../services/kalshi.js';
import { Market, MarketPriceHistory } from '../models/kalshi.js';

describe('generateRecommendations', () => {
  it('should return a "buy" recommendation when the price increases', () => {
    const markets: Market[] = [
      { ticker: 'TEST-TICKER', last_price: 55 } as Market,
    ];
    const marketPriceHistory: MarketPriceHistory = {
      'TEST-TICKER': [{ time: new Date(), price: 50 }],
    };
    const recommendations = generateRecommendations(markets, marketPriceHistory);
    expect(recommendations).toEqual(['buy']);
  });

  it('should return a "sell" recommendation when the price decreases', () => {
    const markets: Market[] = [
      { ticker: 'TEST-TICKER', last_price: 45 } as Market,
    ];
    const marketPriceHistory: MarketPriceHistory = {
      'TEST-TICKER': [{ time: new Date(), price: 50 }],
    };
    const recommendations = generateRecommendations(markets, marketPriceHistory);
    expect(recommendations).toEqual(['sell']);
  });

  it('should return no recommendation when the price is stable', () => {
    const markets: Market[] = [
      { ticker: 'TEST-TICKER', last_price: 50 } as Market,
    ];
    const marketPriceHistory: MarketPriceHistory = {
      'TEST-TICKER': [{ time: new Date(), price: 50 }],
    };
    const recommendations = generateRecommendations(markets, marketPriceHistory);
    expect(recommendations).toEqual(['']);
  });

  it('should handle markets with no prior history', () => {
    const markets: Market[] = [
      { ticker: 'NEW-TICKER', last_price: 70 } as Market,
    ];
    const marketPriceHistory: MarketPriceHistory = {};
    const recommendations = generateRecommendations(markets, marketPriceHistory);
    expect(recommendations).toEqual(['']);
  });
});
