import { useEffect, RefObject } from "react";

// Hook to add double-click skip and hold-to-2x-speed behavior
export function useVideoInteractions(videoRef: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let holdTimer: ReturnType<typeof setTimeout> | null = null;

    const startHold = () => {
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (video) video.playbackRate = 2;
      }, 300);
    };

    const endHold = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      if (video && video.playbackRate !== 1) {
        video.playbackRate = 1;
      }
    };

    const handleDblClick = (e: MouseEvent) => {
      if (!video) return;
      const rect = video.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const half = rect.width / 2;
      if (x < half) {
        video.currentTime = Math.max(0, video.currentTime - 10);
      } else {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
      }
    };

    video.addEventListener("dblclick", handleDblClick);
    video.addEventListener("mousedown", startHold);
    video.addEventListener("mouseup", endHold);
    video.addEventListener("mouseleave", endHold);
    video.addEventListener("touchstart", startHold);
    video.addEventListener("touchend", endHold);
    video.addEventListener("touchcancel", endHold);

    return () => {
      video.removeEventListener("dblclick", handleDblClick);
      video.removeEventListener("mousedown", startHold);
      video.removeEventListener("mouseup", endHold);
      video.removeEventListener("mouseleave", endHold);
      video.removeEventListener("touchstart", startHold);
      video.removeEventListener("touchend", endHold);
      video.removeEventListener("touchcancel", endHold);
    };
  }, [videoRef]);
}
