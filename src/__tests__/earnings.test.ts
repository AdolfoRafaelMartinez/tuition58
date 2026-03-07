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
              <td></td>
              <td class="bought-price"></td>
              <td class="sold-price"></td>
              <td class="earned-value"></td>
              <td>0</td>
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
});