import axios, { AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "src/constants";

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
