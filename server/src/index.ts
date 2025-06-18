import  express from "express";
import { morganMiddleware } from "./middleware/morgan.middleware";
import { logger } from "./logger/winston";
import { ADDRESS, APP_PORT, FACILITATOR_URL } from "./constants";
import { paymentMiddleware, Resource } from "x402-express";
import { rentRoutes } from "./router/rentRoute";
import { subscriptionRoutes } from "./router/subscriptionRoute";

if (!FACILITATOR_URL || !ADDRESS) {
	logger.error("Missing required env variables");
	process.exit(1);
}

const app = express();

app.use(express.json());

app.use(morganMiddleware);

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

app.get("/", (req: express.Request, res: express.Response) => {
	res.status(200).send("Hello World");
});

const payTo = ADDRESS as `0x${string}`;

app.use(
	paymentMiddleware(payTo, paymentConfig, {
		url: FACILITATOR_URL! as Resource,
	})
);

app.use("/rent", rentRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.get("/health", (req, res) => {
	res.json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		services: ["Rent", "Netflix", "Spotify"],
	});
});
app.get("/services", (req, res) => {
	res.json({
		availableServices: {
			rent: ["monthly-payment"],
			netflix: ["monthly-subscription"],
			spotify: ["premium-subscription"],
		},
		allServicesRequirePayment: true,
		paymentPeriod: "30 days",
		acceptedCurrency: "USDC",
	});
});

app.get(/(.*)/, (req: express.Request, res: express.Response) => {
	res.status(500).json({ success: false, msg: "Internal Server Error" });
});

app.listen(APP_PORT, () => {
	logger.info(`Server started at http://localhost:${APP_PORT}`);
});
