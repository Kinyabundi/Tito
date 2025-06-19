import PouchDB from "pouchdb";
import { v4 as uuidv4 } from "uuid";

export interface IUser {
	username: string;
	tg_user_id: string;
	primary_wallet_address: string;
	primary_wallet_private_key: string;
	_id: string;
}

export interface IRecurringPayment {
	user_id: string; // Reference to IUser.tg_user_id
	type: string; // e.g., "rent", "spotify", "netflix"
	wallet_address: string;
	wallet_private_key: string;
	target_wallet_address: string; // Where the payment will be made
	due_date: string; // ISO date string
	amount: number;
	_id: string;
}

const userDb = new PouchDB<IUser>("tito_users");
const recurringPaymentDb = new PouchDB<IRecurringPayment>("tito_recurring_payments");

// USER CRUD
export async function createUser(user: Omit<IUser, "_id">): Promise<IUser> {
	const newUser: IUser = {
		...user,
		_id: uuidv4(),
	};
	await userDb.put(newUser);
	return newUser;
}

export async function getUserByTelegramId(tg_user_id: string): Promise<IUser | null> {
	try {
		const result = await userDb.find({ selector: { tg_user_id } });
		if (result.docs.length > 0) {
			return result.docs[0] as IUser;
		}
		return null;
	} catch (err) {
		// If find plugin is not installed, fallback to allDocs
		const allDocs = await userDb.allDocs({ include_docs: true });
		const userDoc = allDocs.rows.find((row) => row.doc && row.doc.tg_user_id === tg_user_id);
		return userDoc ? (userDoc.doc as IUser) : null;
	}
}

// RECURRING PAYMENT CRUD
export async function addRecurringPayment(payment: Omit<IRecurringPayment, "_id">): Promise<IRecurringPayment> {
	const newPayment: IRecurringPayment = {
		...payment,
		_id: uuidv4(),
	};
	await recurringPaymentDb.put(newPayment);
	return newPayment;
}

export async function updateRecurringPayment(payment: IRecurringPayment): Promise<IRecurringPayment> {
	try {
		const existing = await recurringPaymentDb.get(payment._id);
		const updated = { ...existing, ...payment };
		await recurringPaymentDb.put(updated);
		return updated as IRecurringPayment;
	} catch (err) {
		throw new Error("Recurring payment not found");
	}
}

export async function getRecurringPaymentById(_id: string): Promise<IRecurringPayment | null> {
	try {
		const payment = await recurringPaymentDb.get(_id);
		return payment as IRecurringPayment;
	} catch (err) {
		return null;
	}
}

export async function getRecurringPaymentsByUserId(user_id: string): Promise<IRecurringPayment[]> {
	try {
		const result = await recurringPaymentDb.find({ selector: { user_id } });
		return result.docs as IRecurringPayment[];
	} catch (err) {
		// Fallback if find plugin is not available
		const allDocs = await recurringPaymentDb.allDocs({ include_docs: true });
		return allDocs.rows
			.map(row => row.doc as IRecurringPayment)
			.filter(doc => doc && doc.user_id === user_id);
	}
}
