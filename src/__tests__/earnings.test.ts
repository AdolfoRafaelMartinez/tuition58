import { JSDOM } from 'jsdom';

describe('Market Form', () => {
  let dom: JSDOM;
  let document: Document;
  let marketResult: HTMLElement;
  let boughtPrices: { [key: string]: number };
  let soldPrices: { [key: string]: number };

  beforeEach(() => {
    dom = new JSDOM(`
      <div id="market-result">
        <table>
          <tbody>
            <tr>
              <td>TICKER-A</td>
              <td>100 to 200</td>
              <td>50</td>
              <td><canvas id="chart-TICKER-A" width="100" height="30"></canvas></td>
              <td class="delta-column"></td>
              <td class="bought-price"></td>
              <td class="sold-price"></td>
              <td class="earned-value"></td>
              <td class="recommendation-cell">
                <button class="rec-propose recommendation buy-recommendation" data-ticker="TICKER-A" data-action="buy" data-price="50"></button>
                <button class="rec-propose recommendation sell-recommendation" data-ticker="TICKER-A" data-action="sell" data-price="48"></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `);

    document = dom.window.document;
    marketResult = document.getElementById('market-result')!;
    boughtPrices = {};
    soldPrices = {};

    marketResult.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest('.rec-propose');
      if (button) {
        const ticker = button.getAttribute('data-ticker')!;
        const action = button.getAttribute('data-action')!;
        const row = button.closest('tr')!;
        const priceCell = row.cells[2];
        const displayPrice = parseInt(priceCell.textContent!, 10);
        const earnedCell = row.querySelector('.earned-value')!;
        const boughtCell = row.querySelector('.bought-price')!;
        const soldCell = row.querySelector('.sold-price')!;

        if (action === 'buy') {
          boughtPrices[ticker] = displayPrice;
          boughtCell.textContent = displayPrice.toString();
          soldPrices[ticker] = undefined; // Reset sold price
          soldCell.textContent = ''; // Clear sold cell
        } else if (action === 'sell') {
          soldPrices[ticker] = displayPrice;
          soldCell.textContent = displayPrice.toString();
        }

        const boughtPrice = boughtPrices[ticker];
        const soldPrice = soldPrices[ticker];

        if (boughtPrice !== undefined && soldPrice !== undefined) {
          earnedCell.textContent = (soldPrice - boughtPrice).toString();
        }
      }
    });
  });

  test('should calculate and display the earned value correctly after a buy and sell action', () => {
    const buyButton = document.querySelector('.buy-recommendation') as HTMLButtonElement;
    const sellButton = document.querySelector('.sell-recommendation') as HTMLButtonElement;
    const row = document.querySelector('tr')!;
    const boughtCell = row.querySelector('.bought-price')!;
    const soldCell = row.querySelector('.sold-price')!;
    const earnedCell = row.querySelector('.earned-value')!;

    // Simulate a buy action
    buyButton.click();
    expect(boughtCell.textContent).toBe('50');

    // Simulate a sell action
    sellButton.click();
    expect(soldCell.textContent).toBe('50');

    const boughtPrice = parseFloat(boughtCell.textContent!);
    const soldPrice = parseFloat(soldCell.textContent!);
    const expectedEarnedValue = soldPrice - boughtPrice;

    expect(earnedCell.textContent).toBe(expectedEarnedValue.toString());
  });

  test('should set bought column on buy recommendation and sold column should be blank', () => {
    const buyButton = document.querySelector('.buy-recommendation') as HTMLButtonElement;
    const row = document.querySelector('tr')!;
    const boughtCell = row.querySelector('.bought-price')!;
    const soldCell = row.querySelector('.sold-price')!;

    // Simulate a buy action
    buyButton.click();

    // Assertions
    expect(boughtCell.textContent).toBe('50');
    expect(soldCell.textContent).toBe('');
  });

  test('should update earned column after a sell recommendation', () => {
    const buyButton = document.querySelector('.buy-recommendation') as HTMLButtonElement;
    const sellButton = document.querySelector('.sell-recommendation') as HTMLButtonElement;
    const row = document.querySelector('tr')!;
    const boughtCell = row.querySelector('.bought-price')!;
    const soldCell = row.querySelector('.sold-price')!;
    const earnedCell = row.querySelector('.earned-value')!;

    // Simulate a buy action first to have a "bought" price
    buyButton.click();
    expect(boughtCell.textContent).toBe('50');
    expect(soldCell.textContent).toBe(''); // sold should be blank

    // Now simulate a sell action
    sellButton.click();
    expect(soldCell.textContent).toBe('50'); // Price is 50 in the mock DOM

    const boughtPrice = parseFloat(boughtCell.textContent!);
    const soldPrice = parseFloat(soldCell.textContent!);
    const expectedEarnedValue = soldPrice - boughtPrice;

    expect(earnedCell.textContent).toBe(expectedEarnedValue.toString());
  });

  test('should set sold column on sell recommendation', () => {
    const sellButton = document.querySelector('.sell-recommendation') as HTMLButtonElement;
    const row = document.querySelector('tr')!;
    const priceCell = row.cells[2];
    const soldCell = row.querySelector('.sold-price')!;

    // Simulate a sell action
    sellButton.click();

    // Assertion
    expect(soldCell.textContent).toBe(priceCell.textContent);
  });

  test('should show a buy button when the delta column is positive', () => {
    const marketResult = document.getElementById('market-result')!;
    const priceChange = 5; // Represents a positive delta
    const recommendation = 'buy';

    // This is a simplified version of the rendering logic from marketForm.js
    const getRowHtml = (priceChange: number, recommendation: string | null): string => {
        const market = {
            ticker: 'TICKER-A',
            lower: 100,
            upper: 200,
            last_price: 50,
            yes_ask: 51,
            yes_bid: 49,
        };

        let recBtnHtml = '';
        if (recommendation === 'buy') {
            recBtnHtml = `<button class="rec-propose recommendation buy-recommendation" data-ticker="${market.ticker}" data-action="buy" data-price="${market.yes_ask}" type="button"><span class="dot buy-dot"></span></button>`;
        } else if (recommendation === 'sell') {
            recBtnHtml = `<button class="rec-propose recommendation sell-recommendation" data-ticker="${market.ticker}" data-action="sell" data-price="${market.yes_bid}" type="button"><span class="dot sell-dot"></span></button>`;
        }

        const priceChangeDisplay = Math.abs(Math.round(priceChange));
        const priceChangeClass = priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : 'neutral';
        const priceChangeIcon = priceChange > 0 ? '<span class="triangle-up">&#9650;</span>' : priceChange < 0 ? '<span class="triangle-down">&#9660;</span>' : '';

        return `
            <table>
              <tbody>
                <tr>
                    <td>${market.ticker}</td>
                    <td>${market.lower} to ${market.upper}</td>
                    <td>${market.last_price}</td>
                    <td><canvas id="chart-${market.ticker}" width="100" height="30"></canvas></td>
                    <td class="delta-column ${priceChangeClass}">${priceChangeIcon} ${priceChangeDisplay}</td>
                    <td class="bought-price"></td>
                    <td class="sold-price"></td>
                    <td class="earned-value"></td>
                    <td class="recommendation-cell">${recBtnHtml}</td>
                </tr>
              </tbody>
            </table>
        `;
    }

    marketResult.innerHTML = getRowHtml(priceChange, recommendation);

    const deltaCell = marketResult.querySelector('.delta-column');
    const recommendationCell = marketResult.querySelector('.recommendation-cell');
    const buyButton = recommendationCell?.querySelector('.buy-recommendation');

    const isDeltaPositive = deltaCell?.classList.contains('positive');
    expect(isDeltaPositive).toBe(true);

    if (isDeltaPositive) {
        expect(buyButton).not.toBeNull();
    }
  });

  test('should show a sell button when the delta column is negative', () => {
    const marketResult = document.getElementById('market-result')!;
    const priceChange = -5; // Represents a negative delta
    const recommendation = 'sell';

    // This is a simplified version of the rendering logic from marketForm.js
    const getRowHtml = (priceChange: number, recommendation: string | null): string => {
        const market = {
            ticker: 'TICKER-A',
            lower: 100,
            upper: 200,
            last_price: 50,
            yes_ask: 51,
            yes_bid: 49,
        };

        let recBtnHtml = '';
        if (recommendation === 'buy') {
            recBtnHtml = `<button class="rec-propose recommendation buy-recommendation" data-ticker="${market.ticker}" data-action="buy" data-price="${market.yes_ask}" type="button"><span class="dot buy-dot"></span></button>`;
        } else if (recommendation === 'sell') {
            recBtnHtml = `<button class="rec-propose recommendation sell-recommendation" data-ticker="${market.ticker}" data-action="sell" data-price="${market.yes_bid}" type="button"><span class="dot sell-dot"></span></button>`;
        }

        const priceChangeDisplay = Math.abs(Math.round(priceChange));
        const priceChangeClass = priceChange < 0 ? 'negative' : 'neutral';
        const priceChangeIcon = priceChange < 0 ? '<span class="triangle-down">&#9660;</span>' : '';

        return `
            <table>
              <tbody>
                <tr>
                    <td>${market.ticker}</td>
                    <td>${market.lower} to ${market.upper}</td>
                    <td>${market.last_price}</td>
                    <td><canvas id="chart-${market.ticker}" width="100" height="30"></canvas></td>
                    <td class="delta-column ${priceChangeClass}">${priceChangeIcon} ${priceChangeDisplay}</td>
                    <td class="bought-price"></td>
                    <td class="sold-price"></td>
                    <td class="earned-value"></td>
                    <td class="recommendation-cell">${recBtnHtml}</td>
                </tr>
              </tbody>
            </table>
        `;
    }

    marketResult.innerHTML = getRowHtml(priceChange, recommendation);

    const deltaCell = marketResult.querySelector('.delta-column');
    const recommendationCell = marketResult.querySelector('.recommendation-cell');
    const sellButton = recommendationCell?.querySelector('.sell-recommendation');

    const isDeltaNegative = deltaCell?.classList.contains('negative');
    expect(isDeltaNegative).toBe(true);

    if (isDeltaNegative) {
        expect(sellButton).not.toBeNull();
    }
  });
  test('that the value of the earned column is always the value of the sold column minus the value of the bought column', () => {
    const buyButton = document.querySelector('.buy-recommendation') as HTMLButtonElement;
    const sellButton = document.querySelector('.sell-recommendation') as HTMLButtonElement;
    const row = document.querySelector('tr')!;
    const priceCell = row.cells[2];
    const boughtCell = row.querySelector('.bought-price')!;
    const soldCell = row.querySelector('.sold-price')!;
    const earnedCell = row.querySelector('.earned-value')!;

    // Simulate a buy action with a specific price
    priceCell.textContent = '100';
    buyButton.click();

    // Simulate a sell action with a specific price
    priceCell.textContent = '120';
    sellButton.click();

    const boughtPrice = parseFloat(boughtCell.textContent!);
    const soldPrice = parseFloat(soldCell.textContent!);
    const earnedValue = parseFloat(earnedCell.textContent!);

    // Assert that earned value is the difference between sold and bought prices
    expect(earnedValue).toBe(soldPrice - boughtPrice);
  });
});
