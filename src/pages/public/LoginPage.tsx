import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const { login, loading, error } = useAuthContext();
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await login(credentials);

      success('Login successful!');

      // Redirect based on role
      switch (result.user.role) {
        case 'technician':
          navigate('/technician');
          break;
        case 'supervisor':
          navigate('/supervisor');
          break;
        case 'diesel_manager':
          navigate('/diesel');
          break;
        case 'data_collector':
          navigate('/data-collector');
          break;
        case 'operations':
          navigate('/operations');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      showError(error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Grato Telecoms</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            placeholder="Enter your email"
            required
            fullWidth
          />

          <Input
            label="Password"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            placeholder="Enter your password"
            required
            fullWidth
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact your administrator
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;