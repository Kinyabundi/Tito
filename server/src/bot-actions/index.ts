import { axiosClient } from "src/lib/axios";
import { IUser } from "src/models/user.model";
import { IApiResponse } from "src/types/Api";

export const getAccountByTelegramID = async (tg_id: number | string) => {
	try {
		const rawResp = await axiosClient.get<IApiResponse<IUser>>(`/users/get/by-telegram/${tg_id}`);
		const resp = rawResp.data;

		if (resp?.status === "success") {
			return resp?.data;
		}

		return null;
	} catch (err) {
		return null;
	}
};

export const botSetupUserAccount = async (tg_id: string) => {
	try {
		const rawResp = await axiosClient.post<IApiResponse<IUser>>(`/users/register`, { tg_user_id: tg_id });

		const resp = rawResp.data;

		if (resp?.status === "success") {
			return resp.data;
		}

		return null;
	} catch (err) {
		return null;
	}
};
