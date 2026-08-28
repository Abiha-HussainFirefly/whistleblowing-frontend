import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { QUERY_DEFAULTS, HTTP_STATUS } from '@config/constants';

function isClientError(status: number | undefined): boolean {
  return typeof status === 'number' && status >= 400 && status < 500;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_DEFAULTS.STALE_TIME_MS,
      gcTime: QUERY_DEFAULTS.GC_TIME_MS,
      refetchOnWindowFocus: false,
      retry: (failureCount, error): boolean => {
        if (!isAxiosError(error)) {
          return failureCount < QUERY_DEFAULTS.RETRY;
        }
        const status = error.response?.status;
        if (
          status === HTTP_STATUS.UNAUTHORIZED ||
          status === HTTP_STATUS.FORBIDDEN ||
          status === HTTP_STATUS.NOT_FOUND ||
          isClientError(status)
        ) {
          return false;
        }
        return failureCount < QUERY_DEFAULTS.RETRY;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
