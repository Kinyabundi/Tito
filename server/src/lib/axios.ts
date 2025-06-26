import { EvmServerAccount } from "@coinbase/cdp-sdk";
import axios, { AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "src/constants";
import { withPaymentInterceptor } from "x402-axios";
import { toAccount } from "viem/accounts";

interface CreateAxiosClientOptions {
	options?: AxiosRequestConfig;
}

function createAxiosClient({ options }: CreateAxiosClientOptions) {
	const client = axios.create(options);

	return client;
}

export const axiosClient = createAxiosClient({
	options: {
		baseURL: API_BASE_URL,
		timeout: 30000,
		headers: {
			"Content-Type": "application/json",
		},
	},
});

export const axiosPaymentApi = (account: EvmServerAccount) => withPaymentInterceptor(axios.create({ baseURL: API_BASE_URL }), toAccount(account));
