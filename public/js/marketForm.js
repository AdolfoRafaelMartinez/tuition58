document.addEventListener('DOMContentLoaded', () => {
    const marketForm = document.getElementById('market-form');
    const marketResult = document.getElementById('market-result');
    const positionsResult = document.getElementById('positions-result');
    const eventTickerInput = document.getElementById('event-ticker');
    const submitButton = marketForm.querySelector('button[type="submit"]');
    const orderFormsContainer = document.getElementById('order-forms-container');
    const placeAllOrdersButton = document.getElementById('place-all-orders');
    const container = document.querySelector('.container');
    let marketData = {};

    const fetchAndDisplayPositions = async () => {
        let positions = [];
        try {
            const positionsResponse = await fetch('/api/kalshi/positions');
            const positionsData = await positionsResponse.json();

            if (positionsResponse.ok) {
                positions = [...(positionsData.event_positions || []), ...(positionsData.market_positions || [])];
                let tableHtml = `
                    <table class="market-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Contracts</th>
                                <th>Exposure</th>
                                <th>Yes Bid</th>
                                <th>Resting Orders</th>
                                <th>Fees Paid</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                const positionsWithExposure = positions.filter(p => p.ticker && ((p.market_exposure && p.market_exposure !== 0) || (p.event_exposure && p.event_exposure !== 0)));

                if (positionsWithExposure.length > 0) {
                    positionsWithExposure.forEach(p => {
                        const exposure = p.market_exposure || p.event_exposure || 0;
                        const yesBid = marketData[p.ticker] ? marketData[p.ticker].yes_bid : 'N/A';
                        tableHtml += `
                            <tr>
                                <td>${p.ticker}</td>
                                <td>${p.position}</td>
                                <td>${exposure}</td>
                                <td>${yesBid}</td>
                                <td>${p.resting_orders_count}</td>
                                <td>${p.fees_paid}</td>
                                <td>${new Date(p.last_updated_ts).toLocaleString()}</td>
                            </tr>
                        `;
                    });
                } else {
                    tableHtml += '<tr><td colspan="7">No positions with non-zero exposure to display.</td></tr>';
                }
                
                tableHtml += `</tbody></table>`;
                positionsResult.innerHTML = tableHtml;
            } else {
                positionsResult.innerHTML = `<p>Error: ${positionsData.error}</p>`;
            }
        } catch (error) {
            positionsResult.innerHTML = `<p>Error fetching positions: ${error.message}</p>`;
        }
        return positions;
    };

    const fetchAndDisplayMarkets = async () => {
        const event_ticker = eventTickerInput.value;
        submitButton.disabled = true;
        orderFormsContainer.innerHTML = ''; // Clear previous forms

        try {
            const allPositions = await fetchAndDisplayPositions(); // Refresh positions and get them.

            const existingPositions = new Set();
            if (allPositions.length > 0) {
                allPositions.forEach(p => {
                    if (p.event_exposure > 0 || p.market_exposure > 0) {
                        existingPositions.add(p.ticker);
                    }
                });
            }

            const marketsResponse = await fetch(`/api/kalshi/markets/${event_ticker}`);
            const marketsData = await marketsResponse.json();

            if (marketsResponse.ok) {
                marketsData.markets.forEach(market => {
                    marketData[market.ticker] = market;
                });
                await fetchAndDisplayPositions(); // Re-render positions table with yes_bid data

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
                const ordersToCreate = [];

                marketsData.markets.forEach(market => {
                    let recommendation = "SELL";
                    if (forecast_temp !== undefined && !isNaN(forecast_temp)) {
                        const lower = market.lower === undefined ? -1000 : market.lower;
                        const upper = market.upper === undefined ? 1000 : market.upper;
                        const temp_in_primary_range = forecast_temp >= lower && forecast_temp <= upper;
                        const temp_in_secondary_range = ((forecast_temp + 1) >= lower && (forecast_temp + 1) <= upper) || ((forecast_temp - 1) >= lower && (forecast_temp - 1) <= upper);
                        if (temp_in_primary_range || temp_in_secondary_range) {
                            recommendation = "BUY";
                        }
                    }

                    tableHtml += `<tr><td>${market.ticker}</td><td>${market.lower === undefined ? 'N/A' : market.lower} to ${market.upper === undefined ? 'N/A' : market.upper}</td><td>${market.yes_ask}</td><td>${market.yes_bid}</td><td>${market.status}</td><td class="recommendation-cell"><span class="recommendation ${recommendation.toLowerCase()}-recommendation">${recommendation}</span></td></tr>`;

                    const hasPosition = existingPositions.has(market.ticker);
                    let createOrderForm = false;
                    if (recommendation === 'BUY' && !hasPosition) {
                        createOrderForm = true;
                    } else if (recommendation === 'SELL' && hasPosition) {
                        createOrderForm = true;
                    }

                    if (createOrderForm) {
                        ordersToCreate.push({ market, recommendation });
                    }
                });

                tableHtml += `</tbody></table>`;

                const kalshiBalance = parseFloat(container.dataset.balance) || 0;
                const balanceToTrade = kalshiBalance / 2;
                let orderFormsHtml = '';
                const numberOfOrders = ordersToCreate.length;

                if (numberOfOrders > 0) {
                    const allocationPerOrder = balanceToTrade / numberOfOrders;

                    ordersToCreate.forEach(orderInfo => {
                        const { market, recommendation } = orderInfo;
                        const action = recommendation.toLowerCase();
                        const price = action === 'buy' ? market.yes_ask : market.yes_bid;
                        
                        let costPerContract = 0;
                        if (action === 'buy') {
                            costPerContract = price;
                        } else { // sell
                            costPerContract = 100 - price;
                        }

                        let count = 0;
                        if (costPerContract > 0) {
                            count = Math.floor(allocationPerOrder / costPerContract);
                        }
                        count = Math.max(0, count); // Ensure count is not negative

                        orderFormsHtml += `
                            <form class="order-form-dynamic" data-ticker="${market.ticker}">
                                <h4>${market.ticker}</h4>
                                <input type="hidden" name="ticker" value="${market.ticker}">
                                <div class="form-group"><label>Action:</label><input type="text" name="action" value="${action}" readonly></div>
                                <div class="form-group"><label>Side:</label><input type="text" name="side" value="yes" readonly></div>
                                <div class="form-group"><label>Price (cents):</label><input type="number" name="yes_price" value="${price}" min="1" max="99" required></div>
                                <div class="form-group"><label>Count:</label><input type="number" name="count" value="${count}" min="0"></div>
                            </form>
                        `;
                    });
                }

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

    // Initial load of positions
    fetchAndDisplayPositions();
});