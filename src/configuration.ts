import { workspace, ConfigurationTarget } from 'vscode';
import constants from "./constants";

export async function checkSetupComplete() {
    const apiKey = workspace.getConfiguration()
        .get<string>(constants.configuration.apiKey);

    const defaultAgentCode = workspace.getConfiguration()
        .get<string>(constants.configuration.agents.default);

    if (apiKey && defaultAgentCode) {
        return true;
    }

    return false;
}

export function getApiConfiguration() {
    const apiKey = workspace.getConfiguration()
        .get<string>(constants.configuration.apiKey);

    const baseUrl = workspace.getConfiguration()
        .get<string>(constants.configuration.baseUrl);

    const defaultAgentCode = workspace.getConfiguration()
        .get<string>(constants.configuration.agents.default);

    const explainCommandAgentCode = workspace.getConfiguration()
        .get<string>(constants.configuration.agents.explainCommand);

    const activeAgentCode = workspace.getConfiguration()
        .get<string>(constants.configuration.agents.active);

    if (!apiKey || !baseUrl || !defaultAgentCode) { throw new Error('Missing configuration'); }

    return {
        apiKey,
        baseUrl,
        agents: {
            default: defaultAgentCode,
            explainCommand: explainCommandAgentCode,
            active: activeAgentCode
        }
    };
}

export function getBaseUrl() {
    return workspace.getConfiguration().get<string>(constants.configuration.baseUrl);
}

export function getApiKey() {
    return workspace.getConfiguration().get<string>(constants.configuration.apiKey);
}

export type AgentMode = "default" | "explainCommand" | "active";

export async function updateAgent(agentCode: string, mode: AgentMode) {
    await workspace.getConfiguration().update(
        constants.configuration.agents[mode],
        agentCode,
        ConfigurationTarget.Global
    );
}

export async function updateApiKey(apiKey: string) {
    await workspace.getConfiguration().update(
        constants.configuration.apiKey,
        apiKey,
        ConfigurationTarget.Global
    );
}