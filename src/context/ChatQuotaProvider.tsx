import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useNotifications } from './useNotifications';
import { ChatQuotaContext } from './useChatQuota';
import { getActiveModelLimitInfo, type ModelLimitInfo } from '../services/geminiService';

const STORAGE_PREFIX = 'coherent_chat_quota_';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const ChatQuotaProvider = ({ children }: { children: ReactNode }) => {
  const { addNotification } = useNotifications();
  const todayKey = getTodayKey();

  const [modelLimitInfo, setModelLimitInfo] = useState<ModelLimitInfo>(() => getActiveModelLimitInfo());

  // Listen to model changes
  useEffect(() => {
    const updateModelInfo = () => {
      setModelLimitInfo(getActiveModelLimitInfo());
    };
    window.addEventListener('storage', updateModelInfo);
    return () => window.removeEventListener('storage', updateModelInfo);
  }, []);

  const dailyLimit = modelLimitInfo.rpd;

  const [messagesUsed, setMessagesUsed] = useState<number>(() => {
    try {
      const storedDate = localStorage.getItem(`${STORAGE_PREFIX}date`);
      if (storedDate === todayKey) {
        const storedCount = localStorage.getItem(`${STORAGE_PREFIX}used`);
        return storedCount ? parseInt(storedCount, 10) : 0;
      }
    } catch {
      // Ignore storage error
    }
    return 0;
  });

  const [tokensUsedToday, setTokensUsedToday] = useState<number>(() => {
    try {
      const storedDate = localStorage.getItem(`${STORAGE_PREFIX}date`);
      if (storedDate === todayKey) {
        const storedTokens = localStorage.getItem(`${STORAGE_PREFIX}tokens`);
        return storedTokens ? parseInt(storedTokens, 10) : 0;
      }
    } catch {
      // Ignore storage error
    }
    return 0;
  });

  const [lastTokens, setLastTokens] = useState<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}date`, todayKey);
      localStorage.setItem(`${STORAGE_PREFIX}used`, messagesUsed.toString());
      localStorage.setItem(`${STORAGE_PREFIX}tokens`, tokensUsedToday.toString());
    } catch {
      // Storage error ignored
    }
  }, [messagesUsed, tokensUsedToday, todayKey]);

  const messagesRemaining = Math.max(0, dailyLimit - messagesUsed);
  const isQuotaExceeded = messagesRemaining <= 0;

  const recordTokens = (tokens: number) => {
    if (tokens > 0) {
      setLastTokens(tokens);
      setTokensUsedToday((prev) => prev + tokens);
    }
  };

  const consumeMessage = (): boolean => {
    if (isQuotaExceeded) {
      addNotification({
        icon: '⚠️',
        title: 'Model Rate Limit Reached',
        description: `You have reached the daily request limit (${dailyLimit} RPD) for ${modelLimitInfo.modelName}. Quota resets at midnight Pacific Time.`,
        link: '/bookings',
        category: 'quota',
      });
      return false;
    }

    const nextUsed = messagesUsed + 1;
    setMessagesUsed(nextUsed);
    return true;
  };

  const resetQuota = () => {
    setMessagesUsed(0);
    setTokensUsedToday(0);
    setLastTokens(0);
    addNotification({
      icon: '⚡',
      title: 'Model Quota Reset',
      description: `Daily limit reset for ${modelLimitInfo.modelName} (${dailyLimit} RPD).`,
      link: '/ai-support',
      category: 'quota',
    });
  };

  const contextValue = useMemo(
    () => ({
      dailyLimit,
      messagesUsed,
      messagesRemaining,
      tokensUsedToday,
      lastTokens,
      modelLimitInfo,
      isQuotaExceeded,
      consumeMessage,
      recordTokens,
      resetQuota,
    }),
    [dailyLimit, messagesUsed, messagesRemaining, tokensUsedToday, lastTokens, modelLimitInfo, isQuotaExceeded]
  );

  return (
    <ChatQuotaContext.Provider value={contextValue}>
      {children}
    </ChatQuotaContext.Provider>
  );
};

export default ChatQuotaProvider;
