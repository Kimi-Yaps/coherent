import { createContext, useContext } from 'react';
import { type ModelLimitInfo } from '../services/geminiService';

export interface ChatQuotaContextType {
  dailyLimit: number;
  messagesUsed: number;
  messagesRemaining: number;
  tokensUsedToday: number;
  lastTokens: number;
  modelLimitInfo: ModelLimitInfo;
  isQuotaExceeded: boolean;
  consumeMessage: () => boolean;
  recordTokens: (tokens: number) => void;
  resetQuota: () => void;
}

export const ChatQuotaContext = createContext<ChatQuotaContextType | undefined>(undefined);

export const useChatQuota = () => {
  const context = useContext(ChatQuotaContext);
  if (!context) {
    throw new Error('useChatQuota must be used within a ChatQuotaProvider');
  }
  return context;
};
