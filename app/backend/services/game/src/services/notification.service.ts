/**
 * Service to send notifications via HTTP to notification-service
 */

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';

export const sendNotification = async (data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  metadata?: any;
}) => {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to send notification:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};
