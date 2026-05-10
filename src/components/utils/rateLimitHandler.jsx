import { toast } from "@/components/ui/use-toast";

// Track rate limit state
let isRateLimited = false;
let rateLimitResetTime = null;

export const handleRateLimitError = (error) => {
  const errorMessage = error?.message || error?.toString() || '';
  
  if (errorMessage.includes('Rate limit exceeded') || errorMessage.includes('rate limit')) {
    if (!isRateLimited) {
      isRateLimited = true;
      rateLimitResetTime = Date.now() + 60000; // Reset after 1 minute
      
      toast({
        title: "Rate Limit Reached",
        description: "Please wait a moment before trying again. The app will automatically retry.",
        variant: "destructive",
        duration: 5000,
      });
      
      // Reset flag after cooldown
      setTimeout(() => {
        isRateLimited = false;
        rateLimitResetTime = null;
      }, 60000);
    }
    return true;
  }
  return false;
};

export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = handleRateLimitError(error);
      
      if (i === maxRetries - 1) {
        throw error; // Last retry, throw the error
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = isRateLimit ? 5000 : baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const isCurrentlyRateLimited = () => {
  return isRateLimited && Date.now() < rateLimitResetTime;
};