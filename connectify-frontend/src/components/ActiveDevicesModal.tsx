import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { sendWebSocketMessage } from '../api/websocket';
import { X, Monitor, Smartphone, Laptop } from 'lucide-react';

interface ActiveDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActiveDevicesModal: React.FC<ActiveDevicesModalProps> = ({ isOpen, onClose }) => {
  const activeDevices = usePlayerStore((state) => state.activeDevices);
  const deviceId = usePlayerStore((state) => state.deviceId);
  const activeDeviceId = usePlayerStore((state) => state.activeDeviceId);

  if (!isOpen) return null;

  const handlePlayHere = (targetDeviceId: string) => {
    const isCurrentlyActive = deviceId === activeDeviceId;
    let currentPosition = usePlayerStore.getState().position;

    // If this device is currently active/playing, get the live position from the audio element
    // because the store position may be stale (it's not updated to prevent drift)
    if (isCurrentlyActive) {
      const audioElement = document.querySelector('audio');
      if (audioElement && !isNaN(audioElement.currentTime)) {
        currentPosition = Math.floor(audioElement.currentTime * 1000);
      }
    }

    sendWebSocketMessage('device:set_active', {
      device_id: targetDeviceId,
      position: currentPosition
    });
  };

  const getDeviceIcon = (deviceName: string) => {
    const lowerName = deviceName.toLowerCase();
    if (lowerName.includes('mobile')) {
      return <Smartphone className="w-5 h-5" />;
    } else if (lowerName.includes('desktop') || lowerName.includes('laptop')) {
      return <Laptop className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Active Devices</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Device List */}
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
            {activeDevices.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No active devices</p>
            ) : (
              <div className="space-y-2">
                {activeDevices.map((device) => {
                  const isCurrentDevice = device.id === deviceId;
                  const isPlaying = device.id === activeDeviceId;

                  return (
                    <div
                      onClick={() => !isPlaying ? handlePlayHere(device.id) : undefined}
                      key={device.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${isPlaying
                        ? 'bg-green-900 bg-opacity-30 border border-green-500'
                        : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-300">
                          {getDeviceIcon(device.name)}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {device.name}
                            {isCurrentDevice && (
                              <span className="ml-2 text-xs text-blue-400 font-normal">
                                (This Device)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isPlaying && (
                          <>
                            <div className="flex space-x-1">
                              <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                              <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                              <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                            <span className="text-xs text-green-400 font-medium">
                              Playing
                            </span>
                          </>
                        )}

                        {/* {!isPlaying && (
                          <button
                            onClick={() => handlePlayHere(device.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            Play Here
                          </button>
                        )} */}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-750">
            <p className="text-sm text-gray-400 text-center">
              {activeDevices.length} {activeDevices.length === 1 ? 'device' : 'devices'} connected
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActiveDevicesModal;
