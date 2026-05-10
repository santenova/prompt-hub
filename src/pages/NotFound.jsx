import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function NotFound() {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    navigate(createPageUrl('Templates'), { replace: true });
  }, [navigate]);

  return null;
}