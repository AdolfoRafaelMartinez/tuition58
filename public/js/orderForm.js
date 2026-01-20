document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-form');
    const orderResult = document.getElementById('order-result');

    if (orderForm) {
        orderForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const ticker = document.getElementById('ticker').value;
            const side = document.getElementById('side').value;
            const price = document.getElementById('price').value;
            const count = document.getElementById('count').value;

            try {
                const response = await fetch('/api/kalshi/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ticker, side, price: parseInt(price), count: parseInt(count) }),
                });

                const result = await response.json();

                if (response.ok) {
                    orderResult.innerHTML = `<p>Order placed successfully!</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                } else {
                    orderResult.innerHTML = `<p>Error placing order:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                }
            } catch (error) {
                orderResult.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }
});
