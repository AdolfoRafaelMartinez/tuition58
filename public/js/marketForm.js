document.addEventListener('DOMContentLoaded', () => {
    const marketForm = document.getElementById('market-form');
    const marketResult = document.getElementById('market-result');
    const eventTickerInput = document.getElementById('event-ticker');

    if (marketForm) {
        marketForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const event_ticker = eventTickerInput.value;

            try {
                const response = await fetch(`/api/kalshi/markets/${event_ticker}`);
                const data = await response.json();

                if (response.ok) {
                    let html = `
                        <table class="market-table">
                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th>Range</th>
                                    <th>Yes Ask</th>
                                    <th>Yes Bid</th>
                                    <th>Status</th>
                                    <th>Recommendation</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    const forecast_temp = data.forecast_temp;

                    for (const market of data.markets) {
                        html += `<tr data-ticker="${market.ticker}" data-ask="${market.yes_ask}">`;
                        html += `<td>${market.ticker}</td>`;
                        html += `<td>${market.lower} to ${market.upper}</td>`;
                        html += `<td>${market.yes_ask}</td>`;
                        html += `<td>${market.yes_bid}</td>`;
                        html += `<td>${market.status}</td>`;

                        html += `<td>`;
                        if (forecast_temp !== undefined && !isNaN(forecast_temp)) {
                            if (forecast_temp >= market.lower && forecast_temp <= market.upper && market.yes_ask <= 70) {
                                html += `<span class="buy-recommendation">BUY THIS</span>`;
                            } else if (
                                ((forecast_temp + 1) >= market.lower && (forecast_temp + 1) <= market.upper) ||
                                ((forecast_temp - 1) >= market.lower && (forecast_temp - 1) <= market.upper)
                            ) {
                               if (market.yes_ask <= 70) {
                                html += `<span class="secondary-recommendation" style="color: red;">and this</span>`;
                                }
                            }
                        }
                        html += `</td>`;

                        html += `</tr>`;
                    }
                    html += `
                            </tbody>
                        </table>
                    `;

                    if (data.market_source_url) {
                        html += `<p class="citation">Market data from: <a href="${data.market_source_url}" target="_blank">${data.market_source_url}</a></p>`;
                    }
                    if (data.forecast_source) {
                         html += `<p class="citation">Forecast data from: ${data.forecast_source}</p>`;
                    }

                    marketResult.innerHTML = html;

                    const container = document.querySelector('.container');
                    const balance = parseInt(container.dataset.balance, 10);

                    const primaryRec = marketResult.querySelector('.buy-recommendation');
                    if (primaryRec) {
                        const marketRow = primaryRec.closest('tr');
                        if (marketRow) {
                            const yesAsk = parseInt(marketRow.dataset.ask, 10);
                            const count = (balance && yesAsk) ? Math.floor((balance / 3) / yesAsk) : 1;
                            document.getElementById('ticker').value = marketRow.dataset.ticker;
                            document.getElementById('action').value = 'BUY THIS';
                            document.getElementById('side').value = 'yes';
                            document.getElementById('yes_price').value = yesAsk;
                            document.getElementById('count').value = count;
                        }
                    }

                    const secondaryRec = marketResult.querySelector('.secondary-recommendation');
                    if (secondaryRec) {
                        const marketRow = secondaryRec.closest('tr');
                        if (marketRow) {
                            const yesAsk = parseInt(marketRow.dataset.ask, 10);
                            const count = (balance && yesAsk) ? Math.floor((balance / 3) / yesAsk) : 1;
                            document.getElementById('ticker-2').value = marketRow.dataset.ticker;
                            document.getElementById('action-2').value = 'BUY THIS';
                            document.getElementById('side-2').value = 'yes';
                            document.getElementById('yes_price-2').value = yesAsk;
                            document.getElementById('count-2').value = count;
                        }
                    }

                } else {
                    marketResult.innerHTML = `<p>Error: ${data.error}</p>`;
                }
            } catch (error) {
                marketResult.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }
});