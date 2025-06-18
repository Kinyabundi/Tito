import morgan from "morgan";
import { morganLogger } from "../logger/winston";

export const morganMiddleware = morgan(":method :url :status :res[content-length] - :response-time ms", {
	stream: {
		write: (msg) => morganLogger.http(msg.trim()),
	},
});
