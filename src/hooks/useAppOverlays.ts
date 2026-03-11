import { useCallback, useState } from "react";

export type OverlayKey = "help" | "datePicker";

type OverlayState = Record<OverlayKey, boolean>;

const INITIAL_OVERLAY_STATE: OverlayState = {
  help: false,
  datePicker: false,
};

export const useAppOverlays = () => {
  const [overlays, setOverlays] = useState<OverlayState>(INITIAL_OVERLAY_STATE);

  const openOverlay = useCallback((overlay: OverlayKey) => {
    setOverlays((current) => ({ ...current, [overlay]: true }));
  }, []);

  const closeOverlay = useCallback((overlay: OverlayKey) => {
    setOverlays((current) => ({ ...current, [overlay]: false }));
  }, []);

  const toggleOverlay = useCallback((overlay: OverlayKey) => {
    setOverlays((current) => ({ ...current, [overlay]: !current[overlay] }));
  }, []);

  const closeAllOverlays = useCallback(() => {
    setOverlays(INITIAL_OVERLAY_STATE);
  }, []);

  return {
    overlays,
    openOverlay,
    closeOverlay,
    toggleOverlay,
    closeAllOverlays,
  };
};
