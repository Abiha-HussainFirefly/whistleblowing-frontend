import { useAuthStore } from '@store/authStore';

export type ContextQueryKey = readonly [
  'context',
  string,
  string | null,
  string,
  ...unknown[],
];

/**
 * Builds the isolation boundary shared by every authenticated operational query.
 * Read the store at key-construction time so module-level factories cannot retain
 * an organization or region from a previous authorization context.
 */
export function contextQueryKey(resourceName: string, ...parts: unknown[]): ContextQueryKey {
  const state = useAuthStore.getState();
  return [
    'context',
    state.activeOrganization?.id ?? 'none',
    state.activeRegion,
    resourceName,
    ...parts,
  ];
}
