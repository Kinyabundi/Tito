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
import { exact } from "x402/schemes";
import { useFacilitator } from "x402/verify";
import { processPriceToAtomicAmount } from "x402/shared";
import { Price, Network, PaymentRequirements, PaymentPayload, settleResponseHeader } from "x402/types";
import { SubscriptionManagementService } from "./services/subscriptionManagementService";

Coinbase.configure({ apiKeyName: CDP_API_KEY, privateKey: CDP_API_KEY_SECRET.replace(/\\n/g, "\n") });

if (!FACILITATOR_URL || !ADDRESS) {
	logger.error("Missing required env variables");
	process.exit(1);
}

const app = express();

app.use(express.json());

app.use(morganMiddleware);

const { verify, settle } = useFacilitator({ url: FACILITATOR_URL! as Resource });
const x402Version = 1;

function createExactPaymentRequirements(price: Price, network: Network, resource: Resource, description = ""): PaymentRequirements {
	const atomicAmountForAsset = processPriceToAtomicAmount(price, network);
	if ("error" in atomicAmountForAsset) {
		throw new Error(atomicAmountForAsset.error);
	}
	const { maxAmountRequired, asset } = atomicAmountForAsset;

	return {
		scheme: "exact",
		network,
		maxAmountRequired,
		resource,
		description,
		mimeType: "",
		payTo: ADDRESS as `0x${string}`,
		maxTimeoutSeconds: 60,
		asset: asset.address,
		outputSchema: undefined,
		extra: {
			name: asset.eip712.name,
			version: asset.eip712.version,
		},
	};
}

async function verifyPayment(req: express.Request, res: express.Response, paymentRequirements: PaymentRequirements[]): Promise<boolean> {
	const payment = req.header("X-PAYMENT");
	if (!payment) {
		res.status(402).json({
			x402Version,
			error: "X-PAYMENT header is required",
			accepts: paymentRequirements,
		});
		return false;
	}

	let decodedPayment: PaymentPayload;
	try {
		decodedPayment = exact.evm.decodePayment(payment);
		decodedPayment.x402Version = x402Version;
	} catch (error) {
		res.status(402).json({
			x402Version,
			error: error || "Invalid or malformed payment header",
			accepts: paymentRequirements,
		});
		return false;
	}

	try {
		const response = await verify(decodedPayment, paymentRequirements[0]);
		if (!response.isValid) {
			res.status(402).json({
				x402Version,
				error: response.invalidReason,
				accepts: paymentRequirements,
				payer: response.payer,
			});
			return false;
		}
	} catch (error) {
		res.status(402).json({
			x402Version,
			error,
			accepts: paymentRequirements,
		});
		return false;
	}

	return true;
}

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
		const subscriptionManager = new SubscriptionManagementService();
		const serviceManager = new ServiceManagementService();

		// 1. Get the subscription
		const subscription = await subscriptionManager.getSubscriptionById(subscriptionId);
		if (!subscription) {
			res.status(404).json({ error: "Subscription not found" });
		}

		// 2. Get the associated service
		const service = await serviceManager.getServiceById(subscription.service_id.toString());
		if (!service) {
			res.status(404).json({ error: "Service not found" });
		}

		// 3. Build payment requirements
		const resource = `${req.protocol}://${req.headers.host}${req.originalUrl}` as Resource;
		const paymentRequirements = [createExactPaymentRequirements(`$${service.pricing.amount}`, "base-sepolia", resource, service.description)];

		// 4. Verify payment
		const isValid = await verifyPayment(req, res, paymentRequirements);
		if (!isValid) return;

		try {
			// Process payment synchronously
			const settleResponse = await settle(exact.evm.decodePayment(req.header("X-PAYMENT")!), paymentRequirements[0]);
			const responseHeader = settleResponseHeader(settleResponse);
			res.setHeader("X-PAYMENT-RESPONSE", responseHeader);

			console.log("Payment settled:", responseHeader);

			// Return the service data (or whatever you want)
			res.json({
				message: "Payment successful, access granted.",
				service,
				subscription,
			});
		} catch (error) {
			res.status(402).json({
				x402Version,
				error,
				accepts: paymentRequirements,
			});
		}
	});

	app.get(/(.*)/, (req: express.Request, res: express.Response) => {
		res.status(500).json({ success: false, msg: "Internal Server Error" });
	});

	app.listen(APP_PORT, () => {
		logger.info(`Server started at http://localhost:${APP_PORT}`);
	});
}

main();
