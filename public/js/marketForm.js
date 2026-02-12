document.addEventListener('DOMContentLoaded', () => {
    const marketForm = document.getElementById('market-form');
    const marketResult = document.getElementById('market-result');
    const eventTickerInput = document.getElementById('event-ticker');
    const submitButton = marketForm.querySelector('button[type="submit"]');

    const fetchAndDisplayMarkets = async () => {
        const event_ticker = eventTickerInput.value;
        submitButton.disabled = true;

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
                        const temp_in_primary_range = forecast_temp >= market.lower && forecast_temp <= market.upper;
                        const temp_in_secondary_range = ((forecast_temp + 1) >= market.lower && (forecast_temp + 1) <= market.upper) || ((forecast_temp - 1) >= market.lower && (forecast_temp - 1) <= market.upper);

                        if (temp_in_primary_range || temp_in_secondary_range) {
                            if (temp_in_primary_range) {
                                html += `<span class="buy-recommendation">BUY THIS</span>`;
                            } else {
                                html += `<span class="secondary-recommendation" style="color: red;">BUY THIS</span>`;
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

                const recommendations = marketResult.querySelectorAll('.buy-recommendation, .secondary-recommendation');

                if (recommendations.length > 0) {
                    const marketRow1 = recommendations[0].closest('tr');
                    if (marketRow1) {
                        const yesAsk1 = parseInt(marketRow1.dataset.ask, 10);
                        const count1 = (balance && yesAsk1) ? Math.floor((balance / 3) / yesAsk1) : 1;
                        document.getElementById('ticker').value = marketRow1.dataset.ticker;
                        document.getElementById('action').value = 'BUY THIS';
                        document.getElementById('side').value = 'yes';
                        document.getElementById('yes_price').value = yesAsk1;
                        document.getElementById('count').value = count1;
                    }
                } else {
                    document.getElementById('ticker').value = '';
                    document.getElementById('action').value = '';
                    document.getElementById('side').value = 'yes';
                    document.getElementById('yes_price').value = '';
                    document.getElementById('count').value = '';
                }


                if (recommendations.length > 1) {
                    const marketRow2 = recommendations[1].closest('tr');
                    if (marketRow2) {
                        const yesAsk2 = parseInt(marketRow2.dataset.ask, 10);
                        const count2 = (balance && yesAsk2) ? Math.floor((balance / 3) / yesAsk2) : 1;
                        document.getElementById('ticker-2').value = marketRow2.dataset.ticker;
                        document.getElementById('action-2').value = 'BUY THIS';
                        document.getElementById('side-2').value = 'yes';
                        document.getElementById('yes_price-2').value = yesAsk2;
                        document.getElementById('count-2').value = count2;
                    }
                } else {
                    document.getElementById('ticker-2').value = '';
                    document.getElementById('action-2').value = '';
                    document.getElementById('side-2').value = 'yes';
                    document.getElementById('yes_price-2').value = '';
                    document.getElementById('count-2').value = '';
                }

            } else {
                marketResult.innerHTML = `<p>Error: ${data.error}</p>`;
            }
        } catch (error) {
            marketResult.innerHTML = `<p>Error: ${error.message}</p>`;
        } finally {
            submitButton.disabled = false;
        }
    };

    if (marketForm) {
        marketForm.addEventListener('submit', (event) => {
            event.preventDefault();
            fetchAndDisplayMarkets();
        });

        // Automatically fetch data when the page loads
        fetchAndDisplayMarkets();
    }
});