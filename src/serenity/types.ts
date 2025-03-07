export type AgentInitRes = {
  chatId: string;
  content: string;
};

export type ExecuteBodyParams = {
  Key: string;
  Value: string | string[];
}[];

export type AgentExecuteReq = {
  message: string;
  volatileKnowledgeIds?: string[];
  fileIds?: string[];
};

export type InitConversationReq = {
  inputParameters?: ExecuteBodyParams;
  userIdentifier?: string;
};

export type VolatileKnowledgeUploadRes = {
  id: string;
  expirationDate: string;
  status: string;
  fileName: string;
  fileSize: number;
};

export type AttachedVolatileKnowledge = {
  id: string;
  expirationDate: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
};

export type CompletionUsageRes = {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
};

export type ExecutorTaskLogsRes = {
  description: string;
  duration: number;
}[];

export type SpeechGenerationResult = {
  content: string;
  finish_reason?: string;
  usage?: object;
};

export type PluginExecutionResult = SpeechGenerationResult;

export type MetaAnalysisRes = { [key: string]: any } & {
  policy_compliance?: {
    compliance_score?: number;
    explanation?: string;
    policy_violations?: {
      source_id?: string;
      source_document_name: string;
      chunk_id?: string;
      section_number?: string;
      section?: string;
      policy?: string;
      policy_name: string;
      policy_id?: string;
    }[];
  };
  pii_release_risk?: {
    risk_score?: number;
    explanation?: string;
  };
  ethics?: {
    score?: number;
    explanation?: string;
    avoid_topics?: {
      topic: string;
      reason: string;
    }[];
  };
  deception_estimation?: {
    deception_score?: number;
    explanation?: string;
  };
  cybersecurity_threat?: {
    threat_assessment?: number;
    explanation?: string;
  };
  social_content_risk?: {
    risk_score?: number;
    explanation?: string;
  };
  conversation_analysis?: {
    emotion_value_estimate?: number;
    predicted_next_goal?: string;
    attended_to_features?: string[];
    topic_area?: string;
  };
};

export type Message = (
  | {
      sender: "user";
    }
  | {
      sender: "bot";
      conversationStarters?: string[];
    }
) & {
  createdAt: Date;
  type: "text" | "image" | "error";
  value: string;
  attachments?: VolatileKnowledgeUploadRes[] | AttachedVolatileKnowledge[];
  meta_analysis?: MetaAnalysisRes;
  completion_usage?: CompletionUsageRes;
  time_to_first_token?: number;
  executor_task_logs?: ExecutorTaskLogsRes;
  attachedVolatileKnowledges?: AttachedVolatileKnowledge[];
  action_results?: {
    [key: string]: PluginExecutionResult;
  };
};

export type SerenitySSEStartHandler = () => void;
export type SerenitySSEErrorHandler = (error: any) => void;
export type SerenitySSEContentHandler = (content: Partial<Message>, isComplete: boolean) => void;
export type SerenityNewChatIdHandler = (chatId: string) => void;

export type SerenityEventName = 'sse-start' | 'sse-error' | 'sse-content' | 'new-chat-id';

export type SerenityEventHandlerMap = {
  'sse-start': SerenitySSEStartHandler;
  'sse-error': SerenitySSEErrorHandler;
  'sse-content': SerenitySSEContentHandler;
  'new-chat-id': SerenityNewChatIdHandler;
};

export type AgentItemRes = {
  id: string
  code: string
  name: string
  agentType: number
}