import { getApiErrorMessage } from '@lib/api-error';
import { useAuthStore } from '@store/authStore';
import { toast } from '@store/toastStore';

function isMutationMethod(method: string | undefined): boolean {
  if (method === undefined) {
    return false;
  }

  switch (method.toLowerCase()) {
    case 'post':
    case 'put':
    case 'patch':
    case 'delete':
      return true;
    default:
      return false;
  }
}

/**
 * Only authenticated write requests should use global API feedback. Read/query
 * failures retain their local states to avoid toast noise from refetches.
 */
export function shouldNotifyMutationError(
  method: string | undefined,
  isAuthenticated: boolean,
): boolean {
  return isAuthenticated && isMutationMethod(method);
}

/**
 * Surface terminal write failures consistently for tenant and Super Admin
 * users. Server messages are already localized from the request language.
 */
export function notifyMutationError(error: unknown, method: string | undefined): void {
  const isAuthenticated = useAuthStore.getState().user !== null;
  if (!shouldNotifyMutationError(method, isAuthenticated)) {
    return;
  }

  toast.error(getApiErrorMessage(error));
}
