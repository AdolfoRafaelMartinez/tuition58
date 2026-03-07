
import fs from 'fs';
import path from 'path';
import { jest, describe, beforeEach, test, expect } from '@jest/globals';

describe('Order Form', () => {
  let orderFormsContainer, placeAllOrdersButton, clearAllOrdersButton, orderResult;

  // This function loads the application script and executes it in the global scope
  const initializeScript = () => {
    const jsContent = fs.readFileSync(path.resolve(__dirname, '../../public/js/orderForm.js'), 'utf8');
    // The script is wrapped in a DOMContentLoaded listener, so we need to simulate that event.
    // We add the script to the body and then dispatch the event.
    const script = document.createElement('script');
    script.textContent = jsContent;
    document.body.appendChild(script);
    // Dispatch the event to trigger the script's execution
    document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
  };

  beforeEach(() => {
    // Reset the document body and load the base HTML
    document.body.innerHTML = fs.readFileSync(path.resolve(__dirname, '../../views/index.ejs'), 'utf8');

    // Initialize elements that are part of the main EJS file
    orderFormsContainer = document.getElementById('order-forms-container');

    // Mock the fetch function to avoid actual network calls
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ event_positions: [], market_positions: [] }),
      } as Response)
    );
  });

  test('should display "Clear All Orders" button when an order is recommended', () => {
    // 1. Create the mock order form and add it to the container
    orderFormsContainer.innerHTML = `
      <div class="order-form">
        <input type="hidden" name="ticker" value="TEST-TICKER">
        <input type="hidden" name="action" value="buy">
        <input type="hidden" name="side" value="yes">
        <input type="number" name="contracts" value="5">
        <input type="number" name="price" value="50">
      </div>
    `;

    // 2. Load and execute the application script to attach its event listeners
    initializeScript();

    // 3. The script re-acquires elements, so we must get them fresh
    const placeButton = document.getElementById('place-all-orders');
    const clearButton = document.getElementById('clear-all-orders');

    // 4. Simulate the user clicking the button
    placeButton.click();

    // 5. Assert that the clear button is now visible, as the script's logic dictates
    expect(clearButton.style.display).toBe('block');
  });
});
