document.addEventListener('DOMContentLoaded', () => {
    const marketForm = document.getElementById('market-form');
    const marketResult = document.getElementById('market-result');
    const positionsResult = document.getElementById('positions-result');
    const eventTickerInput = document.getElementById('event-ticker');
    const submitButton = marketForm.querySelector('button[type="submit"]');
    const orderFormsContainer = document.getElementById('order-forms-container');
    const placeAllOrdersButton = document.getElementById('place-all-orders');
    const clearAllOrdersButton = document.getElementById('clear-all-orders');
    const container = document.querySelector('.container');
    let marketData = {};
    let marketPriceHistory = {};
    let charts = {};
    const refreshInterval = 60000;
    let lastExecutionTime = Date.now();

    const updateProgressBar = () => {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return;

        const now = Date.now();
        const timeElapsed = now - lastExecutionTime;
        const percentage = Math.min((timeElapsed / refreshInterval) * 100, 100);

        progressBar.style.width = `${percentage}%`;
    };

    const fetchAndDisplayMarkets = async () => {
        lastExecutionTime = Date.now();
        const event_ticker = eventTickerInput.value;
        submitButton.disabled = true;

        try {
            const marketsResponse = await fetch(`/api/kalshi/markets/${encodeURIComponent(event_ticker)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ marketPriceHistory })
            });
            const marketsData = await marketsResponse.json();

            if (marketsResponse.ok) {
                const now = new Date();

                marketsData.markets.forEach(market => {
                    marketData[market.ticker] = market;
                    if (!marketPriceHistory[market.ticker]) {
                        marketPriceHistory[market.ticker] = [];
                    }
                    const lastHistoryPrice = marketPriceHistory[market.ticker].length > 0 ? marketPriceHistory[market.ticker][marketPriceHistory[market.ticker].length - 1].price : -1;
                    if (lastHistoryPrice !== Math.trunc(market.last_price_dollars * 100)) {
                        marketPriceHistory[market.ticker].push({ time: now, price: Math.trunc(market.last_price_dollars * 100) });
                        marketPriceHistory[market.ticker] = marketPriceHistory[market.ticker].slice(-40);
                    }
                });

                let progressContainer = document.getElementById('progress-container');
                if (!progressContainer) {
                    progressContainer = document.createElement('div');
                    progressContainer.id = 'progress-container';
                    progressContainer.innerHTML = '<div id="progress-bar"></div>';
                    marketResult.before(progressContainer);
                }

                let tableHtml = `
                    <table class="market-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Range</th>
                                <th>Price</th>
                                <th>Change</th>
                                <th>Held</th>
                                <th>Earned</th>
                                <th>Chart</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                marketsData.marketRows.forEach((row) => {
                    tableHtml += `
                        <tr>
                            <td>${row.ticker}</td>
                            <td>${row.range}</td>
                            <td>${Math.trunc(row.price)}</td>
                            <td class="${row.priceChangeClass}">${row.priceChangeIcon} ${Math.trunc(row.priceChangeDisplay)}</td>
                            <td>${row.held ? 'Yes' : 'No'}</td>
                            <td>${Math.trunc(row.earned_value)}</td>
                            <td><canvas id="chart-${row.ticker}" width="100" height="30"></canvas></td>
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
                                    pointRadius: 1
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
        const timeString = new Date().toLocaleTimeString();

        const formHtml = `
            <div class="order-form" id="${formId}">
                <div class="order-details">
                    <strong>${action.toUpperCase()} ${ticker}</strong>
                    <span>${contracts} contract @ ${price}¢ - <em>${timeString}</em></span>
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
        clearAllOrdersButton.style.display = 'block';
    };

    orderFormsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-order')) {
            const formId = event.target.dataset.formId;
            const form = document.getElementById(formId);
            if (form) {
                form.remove();
            }
            if (orderFormsContainer.children.length === 0) {
                placeAllOrdersButton.style.display = 'none';
                clearAllOrdersButton.style.display = 'none';
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

    setInterval(fetchAndDisplayMarkets, refreshInterval);
    setInterval(updateProgressBar, 100);
    fetchAndDisplayMarkets();
});