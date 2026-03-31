import { getKalshiMarkets } from '../services/kalshi.js';

describe('getKalshiMarkets', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it.only('should assert priceChangeClass is "positive" when marketPriceHistory contains an increasing price', async () => {
    // Mock fetch to return a market with a specific price
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.60, // buy at 60, unrealized earnings are 0 since it was just bought.
              // Other properties needed for the function
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 50 } // tracking of price started here
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.priceChangeClass).toBe('positive');
    expect(row.priceChangeDisplay).toBe(0);
  });

  it('should assert priceChangeClass is "negative" when marketPriceHistory contains a decreasing price', async () => {
    // Mock fetch to return a market with a specific price
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.60,
              // Other properties needed for the function
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 70 } // Previous price is 0 cents. Current is 60 cents. So price increased by 10.
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.priceChangeClass).toBe('negative');
    expect(row.priceChangeDisplay).toBe(10);
  });

  it('should assert bought_price returns the last price when the priceChangeClass became positive', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.70, // earned 10
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 30 },
        { time: new Date(), price: 50 }, // buy at 50
        { time: new Date(), price: 40 }, // sell at 40 lost 10
        { time: new Date(), price: 60 } // buy at 60
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.bought_price).toBe(60);
    expect(row.earned_value).toBe(0); // -10 from first trade, 10 from open trade
  });

  it('should assert sold_price returns the last price when the priceChangeClass became negative', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.50, // buy at 50
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 40 },
        { time: new Date(), price: 60 }, // buy at 60
        { time: new Date(), price: 30 } // sell at 30 lose 30
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.sold_price).toBe(30);
  });

  it('should assert earned_value is increasing for multiple periods of positive trends that alternate with negative trends in the market price', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.70, // Current price is 70
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 50 }, // Start
        { time: new Date(), price: 60 }, // Trend is positive, bought_price = 60
        { time: new Date(), price: 55 }, // Trend is negative, sold_price = 55, earned_value = 55 - 60 = -5
        { time: new Date(), price: 65 }, // Trend is positive, bought_price = 65
        { time: new Date(), price: 60 }, // Trend is negative, sold_price = 60, earned_value = -5 + (60 - 65) = -10
        { time: new Date(), price: 80 }, // Trend is positive, bought_price = 80
        { time: new Date(), price: 75 }, // Trend is negative, sold_price = 75, earned_value = -10 + (75 - 80) = -15
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.earned_value).toBe(-15);
  });

  it('should assert zero earnings when no history', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.40, // buy 40
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        // { time: new Date(), price: 30 },
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.earned_value).toBe(0);
  });

  it('should assert zero earnings when a negative trend appears', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.40,
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 50 },
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.earned_value).toBe(0);
  });

  it('should assert some earnings and held to be true when a positive trend appears', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.40,
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 30 },
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.held).toBe(true);
    expect(row.earned_value).toBe(0);
  });

  it('should assert some earnings and held to be true when a positive trend appears more than once', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.50, // earned 10
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 30 },
        { time: new Date(), price: 40 }, // buy at 40
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.held).toBe(true);
    expect(row.earned_value).toBe(10);
  });

  it('should assert more earnings and held to be true when many positive trends appears', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.60, // earned 20
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 30 },
        { time: new Date(), price: 40 }, // buy at 40
        { time: new Date(), price: 50 },
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.held).toBe(true);
    expect(row.earned_value).toBe(20);
  });
});
