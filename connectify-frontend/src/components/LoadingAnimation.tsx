import Lottie from 'react-lottie';
import animationData from '../assets/logo_pulse.json';



const LoadingAnimation = () => {
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice"
        }
    };

    return (
        <div className="w-screen min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
            <Lottie
                options={defaultOptions}
                height={400}
                width={400}
            />
            <p className="mt-4 text-gray-400 text-lg">Loading...</p>
        </div>
    );
};

export default LoadingAnimation;
