import { useState } from 'react';
import LoadingAnimation from '../components/LoadingAnimation';

const TestLoading = () => {
    const [showLoading, setShowLoading] = useState(true);



    if (showLoading) {
        return <LoadingAnimation />;
    }

    return (
        <div className="w-screen min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-4">Loading Complete!</h1>
            <p className="text-gray-400">The Lottie animation was displayed for 5 seconds.</p>
            <button
                onClick={() => setShowLoading(true)}
                className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
                Test Again
            </button>
        </div>
    );
};

export default TestLoading;
