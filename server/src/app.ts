import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { CDP_API_KEY, CDP_API_KEY_PRIVATE_KEY, NETWORK_ID, OPENAI_API_KEY, TELEGRAM_BOT_TOKEN, WALLET_MNEMONIC_PHRASE } from "./constants";
import { END, MemorySaver, MessagesAnnotation, START } from "@langchain/langgraph";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { AgentKit, AgentKitOptions, CdpWalletProvider } from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";
import { StateGraph } from "@langchain/langgraph";
import { Bot } from "grammy";
import { rentRegisterTool } from "./tools";

Coinbase.configure({ apiKeyName: CDP_API_KEY, privateKey: CDP_API_KEY_PRIVATE_KEY.replace(/\\n/g, "\n") });

const bot = new Bot(TELEGRAM_BOT_TOKEN);

const titoTools = [rentRegisterTool];

interface AgentConfig {
	configurable: {
		thread_id: string;
		walletAddress: string;
	};
}

type Agent = ReturnType<typeof createReactAgent>;

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

async function initAgent() {
	try {
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

		const memory = new MemorySaver();

		const app = workflow.compile({ checkpointer: memory });
	} catch (err) {}
}

async function processMessage(agent: Agent, config: AgentConfig, message: string, senderAddress: string): Promise<string> {
	let response = "";
	try {
		const stream = await agent.stream({ messages: [new HumanMessage({ content: message, additional_kwargs: { walletAddress: senderAddress } })] }, config);
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
