import { Router } from "express";
import { ServiceProviderService } from "src/services/serviceProviderService";

const router = Router();
const serviceProviderService = new ServiceProviderService();

router.post("/newService", async (req, res) => {
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

export { router as serviceProviderRoutes };
