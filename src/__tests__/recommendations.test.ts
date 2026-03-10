
import { generateRecommendations } from '../services/kalshi';
import { Market, MarketPriceHistory } from '../models/kalshi';

describe('generateRecommendations', () => {
  it('should return "buy" recommendation for price increase', () => {
    const markets: Market[] = [
      {
        ticker: 'TEST-TICKER',
        last_price: 55,
        // Add other required market properties if any, otherwise leave as is
      } as Market,
    ];

    const marketPriceHistory: MarketPriceHistory = {
      'TEST-TICKER': [
        { time: new Date(Date.now() - 10000), price: 50 },
        { time: new Date(Date.now() - 5000), price: 52 },
      ],
    };

    const recommendations = generateRecommendations(markets, marketPriceHistory);
    expect(recommendations[0]).toBe('buy');
  });

  it('should return "sell" recommendation for price decrease', () => {
    const markets: Market[] = [
      {
        ticker: 'TEST-TICKER',
        last_price: 48,
        // Add other required market properties if any, otherwise leave as is
      } as Market,
    ];

    const marketPriceHistory: MarketPriceHistory = {
      'TEST-TICKER': [
        { time: new Date(Date.now() - 10000), price: 52 },
        { time: new Date(Date.now() - 5000), price: 50 },
      ],
    };

    const recommendations = generateRecommendations(markets, marketPriceHistory);
    expect(recommendations[0]).toBe('sell');
  });
});
