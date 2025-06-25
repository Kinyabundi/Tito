import { Router } from "express";
import { SubscriptionManagementService } from "src/services/subscriptionManagementService";

const router = Router();
const subscriptionManagementService = new SubscriptionManagementService();

router.post("/new", async (req, res) => {
    try {
        const subscription_data = req.body;
        const newSubscription = await subscriptionManagementService.createSubscription(subscription_data);
        res.status(201).json({
            status: "success",
            data: newSubscription,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            error: error.message,
        });
    }
});


export { router as subscriptionRoutes };
