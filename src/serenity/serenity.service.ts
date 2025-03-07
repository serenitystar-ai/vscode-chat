import { getApiConfiguration } from "../configuration";

interface AgentExecuteReq {
    code: string,
    input: { key: string; value: any }[]
}

interface AgentExecuteRes {
    content: string,
    // TODO add more fields   
}

export async function executeAgent<TAgentResponse>(req: AgentExecuteReq): Promise<TAgentResponse> {

    const apiConfig = getApiConfiguration();

    const executeEndpointUrl = `${apiConfig.baseUrl}/api/agent/${req.code}/execute`;

    try {
        const executeRes = await fetch(executeEndpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiConfig.apiKey
            },
            body: JSON.stringify(req.input),
            signal: AbortSignal.timeout(30000)
        });

        if (!executeRes.ok) {
            throw new Error(`Error: ${executeRes.statusText} | ${await executeRes.text()}`); // TODO improve error handling
        }

        const executeResult = await executeRes.json() as AgentExecuteRes;
        return JSON.parse(executeResult.content) as TAgentResponse;
    }
    catch (err) {
        throw err;
    }
}
