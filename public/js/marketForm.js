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
    let marketPriceHistory = {};
    let charts = {};
    let boughtPrices = {}; 
    let soldPrices = {}; 

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
                                <th>Invested</th>
                                <th>Market Value</th>
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
                        const contractCount = parseInt(p.position) || 0;
                        const yesAsk = marketData[p.ticker] ? marketData[p.ticker].yes_ask : 0;
                        const invested = contractCount * yesAsk;
                        const marketValue = contractCount * yesAsk;
                        tableHtml += `
                            <tr>
                                <td>${p.ticker}</td>
                                <td>${p.position}</td>
                                <td>${exposure.toFixed(2)}</td>
                                <td>${invested.toFixed(2)}</td>
                                <td>${marketValue.toFixed(2)}</td>
                                <td>${p.resting_orders_count}</td>
                                <td>${p.fees_paid}</td>
                                <td>${new Date(p.last_updated_ts).toLocaleString()}</td>
                            </tr>
                        `;
                    });
                } else {
                    tableHtml += '<tr><td colspan="8">No positions with non-zero exposure to display.</td></tr>';
                }
                
                tableHtml += `</tbody>`;

                if (positionsWithExposure.length > 0) {
                    tableHtml += `
                        <tfoot>
                            <tr>
                                <td><strong>Totals</strong></td>
                                <td><strong>${totalContracts}</strong></td>
                                <td><strong>${totalDisplayedExposure.toFixed(2)}</strong></td>
                                <td colspan="5"></td>
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

        try {
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
                const now = new Date();
                marketsData.markets.forEach(market => {
                    marketData[market.ticker] = market;
                    if (!marketPriceHistory[market.ticker]) {
                        marketPriceHistory[market.ticker] = [];
                    }
                    const lastHistoryPrice = marketPriceHistory[market.ticker].length > 0 ? marketPriceHistory[market.ticker][marketPriceHistory[market.ticker].length - 1].price : -1;
                    if (lastHistoryPrice !== market.last_price) {
                        marketPriceHistory[market.ticker].push({ time: now, price: market.last_price });
                        marketPriceHistory[market.ticker] = marketPriceHistory[market.ticker].slice(-20);
                    }
                });

                const { positions: allPositions } = await fetchAndDisplayPositions();

                let timerDisplay = document.getElementById('timer-display');
                if (!timerDisplay) {
                    timerDisplay = document.createElement('div');
                    timerDisplay.id = 'timer-display';
                    marketResult.before(timerDisplay);
                }
                timerDisplay.textContent = `Last execution: ${now.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit', second: '2-digit'})}`;

                let tableHtml = `
                    <table class="market-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Range</th>
                                <th>Price</th>
                                <th>Chart</th>
                                <th>Delta</th>
                                <th>Bought</th>
                                <th>Sold</th>
                                <th>Earned</th>
                                <th>Held</th>
                                <th>Recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                marketsData.markets.forEach(market => {
                    const contractsHeld = allPositions.find(p => p.ticker === market.ticker)?.position || 0;
                    const history = marketPriceHistory[market.ticker];
                    let priceChange = 0;
                    if (history && history.length > 1) {
                        const previousPrice = history[history.length - 2].price;
                        priceChange = market.last_price - previousPrice;
                    }

                    let recBtnHtml = '';
                    if (priceChange > 0) {
                        recBtnHtml = `<button class="rec-propose recommendation buy-recommendation" data-ticker="${market.ticker}" data-action="buy" data-price="${market.yes_ask}" type="button"><span class="dot buy-dot"></span></button>`;
                    } else if (priceChange < 0) {
                        recBtnHtml = `<button class="rec-propose recommendation sell-recommendation" data-ticker="${market.ticker}" data-action="sell" data-price="${market.yes_bid}" type="button"><span class="dot sell-dot"></span></button>`;
                    }

                    const priceChangeDisplay = Math.abs(Math.round(priceChange));
                    const priceChangeClass = priceChange > 0 ? 'positive' : priceChange < 0 ? 'negative' : 'neutral';
                    const priceChangeIcon = priceChange > 0 ? '<span class="triangle-up">&#9650;</span>' : priceChange < 0 ? '<span class="triangle-down">&#9660;</span>' : '';
                    const boughtPrice = boughtPrices[market.ticker] !== undefined ? boughtPrices[market.ticker] : '';
                    const soldPrice = soldPrices[market.ticker] !== undefined ? soldPrices[market.ticker] : '';
                    const earned = (boughtPrice !== '' && soldPrice !== '') ? soldPrice - boughtPrice : '';

                    tableHtml += `
                        <tr>
                            <td>${market.ticker}</td>
                            <td>${market.lower === undefined ? 'N/A' : market.lower} to ${market.upper === undefined ? 'N/A' : market.upper}</td>
                            <td>${market.last_price}</td>
                            <td><canvas id="chart-${market.ticker}" width="100" height="30"></canvas></td>
                            <td class="${priceChangeClass}">${priceChangeIcon} ${priceChangeDisplay}</td>
                            <td class="bought-price">${boughtPrice}</td>
                            <td class="sold-price">${soldPrice}</td>
                            <td class="earned-value">${earned}</td>
                            <td>${contractsHeld}</td>
                            <td class="recommendation-cell">${recBtnHtml}</td>
                        </tr>
                    `;
                });

                tableHtml += `</tbody></table>`;
                marketResult.innerHTML = tableHtml;

                marketsData.markets.forEach(market => {
                    const ctx = document.getElementById(`chart-${market.ticker}`).getContext('2d');
                    if (charts[market.ticker]) {
                        charts[market.ticker].destroy();
                    }
                    const history = marketPriceHistory[market.ticker];
                    if (history && history.length > 0) {
                        let chartLabels = history.map(p => p.time.toLocaleTimeString());
                        let chartData = history.map(p => p.price);
                
                        if (chartData.length === 1) {
                            chartLabels.push(chartLabels[0]);
                            chartData.push(chartData[0]);
                        }
                
                        charts[market.ticker] = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: chartLabels,
                                datasets: [{
                                    label: 'Price',
                                    data: chartData,
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    borderWidth: 1,
                                    fill: false,
                                    tension: 0.1,
                                    pointRadius: 0
                                }]
                            },
                            options: {
                                responsive: false,
                                scales: {
                                    x: { display: false },
                                    y: { display: false }
                                },
                                plugins: { legend: { display: false } }
                            }
                        });
                    }
                });

            } else {
                marketResult.innerHTML = `<p>Error: ${marketsData.error}</p>`;
            }
        } catch (error) {
            marketResult.innerHTML = `<p>Error: ${error.message}</p>`;
        } finally {
            submitButton.disabled = false;
        }
    };

    const createOrderForm = (ticker, action, price) => {
        const formId = `order-form-${Date.now()}`;
        const side = 'yes';
        const contracts = 1;

        const formHtml = `
            <div class="order-form" id="${formId}">
                <div class="order-details">
                    <strong>${action.toUpperCase()} ${ticker}</strong>
                    <span>${contracts} contract @ ${price}¢</span>
                </div>
                <input type="hidden" name="ticker" value="${ticker}">
                <input type="hidden" name="action" value="${action}">
                <input type="hidden" name="side" value="${side}">
                <input type="hidden" name="contracts" value="${contracts}">
                <input type="hidden" name="price" value="${price}">
                <button type="button" class="delete-order" data-form-id="${formId}">&#10006;</button>
            </div>
        `;
        orderFormsContainer.insertAdjacentHTML('beforeend', formHtml);
        placeAllOrdersButton.style.display = 'block';
    };

    marketResult.addEventListener('click', (event) => {
        const button = event.target.closest('.rec-propose');
        if (button) {
            const ticker = button.dataset.ticker;
            const action = button.dataset.action;
            const orderPrice = parseInt(button.dataset.price, 10);
    
            const row = button.closest('tr');
            if (row) {
                const priceCell = row.cells[2];
                const displayPrice = parseInt(priceCell.textContent, 10);

                const earnedCell = row.querySelector('.earned-value');
                if (action === 'buy') {
                    boughtPrices[ticker] = displayPrice;
                    const boughtCell = row.querySelector('.bought-price');
                    if (boughtCell) boughtCell.textContent = displayPrice;
                    const soldPrice = soldPrices[ticker];
                    if (soldPrice !== undefined && earnedCell) {
                        earnedCell.textContent = soldPrice - displayPrice;
                    }
                } else if (action === 'sell') {
                    soldPrices[ticker] = displayPrice;
                    const soldCell = row.querySelector('.sold-price');
                    if (soldCell) soldCell.textContent = displayPrice;
                    const boughtPrice = boughtPrices[ticker];
                    if (boughtPrice !== undefined && earnedCell) {
                        earnedCell.textContent = displayPrice - boughtPrice;
                    }
                }
            }
    
            createOrderForm(ticker, action, orderPrice);
        }
    });

    orderFormsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-order')) {
            const formId = event.target.dataset.formId;
            const form = document.getElementById(formId);
            if (form) {
                form.remove();
            }
            if (orderFormsContainer.children.length === 0) {
                placeAllOrdersButton.style.display = 'none';
            }
        }
    });

    window.fetchAndDisplayMarkets = fetchAndDisplayMarkets;

    if (marketForm) {
        marketForm.addEventListener('submit', (event) => {
            event.preventDefault();
            fetchAndDisplayMarkets();
        });
    }

    fetchAndDisplayPositions();
    setInterval(fetchAndDisplayMarkets, 10000);
    fetchAndDisplayMarkets();
});