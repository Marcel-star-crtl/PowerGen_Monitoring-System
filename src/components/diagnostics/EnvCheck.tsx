import React, { useEffect } from 'react';

/**
 * Diagnostic component to check environment variables
 * This should be removed in production
 */
export const EnvCheck: React.FC = () => {
  useEffect(() => {
    console.group('🔍 Environment Variables Check');
    console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('REACT_APP_UPLOAD_URL:', process.env.REACT_APP_UPLOAD_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('All REACT_APP_ vars:', Object.keys(process.env)
      .filter(key => key.startsWith('REACT_APP_'))
      .reduce((obj: any, key) => {
        obj[key] = process.env[key];
        return obj;
      }, {})
    );
    console.groupEnd();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'black',
      color: 'lime',
      padding: '10px',
      fontSize: '10px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      borderRadius: '4px'
    }}>
      <div>API: {process.env.REACT_APP_API_URL || '❌ NOT SET'}</div>
      <div>UPLOAD: {process.env.REACT_APP_UPLOAD_URL || '❌ NOT SET'}</div>
    </div>
  );
};
