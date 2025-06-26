import { IProvider } from "@/types/Provider";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface IAuthStore {
	account: IProvider | null;
	setAccount: (val: IProvider | null) => void;
}

export const useAuthStore = create(
	persist<IAuthStore>(
		(set) => ({
			account: null,
			setAccount(val) {
				set({ account: val });
			},
		}),
		{ storage: createJSONStorage(() => localStorage), name: "tito-auth" }
	)
);
