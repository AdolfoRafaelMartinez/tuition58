import { JSDOM } from 'jsdom';

describe('Market Form', () => {
  let dom: JSDOM;
  let document: Document;
  let marketResult: HTMLElement;
  let boughtPrices: { [key: string]: number };
  let soldPrices: { [key: string]: number };
  let accumulatedEarnings: { [key: string]: number };

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
              <td class="accum-value"></td>
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
    accumulatedEarnings = {};

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
        const accumCell = row.querySelector('.accum-value')!;

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
          const earnedValue = soldPrice - boughtPrice;
          earnedCell.textContent = earnedValue.toString();

          if (accumulatedEarnings[ticker] === undefined) {
            accumulatedEarnings[ticker] = 0;
          }
          accumulatedEarnings[ticker] += earnedValue;
          accumCell.textContent = accumulatedEarnings[ticker].toString();
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

  test('should accumulate earned values correctly', () => {
    const buyButton = document.querySelector('.buy-recommendation') as HTMLButtonElement;
    const sellButton = document.querySelector('.sell-recommendation') as HTMLButtonElement;
    const row = document.querySelector('tr')!;
    const priceCell = row.cells[2];
    const earnedCell = row.querySelector('.earned-value')!;
    const accumCell = row.querySelector('.accum-value')!;

    // First transaction
    priceCell.textContent = '50';
    buyButton.click();
    priceCell.textContent = '60';
    sellButton.click();
    expect(earnedCell.textContent).toBe('10');
    expect(accumCell.textContent).toBe('10');

    // Second transaction
    priceCell.textContent = '55';
    buyButton.click();
    priceCell.textContent = '50';
    sellButton.click();
    expect(earnedCell.textContent).toBe('-5');
    expect(accumCell.textContent).toBe('5'); // 10 + (-5)
  });
  test('should populate bought column with current price on buy recommendation', () => {
    const buyButton = document.querySelector('.buy-recommendation') as HTMLButtonElement;
    const row = document.querySelector('tr')!;
    const priceCell = row.cells[2];
    const boughtCell = row.querySelector('.bought-price')!;

    // Set a specific market price for this test
    const testPrice = '85';
    priceCell.textContent = testPrice;

    // Simulate a buy action
    buyButton.click();

    // Assert that the 'bought' column is populated with the price at the moment of the click
    expect(boughtCell.textContent).toBe(testPrice);
  });
});
