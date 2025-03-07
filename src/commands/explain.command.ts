import * as vscode from "vscode";
import constants from "../constants";
import { ChatViewProvider } from "../providers/chat.view-provider";
import {
  checkSetupComplete,
  getApiConfiguration,
  updateAgent,
} from "../configuration";

export function registerExplainCommand(
  context: vscode.ExtensionContext,
  chatWebViewProvider: ChatViewProvider
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(constants.commands.explain, async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const isSetupComplete = await checkSetupComplete();
      if (!isSetupComplete) {
        return;
      }

      // Check if there is an agent for the command
      const configurations = getApiConfiguration();
      let canProceed = true;

      if (!configurations.agents.explainCommand) {
        canProceed = await handleFirstAgentConfiguration(chatWebViewProvider);
      } else {
        await handleSetActiveAgent(
          configurations.agents.explainCommand,
          chatWebViewProvider
        );
      }

      if (!canProceed) {
        return;
      }

      // Focus on the webview
      vscode.commands.executeCommand(
        "workbench.view.extension.SerenityStar_activityBar"
      );

      const selectedText = editor.document.getText(editor.selection);
      const prompt = `Explain the following code:\n\n${selectedText}`;

      // Send the selected text to the webview
      chatWebViewProvider.sendMessage({
        message: prompt,
      });
    })
  );
}

/**
 * Handles the first-time configuration of an agent for the "explain" command
 * @returns True if the agent was successfully configured, false otherwise
 */
async function handleFirstAgentConfiguration(
  chatWebViewProvider: ChatViewProvider
): Promise<boolean> {
  const agents = await chatWebViewProvider.getAgents();
  const agentName = await vscode.window.showQuickPick(
    agents.map((agent) => agent.name),
    {
      canPickMany: false,
      ignoreFocusOut: true,
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: "Select the agent you want to use for the 'explain' command",
    }
  );

  if (agentName) {
    const agent = agents.find((agent) => agent.name === agentName);
    await updateAgent(agent!.code, "explainCommand");
    await updateAgent(agent!.code, "active");
    await chatWebViewProvider.restartConversation();
    return true;
  } else {
    vscode.window.showWarningMessage(
      "Agent code not set. Please set the agent code to proceed."
    );
    return false;
  }
}

/**
 * Sets the specified agent as active if it's not already
 * @param agentCode The agent code to set as active
 * @param chatWebViewProvider The chat view provider to restart if needed
 */
async function handleSetActiveAgent(
  agentCode: string,
  chatWebViewProvider: ChatViewProvider
): Promise<void> {
  const configurations = getApiConfiguration();
  const isAlreadyActive = configurations.agents.active === agentCode;

  if (!isAlreadyActive) {
    await updateAgent(agentCode, "active");
    await chatWebViewProvider.restartConversation();
  }
}
