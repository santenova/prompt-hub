import { toast as sonnerToast } from "sonner";

export function useToast() {
  return {
    toast: ({ title, description, action, duration, ...rest } = {}) => {
      const message = title || description || "";
      if (!message) return;
      return sonnerToast(message, {
        description: title && description ? description : undefined,
        duration: duration || 3000,
        action,
        ...rest,
      });
    },
  };
}

export const toast = (message, options) => sonnerToast(message, options);