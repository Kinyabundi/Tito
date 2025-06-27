import { Router } from "express";
import { PaymentService } from "src/services/paymentService";

const router = Router();
const paymentService = new PaymentService();

//get payments with subscription id
router.get("/get/by-subscribtion-id/:subscription_id", async (req, res) => {
    try {
        const { subscription_id } = req.params;
        
        const payments = await paymentService.getSubscriptionById(subscription_id)
        
        if (!payments) {
         res.status(404).json({ 
                status: "error", 
                message: "No payments found" 
            });
        }

        res.json({ status: "success", data: payments });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});


export { router as paymentRoutes };
