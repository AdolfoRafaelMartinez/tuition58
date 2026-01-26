document.addEventListener('DOMContentLoaded', () => {
    const setupOrderForm = (formId, resultId, tickerId, actionId, sideId, priceId, countId) => {
        const orderForm = document.getElementById(formId);
        const orderResult = document.getElementById(resultId);

        if (orderForm) {
            orderForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const ticker = document.getElementById(tickerId).value;
                const action = document.getElementById(actionId).value;
                const side = document.getElementById(sideId).value;
                const yes_price = document.getElementById(priceId).value;
                const count = document.getElementById(countId).value;

                try {
                    const response = await fetch('/api/kalshi/order', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ ticker, action, side, yes_price: parseInt(yes_price), count: parseInt(count) }),
                    });

                    const result = await response.json();

                    if (response.ok) {
                        orderResult.innerHTML = `<p>Order placed successfully!</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                        orderResult.classList.add('glow-animation');
                        orderResult.addEventListener('animationend', () => {
                            orderResult.classList.remove('glow-animation');
                        }, { once: true });
                    } else {
                        orderResult.innerHTML = `<p>Error placing order:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                    }
                } catch (error) {
                    orderResult.innerHTML = `<p>Error: ${error.message}</p>`;
                }
            });
        }
    };

    setupOrderForm('order-form', 'order-result', 'ticker', 'action', 'side', 'yes_price', 'count');
    setupOrderForm('order-form-2', 'order-result-2', 'ticker-2', 'action-2', 'side-2', 'yes_price-2', 'count-2');
});
