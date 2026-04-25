import axios from 'axios';

type ValidationDetail = {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationDetail[];
};

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  details?: ValidationDetail[];
};

function collectValidationMessages(details: ValidationDetail[]): string[] {
  const messages: string[] = [];

  for (const item of details) {
    if (item.constraints) {
      messages.push(...Object.values(item.constraints));
    }
    if (item.children && item.children.length > 0) {
      messages.push(...collectValidationMessages(item.children));
    }
  }

  return messages;
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Произошла непредвиденная ошибка';
  }

  if (!error.response) {
    return 'Не удалось подключиться к серверу';
  }

  const data = error.response.data as ApiErrorPayload | undefined;
  if (!data) {
    return `Ошибка сервера (${error.response.status})`;
  }

  if (typeof data.message === 'string' && data.message.trim().length > 0) {
    return data.message;
  }

  if (Array.isArray(data.message) && data.message.length > 0) {
    return data.message.join('. ');
  }

  if (Array.isArray(data.details) && data.details.length > 0) {
    const detailsMessages = collectValidationMessages(data.details);
    if (detailsMessages.length > 0) {
      return detailsMessages.join('. ');
    }
  }

  if (typeof data.error === 'string' && data.error.trim().length > 0) {
    return data.error;
  }

  return `Ошибка сервера (${error.response.status})`;
}
