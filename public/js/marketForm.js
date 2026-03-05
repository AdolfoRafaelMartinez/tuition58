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
    let oldMarketData = {};
    let marketPriceHistory = {};
    let charts = {};

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

        oldMarketData = { ...marketData };
        marketData = {};

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
                    marketPriceHistory[market.ticker].push({ time: now, price: market.last_price });
                    if (marketPriceHistory[market.ticker].length > 20) {
                        marketPriceHistory[market.ticker].shift();
                    }
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

                let timerDisplay = document.getElementById('timer-display');
                if (!timerDisplay) {
                    timerDisplay = document.createElement('div');
                    timerDisplay.id = 'timer-display';
                    marketResult.before(timerDisplay);
                }
                timerDisplay.textContent = `Last execution: ${now.toLocaleTimeString()}`;

                let tableHtml = `
                    <table class="market-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Range</th>
                                <th>Price</th>
                                <th>Chart</th>
                                <th>Held</th>
                                <th>Recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                marketsData.markets.forEach(market => {
                    const contractsHeld = allPositions.find(p => p.ticker === market.ticker)?.position || 0;
                    const recommendation = 'SELL'; // Simplified
                    const recBtnHtml = `<button class="rec-propose recommendation sell-recommendation" data-ticker="${market.ticker}" data-action="sell" data-price="${market.yes_ask}" type="button">SELL</button>`;

                    tableHtml += `
                        <tr>
                            <td>${market.ticker}</td>
                            <td>${market.lower === undefined ? 'N/A' : market.lower} to ${market.upper === undefined ? 'N/A' : market.upper}</td>
                            <td>${market.last_price}</td>
                            <td><canvas id="chart-${market.ticker}" width="100" height="30"></canvas></td>
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
                    charts[market.ticker] = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: marketPriceHistory[market.ticker].map(p => p.time.toLocaleTimeString()),
                            datasets: [{
                                label: 'Price',
                                data: marketPriceHistory[market.ticker].map(p => p.price),
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1,
                                fill: false,
                                tension: 0.1
                            }]
                        },
                        options: {
                            scales: {
                                x: { display: false },
                                y: { display: false }
                            },
                            plugins: { legend: { display: false } }
                        }
                    });
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

    window.fetchAndDisplayMarkets = fetchAndDisplayMarkets;

    if (marketForm) {
        marketForm.addEventListener('submit', (event) => {
            event.preventDefault();
            fetchAndDisplayMarkets();
        });
    }

    fetchAndDisplayPositions();
    setInterval(fetchAndDisplayMarkets, 60000);
    fetchAndDisplayMarkets();
});