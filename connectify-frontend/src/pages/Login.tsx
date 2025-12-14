import React, { useState, useEffect } from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [showSignUp, setShowSignUp] = useState(false);
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      navigate('/');
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="w-[100vw] min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
        {showSignUp ? (
          <>
            <SignUp
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                  card: 'bg-gray-800',
                  headerTitle: 'text-white',
                  headerSubtitle: 'text-gray-400',
                  formFieldLabel: 'text-white',
                  formFieldInput: 'bg-gray-700 text-white border-gray-600',
                  footerActionLink: 'text-blue-400'
                }
              }}
            />
            <button
              onClick={() => setShowSignUp(false)}
              className="mt-4 w-full text-center text-blue-400 hover:text-blue-300 text-sm"
            >
              Already have an account? Sign in
            </button>
          </>
        ) : (
          <>
            <SignIn
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                  card: 'bg-gray-800',
                  headerTitle: 'text-white',
                  headerSubtitle: 'text-gray-400',
                  formFieldLabel: 'text-white',
                  formFieldInput: 'bg-gray-700 text-white border-gray-600',
                  footerActionLink: 'text-blue-400'
                }
              }}
            />
            <button
              onClick={() => setShowSignUp(true)}
              className="mt-4 w-full text-center text-blue-400 hover:text-blue-300 text-sm"
            >
              Don't have an account? Sign up
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
