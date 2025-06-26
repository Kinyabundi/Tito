import { CdpClient } from "@coinbase/cdp-sdk";

import dotenv from "dotenv";

dotenv.config();

export async function createCDPAccount(name: string) {
	const cdp = new CdpClient();

	const account = await cdp.evm.createAccount({ name: name });

	// fund the account
	await cdp.evm.requestFaucet({ address: account.address, network: "base-sepolia", token: "eth" });

	let privateKey = await cdp.evm.exportAccount({ name: name });

	return { account, privateKey };
}

export async function importCDPAccount({ address }: { address: string }) {
	const cdp = new CdpClient();

	const account = await cdp.evm.getAccount({ address: address as `0x${string}` });

	return account;
}
