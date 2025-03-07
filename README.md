![Serenity* Star VSCode Chat](./media/vscode-chat-banner.png)

Serenity* Star VSCode Extension - Code with the power of highly customizable AI Agents.

## Features

### Chat with your AI Agents
Open the chat view at any time during your coding session to ask your AI agents for help.

### Ask an agent to explain or review a block of code
Quickly select a block of code and ask your AI agent to explain it or review it.

## Requirements

To use this extension, you need:

* A Serenity* Star account
* At least one [Assistant Agent](https://docs.serenitystar.ai/docs/serenity-aihub/agents/assistant-agent/) created in your account

Sign up for free at [hub.serenitystar.ai](https://hub.serenitystar.ai)

## Extension Settings

This extension contributes the following settings:

* `SerenityStar.apiKey`: Your Serenity* Star API Key. You can use your default API Key or [create a new one](https://hub.serenitystar.ai/DeveloperTools)
* `SerenityStar.baseUrl`: The base URL for the Serenity* Star API. Default is `https://api.serenitystar.ai`. Intended for users that run their own instance of Serenity* Star.
* `SerenityStar.agents.default`: The code of the default agent to use during conversations. Click here to [create your first agent](https://hub.serenitystar.ai/AgentCreator)
* `SerenityStar.agents.active`: The code of the agent that is being used in the current conversation.
* `SerenityStar.agents.explainCommand`: The code of the agent used for the "explain" command.

## Commands

- `SerenityStar.setup`: Guides you through the setup process to configure your API Key and default agent.
- `SerenityStar.explain`: Uses the agent you chose to explain the selected code and focuses the chat view.
- `SerenityStar.switch-agent`: Allows you to switch between different agents. It provides a list with all your agents from Serenity Star.
- `SerenityStar.new-chat`: Allows you to start a new conversation with the active agent.

## Release Notes

### 1.0.0

Initial release.

- Chat view with multiple Serenity* Star agents.
- You can switch between different agents using the "Switch Agent" command.
- Allows you to start new conversations.

