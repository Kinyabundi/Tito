"use client";
import { ONCHAINKIT_API_KEY } from "../helpers/constants";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { FC, ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { WagmiProvider, createConfig, http, injected } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";

interface OnchainkitProviderProps {
	children: ReactNode;
}

const wagmiConfig = createConfig({
	chains: [baseSepolia],
	connectors: [
		// coinbaseWallet({
		// 	appName: "onchainkit",
		// }),
		// You can add other connectors here if needed
		// e.g., injected(), walletConnect(), etc.
		injected(),	
	],
	ssr: true,
	transports: {
		[baseSepolia.id]: http(),
	},
});

const OnchainkitAppProvider: FC<OnchainkitProviderProps> = ({ children }) => {
	return (
		<WagmiProvider config={wagmiConfig}>
			<Toaster />
			<OnchainKitProvider config={{ wallet: { preference: "eoaOnly" } }} apiKey={ONCHAINKIT_API_KEY} chain={baseSepolia}>
				{children}
			</OnchainKitProvider>
		</WagmiProvider>
	);
};

export default OnchainkitAppProvider;
