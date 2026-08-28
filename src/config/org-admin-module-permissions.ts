import { PERMISSIONS } from './permissions';

/**
 * Read gates for organization-admin module oversight.
 *
 * Organization management permission is intentionally not a substitute for
 * domain access: an admin may manage members and roles without being allowed
 * to view the organization's contract portfolio.
 */
export const ORG_ADMIN_MODULE_PERMISSIONS = {
  contracts: [PERMISSIONS.CONTRACT_READ],
  matters: [PERMISSIONS.LITIGATION_CASE_READ],
  compliance: [
    PERMISSIONS.COUNTERPARTY_READ,
    PERMISSIONS.COUNTERPARTY_CREATE,
    PERMISSIONS.SCREENING_EXECUTE,
    PERMISSIONS.DD_READ_DASHBOARD,
  ],
  assets: [PERMISSIONS.LAND_ASSET_READ],
  whistleblowing: [PERMISSIONS.WHISTLEBLOWING_CASE_READ],
  reporting: [PERMISSIONS.REPORT_READ],
} as const;
