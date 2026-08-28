import { MessageSquareWarning } from 'lucide-react';
import { PERMISSIONS } from './permissions';

export const whistleblowingModule = { key: 'whistleblowing', label: 'Whistleblowing', description: 'Confidential incident reporting and investigation', path: '/whistleblowing', icon: MessageSquareWarning, permissions: [PERMISSIONS.WHISTLEBLOWING_CASE_READ, PERMISSIONS.WHISTLEBLOWING_CASE_CREATE, PERMISSIONS.WHISTLEBLOWING_CASE_INVESTIGATE, PERMISSIONS.WHISTLEBLOWING_CASE_ADMIN] } as const;
export const MODULES = [whistleblowingModule] as const;
