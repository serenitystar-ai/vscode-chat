import showdown from "showdown";
import { getApiConfiguration, getApiKey, getBaseUrl } from "../configuration";
import { SseConnection } from "./sse-connection";
import {
  AgentExecuteReq,
  AgentInitRes,
  ExecuteBodyParams,
  InitConversationReq,
  Message,
  SerenitySSEContentHandler,
  SerenitySSEErrorHandler,
  SerenityEventHandlerMap,
  SerenityEventName,
  SerenitySSEStartHandler,
  SerenityNewChatIdHandler,
  AgentItemRes,
} from "./types";

export class SerenityChatService {
  upcomingMessage: Partial<Message> = {};
  converter = new showdown.Converter({
    tables: true,
    disableForced4SpacesIndentedSublists: true,
  });

  private chatId?: string;

  // Event handlers for SSE events
  private serenityEventHandlers: {
    start: SerenitySSEStartHandler[];
    error: SerenitySSEErrorHandler[];
    content: SerenitySSEContentHandler[];
    chatIds: SerenityNewChatIdHandler[];
  } = {
    start: [],
    error: [],
    content: [],
    chatIds: [],
  };

  constructor() {}

  // Single strongly typed event handler method
  on<E extends SerenityEventName>(
    event: E,
    handler: SerenityEventHandlerMap[E]
  ): this {
    switch (event) {
      case "sse-start":
        this.serenityEventHandlers.start.push(handler as any);
        break;
      case "sse-error":
        this.serenityEventHandlers.error.push(handler as any);
        break;
      case "sse-content":
        this.serenityEventHandlers.content.push(handler as any);
        break;
      case "new-chat-id":
        this.serenityEventHandlers.chatIds.push(handler as any);
    }
    return this;
  }

  async initConversation(request?: InitConversationReq) {
    const apiConfig = getApiConfiguration();

    const initEndpointUrl = `${apiConfig.baseUrl}/api/v2/agent/${apiConfig.agents.active}/conversation`;
    const initRes = await fetch(initEndpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiConfig.apiKey,
      },
      body: JSON.stringify(request),
    });

    if (!initRes.ok) {
      throw new Error(`Error: ${initRes.statusText}`);
    }

    const body = (await initRes.json()) as AgentInitRes;
    this.chatId = body.chatId;
    this.triggerNewChatIdEvent(body.chatId);

    return body;
  }

  async executeAgent(request: AgentExecuteReq) {
    const _self = this;

    const apiConfig = getApiConfiguration();

    if (!this.chatId) {
      throw new Error("Chat ID is not set. Call initConversation() first.");
    }

    const executeEndpointUrl = `${apiConfig.baseUrl}/api/v2/agent/${apiConfig.agents.active}/execute`;

    const sseConnection = new SseConnection();

    sseConnection.on("start", (data) => {
      _self.triggerStartEvent();
    });

    sseConnection.on("error", (data) => {
      const dataObj = JSON.parse(data);
      _self.triggerErrorEvent(dataObj);
    });

    let plainMessage = "";
    let isInCodeBlock = false;

    sseConnection.on("content", (data) => {
      const dataObj = JSON.parse(data);
      plainMessage += dataObj.text;

      isInCodeBlock = !_self.allCodeBlocksAreClosed(plainMessage);

      if (isInCodeBlock) {
        return;
      }

      const html = _self.converter.makeHtml(plainMessage);

      _self.upcomingMessage = {
        ..._self.upcomingMessage,
        value: html,
      };

      _self.triggerContentEvent(_self.upcomingMessage, false);
    });

    sseConnection.on("stop", (data) => {
      const dataObj = JSON.parse(data);
      _self.upcomingMessage = {
        ..._self.upcomingMessage,
        meta_analysis: dataObj.result?.meta_analysis,
        completion_usage: dataObj.result?.completion_usage,
        time_to_first_token: dataObj.result?.time_to_first_token,
        executor_task_logs: dataObj.result?.executor_task_logs,
        action_results: dataObj.result?.action_results,
      };

      // Trigger final content event with isComplete=true
      _self.triggerContentEvent(_self.upcomingMessage, true);

      // Reset the upcoming message
      _self.upcomingMessage = {
        createdAt: new Date(),
        sender: "bot",
        type: "text",
        value: "",
      };

      plainMessage = "";
      isInCodeBlock = false;
    });

    const body: ExecuteBodyParams = [
      {
        Key: "chatId",
        Value: this.chatId,
      },
      {
        Key: "message",
        Value: request.message,
      },
      {
        Key: "stream",
        Value: "true",
      },
    ];

    const executeRes = await sseConnection.start(executeEndpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiConfig.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!executeRes.ok) {
      throw new Error(`Error: ${executeRes.statusText}`); // TODO improve error handling
    }
  }

  setChatId(chatId: string) {
    this.chatId = chatId;
  }

  async getAgents(): Promise<AgentItemRes[]> {
    const baseUrl = getBaseUrl();
    const apiKey = getApiKey() as string;

    // add page and pageSize query params
    const queryParams = new URLSearchParams();
    queryParams.append("page", "1");
    queryParams.append("pageSize", "50");
    queryParams.append("type", "4");

    let url = `${baseUrl}/api/v2/agent?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`There was an error trying to retrieve the agents}`);
    }

    const body = (await response.json()) as {
      items: AgentItemRes[];
    };

    const items = body.items.map((agent) => ({
      id: agent.id,
      code: agent.code,
      name: agent.name,
      agentType: agent.agentType,
    }));

    return items;
  }

  private triggerStartEvent() {
    for (const handler of this.serenityEventHandlers.start) {
      handler();
    }
  }

  private triggerErrorEvent(error: any) {
    for (const handler of this.serenityEventHandlers.error) {
      handler(error);
    }
  }

  private triggerContentEvent(content: Partial<Message>, isComplete: boolean) {
    for (const handler of this.serenityEventHandlers.content) {
      handler(content, isComplete);
    }
  }

  private triggerNewChatIdEvent(chatId: string) {
    for (const handler of this.serenityEventHandlers.chatIds) {
      handler(chatId);
    }
  }

  private allCodeBlocksAreClosed(markdown: string): boolean {
    const codeBlockPattern = /```/g;
    const matches = markdown.match(codeBlockPattern);

    if (!matches) {
      // No code blocks found
      return true;
    }

    // If the count of code block delimiters is even, all code blocks are closed
    return matches.length % 2 === 0;
  }
}
