import { getKalshiMarkets } from '../services/kalshi.js';

describe('getKalshiMarkets', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should handle no history', async () => {
    // Mock fetch to return a market with a specific price
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.00,
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        // no history
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    // expect(row.earned_value).toBe(0);
    expect(row.held).toBe(false);
    expect(row.price).toBe(0);
    // expect(row.priceChangeClass).toBe('neutral');
    // expect(row.priceChangeDisplay).toBe(0);
    expect(row.signal).toBe('hold');
    expect(row.ticker).toBe('TEST-MARKET');    
  });

  it('should buy the highest market', async () => {
    // Mock fetch to return a market with a specific price
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.10,
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 0.00 },
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.earned_value).toBe(0);
    expect(row.held).toBe(true);
    expect(row.price).toBe(10);
    expect(row.priceChangeClass).toBe('positive');
    expect(row.priceChangeDisplay).toBe(10);
    expect(row.signal).toBe('buy');
    expect(row.ticker).toBe('TEST-MARKET');    
  });

  it('should buy the highest priced market when multiple markets exist', async () => {
    // Mock fetch to return multiple markets with different prices
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET-LOW',
              last_price_dollars: 0.10,
            },
            {
              ticker: 'TEST-MARKET-HIGH',
              last_price_dollars: 0.20,
            }
          ]
        })
      })
    ) as jest.Mock;
  
    const mockHistory = {
      'TEST-MARKET-LOW': [],
      'TEST-MARKET-HIGH': []
    };
  
    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);
  
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(2);
  
    const lowPriceMarket = response.data.marketRows.find(m => m.ticker === 'TEST-MARKET-LOW');
    const highPriceMarket = response.data.marketRows.find(m => m.ticker === 'TEST-MARKET-HIGH');
  
    expect(lowPriceMarket.signal).toBe('hold');
    expect(highPriceMarket.signal).toBe('buy');
  });
});
