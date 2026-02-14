document.addEventListener('DOMContentLoaded', () => {
    const marketForm = document.getElementById('market-form');
    const marketResult = document.getElementById('market-result');
    const eventTickerInput = document.getElementById('event-ticker');
    const submitButton = marketForm.querySelector('button[type="submit"]');
    const orderFormsContainer = document.getElementById('order-forms-container');
    const placeAllOrdersButton = document.getElementById('place-all-orders');

    const fetchAndDisplayMarkets = async () => {
        const event_ticker = eventTickerInput.value;
        submitButton.disabled = true;
        orderFormsContainer.innerHTML = ''; // Clear previous forms

        try {
            const response = await fetch(`/api/kalshi/markets/${event_ticker}`);
            const data = await response.json();

            if (response.ok) {
                let tableHtml = `
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
                let orderFormsHtml = '';

                data.markets.forEach((market, index) => {
                    tableHtml += `<tr data-ticker="${market.ticker}" data-ask="${market.yes_ask}">`;
                    tableHtml += `<td>${market.ticker}</td>`;
                    tableHtml += `<td>${market.lower} to ${market.upper}</td>`;
                    tableHtml += `<td>${market.yes_ask}</td>`;
                    tableHtml += `<td>${market.yes_bid}</td>`;
                    tableHtml += `<td>${market.status}</td>`;

                    let recommendation = "SELL";
                    if (forecast_temp !== undefined && !isNaN(forecast_temp)) {
                        const temp_in_primary_range = forecast_temp >= (market.lower || -1000) && forecast_temp <= (market.upper || 1000);
                        const temp_in_secondary_range = ((forecast_temp + 1) >= (market.lower || -1000) && (forecast_temp + 1) <= (market.upper || 1000)) || ((forecast_temp - 1) >= (market.lower || -1000) && (forecast_temp - 1) <= (market.upper || 1000));
                        if (temp_in_primary_range || temp_in_secondary_range) {
                            recommendation = "BUY";
                        }
                    }

                    tableHtml += `<td class="recommendation-cell"><span class="recommendation ${recommendation.toLowerCase()}-recommendation">${recommendation}</span></td>`;
                    tableHtml += `</tr>`;

                    // Create an order form for each market
                    const action = recommendation === 'BUY' ? 'buy' : 'sell';
                    const side = 'yes'; // Always trading on the 'yes' side based on recommendation
                    const price = recommendation === 'BUY' ? market.yes_ask : market.yes_bid;

                    orderFormsHtml += `
                        <form class="order-form-dynamic" data-ticker="${market.ticker}">
                            <h4>${market.ticker}</h4>
                            <input type="hidden" name="ticker" value="${market.ticker}">
                            <div class="form-group">
                                <label>Action:</label>
                                <input type="text" name="action" value="${action}" readonly>
                            </div>
                            <div class="form-group">
                                <label>Side:</label>
                                <input type="text" name="side" value="${side}" readonly>
                            </div>
                            <div class="form-group">
                                <label>Price (cents):</label>
                                <input type="number" name="yes_price" value="${price}" min="1" max="99" required>
                            </div>
                            <div class="form-group">
                                <label>Count:</label>
                                <input type="number" name="count" min="0" placeholder="0">
                            </div>
                        </form>
                    `;
                });

                tableHtml += `</tbody></table>`;
                if (data.market_source_url) {
                    tableHtml += `<p class="citation">Market data from: <a href="${data.market_source_url}" target="_blank">${data.market_source_url}</a></p>`;
                }
                if (data.forecast_source) {
                     tableHtml += `<p class="citation">Forecast data from: ${data.forecast_source}</p>`;
                }

                marketResult.innerHTML = tableHtml;
                orderFormsContainer.innerHTML = orderFormsHtml;
                placeAllOrdersButton.style.display = data.markets.length > 0 ? 'block' : 'none';

            } else {
                marketResult.innerHTML = `<p>Error: ${data.error}</p>`;
                placeAllOrdersButton.style.display = 'none';
            }
        } catch (error) {
            marketResult.innerHTML = `<p>Error: ${error.message}</p>`;
            placeAllOrdersButton.style.display = 'none';
        } finally {
            submitButton.disabled = false;
        }
    };

    window.fetchAndDisplayMarkets = fetchAndDisplayMarkets;

    if (marketForm) {
        marketForm.addEventListener('submit', (event) => {
            event.preventDefault();
            fetchAndDisplayMarkets();
        });
    }
});