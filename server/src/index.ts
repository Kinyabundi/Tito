import express from "express";
import { morganMiddleware } from "./middleware/morgan.middleware";
import { CDP_API_KEY, CDP_API_KEY_SECRET } from "./constants";
import { logger } from "./logger/winston";
import { ADDRESS, APP_PORT, FACILITATOR_URL } from "./constants";
import { paymentMiddleware, Resource } from "x402-express";
import DatabaseConnection from "./database/connection";
import { userRoutes } from "./router/userRoute";
import { Coinbase } from "@coinbase/coinbase-sdk";
import { serviceProviderRoutes } from "./router/serviceProviderRoute";
import { serviceRoutes } from "./router/serviceRoute";
import { subscriptionRoutes } from "./router/subscriptionRoute";
import { ServiceManagementService } from "./services/serviceManagementService";
import { SubscriptionManagementService } from "./services/subscriptionManagementService";

Coinbase.configure({ apiKeyName: CDP_API_KEY, privateKey: CDP_API_KEY_SECRET.replace(/\\n/g, "\n") });

if (!FACILITATOR_URL || !ADDRESS) {
	logger.error("Missing required env variables");
	process.exit(1);
}

const app = express();

//enable CORS
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
});

app.use(express.json());

app.use(morganMiddleware);

async function initializeDatabase() {
	try {
		const dbConnection = DatabaseConnection.getInstance();
		await dbConnection.connect();
		logger.info("Database connected successfully");
	} catch (error) {
		logger.error("Failed to connect to the database", error);
		process.exit(1);
	}
}

async function main() {
	await initializeDatabase();

	const serviceManager = new ServiceManagementService();
	const activeServices = await serviceManager.getActiveServices();

	const subscriptionManager = new SubscriptionManagementService();
	const activeOrPendingSubscriptions = await subscriptionManager.getAllActiveOrPendingSubscriptions();

	const paymentConfig: Record<string, { price: string; network: "base-sepolia" }> = {};
	for (const subscription of activeOrPendingSubscriptions) {
		const service = await serviceManager.getServiceById(subscription.service_id.toString());
		if (!service) continue;
		const routeKey = `GET /subscriptions-k/pay/${subscription._id}`;
		paymentConfig[routeKey] = {
			price: `$${service.pricing.amount}`,
			network: "base-sepolia",
		};
	}

	const payTo = ADDRESS as `0x${string}`;

	app.use(
		paymentMiddleware(payTo, paymentConfig, {
			url: FACILITATOR_URL! as Resource,
		})
	);

	app.use("/users", userRoutes);
	app.use("/service-providers", serviceProviderRoutes);
	app.use("/services-k", serviceRoutes);
	app.use("/subscriptions", subscriptionRoutes);
	app.get("/health", (req, res) => {
		res.json({
			status: "healthy",
			timestamp: new Date().toISOString(),
			services: activeServices.map((s) => s.name),
		});
	});
	app.get("/services", (req, res) => {
		res.json({
			availableServices: activeServices.map((s) => s.name),
			allServicesRequirePayment: true,
			paymentPeriod: "30 days",
			acceptedCurrency: "USDC",
		});
	});

	app.get("/subscriptions-k/pay/:subscriptionId", async (req, res) => {
		const subscriptionId = req.params.subscriptionId;
		const subscription = await subscriptionManager.getSubscriptionById(subscriptionId);
		if (!subscription) {
			res.status(404).json({ error: "Subscription not found" });
			return;
		}
		const service = await serviceManager.getServiceById(subscription.service_id.toString());
		if (!service) {
			res.status(404).json({ error: "Service not found" });
			return;
		}
		res.json({
			message: "Payment successful, access granted.",
			service,
			subscription,
		});
	});

	app.get(/(.*)/, (req: express.Request, res: express.Response) => {
		res.status(500).json({ success: false, msg: "Internal Server Error" });
	});

	app.listen(APP_PORT, () => {
		logger.info(`Server started at http://localhost:${APP_PORT}`);
	});
}

main();
