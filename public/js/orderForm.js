document.addEventListener('DOMContentLoaded', () => {
    const orderResult = document.getElementById('order-result');
    const clearAllOrdersButton = document.getElementById('clear-all-orders');
    const orderFormsContainer = document.getElementById('order-forms-container');

    let proposedOrders = [];
    let isReviewMode = false;

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

        let html = '<div id="order-summary-dialog" style="border: 1px solid #ccc; padding: 1.5rem; border-radius: 8px; text-align: left; background-color: #f9f9f9;">';
        html += '<h3 style="text-align: center;">Order Summary</h3>';
        
        if (buyOrders.length > 0) {
            html += `<p><strong style="color: green; font-weight: bold;">Total Buy Orders:</strong> ${buyOrders.length}</p><p><strong>Cost:</strong> $${(totalBuyCost / 100).toFixed(2)}</p>`;
        }
        if (sellOrders.length > 0) {
            html += `<p><strong style="color: red; font-weight: bold;">Total Sell Orders:</strong> ${sellOrders.length}</p><p><strong>Collateral:</strong> $${(totalSellCollateral / 100).toFixed(2)}</p>`;
        }

        html += '<h4>Proposed Orders:</h4><ul>';
        proposedOrders.forEach(order => {
            const actionText = order.action.toUpperCase();
            const actionStyle = order.action === 'buy' ? 'color: green; font-weight: bold;' : 'color: red; font-weight: bold;';
            const timeString = new Date(order.proposedTime).toLocaleString();
            html += `<li><span style="${actionStyle}">${actionText}</span> ${order.count} contracts of ${order.ticker} at ${order.yes_price}c - <em>Proposed at ${timeString}</em></li>`;
        });
        html += '</ul>';


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
                const actionText = orderData.action.toUpperCase();
                const actionStyle = orderData.action === 'buy' ? 'color: green; font-weight: bold;' : 'color: red; font-weight: bold;';
                
                if (response.ok) {
                    orderExecutionHTML += `<p><span style="${actionStyle}">${actionText}</span> order for ${orderData.ticker} placed successfully!</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                } else {
                    orderExecutionHTML += `<p>Error placing <span style="${actionStyle}">${actionText}</span> order for ${orderData.ticker}:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                }

            } catch (error) {
                orderExecutionHTML += `<p>Error for ${orderData.ticker}: ${error.message}</p>`;
            }
        }

        // Reset
        orderResult.innerHTML = orderExecutionHTML;
        proposedOrders = [];
        isReviewMode = false;
        clearAllOrdersButton.style.display = 'none';
        orderFormsContainer.innerHTML = '';
    }

    function attachOrderEventListeners() {
        // This function is no longer used since we've moved to a dialog pattern
    }

    if (clearAllOrdersButton) {
        clearAllOrdersButton.addEventListener('click', () => {
            orderFormsContainer.innerHTML = '';
            proposedOrders = [];
            isReviewMode = false;
            clearAllOrdersButton.style.display = 'none';
            orderResult.innerHTML = '';
        });
    }
});
