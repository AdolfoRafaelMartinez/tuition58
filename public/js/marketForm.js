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

                const positionsWithExposure = positions.filter(p => p.ticker && ((p.market_exposure && p.market_exposure !== 0) || (p.event_exposure && p.event_exposure !== 0)));

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
            const marketsResponse = await fetch(`/api/kalshi/markets/${event_ticker}`);
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
                        if (exposure > 0) {
                            existingPositions.add(p.ticker);
                        }
                    });
                }

                let highestBidMarket = null;
                if (marketsData.markets && marketsData.markets.length > 0) {
                    highestBidMarket = marketsData.markets.reduce((max, market) => max.yes_bid > market.yes_bid ? max : market, marketsData.markets[0]);
                }

                let favoriteMarketContracts = 0;

                if (highestBidMarket) {
                    const position = allPositions.find(p => p.ticker === highestBidMarket.ticker);
                    favoriteMarketContracts = position ? parseInt(position.position) : 0;

                    let highestBidSection = document.getElementById('highest-bid-section');
                    if (!highestBidSection) {
                        highestBidSection = document.createElement('div');
                        highestBidSection.id = 'highest-bid-section';
                        highestBidSection.className = 'section';
                        container.appendChild(highestBidSection);
                    }

                    highestBidSection.innerHTML = `
                        <h2>Favorite Market</h2>
                        <p>Market with the highest 'Yes' bid:</p>
                        <table class="market-table">
                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th>Yes Bid</th>
                                    <th>Contracts</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${highestBidMarket.ticker}</td>
                                    <td>${highestBidMarket.yes_bid}</td>
                                    <td>${favoriteMarketContracts}</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                }

                let tuitionMoneySection = document.getElementById('tuition-money-section');
                if (!tuitionMoneySection) {
                    tuitionMoneySection = document.createElement('div');
                    tuitionMoneySection.id = 'tuition-money-section';
                    tuitionMoneySection.className = 'section';
                    container.appendChild(tuitionMoneySection);
                }
                
                // if (favoriteMarketContracts > 0) {
                //     const tuition = (favoriteMarketContracts * 100) - totalDisplayedExposure;
                //     const gain = favoriteMarketContracts / totalDisplayedExposure;
                //     tuitionMoneySection.innerHTML = `
                //         <h2>Tuition Money</h2>
                //         <p>This is the calculated cost of your market positions, representing the money you\'ve paid that you won\'t get back.</p>
                //         <table class="market-table">
                //             <thead>
                //                 <tr>
                //                     <th>Favorite Market Contracts</th>
                //                     <th>Total Exposure</th>
                //                     <th>Tuition</th>
                //                     <th>Gain</th>
                //                 </tr>
                //             </thead>
                //             <tbody>
                //                 <tr>
                //                     <td>${favoriteMarketContracts}</td>
                //                     <td>$${totalDisplayedExposure.toFixed(2)}</td>
                //                     <td>$${tuition.toFixed(2)}</td>
                //                     <td>${favoriteMarketContracts*100-totalDisplayedExposure}</td>
                //                 </tr>
                //             </tbody>
                //         </table>
                //         <p class="citation">Gain calculated as: Favorite Market Contracts / Total Exposure</p>
                //         <p class="citation">Tuition calculated as: (Favorite Market Contracts * 100) - Total Exposure</p>
                //     `;
                // } else {
                //     tuitionMoneySection.innerHTML = `<h2>Tuition Money</h2>`;
                // }

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
                        let in_range;
                        in_range = forecast_temp == lower || forecast_temp == upper;
                        if (in_range) {
                            recommendation = "BUY";
                        }
                        in_range = forecast_temp - 1 == lower || forecast_temp - 1 == upper;
                        if (in_range) {
                            recommendation = "BUY";
                        }
                        in_range = forecast_temp + 1 == lower || forecast_temp + 1 == upper;
                        if (in_range) {
                            recommendation = "BUY";
                        }
                    }

                    let displayRecommendation = recommendation;

                    tableHtml += `<tr><td>${market.ticker}</td><td>${market.lower === undefined ? 'N/A' : market.lower} to ${market.upper === undefined ? 'N/A' : market.upper}</td><td>${market.yes_ask}</td><td>${market.yes_bid}</td><td>${market.status}</td><td class="recommendation-cell"><span class="recommendation ${displayRecommendation.toLowerCase()}-recommendation">${displayRecommendation}</span></td></tr>`;

                    const hasPosition = existingPositions.has(market.ticker);
                    if ((displayRecommendation === 'BUY' && !hasPosition) || (displayRecommendation === 'SELL' && hasPosition)) {
                        ordersToCreate.push({ market, recommendation: displayRecommendation });
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
                        
                        let costPerContract = action === 'buy' ? price : 100 - price;

                        let count = 0;
                        if (costPerContract > 0) {
                            count = Math.floor(allocationPerOrder / costPerContract);
                        }
                        count = Math.max(0, count);

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