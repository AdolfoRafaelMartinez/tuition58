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

    expect(market1.held).toBe(true);
    expect(market1.signal).toBe('hold');
    expect(market2.held).toBe(true);
    expect(market2.signal).toBe('hold');
  });

  it('should handle one market rising', async () => {
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

    expect(market1.held).toBe(true);
    expect(market1.signal).toBe('sell');
    expect(market2.held).toBe(true);
    expect(market2.signal).toBe('buy');
  });

  it('should handle both markets rising', async () => {
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

    expect(market1.held).toBe(true);
    expect(market1.signal).toBe('hold');
    expect(market2.held).toBe(true);
    expect(market2.signal).toBe('hold');
  });

  it('should handle one market falling', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 2000), price: 20 }, // ~own / buy 
        { time: new Date(Date.now() - 1000), price: 20 }  //  own / buy
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 2000), price: 10 }, // !own / hold 
        { time: new Date(Date.now() - 1000), price: 20 }  // !own / buy
      ]
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          markets: [
            {
              ticker: 'MARKET1',
              last_price_dollars: 0.20, // own / buy
            },
            {
              ticker: 'MARKET2',
              last_price_dollars: 0.10, // own / sell
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
    expect(market2.held).toBe(true);
    expect(market2.signal).toBe('sell');
  });

  it('should handle no history and a market rising', async () => {
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
    expect(market1.signal).toBe('hold');
    expect(market2.held).toBe(false);
    expect(market2.signal).toBe('buy');
  });

  it('should handle a history and a market rising again', async () => {
    const mockHistory = {
      'MARKET1': [
        { time: new Date(Date.now() - 1000), price: 20 }, // !own / sell
      ],
      'MARKET2': [
        { time: new Date(Date.now() - 1000), price: 30 }, // !own / buy
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
              last_price_dollars: 0.40, //  own / buy
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
    expect(market2.held).toBe(true);
    expect(market2.signal).toBe('buy');
  });
});
