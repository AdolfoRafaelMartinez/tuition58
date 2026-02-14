document.addEventListener('DOMContentLoaded', () => {
    const combinedOrderForm = document.getElementById('combined-order-form');
    const orderResult1 = document.getElementById('order-result');
    const orderResult2 = document.getElementById('order-result-2');
    const positionsResult = document.getElementById('positions-result');

    async function loadPositions() {
        try {
            const response = await fetch('/api/kalshi/positions');
            const result = await response.json();

            if (response.ok) {
                if (result && (Array.isArray(result.event_positions) || Array.isArray(result.market_positions))) {
                    const event_positions = result.event_positions || [];
                    const market_positions = result.market_positions || [];
                    const positions = [...event_positions, ...market_positions];

                    const filteredPositions = positions.filter(
                        p => p.event_exposure !== 0 || p.market_exposure !== 0
                    );

                    if (filteredPositions.length > 0) {
                        positionsResult.innerHTML = `<p>Your Positions:</p><pre>${JSON.stringify(filteredPositions, null, 2)}</pre>`;
                    } else {
                        positionsResult.innerHTML = `<p>You have no positions with non-zero exposure.</p>`;
                    }
                } else {
                    positionsResult.innerHTML = `<p>Could not find 'event_positions' or 'market_positions' array in the response.</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                }
            } else {
                positionsResult.innerHTML = `<p>Error loading positions:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
            }
        } catch (error) {
            positionsResult.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    }

    if (combinedOrderForm) {
        combinedOrderForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Order 1
            const ticker1 = document.getElementById('ticker').value;
            const action1 = document.getElementById('action').value;
            const side1 = document.getElementById('side').value;
            const yes_price1 = document.getElementById('yes_price').value;
            const count1 = document.getElementById('count').value;

            if (ticker1) {
                try {
                    const response = await fetch('/api/kalshi/order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ticker: ticker1, action: action1, side: side1, yes_price: parseInt(yes_price1), count: parseInt(count1) }),
                    });
                    const result = await response.json();

                    if (response.ok) {
                        orderResult1.innerHTML = `<p>Order 1 placed successfully!</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                        orderResult1.classList.add('glow-animation');
                        orderResult1.addEventListener('animationend', () => {
                            orderResult1.classList.remove('glow-animation');
                        }, { once: true });
                    } else {
                        orderResult1.innerHTML = `<p>Error placing order 1:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                    }
                } catch (error) {
                    orderResult1.innerHTML = `<p>Error: ${error.message}</p>`;
                }
            }

            // Order 2
            const ticker2 = document.getElementById('ticker-2').value;
            const action2 = document.getElementById('action-2').value;
            const side2 = document.getElementById('side-2').value;
            const yes_price2 = document.getElementById('yes_price-2').value;
            const count2 = document.getElementById('count-2').value;

            if (ticker2) {
                try {
                    const response = await fetch('/api/kalshi/order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ticker: ticker2, action: action2, side: side2, yes_price: parseInt(yes_price2), count: parseInt(count2) }),
                    });
                    const result = await response.json();

                    if (response.ok) {
                        orderResult2.innerHTML = `<p>Order 2 placed successfully!</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                        orderResult2.classList.add('glow-animation');
                        orderResult2.addEventListener('animationend', () => {
                            orderResult2.classList.remove('glow-animation');
                        }, { once: true });
                    } else {
                        orderResult2.innerHTML = `<p>Error placing order 2:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                    }
                } catch (error) {
                    orderResult2.innerHTML = `<p>Error: ${error.message}</p>`;
                }
            }
        });
    }

    loadPositions();
});