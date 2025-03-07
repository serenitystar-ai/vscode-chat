import * as vscode from "vscode";
import constants from "../constants";
import { getApiKey, updateAgent } from "../configuration";
import { ChatViewProvider } from "../providers/chat.view-provider";

export function registerSwitchAgentCommand(
  context: vscode.ExtensionContext,
  chatWebViewProvider: ChatViewProvider
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(constants.commands["switch-agent"], () =>
      configureNewAgent(chatWebViewProvider)
    )
  );
}

async function configureNewAgent(chatWebViewProvider: ChatViewProvider) {
  // Step 1: Check if api key is set
  const hasApiKey = getApiKey() !== undefined;
  if (!hasApiKey) {
    vscode.window.showErrorMessage(
      "Please set up your Serenity* API key before switching agents."
    );
    return;
  }

  const agents = await chatWebViewProvider.getAgents();
  const agentName = await vscode.window.showQuickPick(
    agents.map((agent) => agent.name),
    {
      canPickMany: false,
      ignoreFocusOut: true,
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: "Select the agent you want to switch to",
    }
  );

  // Step 3: Update the agent code and restart the conversation
  if (agentName) {
    const agent = agents.find((agent) => agent.name === agentName);
    await updateAgent(agent!.code, "active");
    await chatWebViewProvider.restartConversation();
  }

  return;
}
