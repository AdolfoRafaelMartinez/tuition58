import { getKalshiMarkets } from '../services/kalshi.js';

describe('getKalshiMarkets', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should handle nothing happening', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 1000), price: 10 }
      ],
      'MARKET2': [
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
    expect(response.data.marketRows.length).toBe(2);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');

    expect(market1.held).toBe(false);
    expect(market1.signal).toBe('none');
    expect(market1.earned).toBe(0);
    expect(market2.held).toBe(false);
    expect(market2.signal).toBe('none');
    expect(market2.earned).toBe(0);
  });

  it('should handle one market trailing', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 2000), price: 20 }, // !own / buy 
        { time: new Date(Date.now() - 1000), price: 20 }  //  own / none
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 2000), price: 10 }, // !own / sell 
        { time: new Date(Date.now() - 1000), price: 20 }  // !own / none
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.20, // own / buy // 0
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.10, // !own / sell // 0
            }
          ]
        })
      })
    ) as jest.Mock;

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(2);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');

    expect(market1.held).toBe(true);
    expect(market1.signal).toBe('buy');
    expect(market1.earned).toBe(0);
    expect(market2.held).toBe(false);
    expect(market2.signal).toBe('sell');
    expect(market2.earned).toBe(0);
  });

  it('should handle no history and no leading market', async () => {
    const mockHistory = {
      'MARKET1': [
      ],
      'MARKET2': [
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.20,
            },
            {
              ticker: 'MARKET2',
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
    expect(response.data.marketRows.length).toBe(2);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');

    expect(market1.held).toBe(false);
    expect(market1.signal).toBe('none');
    expect(market1.earned).toBe(0);
    expect(market2.held).toBe(false);
    expect(market2.signal).toBe('none');
    expect(market2.earned).toBe(0);
  });

  it('should handle no history and a leading market', async () => {
    const mockHistory = {
      'MARKET1': [
      ],
      'MARKET2': [
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.20,
            },
            {
              ticker: 'MARKET2',
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
    expect(response.data.marketRows.length).toBe(2);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');

    expect(market1.held).toBe(false);
    expect(market1.signal).toBe('sell');
    expect(market1.earned).toBe(0);
    expect(market2.held).toBe(false);
    expect(market2.signal).toBe('buy');
    expect(market2.earned).toBe(0);
  });

  it('should handle a point in history and no leading market', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 1000), price: 20 } // !own / sell
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 1000), price: 30 } // !own / buy
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.20, // !own / none // 0
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.20, // own / none // -10
            }
          ]
        })
      })
    ) as jest.Mock;

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(2);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');

    expect(market1.held).toBe(false);
    expect(market1.signal).toBe('none');
    expect(market1.earned).toBe(0);
    expect(market2.held).toBe(true);
    expect(market2.signal).toBe('none');
    expect(market2.earned).toBe(-10);
  });

  it('should handle a point in history and a leading market', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 1000), price: 20 } // !own / sell
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 1000), price: 30 } // !own / buy
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.20, // !own / sell
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.30, // own / buy // 0
            }
          ]
        })
      })
    ) as jest.Mock;

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(2);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');

    expect(market1.held).toBe(false);
    expect(market1.signal).toBe('sell');
    expect(market1.earned).toBe(0);
    expect(market2.held).toBe(true);
    expect(market2.signal).toBe('buy');
    expect(market2.earned).toBe(0);
  });

  it('should handle two points in history and a leading market', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 2000), price: 20 }, // !own / sell
        { time: new Date(Date.now() - 1000), price: 20 } // !own / sell
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 2000), price: 30 }, // !own / buy
        { time: new Date(Date.now() - 1000), price: 40 } // own / buy
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.20, // !own / sell / 0
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.50, // own / buy / 20
            }
          ]
        })
      })
    ) as jest.Mock;

    const response = await getKalshiMarkets('TEST-EVENT', mockHistory);

    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.marketRows).toBeDefined();
    expect(response.data.marketRows.length).toBe(2);

    const market1 = response.data.marketRows.find(m => m.ticker === 'MARKET1');
    const market2 = response.data.marketRows.find(m => m.ticker === 'MARKET2');

    expect(market1.held).toBe(false);
    expect(market1.signal).toBe('sell');
    expect(market1.earned).toBe(0);
    expect(market2.held).toBe(true);
    expect(market2.signal).toBe('buy');
    expect(market2.earned).toBe(10);
  });
});
