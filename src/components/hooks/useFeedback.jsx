import { useState, useCallback } from 'react';
import { client } from '@/apis/client';

/**
 * Hook for collecting user feedback on features/pages
 * @returns {Object} - { submitFeedback, isSubmitting, success }
 */
export function useFeedback() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const submitFeedback = useCallback(async (feedbackData) => {
    setIsSubmitting(true);
    try {
      await client.functions.invoke('submitUserFeedback', {
        type: feedbackData.type,
        rating: feedbackData.rating,
        message: feedbackData.message,
        page: window.location.pathname,
        timestamp: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return true;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submitFeedback, isSubmitting, success };
}
