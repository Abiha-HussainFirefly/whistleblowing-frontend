import { wbRoutes } from '../config/routes';

export const whistleblowingRouteDefinitions = [
  { path: wbRoutes.dashboard, kind: 'internal-dashboard' },
  { path: wbRoutes.cases, kind: 'internal-register' },
  { path: '/whistleblowing/detail/:id', kind: 'internal-case-detail' },
  { path: wbRoutes.reportConcern, kind: 'internal-report' },
  { path: wbRoutes.reportTrack, kind: 'public-tracking' },
  { path: '/report/:slug', kind: 'public-portal' },
  { path: '/report/case', kind: 'public-case' },
  { path: '/org-admin/whistleblowing', kind: 'organization-oversight' },
  { path: '/org-admin/whistleblowing/cases/:id', kind: 'organization-case' },
] as const;

