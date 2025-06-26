"use client";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Bot, DollarSign, Settings, X, Building } from "lucide-react";
import Link from "next/link";
import { TbRobot, TbBox, TbCreditCard, TbChartLine } from "react-icons/tb";
import { RxArrowTopRight } from "react-icons/rx";
import { ReactNode } from "react";
import ConnectWalletBtn from "@/components/btn/connect-wallet";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/store/useAuthStore";

interface HomeLinkProps {
	isActive?: boolean;
	text: string;
	href?: string;
}

interface FeatureCardProps {
	title: string;
	description: string;
	icon: ReactNode;
}

interface StepItemProps {
	title: string;
	description: string;
}

interface ServiceCardProps {
	name: string;
	price: string;
	subscribers: string;
}

const LandingPage = () => {
	const { address, isConnected } = useAccount();
	const [showSignupForm, setShowSignupForm] = useState(false);
	const [providerExists, setProviderExists] = useState<boolean | null>(null);
	const [checkingProvider, setCheckingProvider] = useState(false);
	const [formData, setFormData] = useState({
		companyName: "",
		walletAddress: "",
	});
	const { account, setAccount } = useAuthStore();

	const router = useRouter();

	// Check if provider exists when wallet connects
	useEffect(() => {
		const checkProviderExists = async () => {
			if (!address || !isConnected) {
				setProviderExists(null);
				return;
			}

			try {
				setCheckingProvider(true);
				const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/service-providers/get/by-wallet/${address}`);

				if (response.data.status === "success" && response.data.data) {
					setProviderExists(true);
					setAccount(response.data.data); // Set the account in the store
				} else {
					setProviderExists(false);
				}
			} catch (error) {
				console.error("Error checking provider:", error);
				setProviderExists(false);
			} finally {
				setCheckingProvider(false);
			}
		};

		checkProviderExists();
	}, [address, isConnected]);

	const handleGetStarted = () => {
		if (!isConnected) {
			toast.error("Please connect your wallet first.");
			return;
		}
		setShowSignupForm(true);
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isConnected || !address) {
			toast.error("Please connect your wallet first.");
			return;
		}

		try {
			const providerData = {
				companyName: formData.companyName,
				wallet_address: address
			};

			const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/service-providers/new`, providerData);

			if (response.data.status === "success") {
				toast.success("Provider account created successfully!");
				setProviderExists(true);
				setShowSignupForm(false);
				router.push("/dashboard");
			} else {
				toast.error("Error creating provider account. Please try again.");
			}
		} catch (error) {
			console.error("Error creating provider account:", error);
			toast.error("Error creating provider account. Please try again.");
		}

		setFormData({ companyName: "", walletAddress: "" });
	};

	return (
		<div className="min-h-screen overflow-y-auto w-screen text-white bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#21262D] pt-4">
			<div className="mt-2 flex items-center justify-between px-20">
				<Link href={"/"}>
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center">
							<TbRobot className="w-8 h-8 text-white" />
						</div>
						<span className="text-3xl font-bold bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">Tito</span>
						<span className="text-sm bg-gray-700 px-2 py-1 rounded-full">Provider Portal</span>
					</div>
				</Link>
				<div className="flex items-center gap-4">
					<HomeLink href="/" isActive text="Overview" />
					<HomeLink href="/services" text="My Services" />
					<HomeLink href="/analytics" text="Analytics" />
					<HomeLink href="/docs" text="Documentation" />
					<div className="ml-5 flex gap-3">
						<ConnectWalletBtn />
						{isConnected && !account && (
							<button onClick={handleGetStarted} className={cn("px-6 py-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-lg font-semibold hover:scale-105 transition-transform")}>
								Get Started
							</button>
						)}
					</div>
				</div>
			</div>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-8 pl-20 gap-8">
				<div className="col-auto md:col-span-4 mt-12 space-y-10">
					<div className="text-6xl font-bold leading-tight">
						<span>Monetize Your Services with </span>
						<span className="text-transparent bg-gradient-to-r bg-clip-text from-[#6366F1] via-[#8B5CF6] to-[#EC4899]">X402 Payments</span>
					</div>
					<div className="mt-8">
						<p className="text-xl text-gray-300 leading-relaxed">
							Join Netflix, Spotify, and thousands of service providers using Tito's AI-powered platform. Create subscription services with instant X402 payments and automated billing management.
						</p>
					</div>
					<div className="flex gap-4 mt-8">
						{account && (
							<button
								onClick={() => router.push("/dashboard")}
								className={cn("flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-xl font-semibold text-lg hover:scale-105 transition-transform")}>
								<Settings className="w-5 h-5" />
								Go to Dashboard
								<ArrowRight className="w-5 h-5" />
							</button>
						)}
						<Link href="/docs">
							<button className="flex items-center gap-2 px-8 py-4 border border-gray-600 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors">
								<Bot className="w-5 h-5" />
								View Documentation
							</button>
						</Link>
					</div>
				</div>
				<div className="col-auto md:col-span-4 flex items-center justify-center">
					<div className="relative">
						<div className="w-96 h-96 bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 rounded-full blur-3xl absolute -top-10 -left-10"></div>
						<div className="relative z-10 bg-gradient-to-br from-[#1F2937] to-[#374151] p-8 rounded-3xl border border-gray-700">
							<div className="flex items-center gap-3 mb-6">
								<div className="w-3 h-3 bg-red-500 rounded-full"></div>
								<div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
								<div className="w-3 h-3 bg-green-500 rounded-full"></div>
								<span className="text-sm text-gray-400 ml-auto">Tito Provider Dashboard</span>
							</div>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-lg font-semibold">Your Services</span>
									<span className="text-sm text-green-400">+12% this month</span>
								</div>
								<ServiceCard name="Premium Streaming" price="$15.99/mo" subscribers="1,247" />
								<ServiceCard name="Cloud Storage Pro" price="$9.99/mo" subscribers="892" />
								<ServiceCard name="Design Tools Suite" price="$29.99/mo" subscribers="456" />
								<div className="bg-[#6366F1]/10 p-4 rounded-lg border border-[#6366F1]/30">
									<div className="flex items-center gap-2 mb-2">
										<DollarSign className="w-5 h-5 text-green-400" />
										<span className="font-semibold">Monthly Revenue</span>
									</div>
									<span className="text-2xl font-bold text-green-400">$47,832</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="px-20 mt-20 relative">
				<div className="absolute left-[30%] top-6 w-full pointer-events-none z-10 opacity-50">
					<div className="w-96 h-96 bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20 rounded-full blur-3xl"></div>
				</div>
				<div className="w-full relative z-20">
					<div className="text-center space-y-4">
						<h1 className="text-5xl font-bold">Why Service Providers Choose Tito?</h1>
						<p className="text-xl text-gray-300 px-10 max-w-4xl mx-auto">
							Join the future of subscription services with X402 blockchain payments, AI-powered customer management, and real-time analytics that help you grow your business.
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
						<FeatureCard title="Instant X402 Payments" description="Receive payments instantly with blockchain security. No waiting periods, no chargebacks." icon={<TbCreditCard className="w-8 h-8" />} />
						<FeatureCard title="AI Customer Management" description="Tito AI handles customer inquiries, renewals, and cancellations automatically 24/7." icon={<TbRobot className="w-8 h-8" />} />
						<FeatureCard title="Real-time Analytics" description="Track subscriptions, revenue, churn rates, and customer insights in real-time." icon={<TbChartLine className="w-8 h-8" />} />
						<FeatureCard title="Easy Integration" description="Simple webhook setup and comprehensive documentation for quick integration." icon={<TbBox className="w-8 h-8" />} />
					</div>
				</div>
			</div>

			<div className="px-24 mt-28">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
					<div className="bg-gradient-to-br from-[#1F2937] to-[#374151] p-8 rounded-3xl border border-gray-700">
						<div className="space-y-6">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-full flex items-center justify-center text-white font-bold">1</div>
								<div>
									<h3 className="text-lg font-semibold">Register Your Company</h3>
									<p className="text-gray-400">Quick signup with business verification</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center text-white font-bold">2</div>
								<div>
									<h3 className="text-lg font-semibold">Create Your Services</h3>
									<p className="text-gray-400">Define pricing, features, and billing cycles</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 bg-gradient-to-br from-[#EC4899] to-[#F59E0B] rounded-full flex items-center justify-center text-white font-bold">3</div>
								<div>
									<h3 className="text-lg font-semibold">Integrate X402 Payments</h3>
									<p className="text-gray-400">Add payment endpoints to your service</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B] to-[#10B981] rounded-full flex items-center justify-center text-white font-bold">4</div>
								<div>
									<h3 className="text-lg font-semibold">Go Live & Earn</h3>
									<p className="text-gray-400">Start receiving payments and track growth</p>
								</div>
							</div>
						</div>
					</div>
					<div className="pt-5">
						<h1 className="font-bold text-4xl mb-6">4 Steps to Launch Your Service</h1>
						<div className="space-y-6">
							<StepItem title="Register as Service Provider" description="Create your provider account with business details, wallet address, and verification documents." />
							<StepItem title="Design Your Services" description="Set up subscription tiers, pricing models, trial periods, and service features through our dashboard." />
							<StepItem title="Configure Integration" description="Add payment endpoints, configure webhooks, and test the integration with our sandbox environment." />
							<StepItem title="Launch & Monitor" description="Go live with your services and monitor subscriptions, revenue, and customer analytics in real-time." />
						</div>
					</div>
				</div>
			</div>

			{/* Signup Form Modal */}
			{showSignupForm && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-gradient-to-br from-[#1F2937] to-[#374151] p-8 rounded-3xl border border-gray-700 max-w-md w-full relative">
						<button onClick={() => setShowSignupForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
							<X className="w-6 h-6" />
						</button>

						<div className="mb-6">
							<div className="flex items-center gap-3 mb-2">
								<div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center">
									<Building className="w-6 h-6 text-white" />
								</div>
								<h2 className="text-2xl font-bold text-white">Create Provider Account</h2>
							</div>
							<p className="text-gray-400">Start monetizing your services with Tito</p>
						</div>

						<form onSubmit={handleFormSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
								<input
									type="text"
									required
									value={formData.companyName}
									onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
									className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
									placeholder="Your company name"
								/>
							</div>
							<div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
								<label className="block text-sm font-medium text-gray-300 mb-2">Wallet Address</label>
								<div className="text-sm text-gray-400 font-mono break-all">{address || "Not connected"}</div>
								<p className="text-xs text-gray-500 mt-1">This will be used for receiving payments</p>
							</div>

							<button
								type="submit"
								disabled={!isConnected}
								className="w-full px-6 py-3 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-lg font-semibold text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
								{isConnected ? "Create Provider Account" : "Connect Wallet First"}
							</button>

							<p className="text-xs text-gray-500 text-center">By creating an account, you agree to our Terms of Service and Privacy Policy</p>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

const HomeLink = ({ text, isActive, href }: HomeLinkProps) => {
	return (
		<Link href={href ?? "/"}>
			<p className={cn("transition-all duration-300 hover:text-[#6366F1]", isActive ? "text-[#6366F1] font-semibold" : "text-gray-300 hover:font-semibold")}>{text}</p>
		</Link>
	);
};

const FeatureCard = ({ title, description, icon }: FeatureCardProps) => {
	return (
		<div className="group hover:scale-105 transition-transform duration-300">
			<div className="p-[1px] rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">
				<div className="px-6 py-8 bg-[#1F2937] rounded-2xl h-full">
					<div className="flex items-center justify-between mb-4">
						<div className="p-3 bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 rounded-xl text-[#6366F1]">{icon}</div>
						<RxArrowTopRight className="w-6 h-6 text-gray-400 group-hover:text-[#6366F1] transition-colors" />
					</div>
					<div className="space-y-3">
						<h3 className="font-semibold text-xl text-white">{title}</h3>
						<p className="text-gray-400 leading-relaxed">{description}</p>
					</div>
				</div>
			</div>
		</div>
	);
};

const StepItem = ({ title, description }: StepItemProps) => {
	return (
		<div className="flex gap-4 items-start">
			<div className="w-2 h-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full mt-3 flex-shrink-0"></div>
			<div className="space-y-2">
				<h3 className="text-xl font-semibold text-white">{title}</h3>
				<p className="text-gray-400 leading-relaxed">{description}</p>
			</div>
		</div>
	);
};

const ServiceCard = ({ name, price, subscribers }: ServiceCardProps) => {
	return (
		<div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
			<div>
				<h4 className="font-semibold text-sm">{name}</h4>
			</div>
			<div className="text-right">
				<p className="text-sm font-semibold">{price}</p>
				<p className="text-xs text-gray-400">{subscribers} subs</p>
			</div>
		</div>
	);
};

export default LandingPage;
