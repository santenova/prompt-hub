import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, Edit, MessageSquare } from "lucide-react";

export default function PermissionGuard({ 
  template, 
  currentUser, 
  requiredPermission = 'view',
  children,
  fallback 
}) {
  if (!currentUser) {
    return fallback || (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Please sign in to access this template.
        </AlertDescription>
      </Alert>
    );
  }

  // Owner has all permissions
  if (template.created_by === currentUser.email) {
    return <>{children}</>;
  }

  // Check if template is public
  const isPublic = template.is_public || template.visibility === 'public';
  
  // Get user's permission level
  const userPermission = template.user_permissions?.[currentUser.email] || 
                        (template.shared_with?.includes(currentUser.email) ? 'view' : null);

  // Public templates: view only by default, unless user has explicit permission
  if (isPublic && !userPermission) {
    if (requiredPermission === 'view') {
      return <>{children}</>;
    }
    return fallback || (
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>
          This is a public template. You can view and copy it, but you need explicit permission to {requiredPermission}.
        </AlertDescription>
      </Alert>
    );
  }

  // Not shared with user
  if (!userPermission && !isPublic) {
    return fallback || (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this template.
        </AlertDescription>
      </Alert>
    );
  }

  // Permission hierarchy: edit > contribute > view
  const permissionLevels = {
    view: 1,
    contribute: 2,
    edit: 3
  };

  const hasPermission = permissionLevels[userPermission] >= permissionLevels[requiredPermission];

  if (!hasPermission) {
    const permissionIcons = {
      view: Eye,
      contribute: MessageSquare,
      edit: Edit
    };
    const Icon = permissionIcons[requiredPermission];

    return fallback || (
      <Alert>
        <Icon className="h-4 w-4" />
        <AlertDescription>
          You need '{requiredPermission}' permission to perform this action. 
          Your current permission: '{userPermission}'.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}