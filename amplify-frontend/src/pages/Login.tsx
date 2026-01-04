import React, { useEffect } from 'react';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { dark } from '@clerk/themes';

const Login: React.FC = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      navigate('/');
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="w-[100vw] min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <SignIn
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#1f2937',
            colorInputBackground: '#374151',
            colorInputText: '#ffffff',
            colorText: '#ffffff',
            colorTextSecondary: '#9ca3af',
            colorDanger: '#ef4444',
            borderRadius: '0.5rem',
          },
        }}
        signUpUrl="/signup"
      />
    </div>
  );
};

export default Login;
