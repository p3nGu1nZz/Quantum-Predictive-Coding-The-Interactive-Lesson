import React, { useEffect, useRef, useState } from 'react';
import { MatrixBackground } from './MatrixBackground';

interface CinematicBackgroundProps {
  videoBlob: Blob | null;
  isActive: boolean;
}

export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ videoBlob, isActive }) => {
  // We use two video tracks to cross-fade between clips smoothly
  const [tracks, setTracks] = useState<[string | null, string | null]>([null, null]);
  const [activeTrackIndex, setActiveTrackIndex] = useState<0 | 1>(0);
  const [fading, setFading] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null]);
  
  // Track the current Blob URL to prevent unnecessary re-renders
  const lastBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (videoBlob) {
        const newUrl = URL.createObjectURL(videoBlob);
        
        // Don't update if it's the exact same object (though Blob objects change ref, we handle cleanup)
        // In a real app we might compare IDs, but here we assume new blob = new clip
        
        setFading(true);
        
        // Update the *inactive* track
        const nextIndex = activeTrackIndex === 0 ? 1 : 0;
        
        setTracks(prev => {
            const newTracks = [...prev] as [string | null, string | null];
            // Revoke old URL to free memory
            if (newTracks[nextIndex]) URL.revokeObjectURL(newTracks[nextIndex]!);
            newTracks[nextIndex] = newUrl;
            return newTracks;
        });

        // The actual switch of "activeTrackIndex" happens once the new video emits 'canplay'
        // This is handled in the onCanPlay handler of the video element
        
    } else {
        // If blob is null, we might want to fade to black or matrix
        // For now, we just let the last frame linger or fade out
    }
  }, [videoBlob]); // Intentionally not including activeTrackIndex to avoid loops

  const handleCanPlay = (index: number) => {
      // Only trigger swap if this is the pending track
      const pendingIndex = activeTrackIndex === 0 ? 1 : 0;
      if (index === pendingIndex) {
          const videoEl = videoRefs.current[index];
          if (videoEl) {
              videoEl.play().catch(e => console.log("Auto-play blocked", e));
              setActiveTrackIndex(pendingIndex); // Trigger the CSS Fade
              setTimeout(() => setFading(false), 1000); // Reset fading state after transition
          }
      }
  };

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-black">
        {/* Fallback Matrix Background - Always there, bottom layer */}
        <MatrixBackground />
        
        {/* Track 0 */}
        {tracks[0] && (
            <video
                ref={el => { videoRefs.current[0] = el; }}
                src={tracks[0]}
                autoPlay
                loop
                muted
                playsInline
                onCanPlay={() => handleCanPlay(0)}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out mix-blend-screen"
                style={{ opacity: isActive && activeTrackIndex === 0 ? 0.6 : 0 }} 
            />
        )}

        {/* Track 1 */}
        {tracks[1] && (
            <video
                ref={el => { videoRefs.current[1] = el; }}
                src={tracks[1]}
                autoPlay
                loop
                muted
                playsInline
                onCanPlay={() => handleCanPlay(1)}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out mix-blend-screen"
                style={{ opacity: isActive && activeTrackIndex === 1 ? 0.6 : 0 }} 
            />
        )}
        
        {/* Vignette Overlay to blend edges */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/90 pointer-events-none"></div>
    </div>
  );
};