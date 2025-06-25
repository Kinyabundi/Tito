import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { CDP_API_KEY, CDP_API_KEY_PRIVATE_KEY, CDP_API_KEY_SECRET, NETWORK_ID, OPENAI_API_KEY, TELEGRAM_BOT_TOKEN, WALLET_MNEMONIC_PHRASE } from "./constants";
import { END, MemorySaver, MessagesAnnotation, START } from "@langchain/langgraph";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { AgentKit, AgentKitOptions, CdpWalletProvider } from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";
import { StateGraph } from "@langchain/langgraph";
import { Bot, CallbackQueryContext, CommandContext, Context } from "grammy";
import { User } from "grammy/types";
import { botSetupUserAccount, getAccountByTelegramID } from "./bot-actions";
import { fetchAllServiceProvidersTool, fetchServicesByProviderNameTool } from "./tools";

type TUser = User;

type TUserState = Record<string, any>;

const userStates: TUserState = {};

type TQ = CallbackQueryContext<Context>;

Coinbase.configure({ apiKeyName: CDP_API_KEY, privateKey: CDP_API_KEY_SECRET.replace(/\\n/g, "\n") });

const updateUserState = (user: TUser, state: any) => {
	userStates[user.id] = { ...userStates[user.id], ...state };
};

const clearUserState = (user: TUser) => {
	delete userStates[user.id];
};

const sendReply = async (ctx: CommandContext<Context>, text: string, options: Record<string, any> = {}) => {
	const msg = await ctx.reply(text, options);
	updateUserState(ctx.from, { messageId: msg.message_id });
};

const handleUserState = async (ctx: Context, handler: any) => {
	const userState = userStates[ctx.from.id] || {};
	if (ctx.message.reply_to_message && String(ctx.message.reply_to_message.message_id) === String(userState.messageId)) {
		await handler(ctx);
	} else {
		await ctx.reply("Please select an option from the menu.");
	}
};

const bot = new Bot(TELEGRAM_BOT_TOKEN);

const titoTools = [fetchAllServiceProvidersTool, fetchServicesByProviderNameTool];

interface AgentConfig {
	configurable: {
		thread_id: string;
		user_id: string;
	};
}

type Agent = ReturnType<typeof createReactAgent>;

const memoryStore: Record<string, MemorySaver> = {};

const agentStore: Record<string, { agent: Agent; config: AgentConfig }> = {};

function askHuman(state: typeof MessagesAnnotation.State): Partial<typeof MessagesAnnotation.State> {
	const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
	const toolCallId = lastMessage.tool_calls?.[0].id;
	console.log(`Human input required: ${lastMessage.content}`);
	console.log("Options: approve, reject, adjust (with JSON input)");
	return { messages: [] };
}

function shouldContinue(state: typeof MessagesAnnotation.State): "action" | "askHuman" | typeof END {
	const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

	if (lastMessage && !lastMessage.tool_calls?.length) {
		return END;
	}

	if (lastMessage.tool_calls?.[0]?.name === "askHuman") {
		console.log("--- ASKING HUMAN ---");
		return "askHuman";
	}

	return "action";
}

async function initAgent(user_id: string) {
	try {
		// confirm if user account setup
		const userAccount = await getAccountByTelegramID(user_id);
		if (!userAccount) {
			// trigger create account
			await botSetupUserAccount(user_id);
		}
		const llm = new ChatOpenAI({
			model: "gpt-4o",
			apiKey: OPENAI_API_KEY,
			temperature: 0.7,
		});

		const walletInfo = await Wallet.import({
			mnemonicPhrase: WALLET_MNEMONIC_PHRASE!,
		});

		const walletProvider = await CdpWalletProvider.configureWithWallet({
			apiKeyId: CDP_API_KEY,
			apiKeySecret: CDP_API_KEY_PRIVATE_KEY.replace(/\\n/g, "\n"),
			networkId: NETWORK_ID,
			wallet: walletInfo,
		});

		const options = {
			cdpApiKeyId: CDP_API_KEY,
			cdpApiKeySecret: CDP_API_KEY_PRIVATE_KEY.replace(/\\n/g, "\n"),
			walletProvider,
			actionProviders: [
				// walletActionProvider(),
				// erc20ActionProvider()
			],
		} satisfies AgentKitOptions;

		const agentKit = await AgentKit.from(options);

		const tools = await getLangChainTools(agentKit);

		const allTools = [...titoTools, ...tools];

		memoryStore[user_id] = new MemorySaver();

		const agentConfig: AgentConfig = {
			configurable: { thread_id: user_id, user_id: user_id },
		};

		const toolNode = new ToolNode<typeof MessagesAnnotation.State>([...allTools]);

		const modelWithTools = llm.bindTools(allTools.map((t) => convertToOpenAITool(t)));

		async function callModel(state: typeof MessagesAnnotation.State): Promise<Partial<typeof MessagesAnnotation.State>> {
			const messages = state.messages;
			const response = await modelWithTools.invoke(messages);
			return { messages: [response] };
		}

		const workflow = new StateGraph(MessagesAnnotation)
			.addNode("agent", callModel)
			.addNode("action", toolNode)
			.addNode("askHuman", askHuman)
			.addEdge(START, "agent")
			.addEdge("action", "agent")
			.addEdge("askHuman", "agent")
			.addConditionalEdges("agent", shouldContinue);

		const app = workflow.compile({ checkpointer: memoryStore[user_id] });

		return { app, agentConfig };
	} catch (err) {
		console.error("Failed to initialize agent:", err);
		throw err;
	}
}

async function processMessage(agent: Agent, config: AgentConfig, message: string, user_id: string): Promise<string> {
	let response = "";
	try {
		const stream = await agent.stream({ messages: [new HumanMessage({ content: message, additional_kwargs: { user_id: user_id } })] }, config);
		for await (const event of stream) {
			if (!event.__end__) {
				const node = Object.keys(event)[0];
				// console.log('node', node)
				// console.log('event', event)
				const recentMsg = event[node].messages[event[node].messages.length - 1] as BaseMessage;
				response += String(recentMsg.content) + "\n";
			}
		}
		return response.trim() || "Action processed. Awaiting your next input.";
	} catch (error) {
		console.error("Error processing message:", error);
		return "Sorry, I encountered an error while processing your request. Please try again later.";
	}
}

async function handleAndStreamMessage(ctx: Context) {
	const { from: user } = ctx;
	const message = ctx.message;
	const user_id = String(user.id);

	let agentData = agentStore[user_id];
	if (!agentData) {
		const { agentConfig, app } = await initAgent(user_id);
		agentData = { config: agentConfig, agent: app };
		agentStore[user_id] = agentData;
	}
	const { agent, config } = agentData;

	let state = await agent.getState(config);

	// Send initial placeholder message
	let sentMessage = await ctx.reply("...");
	let response = "";

	// Choose stream input based on state
	let stream;
	if (state.next.includes("askHuman")) {
		stream = await agent.stream({ resume: message.text }, config);
	} else {
		stream = await agent.stream(
			{
				messages: [new HumanMessage({ content: message.text, additional_kwargs: { user_id } })],
			},
			config
		);
	}

	// Stream and edit message
	for await (const event of stream) {
		if (!event.__end__) {
			const node = Object.keys(event)[0];
			const recentMsg = event[node].messages[event[node].messages.length - 1] as BaseMessage;
			response += String(recentMsg.content) + "\n";
			await ctx.api.editMessageText(ctx.chat.id, sentMessage.message_id, response);
		}
	}

	// Optionally, handle post-stream state (e.g., ask for human input)
	state = await agent.getState(config);
	if (state.next.includes("askHuman")) {
		const lastMessage = state.values.messages[state.values.messages.length - 1] as BaseMessage;
		response = `${lastMessage.content}\nPlease respond with 'approve', 'reject', or 'adjust' (with JSON, e.g., {\"amount\": 500}).`;
		await ctx.api.editMessageText(ctx.chat.id, sentMessage.message_id, response);
	}
}

bot.command("start", async (ctx) => {
	console.log("here");
	const { from: user } = ctx;
	// init agent per user, if no user agent instance (create one)
	await initAgent(user.id.toString());
	updateUserState(user, {});

	// should get account details

	const welcomeMsg = `Welcome to Tito, an AI Agent to assist you to manage your recurring payments.`;

	await sendReply(ctx, welcomeMsg, { parse_mode: "Markdown" });
});

bot.on("message:text", async (ctx) => {
	await handleAndStreamMessage(ctx);
});

bot.start();
