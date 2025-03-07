import * as vscode from "vscode";
import constants from "../constants";
import { ChatViewProvider } from "../providers/chat.view-provider";
import { checkSetupComplete, getApiConfiguration, updateAgent } from "../configuration";

export function registerNewChatCommand(
  context: vscode.ExtensionContext,
  chatWebViewProvider: ChatViewProvider
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      constants.commands["new-chat"],
      async () => {
        // Step 1: Check if setup is complete
        const isSetupComplete = await checkSetupComplete();
        if (!isSetupComplete) {
          return;
        }

        const configuration = getApiConfiguration();

        // Step 2: Update the agent code and restart the conversation
        await updateAgent(configuration.agents.default, "active");
        await chatWebViewProvider.restartConversation();
      }
    )
  );
}
