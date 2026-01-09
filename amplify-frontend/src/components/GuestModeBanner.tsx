import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const GuestModeBanner = () => {
    return (
        <div className="w-full bg-blue-900/30 border-b border-blue-800/50">
            <div className="px-4 py-2 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <Info size={18} className="text-blue-200 flex-shrink-0" />
                    <p className="text-blue-100 text-sm">
                        Sign in to sync across devices
                    </p>
                </div>
                <Link
                    to="/login"
                    className="px-4 py-1.5 text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-800/50 rounded-md transition-colors"
                >
                    Sign In
                </Link>
            </div>
        </div>
    );
};

export default GuestModeBanner;
