const extension = 'SerenityStar';
export default {
    extension,
    configuration: {
        apiKey: extension + '.apiKey',
        agents: {
            default: `${extension}.agents.default`,
            explainCommand: `${extension}.agents.explainCommand`,
            active: `${extension}.agents.active`,
        },
        baseUrl: extension + '.baseUrl',
    },
    commands: {
        setup: extension + '.setup',
        explain: extension + '.explain',
        "switch-agent": extension + '.switch-agent',
        "new-chat": extension + '.new-chat',
    },
    views: {
        chat: extension + '.chat',
    }
};