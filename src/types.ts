export interface Session {
  id: string;
  agent: string;
  status: string;
  created_at: string;
  last_active: string;
}

export interface SessionEvent {
  id: number;
  session_id: string;
  sender: 'user' | 'agent' | 'system';
  payload: {
    text: string;
    data?: any;
  };
  timestamp: string;
}

export type AgentType = 'claude' | 'codex' | 'opencode' | 'amp' | 'mock';
