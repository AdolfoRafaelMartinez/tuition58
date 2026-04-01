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
              last_price_dollars: 0.60,
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

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.priceChangeDisplay).toBe(0);
    // expect(row.priceChangeIcon).toBe('<span class="triangle-down">&#9660;</span>');
    expect(row.held).toBe(false);
    expect(row.earned_value).toBe(0);
  });

  it('should handle one down', async () => {
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
        { time: new Date(), price: 70 }
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.priceChangeDisplay).toBe(10);
    expect(row.priceChangeIcon).toBe('<span class="triangle-down">&#9660;</span>');
    expect(row.held).toBe(false);
    expect(row.earned_value).toBe(0);
  });

  it('should handle one straight', async () => {
    // Mock fetch to return a market with a specific price
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.70,
              // Other properties needed for the function
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 70 }
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.priceChangeDisplay).toBe(0);
    // expect(row.priceChangeIcon).toBe('<span class="triangle-down">&#9660;</span>');
    expect(row.held).toBe(false);
    expect(row.earned_value).toBe(0);
  });

  it('should handle one straight one down', async () => {
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
        { time: new Date(), price: 70 },
        { time: new Date(), price: 70 }
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.priceChangeDisplay).toBe(10);
    expect(row.priceChangeIcon).toBe('<span class="triangle-down">&#9660;</span>');
    expect(row.held).toBe(false);
    expect(row.earned_value).toBe(0);
  });

  it('should handle two up one down', async () => {
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
        { time: new Date(), price: 50 },
        { time: new Date(), price: 60 },
        { time: new Date(), price: 70 }
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.priceChangeDisplay).toBe(10);
    expect(row.priceChangeIcon).toBe('<span class="triangle-down">&#9660;</span>');
    expect(row.held).toBe(false);
    expect(row.earned_value).toBe(-10);
  });

  it('should handle one up', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.80,
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 70 }
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.priceChangeDisplay).toBe(10);
    expect(row.priceChangeIcon).toBe('<span class="triangle-up">&#9650;</span>');
    expect(row.held).toBe(false);
    expect(row.earned_value).toBe(0);
  });

  it('should handle two up', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.60,
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 40 },
        { time: new Date(), price: 50 },
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.priceChangeDisplay).toBe(10);
    expect(row.priceChangeIcon).toBe('<span class="triangle-up">&#9650;</span>');
    expect(row.held).toBe(true);
    expect(row.earned_value).toBe(0)
  });

  it('should handle two up one down', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.60,
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 50 },
        { time: new Date(), price: 60 },
        { time: new Date(), price: 70 }, // buy
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.priceChangeDisplay).toBe(10);
    expect(row.priceChangeIcon).toBe('<span class="triangle-down">&#9660;</span>');
    expect(row.held).toBe(false);
    expect(row.earned_value).toBe(-10)
  });

  it('should handle two up one down', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'TEST-MARKET',
              last_price_dollars: 0.90,
            }
          ]
        })
      })
    ) as jest.Mock;

    const mockHistory = {
      'TEST-MARKET': [
        { time: new Date(), price: 50 },
        { time: new Date(), price: 60 },
        { time: new Date(), price: 70 }, // buy
        { time: new Date(), price: 80 },
      ]
    };

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();

    const row = response.data.marketRows[0];

    expect(row.ticker).toBe('TEST-MARKET');
    expect(row.priceChangeDisplay).toBe(10);
    expect(row.priceChangeIcon).toBe('<span class="triangle-up">&#9650;</span>');
    expect(row.held).toBe(true);
    expect(row.earned_value).toBe(20)
  });
});
