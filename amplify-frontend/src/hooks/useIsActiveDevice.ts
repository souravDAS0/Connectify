import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePlayerStore } from "../store/usePlayerStore";

/**
 * Hook to determine if the current device should be the active playback device.
 *
 * Returns true when:
 * 1. User is not authenticated (guest mode - local playback only)
 * 2. Only one device is connected (must be this one)
 * 3. This device matches the active device ID from server
 *
 * This matches the Flutter implementation logic.
 */
export const useIsActiveDevice = (): boolean => {
  const { user } = useAuth();
  const deviceId = usePlayerStore((state) => state.deviceId);
  const activeDeviceId = usePlayerStore((state) => state.activeDeviceId);
  const activeDevices = usePlayerStore((state) => state.activeDevices);

  return useMemo(() => {
    // If not authenticated, this device is always active (guest mode - local playback)
    if (!user) {
      return true;
    }

    // If we don't have a device ID yet, can't be active
    if (!deviceId) {
      return false;
    }

    // If only one device exists (or none), this device is active
    if (activeDevices.length <= 1) {
      return true;
    }

    // Multiple devices: check if this device is the designated active one
    return deviceId === activeDeviceId;
  }, [user, deviceId, activeDeviceId, activeDevices.length]);
};
