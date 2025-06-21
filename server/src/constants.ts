import * as dotenv from "dotenv";

dotenv.config();

export const APP_PORT = 6754;
export const FACILITATOR_URL = process.env.FACILITATOR_URL;
export const ADDRESS = process.env.ADDRESS;
export const CDP_API_KEY = process.env.CDP_API_KEY;
export const CDP_API_KEY_PRIVATE_KEY = process.env.CDP_API_KEY_PRIVATE_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const WALLET_MNEMONIC_PHRASE = process.env.WALLET_MNEMONIC_PHRASE
export const NETWORK_ID = process.env.NETWORK_ID;
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tito";
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "tito";
