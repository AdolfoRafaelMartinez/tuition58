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
            // First, get the current positions.
            const positionsResponse = await fetch('/api/kalshi/positions');
            const positionsResult = await positionsResponse.json();
            const existingPositions = new Set();
            if (positionsResponse.ok) {
                const positions = [...(positionsResult.event_positions || []), ...(positionsResult.market_positions || [])];
                positions.forEach(p => {
                    if (p.market_exposure > 0) {
                        existingPositions.add(p.ticker);
                    }
                });
            }

            const marketsResponse = await fetch(`/api/kalshi/markets/${event_ticker}`);
            const marketsData = await marketsResponse.json();

            if (marketsResponse.ok) {
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
                const forecast_temp = marketsData.forecast_temp;
                let orderFormsHtml = '';

                marketsData.markets.forEach(market => {
                    let recommendation = "SELL";
                    if (forecast_temp !== undefined && !isNaN(forecast_temp)) {
                        const temp_in_primary_range = forecast_temp >= (market.lower || -1000) && forecast_temp <= (market.upper || 1000);
                        if (temp_in_primary_range) {
                            recommendation = "BUY";
                        }
                    }

                    tableHtml += `<tr><td>${market.ticker}</td><td>${market.lower} to ${market.upper}</td><td>${market.yes_ask}</td><td>${market.yes_bid}</td><td>${market.status}</td><td class="recommendation-cell"><span class="recommendation ${recommendation.toLowerCase()}-recommendation">${recommendation}</span></td></tr>`;

                    const hasPosition = existingPositions.has(market.ticker);
                    let createOrderForm = false;
                    if (recommendation === 'BUY' && !hasPosition) {
                        createOrderForm = true;
                    } else if (recommendation === 'SELL' && hasPosition) {
                        createOrderForm = true;
                    }

                    if (createOrderForm) {
                        const action = recommendation.toLowerCase();
                        const price = action === 'buy' ? market.yes_ask : market.yes_bid;
                        orderFormsHtml += `
                            <form class="order-form-dynamic" data-ticker="${market.ticker}">
                                <h4>${market.ticker}</h4>
                                <input type="hidden" name="ticker" value="${market.ticker}">
                                <div class="form-group"><label>Action:</label><input type="text" name="action" value="${action}" readonly></div>
                                <div class="form-group"><label>Side:</label><input type="text" name="side" value="yes" readonly></div>
                                <div class="form-group"><label>Price (cents):</label><input type="number" name="yes_price" value="${price}" min="1" max="99" required></div>
                                <div class="form-group"><label>Count:</label><input type="number" name="count" min="0" placeholder="0"></div>
                            </form>
                        `;
                    }
                });

                tableHtml += `</tbody></table>`;
                if (marketsData.market_source_url) tableHtml += `<p class="citation">Market data from: <a href="${marketsData.market_source_url}" target="_blank">${marketsData.market_source_url}</a></p>`;
                if (marketsData.forecast_source) tableHtml += `<p class="citation">Forecast data from: ${marketsData.forecast_source}</p>`;

                marketResult.innerHTML = tableHtml;
                orderFormsContainer.innerHTML = orderFormsHtml;
                placeAllOrdersButton.style.display = orderFormsHtml.length > 0 ? 'block' : 'none';

            } else {
                marketResult.innerHTML = `<p>Error: ${marketsData.error}</p>`;
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