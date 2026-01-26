document.addEventListener('DOMContentLoaded', () => {
    // Form 1
    const orderForm1 = document.getElementById('order-form');
    const orderResult1 = document.getElementById('order-result');

    if (orderForm1) {
        orderForm1.addEventListener('submit', async (event) => {
            event.preventDefault();

            const ticker = document.getElementById('ticker').value;
            const action = document.getElementById('action').value;
            const side = document.getElementById('side').value;
            const yes_price = document.getElementById('yes_price').value;
            const count = document.getElementById('count').value;

            try {
                const response = await fetch('/api/kalshi/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticker, action, side, yes_price: parseInt(yes_price), count: parseInt(count) }),
                });
                const result = await response.json();

                if (response.ok) {
                    orderResult1.innerHTML = `<p>Order placed successfully!</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                    orderResult1.classList.add('glow-animation');
                    orderResult1.addEventListener('animationend', () => {
                        orderResult1.classList.remove('glow-animation');
                    }, { once: true });
                } else {
                    orderResult1.innerHTML = `<p>Error placing order:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                }
            } catch (error) {
                orderResult1.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }

    // Form 2
    const orderForm2 = document.getElementById('order-form-2');
    const orderResult2 = document.getElementById('order-result-2');

    if (orderForm2) {
        orderForm2.addEventListener('submit', async (event) => {
            event.preventDefault();

            const ticker = document.getElementById('ticker-2').value;
            const action = document.getElementById('action-2').value;
            const side = document.getElementById('side-2').value;
            const yes_price = document.getElementById('yes_price-2').value;
            const count = document.getElementById('count-2').value;

            try {
                const response = await fetch('/api/kalshi/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticker, action, side, yes_price: parseInt(yes_price), count: parseInt(count) }),
                });
                const result = await response.json();

                if (response.ok) {
                    orderResult2.innerHTML = `<p>Order placed successfully!</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                    orderResult2.classList.add('glow-animation');
                    orderResult2.addEventListener('animationend', () => {
                        orderResult2.classList.remove('glow-animation');
                    }, { once: true });
                } else {
                    orderResult2.innerHTML = `<p>Error placing order:</p><pre>${JSON.stringify(result, null, 2)}</pre>`;
                }
            } catch (error) {
                orderResult2.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }
});