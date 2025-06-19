import { CdpClient } from "@coinbase/cdp-sdk";

export async function createCDPAccount(name: string) {
	const cdp = new CdpClient();

	const account = await cdp.evm.createAccount({ name: name });

	return account;
}
