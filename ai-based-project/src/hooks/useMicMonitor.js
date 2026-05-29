import { useState, useEffect } from 'react';

export function useMicMonitor(stream) {
  const [isMicActive, setIsMicActive] = useState(!!stream);
  const [lastError, setLastError] = useState(null);

  useEffect(() => {
    if (!stream) {
      setIsMicActive(false);
      return;
    }

    const checkMic = () => {
      try {
        const tracks = stream.getAudioTracks();
        if (!tracks || tracks.length === 0) {
          setIsMicActive(false);
          setLastError("No audio tracks found.");
          return;
        }
        
        const track = tracks[0];
        // 'ended' means the track has ended (e.g. device disconnected, permission revoked)
        if (track.readyState === 'ended') {
          setIsMicActive(false);
          setLastError("Microphone disconnected or permission revoked.");
        } else {
          setIsMicActive(true);
          setLastError(null);
        }
      } catch (err) {
        setIsMicActive(false);
        setLastError(err.message || "Unknown error accessing microphone");
      }
    };

    // Initial check
    checkMic();

    // Check every 3 seconds
    const interval = setInterval(checkMic, 3000);

    // Also listen to the 'ended' event on the track for immediate detection
    const track = stream.getAudioTracks()[0];
    const handleEnded = () => {
      setIsMicActive(false);
      setLastError("Microphone disconnected or permission revoked.");
    };
    if (track) {
      track.addEventListener('ended', handleEnded);
    }

    return () => {
      clearInterval(interval);
      if (track) {
        track.removeEventListener('ended', handleEnded);
      }
    };
  }, [stream]);

  return { isMicActive, lastError };
}
