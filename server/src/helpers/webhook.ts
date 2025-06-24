import axios from 'axios';
import { logger } from '../logger/winston';

export interface WebhookPayload {
  event: string;
  subscription_id: string;
  user_id: string;
  service_id: string;
  data: any;
  timestamp: string;
}

export async function sendWebhook(url: string, payload: WebhookPayload): Promise<boolean> {
  try {
    const response = await axios.post(url, payload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Tito-Webhook/1.0',
      },
    });

    if (response.status >= 200 && response.status < 300) {
      logger.info(`Webhook sent successfully to ${url}`);
      return true;
    } else {
      logger.warn(`Webhook failed with status ${response.status} for ${url}`);
      return false;
    }
  } catch (error) {
    logger.error(`Webhook error for ${url}:`, error);
    return false;
  }
}
