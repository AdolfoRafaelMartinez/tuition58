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

                    html += `<td class="recommendation-cell">`;
                    if (forecast_temp !== undefined && !isNaN(forecast_temp)) {
                        if(market.lower == undefined) {
                            market.lower = -1000;
                        }
                        if(market.upper == undefined) {
                            market.lower = 1000;
                        }
                        const temp_in_primary_range = forecast_temp >= market.lower && forecast_temp <= market.upper;
                        const temp_in_secondary_range = ((forecast_temp + 1) >= market.lower && (forecast_temp + 1) <= market.upper) || ((forecast_temp - 1) >= market.lower && (forecast_temp - 1) <= market.upper);

                        if (temp_in_primary_range || temp_in_secondary_range) {
                            html += `<span class="recommendation buy-recommendation">BUY</span>`;
                        } else {
                            html += `<span class="recommendation sell-recommendation">SELL</span>`;
                        }
                    } else {
                        html += `<span class="recommendation sell-recommendation">SELL</span>`;
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

            } else {
                marketResult.innerHTML = `<p>Error: ${data.error}</p>`;
            }
        } catch (error) {
            marketResult.innerHTML = `<p>Error: ${error.message}</p>`;
        } finally {
            submitButton.disabled = false;
        }
    };

    // Expose the function to the global scope
    window.fetchAndDisplayMarkets = fetchAndDisplayMarkets;

    if (marketForm) {
        marketForm.addEventListener('submit', (event) => {
            event.preventDefault();
            fetchAndDisplayMarkets();
        });
    }
});