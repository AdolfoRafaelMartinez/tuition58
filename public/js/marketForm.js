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
        let totalContracts = 0;
        let totalDisplayedExposure = 0;

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

                const positionsWithExposure = positions.filter(p => p && p.ticker && String(p.ticker).trim() !== '' && ((p.market_exposure && p.market_exposure !== 0) || (p.event_exposure && p.event_exposure !== 0)));

                if (positionsWithExposure.length > 0) {
                    positionsWithExposure.forEach(p => {
                        const exposure = parseFloat(p.market_exposure || p.event_exposure || 0);
                        totalDisplayedExposure += exposure;
                        totalContracts += parseInt(p.position) || 0;
                        const yesBid = marketData[p.ticker] ? marketData[p.ticker].yes_bid : 'N/A';
                        tableHtml += `
                            <tr>
                                <td>${p.ticker}</td>
                                <td>${p.position}</td>
                                <td>${exposure.toFixed(2)}</td>
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
                
                tableHtml += `</tbody>`;

                if (positionsWithExposure.length > 0) {
                    tableHtml += `
                        <tfoot>
                            <tr>
                                <td><strong>Totals</strong></td>
                                <td><strong>${totalContracts}</strong></td>
                                <td><strong>${totalDisplayedExposure.toFixed(2)}</strong></td>
                                <td colspan="4"></td>
                            </tr>
                        </tfoot>
                    `;
                }

                tableHtml += `</table>`;
                positionsResult.innerHTML = tableHtml;
            } else {
                positionsResult.innerHTML = `<p>Error: ${positionsData.error}</p>`;
            }
        } catch (error) {
            positionsResult.innerHTML = `<p>Error fetching positions: ${error.message}</p>`;
        }
        return { positions, totalContracts, totalDisplayedExposure };
    };

    const fetchAndDisplayMarkets = async () => {
        const event_ticker = eventTickerInput.value;
        submitButton.disabled = true;
        orderFormsContainer.innerHTML = ''; // Clear previous forms

        try {
            // include currently selected forecast location so server returns matching forecast_temp
            let location = 'bergstrom';
            const locSelect = document.getElementById('location-select');
            if (locSelect && locSelect.value) {
                location = locSelect.value;
            } else {
                const params = new URLSearchParams(window.location.search);
                const p = params.get('location');
                if (p) location = p.toLowerCase();
            }
            const marketsResponse = await fetch(`/api/kalshi/markets/${encodeURIComponent(event_ticker)}?location=${encodeURIComponent(location)}`);
            const marketsData = await marketsResponse.json();

            if (marketsResponse.ok) {
                marketsData.markets.forEach(market => {
                    marketData[market.ticker] = market;
                });

                const { positions: allPositions, totalDisplayedExposure } = await fetchAndDisplayPositions();

                const existingPositions = new Set();
                if (allPositions.length > 0) {
                    allPositions.forEach(p => {
                        const exposure = parseFloat(p.market_exposure || p.event_exposure || 0);
                        if (exposure > 0 && p && p.ticker && String(p.ticker).trim() !== '') {
                            existingPositions.add(p.ticker);
                        }
                    });
                }

                let tuitionMoneySection = document.getElementById('tuition-money-section');
                if (!tuitionMoneySection) {
                    tuitionMoneySection = document.createElement('div');
                    tuitionMoneySection.id = 'tuition-money-section';
                    tuitionMoneySection.className = 'section';
                    container.appendChild(tuitionMoneySection);
                }

                let tableHtml = `
                    <table class="market-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Range</th>
                                <th>Yes Ask</th>
                                <th>Yes Bid</th>
                                <th>Status</th>
                                <th>Contracts Held</th>
                                <th>Recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                // Determine market with greatest yes_ask (recommend only that market)
                let topMarket = null;
                let maxYesAsk = -Infinity;
                (marketsData.markets || []).forEach(m => {
                    const yesAsk = typeof m.yes_ask === 'number' ? m.yes_ask : parseFloat(m.yes_ask);
                    if (!isNaN(yesAsk) && yesAsk > maxYesAsk) {
                        maxYesAsk = yesAsk;
                        topMarket = m;
                    }
                });

                const ordersToCreate = [];

                // Create a map of ticker to contract count for quick lookup
                const contractsByTicker = {};
                if (allPositions.length > 0) {
                    allPositions.forEach(p => {
                        if (p && p.ticker && String(p.ticker).trim() !== '') {
                            contractsByTicker[p.ticker] = parseInt(p.position) || 0;
                        }
                    });
                }

                marketsData.markets.forEach(market => {
                    // Recommend BUY only for the topMarket (highest yes_ask), SELL otherwise
                    let recommendation = (topMarket && market.ticker === topMarket.ticker) ? 'BUY' : 'SELL';
                    let displayRecommendation = recommendation;

                    const hasPosition = existingPositions.has(market.ticker);
                    const contractsHeld = contractsByTicker[market.ticker] || 0;
                    // Render recommendation as a button that proposes a one-contract order at last yes_ask
                    const recAction = displayRecommendation.toLowerCase();
                    const recBtnHtml = `<button class="rec-propose recommendation ${recAction}-recommendation" data-ticker="${market.ticker}" data-action="${recAction}" data-price="${market.yes_ask}" type="button" style="padding:6px 8px;border-radius:4px;border:none;cursor:pointer;">${displayRecommendation}</button>`;
                    tableHtml += `<tr><td>${market.ticker}</td><td>${market.lower === undefined ? 'N/A' : market.lower} to ${market.upper === undefined ? 'N/A' : market.upper}</td><td>${market.yes_ask}</td><td>${market.yes_bid}</td><td>${market.status}</td><td>${contractsHeld}</td><td class="recommendation-cell">${recBtnHtml}</td></tr>`;
                    // Only create orders for the top market if it's not already held
                    if (recommendation === 'BUY' && !hasPosition) {
                        ordersToCreate.push({ market, recommendation: displayRecommendation });
                    }
                });

                tableHtml += `</tbody></table>`;

                // (No top-market banner — recommendations use the single highest yes_ask market)
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
                        
                        let costPerContract = action === 'buy' ? price : 100 - price;

                        let count = 0;
                        if (costPerContract > 0) {
                            count = Math.floor(allocationPerOrder / costPerContract);
                        }
                        count = Math.max(0, count);

                        orderFormsHtml += `
                            <form class="order-form-dynamic" data-ticker="${market.ticker}" style="position: relative; padding-top: 20px;">
                                <button type="button" class="delete-form" title="Delete Order" style="position: absolute; top: 0; right: 0;">🗑️</button>
                                <h4>${market.ticker}</h4>
                                <div class="form-group"><label>Action:</label><select name="action">
                                    <option value="buy" ${action === 'buy' ? 'selected' : ''}>Buy</option>
                                    <option value="sell" ${action === 'sell' ? 'selected' : ''}>Sell</option>
                                </select></div>
                                <div class="form-group"><label>Side:</label><select name="side">
                                    <option value="yes" selected>Yes</option>
                                    <option value="no">No</option>
                                </select></div>
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

                // Attach handlers so clicking a recommendation button creates/updates a one-contract proposed order
                const recButtons = marketResult.querySelectorAll('.rec-propose');
                recButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const ticker = btn.dataset.ticker;
                        const action = btn.dataset.action; // 'buy' or 'sell'
                        const price = parseInt(btn.dataset.price, 10) || 0;

                        const existingForm = orderFormsContainer.querySelector(`[data-ticker="${ticker}"]`);
                        if (existingForm) {
                            // update existing form to requested action, price, and ensure count >= 1
                            const actionSelect = existingForm.querySelector('select[name="action"]');
                            if (actionSelect) actionSelect.value = action;
                            const priceInput = existingForm.querySelector('input[name="yes_price"]');
                            if (priceInput) priceInput.value = price;
                            const countInput = existingForm.querySelector('input[name="count"]');
                            if (countInput) countInput.value = Math.max(1, parseInt(countInput.value || '0', 10));
                        } else {
                            // create new one-contract form for this market
                            const formHtml = `\n                                <form class="order-form-dynamic" data-ticker="${ticker}" style="position: relative; padding-top: 20px;">\n                                    <button type="button" class="delete-form" title="Delete Order" style="position: absolute; top: 0; right: 0;">🗑️</button>\n                                    <h4>${ticker}</h4>\n                                    <input type="hidden" name="ticker" value="${ticker}">\n                                    <div class="form-group"><label>Action:</label><select name="action">\n                                        <option value="buy" ${action === 'buy' ? 'selected' : ''}>Buy</option>\n                                        <option value="sell" ${action === 'sell' ? 'selected' : ''}>Sell</option>\n                                    </select></div>\n                                    <div class="form-group"><label>Side:</label><select name="side">\n                                        <option value="yes" selected>Yes</option>\n                                        <option value="no">No</option>\n                                    </select></div>\n                                    <div class="form-group"><label>Price (cents):</label><input type="number" name="yes_price" value="${price}" min="1" max="99" required></div>\n                                    <div class="form-group"><label>Count:</label><input type="number" name="count" value="1" min="0"></div>\n                                </form>\n                            `;

                            orderFormsContainer.insertAdjacentHTML('beforeend', formHtml);
                            placeAllOrdersButton.style.display = 'block';

                            // attach delete listener for the new form
                            const newDelete = orderFormsContainer.querySelector('[data-ticker="' + ticker + '"] .delete-form');
                            if (newDelete) {
                                newDelete.addEventListener('click', () => {
                                    newDelete.closest('form').remove();
                                    if (orderFormsContainer.querySelectorAll('.order-form-dynamic').length === 0) {
                                        placeAllOrdersButton.style.display = 'none';
                                    }
                                });
                            }
                        }
                    });
                });
                // (propose buttons removed)
                placeAllOrdersButton.style.display = orderFormsHtml.length > 0 ? 'block' : 'none';

                // Attach delete listeners for order forms
                const deleteFormButtons = orderFormsContainer.querySelectorAll('.delete-form');
                deleteFormButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        button.closest('form').remove();
                        // Hide button if no forms left
                        if (orderFormsContainer.querySelectorAll('.order-form-dynamic').length === 0) {
                            placeAllOrdersButton.style.display = 'none';
                        }
                    });
                });

                // (propose-top-market removed)

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