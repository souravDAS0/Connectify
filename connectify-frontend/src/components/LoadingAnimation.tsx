import Lottie from 'react-lottie';
import animationData from '../assets/loading.json';




const LoadingAnimation = () => {
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid meet"
        }
    };

    return (
        <div className="w-screen min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
            <div className="w-[60px] h-[60px] md:w-[100px] md:h-[100px]">

                <Lottie
                    options={defaultOptions}
                />
            </div>

        </div>
    );
};

export default LoadingAnimation;
