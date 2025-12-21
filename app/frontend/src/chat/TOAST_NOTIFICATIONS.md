# Chat Toast Notification System

## Overview
A professional toast notification system for the chat module that replaces standard browser alerts with styled, dismissible notifications matching your website's design.

## Features
- ✅ **Professional Design** - Matches the website's color scheme and styling
- ✅ **Multiple Types** - Success, Error, Info, and Challenge notifications
- ✅ **Auto-dismiss** - Configurable duration with visual progress bar
- ✅ **Challenge Notifications** - Interactive notifications with Accept/Decline buttons
- ✅ **Smooth Animations** - Slide-in/out transitions
- ✅ **User-friendly** - Non-blocking and dismissible

## Components

### 1. ChallengeToast Component
Location: `src/chat/components/ChallengeToast.tsx`

The main toast component that renders notifications with different styles based on type.

**Props:**
- `message` (string): The notification message to display
- `type` ('success' | 'error' | 'info' | 'challenge'): The notification type
- `onClose` (function): Callback when toast is closed
- `onAccept` (function, optional): Callback when Accept button is clicked (for challenge type)
- `autoHideDuration` (number): Duration in milliseconds before auto-hide (default: 5000)

### 2. useChatToast Hook
Location: `src/chat/hooks/useChatToast.ts`

A custom hook that provides easy-to-use functions for showing different types of toasts.

**Functions:**
- `showSuccessToast(message, duration?)` - Shows a green success notification
- `showErrorToast(message, duration?)` - Shows a red error notification
- `showInfoToast(message, duration?)` - Shows a blue info notification
- `showChallengeToast(message, onAccept, duration?)` - Shows an interactive challenge notification
- `showToast(options)` - Generic function for custom toast configurations

## Usage Examples

### Basic Usage in Components

```tsx
import { useChatToast } from "../hooks/useChatToast";

function MyComponent() {
  const { showSuccessToast, showErrorToast, showChallengeToast } = useChatToast();

  // Success notification
  const handleSuccess = () => {
    showSuccessToast("Operation completed successfully!");
  };

  // Error notification
  const handleError = () => {
    showErrorToast("Something went wrong. Please try again.");
  };

  // Challenge notification with Accept button
  const handleChallenge = () => {
    showChallengeToast(
      "John challenged you to a game!",
      () => {
        // Handle accept action
        console.log("Challenge accepted!");
        window.location.href = "/game";
      },
      10000 // 10 seconds
    );
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleChallenge}>Show Challenge</button>
    </div>
  );
}
```

### Usage in Zustand Store

```tsx
import { showToast } from '../hooks/useChatToast';

// In your store actions
const myAction = () => {
  try {
    // Do something
    showToast({
      message: 'Action completed!',
      type: 'success',
      duration: 3000
    });
  } catch (error) {
    showToast({
      message: 'Action failed!',
      type: 'error',
      duration: 5000
    });
  }
};
```

## Implementation Details

### Current Implementations

#### 1. History Panel (HistoryPanel.tsx)
- **Challenge Button**: Shows success toast when challenge is sent, error toast if user is offline or request fails
- **Block/Unblock**: Shows success/error toast based on the action result

#### 2. Chat Store (useChatStore.ts)
- **Challenge Received**: Shows interactive challenge notification with Accept/Decline buttons
- **Challenge Accepted**: Shows success notification before redirecting to game
- **Challenge Declined**: Shows info notification
- **Challenge Unavailable**: Shows error notification with reason

### Auto-hide Behavior
- Success toasts: 3 seconds
- Error toasts: 5 seconds
- Info toasts: 5 seconds
- Challenge toasts: 10 seconds (with auto-decline)

### Visual Progress Bar
Each toast includes a progress bar at the bottom that visually indicates the remaining time before auto-dismissal.

## Styling

The toasts use gradients and colors that match your website's theme:

- **Challenge**: Blue gradient (#112434 → #1A2D42) with teal accent (#0C7368)
- **Success**: Green gradient (#00912E → #007A26)
- **Error**: Red gradient (#A33B2E → #8E3125)
- **Info**: Blue gradient (#1A2D42 → #112434)

## Accessibility

- ✅ Keyboard accessible (ESC to close)
- ✅ Visual progress indicator
- ✅ Clear action buttons with hover states
- ✅ Non-blocking (doesn't prevent user interaction with the page)
- ✅ Auto-dismissible to prevent notification buildup

## Future Enhancements

Possible improvements:
- Sound notifications
- Multiple toast queue
- Position customization
- Animation preferences
- Persistent notifications option
