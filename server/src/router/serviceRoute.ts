import { Router } from "express";
import { ServiceManagementService } from "src/services/serviceManagementService";

const router = Router();
const serviceMngr = new ServiceManagementService();

router.post("/new", async (req, res) => {
	try {
		const providerData = req.body;
		const newService = await serviceMngr.createService(providerData);
		res.status(201).json({
			status: "success",
			data: newService,
		});
	} catch (error) {
		res.status(500).json({
			status: "error",
			error: error.message,
		});
	}
});

//get services by provider id 
router.get("/get/by-provider-id/:provider_id", async (req, res) => {
	try {
		const {provider_id} = req.params
		const services = await serviceMngr.getServicesByProvider(provider_id)
		res.status(201).json({
			status: "success",
			data: services
		})
	} catch (error) {
		res.status(500).json({
			status:"error",
			error: error.message
		})
	}
})

export { router as serviceRoutes };
