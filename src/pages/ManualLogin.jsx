import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, Sparkles, AlertTriangle, Loader2, Home } from 'lucide-react';
import { apiClient } from '@/apis/client';
import { createPageUrl } from '../utils';

export default function ManualLogin() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const nextUrl = searchParams.get('next');

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const isAuth = await apiClient.auth.isAuthenticated();
        if (isAuth) {
          // Already logged in, redirect to next URL or home
          navigate(nextUrl || createPageUrl('Tools'));
        }
      } catch (err) {
        // Not authenticated, stay on login page
      }
    };
    
    checkAuth();
  }, [navigate, nextUrl]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try automatic redirect
      await apiClient.auth.redirectToLogin(nextUrl);
    } catch (err) {
      setError('Automatic redirect failed. Please try again or contact support.');
      console.error('Login redirect failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-2xl w-fit">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to Prompt Hub
          </CardTitle>
          <CardDescription>
            Sign in to access your prompts, personas, and AI tools
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/30 h-12 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Redirecting to login...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </>
            )}
          </Button>

          <div className="text-center">
            <span className="text-sm text-gray-500">or</span>
          </div>

          <a href={`/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`} className="block">
            <Button variant="outline" className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Direct Login Link
            </Button>
          </a>

          <div className="text-center text-sm text-gray-500 pt-2">
            <p>New to Prompt Hub?</p>
            <p className="mt-1">Create an account through the sign-in process</p>
          </div>

          {nextUrl && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800 text-xs">
                You'll be redirected to: <code className="bg-blue-100 px-1 py-0.5 rounded">{nextUrl}</code>
              </AlertDescription>
            </Alert>
          )}

          <div className="border-t pt-4">
            <Link to={createPageUrl('Tools')}>
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-xs">
              <strong>Fallback Login Page:</strong> Use this page if automatic login redirect fails. 
              Access via <code className="bg-yellow-100 px-1 py-0.5 rounded">/ManualLogin</code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
