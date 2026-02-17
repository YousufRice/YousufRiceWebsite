import { NextRequest, NextResponse } from 'next/server';
import { account } from './appwrite';

// Detect if we're in a build environment
const isBuildTime = () => {
  return process.env.NODE_ENV === 'production' && typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build';
};

/**
 * Utility function to check admin permissions for API routes
 * @param req - Next.js request object
 * @param requireWriteAccess - Whether write access is required (admin label)
 * @returns NextResponse error or null if authorized
 */
export async function checkAdminPermissions(
  req: NextRequest,
  requireWriteAccess = false
): Promise<NextResponse | null> {
  // Skip authentication during build time
  if (isBuildTime()) {
    console.log('Build-time auth check, skipping');
    return null;
  }
  
  try {
    const user = await account.get();
    const hasAdminLabel = user.labels?.includes('admin');
    const hasReadOnlyLabel = user.labels?.includes('readonly');
    
    // For write operations, require admin label
    if (requireWriteAccess && !hasAdminLabel) {
      return NextResponse.json(
        { 
          error: 'Write access denied',
          message: 'You have read-only access and cannot perform this action'
        },
        { status: 403 }
      );
    }
    
    // For read operations, require either admin or readonly label
    if (!hasAdminLabel && !hasReadOnlyLabel) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // User is authorized
    return null;
  } catch (error) {
    console.error('Auth error:', error);
    
    // During build time, don't return an error
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
      console.log('Build-time auth check, skipping');
      return null;
    }
    
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}

/**
 * Check if the request is a mutation (POST, PUT, PATCH, DELETE)
 * @param req - Next.js request object
 * @returns boolean
 */
export function isMutationRequest(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

/**
 * Middleware to protect API routes with admin permissions
 * @param handler - API route handler
 * @returns Handler function
 */
export function withAdminAuth(handler: Function) {
  return async function(req: NextRequest) {
    // For mutation requests, require write access
    const requireWriteAccess = isMutationRequest(req);
    
    // Check permissions
    const authError = await checkAdminPermissions(req, requireWriteAccess);
    if (authError) {
      return authError;
    }
    
    // User is authorized, proceed with the handler
    return handler(req);
  };
}
