import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, Resource } from "x402-express";

config();

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}`;

if (!facilitatorUrl || !payTo) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const app = express();

app.use(express.json());

app.use(
  paymentMiddleware(
    payTo,
    {
      "GET /rent/monthly-payment": {
        price: "$1",
        network: "base-sepolia",
      },

      "GET /netflix/monthly-subscription": {
        price: "$1.99",
        network: "base-sepolia",
      },


      "GET /spotify/premium-subscription": {
        price: "$9.99",
        network: "base-sepolia",
      },
    },
    {
      url: facilitatorUrl,
    }
  )
);


app.get("/rent/monthly-payment", (req, res) => {
  const currentDate = new Date();
  const nextPaymentDate = new Date(currentDate);
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

  res.json({
    service: "Rent Payment",
    amount: "$1000",
    paymentDate: currentDate.toISOString().split('T')[0],
    nextDueDate: nextPaymentDate.toISOString().split('T')[0],
    property: "123 Main St, Apt 4B",
    landlord: "Property Management LLC",
    status: "PAID",
    receipt: `RENT-${Date.now()}`,
    period: "30 days"
  });
});

app.get("/netflix/monthly-subscription", (req, res) => {
  const currentDate = new Date();
  const nextBillingDate = new Date(currentDate);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  res.json({
    service: "Netflix Premium",
    amount: "$15.99",
    paymentDate: currentDate.toISOString().split('T')[0],
    nextBillingDate: nextBillingDate.toISOString().split('T')[0],
    plan: "Premium (4K + 4 Screens)",
    status: "ACTIVE",
    receipt: `NETFLIX-${Date.now()}`,
    period: "30 days",
    features: ["4K Ultra HD", "4 screens", "Downloads", "No ads"]
  });
});

app.get("/netflix/content-access", (req, res) => {
  res.json({
    content: "Premium Netflix content unlocked",
    shows: ["Stranger Things", "The Crown", "Ozark", "Money Heist"],
    movies: ["Red Notice", "Don't Look Up", "The Irishman"],
    accessLevel: "Premium"
  });
});


app.get("/spotify/premium-subscription", (req, res) => {
  const currentDate = new Date();
  const nextBillingDate = new Date(currentDate);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  res.json({
    service: "Spotify Premium",
    amount: "$9.99",
    paymentDate: currentDate.toISOString().split('T')[0],
    nextBillingDate: nextBillingDate.toISOString().split('T')[0],
    plan: "Individual Premium",
    status: "ACTIVE",
    receipt: `SPOTIFY-${Date.now()}`,
    period: "30 days",
    features: ["Ad-free music", "Offline downloads", "High quality audio", "Unlimited skips"]
  });
});

app.get("/spotify/playlist-access", (req, res) => {
  res.json({
    playlists: ["Discover Weekly", "Release Radar", "Daily Mix 1", "Daily Mix 2"],
    podcasts: ["Joe Rogan Experience", "Serial", "This American Life"],
    audioQuality: "Very High (320kbps)"
  });
});





app.post("/rent/register", (req, res) => {
  //  handle the registration logic, e.g., saving to a database
  res.json({
    message: "Rent payment service registered successfully",
    serviceId: `RENT-REG-${Date.now()}`,
    status: "REGISTERED",
    monthlyAmount: "$1000",
    nextPaymentDue: "2025-02-01"
  });
});

app.post("/netflix/register", (req, res) => {
   //  handle the registration logic, e.g., saving to a database
   // payload {
   //   payer: string;
   //   plan: string;
   //   paymentMethod: string;
    //   paymentAmount: string;
    //   paymentDate: string;
    //   nextBillingDate: string;
    //   features?: string[];
   //   receipt?: string;
   //   period?: string;
   //   status?: string;
   //   serviceId?: string;
   // }
  res.json({
    message: "Netflix subscription registered successfully",
    serviceId: `NETFLIX-REG-${Date.now()}`,
    status: "REGISTERED",
    plan: "Premium",
    monthlyAmount: "$15.99",
    nextPaymentDue: "2025-02-01"
  });
});

app.post("/spotify/register", (req, res) => {
  res.json({
    message: "Spotify subscription registered successfully",
    serviceId: `SPOTIFY-REG-${Date.now()}`,
    status: "REGISTERED",
    plan: "Premium Individual",
    monthlyAmount: "$9.99",
    nextPaymentDue: "2025-02-01"
  });
});


app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: [
      "Rent", "Netflix", "Spotify", "Utilities"
    ]
  });
});

app.get("/services", (req, res) => {
  res.json({
    availableServices: {
      rent: ["monthly-payment", "lease-info"],
      netflix: ["monthly-subscription", "content-access"],
      spotify: ["premium-subscription", "playlist-access"],
      utilities: ["electricity", "water", "gas", "internet"],
    },
    allServicesRequirePayment: true,
    paymentPeriod: "30 days",
    acceptedCurrency: "USDC"
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Recurring Bills Server running on http://localhost:${PORT}`);
});