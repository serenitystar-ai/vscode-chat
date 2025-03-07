import * as vscode from 'vscode';
import constants from '../constants';
import { updateApiKey, updateAgent } from '../configuration';
import { ChatViewProvider } from '../providers/chat.view-provider';

export function registerSetupCommand(context: vscode.ExtensionContext, chatWebViewProvider: ChatViewProvider) {
    context.subscriptions.push(
        vscode.commands.registerCommand(constants.commands.setup, () => configureApiKey(chatWebViewProvider))
    );
}

async function configureApiKey(chatWebViewProvider: ChatViewProvider) {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Serenity* API key',
        ignoreFocusOut: true
    });
    if (apiKey) {
        await updateApiKey(apiKey);
        return await configureDefaultAgent(chatWebViewProvider);  // Proceed to configure agent codes
    } else {
        vscode.window.showWarningMessage('Setup cancelled.');
        return false;
    }
}

async function configureDefaultAgent(chatWebViewProvider: ChatViewProvider) {
    const agents = await chatWebViewProvider.getAgents();
    const agentName = await vscode.window.showQuickPick(agents.map(agent => agent.name), {
        canPickMany: false,
        ignoreFocusOut: true,
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: 'Select the default agent to use',
    });

    if(agentName) {
        const agent = agents.find(agent => agent.name === agentName);
        await updateAgent(agent!.code, "default");
        await updateAgent(agent!.code, "active");
        return true;
    } else {
        vscode.window.showWarningMessage('Setup cancelled.');
        return false;
    }
}