document.addEventListener('DOMContentLoaded', () => {
    const orderResult = document.getElementById('order-result');
    const positionsResult = document.getElementById('positions-result');
    const placeAllOrdersButton = document.getElementById('place-all-orders');

    async function loadPositions() {
        try {
            const response = await fetch('/api/kalshi/positions');
            const result = await response.json();

            if (response.ok) {
                const positions = [...(result.event_positions || []), ...(result.market_positions || [])];
                const filteredPositions = positions.filter(p => p.event_exposure > 0 || p.market_exposure > 0);

                if (filteredPositions.length > 0) {
                    let tableHtml = `
                        <p>Your Positions:</p>
                        <table class="market-table">
                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th>Exposure</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    filteredPositions.forEach(p => {
                        const exposure = p.market_exposure || p.event_exposure || 0;
                        tableHtml += `
                            <tr>
                                <td>${p.ticker}</td>
                                <td>${exposure}</td>
                            </tr>
                        `;
                    });
                    tableHtml += '</tbody></table>';
                    positionsResult.innerHTML = tableHtml;
                } else {
                    positionsResult.innerHTML = `<p>You have no positions with non-zero exposure.</p>`;
                }
            } else {
                positionsResult.innerHTML = `<p>Error loading positions:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
            }
        } catch (error) {
            positionsResult.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }

    if (placeAllOrdersButton) {
        placeAllOrdersButton.addEventListener('click', async () => {
            const forms = document.querySelectorAll('.order-form-dynamic');
            let totalBuyCost = 0;
            let totalSellCollateral = 0;
            const ordersToPlace = [];

            // Prepare orders and calculate totals
            for (const form of forms) {
                const countInput = form.querySelector('input[name="count"]');
                const count = parseInt(countInput.value, 10);

                if (count > 0) {
                    const formData = new FormData(form);
                    const orderData = Object.fromEntries(formData.entries());
                    const price = parseInt(orderData.yes_price, 10);
                    orderData.count = count;
                    orderData.yes_price = price;

                    if (orderData.action === 'buy') {
                        totalBuyCost += price * count;
                    } else if (orderData.action === 'sell') {
                        totalSellCollateral += (100 - price) * count;
                    }
                    ordersToPlace.push(orderData);
                }
            }

            // Build and display the summary
            let resultsHTML = '<h3>Order Summary</h3>';
            const buyOrders = ordersToPlace.filter(o => o.action === 'buy');
            const sellOrders = ordersToPlace.filter(o => o.action === 'sell');

            if (buyOrders.length > 0) {
                resultsHTML += `<p>Total Buy Orders: ${buyOrders.length}, Cost: $${(totalBuyCost / 100).toFixed(2)}</p>`;
            }
            if (sellOrders.length > 0) {
                resultsHTML += `<p>Total Sell Orders: ${sellOrders.length}, Collateral: $${(totalSellCollateral / 100).toFixed(2)}</p>`;
            }
            if (ordersToPlace.length === 0) {
                resultsHTML += '<p>No orders with a count greater than 0 were found.</p>';
            }
            resultsHTML += '<hr>';
            orderResult.innerHTML = resultsHTML; // Display summary immediately

            // Execute the orders
            let orderExecutionHTML = '';
            for (const orderData of ordersToPlace) {
                try {
                    const response = await fetch('/api/kalshi/order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderData),
                    });
                    const result = await response.json();
                    orderExecutionHTML += response.ok ?
                        `<p>Order for ${orderData.ticker} placed successfully!</p><pre>${JSON.stringify(result, null, 2)}</pre>` :
                        `<p>Error for ${orderData.ticker}:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                } catch (error) {
                    orderExecutionHTML += `<p>Error for ${orderData.ticker}: ${error.message}</p>`;
                }
            }
            
            // Append execution results and refresh positions
            orderResult.innerHTML += orderExecutionHTML;
            loadPositions(); 
        });
    }

    loadPositions();
});