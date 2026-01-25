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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public/')));
app.use(express.json());

app.get('/', async (req, res) => {
  const weather = await get_forecast();
  const cliWeather = await get_observed();
  const kalshi = await getKalshiBalance();
  res.render('index', { weather: weather.data, cliWeather: cliWeather, kalshi: kalshi.data });
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
    const result = await getKalshiMarkets(event_ticker);
    if (result.error) {
        res.status(500).json({ error: result.error });
    } else {
        res.json(result.data);
    }
});

app.get('/api', (req, res) => {
  res.json({"msg": "Hello world"});
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
