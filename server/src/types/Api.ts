interface IApiSuccessResponse<T> {
	status: "success";
	message: string;
	data?: T;
}
interface IApiErrorResponse {
	status: "error" | "failure" | "not-ready";
	message: string;
}

export type IApiResponse<T = any> = IApiSuccessResponse<T> | IApiErrorResponse;
