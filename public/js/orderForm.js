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
                const filteredPositions = positions.filter(p => p.event_exposure == 1 || p.market_exposure == 1);
                positionsResult.innerHTML = filteredPositions.length > 0 ? 
                    `<p>Your Positions:</p><pre>${JSON.stringify(filteredPositions, null, 2)}</pre>` : 
                    `<p>You have no positions with exposure.</p>`;
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
            let resultsHTML = '';

            for (const form of forms) {
                const ticker = form.dataset.ticker;
                const countInput = form.querySelector('input[name="count"]');
                const count = parseInt(countInput.value, 10);

                if (count > 0) {
                    const formData = new FormData(form);
                    const orderData = Object.fromEntries(formData.entries());
                    orderData.yes_price = parseInt(orderData.yes_price, 10);
                    orderData.count = count;

                    try {
                        const response = await fetch('/api/kalshi/order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(orderData),
                        });
                        const result = await response.json();
                        resultsHTML += response.ok ? 
                            `<p>Order for ${ticker} placed successfully!</p><pre>${JSON.stringify(result, null, 2)}</pre>` : 
                            `<p>Error for ${ticker}:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                    } catch (error) {
                        resultsHTML += `<p>Error for ${ticker}: ${error.message}</p>`;
                    }
                }
            }
            orderResult.innerHTML = resultsHTML;
            loadPositions(); // Refresh positions after placing orders
        });
    }

    loadPositions();
});