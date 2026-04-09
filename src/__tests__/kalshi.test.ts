import { getKalshiMarkets } from '../services/kalshi.js';

describe('getKalshiMarkets', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it.only('should handle state 0', async () => {
    const mockHistory = {
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.10,
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.10,
            },
            {
              ticker: 'MARKET3',
              last_price_dollars: 0.10,
            }
          ]
        })
      })
    ) as jest.Mock;

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(3);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');
    const market3 = response.data.marketRows.find(m => m.ticker === 'MARKET3');

    expect(market1.priceChangeClass).toBe('neutral');
    expect(market1.priceChangeDisplay).toBe(0);

    expect(market2.priceChangeClass).toBe('neutral');
    expect(market2.priceChangeDisplay).toBe(0);

    expect(market3.priceChangeClass).toBe('neutral');
    expect(market3.priceChangeDisplay).toBe(0);
  });

  it.only('should handle state 1', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 1000), price: 10 }
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 1000), price: 10 }
      ],
      'MARKET3': [
        { time: new Date(Date.now() - 1000), price: 10 }
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.10,
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.00,
            },
            {
              ticker: 'MARKET3',
              last_price_dollars: 0.20,
            }
          ]
        })
      })
    ) as jest.Mock;

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(3);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');
    const market3 = response.data.marketRows.find(m => m.ticker === 'MARKET3');

    expect(market1.priceChangeClass).toBe('neutral');
    expect(market1.priceChangeDisplay).toBe(0);
    expect(market1.leader).toBe(false);

    expect(market2.priceChangeClass).toBe('negative');
    expect(market2.priceChangeDisplay).toBe(10);
    expect(market2.leader).toBe(false);

    expect(market3.priceChangeClass).toBe('positive');
    expect(market3.priceChangeDisplay).toBe(10);
    expect(market3.leader).toBe(true);
    expect(market3.earned).toBe(0);

    expect(response.data.portfolio_value).toBe(0);
  });

  it('should handle state 2', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 10 }
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 0 }
      ],
      'MARKET3': [
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 20 }
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.10,
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.10,
            },
            {
              ticker: 'MARKET3',
              last_price_dollars: 0.30,
            }
          ]
        })
      })
    ) as jest.Mock;

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(3);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');
    const market3 = response.data.marketRows.find(m => m.ticker === 'MARKET3');

    expect(market1.priceChangeClass).toBe('neutral');
    expect(market1.priceChangeDisplay).toBe(0);
    expect(market1.leader).toBe(false);

    expect(market2.priceChangeClass).toBe('positive');
    expect(market2.priceChangeDisplay).toBe(10);
    expect(market2.leader).toBe(false);
    
    expect(market3.priceChangeClass).toBe('positive');
    expect(market3.priceChangeDisplay).toBe(10);
    expect(market3.leader).toBe(true);
    expect(market3.earned).toBe(10);

    // expect(response.data.portfolio_value).toBe(10);
    
  });

  it('should handle state 3', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 10 }
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 0 }
      ],
      'MARKET3': [
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 20 }
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.10,
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.20, // leader
            },
            {
              ticker: 'MARKET3',
              last_price_dollars: 0.10,
            }
          ]
        })
      })
    ) as jest.Mock;

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(3);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');
    const market3 = response.data.marketRows.find(m => m.ticker === 'MARKET3');

    expect(market1.priceChangeClass).toBe('neutral');
    expect(market1.priceChangeDisplay).toBe(0);
    expect(market1.leader).toBe(false);
    
    expect(market2.priceChangeClass).toBe('positive');
    expect(market2.priceChangeDisplay).toBe(20);
    expect(market2.leader).toBe(true);
    expect(market2.earned).toBe(0);
    
    expect(market3.priceChangeClass).toBe('negative');
    expect(market3.priceChangeDisplay).toBe(10);
    expect(market3.leader).toBe(false);
    expect(market3.earned).toBe(-20);

    // expect(response.data.portfolio_value).toBe(-10);
    
  });

  it('should handle state 4', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 4000), price: 10 },
        { time: new Date(Date.now() - 3000), price: 10 },
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 10 }
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 4000), price: 10 },
        { time: new Date(Date.now() - 3000), price: 0 },
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 20 }
      ],
      'MARKET3': [
        { time: new Date(Date.now() - 4000), price: 10 },
        { time: new Date(Date.now() - 3000), price: 20 },
        { time: new Date(Date.now() - 2000), price: 30 },
        { time: new Date(Date.now() - 1000), price: 10 }
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.10,
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.30, // leader
            },
            {
              ticker: 'MARKET3',
              last_price_dollars: 0.10,
            }
          ]
        })
      })
    ) as jest.Mock;

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(3);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');
    const market3 = response.data.marketRows.find(m => m.ticker === 'MARKET3');

    expect(market1.priceChangeClass).toBe('neutral');
    expect(market1.priceChangeDisplay).toBe(0);
    expect(market1.leader).toBe(false);
    
    expect(market2.priceChangeClass).toBe('positive');
    expect(market2.priceChangeDisplay).toBe(10);
    expect(market2.leader).toBe(true);
    expect(market2.earned).toBe(10);
    
    expect(market3.priceChangeClass).toBe('neutral');
    expect(market3.priceChangeDisplay).toBe(0);
    expect(market3.leader).toBe(false);

    // expect(response.data.portfolio_value).toBe(0);
    
  });

  it('should handle state 5', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 5000), price: 10 },
        { time: new Date(Date.now() - 4000), price: 10 },
        { time: new Date(Date.now() - 3000), price: 10 },
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 10 }
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 5000), price: 10 },
        { time: new Date(Date.now() - 4000), price: 0 },
        { time: new Date(Date.now() - 3000), price: 10 },
        { time: new Date(Date.now() - 2000), price: 20 },
        { time: new Date(Date.now() - 1000), price: 30 }
      ],
      'MARKET3': [
        { time: new Date(Date.now() - 5000), price: 10 },
        { time: new Date(Date.now() - 4000), price: 20 },
        { time: new Date(Date.now() - 3000), price: 30 },
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 10 }
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.10,
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.40, // leader
            },
            {
              ticker: 'MARKET3',
              last_price_dollars: 0.10,
            }
          ]
        })
      })
    ) as jest.Mock;

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(3);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');
    const market3 = response.data.marketRows.find(m => m.ticker === 'MARKET3');

    expect(market1.priceChangeClass).toBe('neutral');
    expect(market1.priceChangeDisplay).toBe(0);
    expect(market1.leader).toBe(false);
    
    expect(market2.priceChangeClass).toBe('positive');
    expect(market2.priceChangeDisplay).toBe(10);
    expect(market2.leader).toBe(true);
    expect(market2.earned).toBe(10);
    
    expect(market3.priceChangeClass).toBe('neutral');
    expect(market3.priceChangeDisplay).toBe(0);
    expect(market3.leader).toBe(false);

    // expect(response.data.portfolio_value).toBe(10);
    
  });

  it('should handle state 6', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 5000), price: 10 },
        { time: new Date(Date.now() - 4000), price: 10 },
        { time: new Date(Date.now() - 3000), price: 10 },
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 10 }
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 5000), price: 10 },
        { time: new Date(Date.now() - 4000), price: 0 },
        { time: new Date(Date.now() - 3000), price: 10 },
        { time: new Date(Date.now() - 2000), price: 20 },
        { time: new Date(Date.now() - 1000), price: 30 },
        { time: new Date(Date.now() - 1000), price: 40 }
      ],
      'MARKET3': [
        { time: new Date(Date.now() - 5000), price: 10 },
        { time: new Date(Date.now() - 4000), price: 20 },
        { time: new Date(Date.now() - 3000), price: 30 },
        { time: new Date(Date.now() - 2000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 10 },
        { time: new Date(Date.now() - 1000), price: 10 }
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.10,
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.50, // leader
            },
            {
              ticker: 'MARKET3',
              last_price_dollars: 0.10,
            }
          ]
        })
      })
    ) as jest.Mock;

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(3);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');
    const market3 = response.data.marketRows.find(m => m.ticker === 'MARKET3');

    expect(market1.priceChangeClass).toBe('neutral');
    expect(market1.priceChangeDisplay).toBe(0);
    expect(market1.leader).toBe(false);
    
    expect(market2.priceChangeClass).toBe('positive');
    expect(market2.priceChangeDisplay).toBe(10);
    expect(market2.leader).toBe(true);
    expect(market2.earned).toBe(10);
    
    expect(market3.priceChangeClass).toBe('neutral');
    expect(market3.priceChangeDisplay).toBe(0);
    expect(market3.leader).toBe(false);

    // expect(response.data.portfolio_value).toBe(20);
    
  });
});