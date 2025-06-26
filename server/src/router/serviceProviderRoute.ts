import { Router } from "express";
import { ServiceProviderService } from "src/services/serviceProviderService";

const router = Router();
const serviceProviderService = new ServiceProviderService();

router.post("/new", async (req, res) => {
	try {
		const providerData = req.body;
		const newProvider = await serviceProviderService.createProvider(providerData);
		res.status(201).json({
			status: "success",
			data: newProvider,
		});
	} catch (error) {
		res.status(500).json({
			status: "error",
			error: error.message,
		});
	}
});

router.get("/get/by-id/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const provider = await serviceProviderService.getProviderById(id);
		res.json({ status: "success", data: provider });
	} catch (error) {
		res.status(500).json({ status: "error", error: error.message });
	}
});

router.get("/get/by-wallet/:wallet_address", async (req, res) => {
	try {
		const { wallet_address } = req.params;
		const provider = await serviceProviderService.findByWalletAddress(wallet_address);
		res.json({ status: "success", data: provider });
	} catch (error) {
		res.status(500).json({ status: "error", error: error.message });
	}
});

router.post("/withdraw", async (req, res) => {
	try {
		const { wallet_address, amount } = req.body;

		const resp = await serviceProviderService.withdrawAmounts(wallet_address);

		res.status(200).json({ status: "success", data: resp });
	} catch (err) {
		res.status(500).json({ status: "error", error: err.message });
	}
});

export { router as serviceProviderRoutes };
