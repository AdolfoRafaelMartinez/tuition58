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

        let html = '<h3>Proposed Orders</h3>';
        if (proposedOrders.length === 0) {
            html += '<p>No orders proposed.</p>';
        } else {
            const buyOrders = proposedOrders.filter(o => o.action === 'buy');
            const sellOrders = proposedOrders.filter(o => o.action === 'sell');

            if (buyOrders.length > 0) {
                html += `<p>Total Buy Orders: ${buyOrders.length}, Cost: $${(totalBuyCost / 100).toFixed(2)}</p>`;
            }
            if (sellOrders.length > 0) {
                html += `<p>Total Sell Orders: ${sellOrders.length}, Collateral: $${(totalSellCollateral / 100).toFixed(2)}</p>`;
            }

            html += '<ul id="proposed-orders-list">';
            proposedOrders.forEach((order, index) => {
                html += `
                    <li data-index="${index}" style="position: relative; padding-right: 30px;">
                        <div class="order-content">
                            <select class="order-action" data-index="${index}">
                                <option value="buy" ${order.action === 'buy' ? 'selected' : ''}>Buy</option>
                                <option value="sell" ${order.action === 'sell' ? 'selected' : ''}>Sell</option>
                            </select>
                            <input type="number" class="order-count" data-index="${index}" value="${order.count}" min="1">
                            contracts of ${order.ticker} at
                            <input type="number" class="order-price" data-index="${index}" value="${order.yes_price}" min="1" max="99">¢
                            <select class="order-side" data-index="${index}">
                                <option value="yes" ${order.side === 'yes' ? 'selected' : ''}>Yes</option>
                                <option value="no" ${order.side === 'no' ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                        <button class="delete-order" data-index="${index}" title="Delete Order" style="position: absolute; top: 0; right: 0;">🗑️</button>
                    </li>
                `;
            });
            html += '</ul>';
        }
        orderResult.innerHTML = html;

        // Attach event listeners
        attachOrderEventListeners();
    }

    function attachOrderEventListeners() {
        // Delete buttons
        const deleteButtons = orderResult.querySelectorAll('.delete-order');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                proposedOrders.splice(index, 1);
                renderProposedOrders();
            });
        });

        // Action changes
        const actionSelects = orderResult.querySelectorAll('.order-action');
        actionSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                proposedOrders[index].action = e.target.value;
                renderProposedOrders();
            });
        });

        // Side changes
        const sideSelects = orderResult.querySelectorAll('.order-side');
        sideSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                proposedOrders[index].side = e.target.value;
                renderProposedOrders();
            });
        });

        // Count changes
        const countInputs = orderResult.querySelectorAll('.order-count');
        countInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                proposedOrders[index].count = parseInt(e.target.value, 10) || 0;
                renderProposedOrders();
            });
        });

        // Price changes
        const priceInputs = orderResult.querySelectorAll('.order-price');
        priceInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                proposedOrders[index].yes_price = parseInt(e.target.value, 10) || 0;
                renderProposedOrders();
            });
        });
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
                // Place the orders
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
                orderResult.innerHTML += orderExecutionHTML;
                proposedOrders = [];
                isReviewMode = false;
                placeAllOrdersButton.textContent = 'Place All Orders';
                loadPositions();
            }
        });
    }

    loadPositions();
});