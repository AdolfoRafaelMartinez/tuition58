document.addEventListener('DOMContentLoaded', () => {
    const orderResult = document.getElementById('order-result');
    const positionsResult = document.getElementById('positions-result');
    const placeAllOrdersButton = document.getElementById('place-all-orders');

    let proposedOrders = [];
    let isReviewMode = false;

    async function loadPositions() {
        try {
            const response = await fetch('/api/kalshi/positions');
            const result = await response.json();

            if (response.ok) {
                const positions = [...(result.event_positions || []), ...(result.market_positions || [])];
                const filteredPositions = positions.filter(p => p && p.ticker && String(p.ticker).trim() !== '' && ((p.event_exposure && p.event_exposure > 0) || (p.market_exposure && p.market_exposure > 0)));

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
                    positionsResult.innerHTML = `<p>You have no exposure.</p>`;
                }
            } else {
                positionsResult.innerHTML = `<p>Error loading positions:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
            }
        } catch (error) {
            positionsResult.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }

    function renderProposedOrders() {
        let totalBuyCost = 0;
        let totalSellCollateral = 0;

        proposedOrders.forEach(order => {
            const price = parseInt(order.yes_price, 10);
            const count = parseInt(order.count, 10);
            if (order.action === 'buy') {
                totalBuyCost += price * count;
            } else if (order.action === 'sell') {
                totalSellCollateral += (100 - price) * count;
            }
        });

        if (proposedOrders.length === 0) {
            orderResult.innerHTML = '<p>No orders proposed.</p>';
            return;
        }

        const buyOrders = proposedOrders.filter(o => o.action === 'buy');
        const sellOrders = proposedOrders.filter(o => o.action === 'sell');

        let html = '<div id="order-summary-dialog" style="border: 1px solid #ccc; padding: 1.5rem; border-radius: 8px; text-align: center; background-color: #f9f9f9;">';
        html += '<h3>Order Summary</h3>';
        
        if (buyOrders.length > 0) {
            html += `<p><strong>Total Buy Orders:</strong> ${buyOrders.length}</p><p><strong>Cost:</strong> $${(totalBuyCost / 100).toFixed(2)}</p>`;
        }
        if (sellOrders.length > 0) {
            html += `<p><strong>Total Sell Orders:</strong> ${sellOrders.length}</p><p><strong>Collateral:</strong> $${(totalSellCollateral / 100).toFixed(2)}</p>`;
        }

        html += '<div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center;">';
        html += '<button id="confirm-orders" style="padding: 0.8rem 1.5rem; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;">Confirm</button>';
        html += '<button id="cancel-orders" style="padding: 0.8rem 1.5rem; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;">Cancel</button>';
        html += '</div>';
        html += '</div>';

        orderResult.innerHTML = html;

        // Attach event listeners to buttons
        const confirmBtn = orderResult.querySelector('#confirm-orders');
        const cancelBtn = orderResult.querySelector('#cancel-orders');

        confirmBtn.addEventListener('click', placeOrdersConfirmed);
        cancelBtn.addEventListener('click', cancelOrders);
    }

    function cancelOrders() {
        proposedOrders = [];
        isReviewMode = false;
        placeAllOrdersButton.textContent = 'Place All Orders';
        orderResult.innerHTML = '';
    }

    async function placeOrdersConfirmed() {
        let orderExecutionHTML = '<h3>Order Execution Results</h3>';
        for (const orderData of proposedOrders) {
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

        // Reset
        orderResult.innerHTML = orderExecutionHTML;
        proposedOrders = [];
        isReviewMode = false;
        placeAllOrdersButton.textContent = 'Place All Orders';
        loadPositions();
    }

    function attachOrderEventListeners() {
        // This function is no longer used since we've moved to a dialog pattern
    }

    if (placeAllOrdersButton) {
        placeAllOrdersButton.addEventListener('click', async () => {
            if (!isReviewMode) {
                // Collect orders from forms
                const forms = document.querySelectorAll('.order-form-dynamic');
                proposedOrders = [];

                for (const form of forms) {
                    const countInput = form.querySelector('input[name="count"]');
                    const count = parseInt(countInput.value, 10);

                    if (count > 0) {
                        const formData = new FormData(form);
                        const orderData = Object.fromEntries(formData.entries());
                        orderData.count = count;
                        orderData.yes_price = parseInt(orderData.yes_price, 10);
                        // Ensure ticker is preserved
                        if (!orderData.ticker) {
                            orderData.ticker = form.dataset.ticker;
                        }
                        proposedOrders.push(orderData);
                    }
                }

                if (proposedOrders.length === 0) {
                    orderResult.innerHTML = '<p>No orders with a count greater than 0 were found.</p>';
                    return;
                }

                // Switch to review mode
                isReviewMode = true;
                placeAllOrdersButton.textContent = 'Confirm Place Orders';
                renderProposedOrders();
            } else {
                // Switch to review mode with summary dialog
                isReviewMode = true;
                placeAllOrdersButton.textContent = 'Place All Orders';
                renderProposedOrders();
            }
        });
    }

    loadPositions();
});