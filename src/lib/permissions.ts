// Permission system for SynergySphere - NO MOCK DATA, SECURE BY DEFAULT

export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

export type Permission = 
  | 'project:read' | 'project:write' | 'project:delete'
  | 'task:read' | 'task:write' | 'task:delete' | 'task:assign'
  | 'member:read' | 'member:invite' | 'member:remove' | 'member:role_change'
  | 'budget:read' | 'budget:write'
  | 'comment:read' | 'comment:write' | 'comment:delete';

// Define permissions for each role - SECURE BY DEFAULT
const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  owner: [
    'project:read', 'project:write', 'project:delete',
    'task:read', 'task:write', 'task:delete', 'task:assign',
    'member:read', 'member:invite', 'member:remove', 'member:role_change',
    'budget:read', 'budget:write',
    'comment:read', 'comment:write', 'comment:delete'
  ],
  admin: [
    'project:read', 'project:write',
    'task:read', 'task:write', 'task:delete', 'task:assign',
    'member:read', 'member:invite', 'member:remove',
    'budget:read', 'budget:write',
    'comment:read', 'comment:write', 'comment:delete'
  ],
  member: [
    'project:read',
    'task:read', 'task:write',
    'member:read',
    'budget:read',
    'comment:read', 'comment:write'
  ],
  viewer: [
    'project:read',
    'task:read',
    'member:read',
    'comment:read'
  ]
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: ProjectRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if a user can perform an action based on their role
 */
export function canPerform(role: ProjectRole, action: Permission): boolean {
  return hasPermission(role, action);
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(role: ProjectRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Validate if a role is valid
 */
export function isValidRole(role: string): role is ProjectRole {
  return ['owner', 'admin', 'member', 'viewer'].includes(role);
}

/**
 * Check if user can assign tasks (only to project members)
 * This adds an extra security layer beyond basic permissions
 */
export function canAssignTaskToUser(
  assignerRole: ProjectRole, 
  assigneeUserId: string, 
  projectMemberIds: string[]
): boolean {
  // Must have permission to assign tasks
  if (!hasPermission(assignerRole, 'task:assign')) {
    return false;
  }
  
  // Can only assign to project members (SECURITY: No external assignments)
  return projectMemberIds.includes(assigneeUserId);
}

/**
 * Check if user can modify budget (admin/owner only)
 */
export function canModifyBudget(role: ProjectRole): boolean {
  return hasPermission(role, 'budget:write');
}

/**
 * Check if user can view budget (members can read, admin/owner can write)
 */
export function canViewBudget(role: ProjectRole): boolean {
  return hasPermission(role, 'budget:read');
}

/**
 * Security helper: Ensure only project members can chat
 */
export function canParticipateInProjectChat(
  userId: string, 
  projectMemberIds: string[]
): boolean {
  return projectMemberIds.includes(userId);
} 