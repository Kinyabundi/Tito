import { Router } from "express";
import { ServiceProviderService } from "src/services/serviceProviderService";
import { WithdrawalRepository } from "../repositories/withdrawal.repository";
import { PaymentTransactionRepository } from "../repositories/payment-transaction.repository";

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
		if (!wallet_address || typeof amount !== 'number' || amount <= 0) {
			res.status(400).json({ status: "error", error: "wallet_address and positive amount are required" });
			return
		}
		const txHash = await serviceProviderService.withdrawAmounts(wallet_address, amount);
		if (txHash) {
			res.status(200).json({ status: "success", transaction_hash: txHash });
		} else {
			 res.status(500).json({ status: "error", error: "Withdrawal failed or was not confirmed." });
		}
	} catch (err) {
		res.status(500).json({ status: "error", error: err.message });
	}
});

router.get("/max-payout/:providerId", async (req, res) => {
	try {
		const { providerId } = req.params;
		const paymentTxRepo = new PaymentTransactionRepository();
		// Find all completed, withdrawn payment transactions for this provider
		const txs = await paymentTxRepo.findCompletedUnwithdrawnByProviderId(providerId);
		const withdrawnTxs = txs.filter(tx => tx.withdrawal_id !== null);
		const total = withdrawnTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
		res.json({ status: "success", total_payout: total, transactions: withdrawnTxs });
	} catch (err) {
		res.status(500).json({ status: "error", error: err.message });
	}
});

router.get("/withdrawals/:providerId", async (req, res) => {
	try {
		const { providerId } = req.params;
		const withdrawalRepo = new WithdrawalRepository();
		const withdrawals = await withdrawalRepo.findByProviderId(providerId);
		res.json({ status: "success", withdrawals });
	} catch (err) {
		res.status(500).json({ status: "error", error: err.message });
	}
});

export { router as serviceProviderRoutes };
