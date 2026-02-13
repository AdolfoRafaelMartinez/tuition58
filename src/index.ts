import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { get_forecast } from "./services/forecast.js";
import { get_observed } from "./services/observed.js";
import { getKalshiBalance, placeKalshiOrder, getKalshiMarkets } from "./services/kalshi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT) || process.argv[3] || 8080;

app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

app.set('view engine', 'ejs');
app.use(express.json());

app.get('/', async (req, res) => {
  const forecast = await get_forecast();
  const observed = await get_observed();
  const kalshi = await getKalshiBalance();
  res.render('index', { weather: forecast.data, observed: observed, kalshi: kalshi.data });
});

app.get('/api/forecast', async (req, res) => {
    const forecast = await get_forecast();
    if (forecast.error) {
        res.status(500).json({ error: forecast.error });
    } else {
        res.json(forecast.data);
    }
});

app.get('/api/observed', async (req, res) => {
    const cliWeather = await get_observed();
    if (cliWeather.error) {
        res.status(500).json({ error: cliWeather.error });
    } else {
        res.json(cliWeather);
    }
});

app.post('/api/kalshi/order', async (req, res) => {
    const orderParams = req.body;
    const result = await placeKalshiOrder(orderParams);
    if (result.error) {
        res.status(500).json({ error: result.error });
    } else {
        res.json(result.data);
    }
});

app.get('/api/kalshi/markets/:event_ticker', async (req, res) => {
    const event_ticker = req.params.event_ticker;
    const marketResult = await getKalshiMarkets(event_ticker);
    const forecastResult = await get_forecast();

    if (marketResult.error) {
        return res.status(500).json({ error: marketResult.error });
    }

    // If forecast fails, we can still return market data without recommendations
    if (forecastResult.error || !forecastResult.data) {
        return res.json(marketResult.data);
    }

    // The forecast temperature is already a number
    const forecast_temp = forecastResult.data.temperature;

    // Combine the market data with the forecast temperature
    const responseData = {
        ...marketResult.data,
        forecast_temp: forecast_temp
    };

    res.json(responseData);
});

app.get('/api', (req, res) => {
  res.json({"msg": "Hello world"});
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
