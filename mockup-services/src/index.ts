import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, Resource } from "x402-express";
import { routes } from './routes/index.js';

config();

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}`;

if (!facilitatorUrl || !payTo) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const app = express();

app.use(express.json());

const paymentConfig = {
  "GET /rent/monthly-payment": {
    price: "$1",
    network: "base-sepolia" as const,
  },

  "GET /subscriptions/netflix/monthly-subscription": {
    price: "$1.99",
    network: "base-sepolia" as const,
  },

  "GET /subscriptions/spotify/premium-subscription": {
    price: "$9.99",
    network: "base-sepolia" as const,
  },

  "POST /*/register": {
    price: "$0", // Registration is free
    network: "base-sepolia" as const,
  },
};

// Apply payment middleware
app.use(
  paymentMiddleware(payTo, paymentConfig, {
    url: facilitatorUrl,
  })
);

app.use('/', routes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Recurring Bills Server running on http://localhost:${PORT}`);
});