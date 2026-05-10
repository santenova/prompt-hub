import { apiClient } from '@/apis/client';

/**
 * Log user activity
 * @param {Object} params - Activity parameters
 * @param {string} params.action - Action type: 'create', 'update', 'delete', 'view', 'export', 'share', 'login', 'logout'
 * @param {string} params.entityType - Entity type (e.g., 'Template', 'Persona', 'Project')
 * @param {string} params.entityId - Entity ID (optional for some actions)
 * @param {string} params.entityName - Entity name/title for display
 * @param {Object} params.details - Additional details about the action
 */
export async function logActivity({ action, entityType, entityId, entityName, details = {} }) {
  try {
    const user = await apiClient.auth.me();
    
    if (!user) {
      console.warn('Cannot log activity: user not authenticated');
      return;
    }

    await apiClient.entities.ActivityLog.create({
      user_email: user.email,
      user_name: user.full_name || user.email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      details,
      ip_address: 'N/A', // Browser cannot directly access IP
      user_agent: navigator.userAgent
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
