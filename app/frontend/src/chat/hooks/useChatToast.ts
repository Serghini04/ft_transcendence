import { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { ChallengeToast } from '../components/ChallengeToast';
import React from 'react';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info' | 'challenge';
  duration?: number;
  onAccept?: () => void;
}

let toastContainer: HTMLDivElement | null = null;
let activeToasts: Map<string, { root: any; element: HTMLDivElement }> = new Map();

const getToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'chat-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

export const showToast = (options: ToastOptions) => {
  const { message, type = 'info', duration = 5000, onAccept } = options;
  
  const container = getToastContainer();
  const toastId = `toast-${Date.now()}-${Math.random()}`;
  
  // Remove any existing toasts
  activeToasts.forEach(({ root, element }) => {
    root.unmount();
    element.remove();
  });
  activeToasts.clear();
  
  const toastElement = document.createElement('div');
  toastElement.style.pointerEvents = 'auto';
  container.appendChild(toastElement);
  
  const root = createRoot(toastElement);
  
  const handleClose = () => {
    const toast = activeToasts.get(toastId);
    if (toast) {
      toast.root.unmount();
      toast.element.remove();
      activeToasts.delete(toastId);
    }
  };
  
  root.render(
    React.createElement(ChallengeToast, {
      message,
      type,
      onClose: handleClose,
      onAccept,
      autoHideDuration: duration
    })
  );
  
  activeToasts.set(toastId, { root, element: toastElement });
  
  return handleClose;
};

export const useChatToast = () => {
  const showSuccessToast = useCallback((message: string, duration = 3000) => {
    return showToast({ message, type: 'success', duration });
  }, []);
  
  const showErrorToast = useCallback((message: string, duration = 5000) => {
    return showToast({ message, type: 'error', duration });
  }, []);
  
  const showInfoToast = useCallback((message: string, duration = 5000) => {
    return showToast({ message, type: 'info', duration });
  }, []);
  
  const showChallengeToast = useCallback((message: string, onAccept: () => void, duration = 10000) => {
    return showToast({ message, type: 'challenge', duration, onAccept });
  }, []);
  
  return {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showChallengeToast,
    showToast,
  };
};
