import { Router } from "express";
import { UserService } from "src/services/userService";

const router = Router();
const userService = new UserService();

router.post("/register", async (req, res) => {
	try {
		const userData = req.body;
		const newUser = await userService.createUser(userData);
		res.status(201).json({
			status: "success",
			data: newUser,
		});
	} catch (error) {
		res.status(500).json({
			status: "error",
			error: error.message,
		});
	}
});

router.get("/get/by-telegram/:tg_user_id", async (req, res) => {
	try {
		const { tg_user_id } = req.params;
		const user = await userService.getUserByTelegramId(tg_user_id);

		res.json({
			status: "success",
			data: user,
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
		const user = await userService.getUserById(id);
		if (!user) {
			res.status(404).json({ status: "error", message: "User not found" });
		}
		res.json({ status: "success", data: user });
	} catch (error) {
		res.status(500).json({ status: "error", error: error.message });
	}
});

router.get("/get/by-wallet/:primary_wallet_address", async (req, res) => {
	try {
		const { primary_wallet_address } = req.params;
		const user = await userService.getUserByWalletAddress(primary_wallet_address);
		if (!user) {
			res.status(404).json({ status: "error", message: "User not found" });
		}
		res.json({ status: "success", data: user });
	} catch (error) {
		res.status(500).json({ status: "error", error: error.message });
	}
});

export { router as userRoutes };
