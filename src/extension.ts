import * as vscode from 'vscode';
import { ChatViewProvider } from './providers/chat.view-provider';
import { registerSetupCommand } from './commands/setup.command';
import { registerExplainCommand } from './commands/explain.command';
import constants from './constants';
import { registerSwitchAgentCommand } from './commands/switch-agent.command';
import { registerNewChatCommand } from './commands/new-chat.command';

export function activate(context: vscode.ExtensionContext) {
  const chatWebViewProvider = new ChatViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(constants.views.chat, chatWebViewProvider)
  );

  registerSetupCommand(context, chatWebViewProvider);
  registerExplainCommand(context, chatWebViewProvider);
  registerSwitchAgentCommand(context, chatWebViewProvider);
  registerNewChatCommand(context, chatWebViewProvider);
}