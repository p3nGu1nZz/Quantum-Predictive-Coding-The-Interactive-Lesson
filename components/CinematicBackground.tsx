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
  
  // Refs to manage video elements and blob comparison
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null]);
  const currentBlobRef = useRef<Blob | null>(null);
  
  useEffect(() => {
    // 1. Check if the blob has actually changed.
    // Use strictly equal reference check or size/type check if strictly equal fails (though blobs usually stable if from state)
    if (videoBlob === currentBlobRef.current) {
        return; 
    }
    
    // 2. If it's a new blob (or null)
    currentBlobRef.current = videoBlob;

    if (videoBlob) {
        const newUrl = URL.createObjectURL(videoBlob);
        
        // Determine which track is currently "inactive" (hidden)
        // If active is 0, we load into 1. If active is 1, we load into 0.
        const nextIndex = activeTrackIndex === 0 ? 1 : 0;
        
        setTracks(prev => {
            const newTracks = [...prev] as [string | null, string | null];
            // Revoke old URL to free memory, but ONLY if it's not the one currently visible
            // (Actually, we are replacing the slot 'nextIndex', so whatever was there is gone now)
            if (newTracks[nextIndex]) {
                URL.revokeObjectURL(newTracks[nextIndex]!);
            }
            newTracks[nextIndex] = newUrl;
            return newTracks;
        });

        // The actual switch of "activeTrackIndex" happens once the new video emits 'canplay'
    } else {
        // If blob is null, we do NOT clear the current video immediately to avoid a black flash.
        // We just let the current video persist or we could fade it out if we wanted "no video" state.
        // For this app, preserving the last vibe is better than a black screen.
    }
  }, [videoBlob, activeTrackIndex]);

  const handleCanPlay = (index: number) => {
      // Only trigger swap if this is the pending track (the one we just loaded)
      const pendingIndex = activeTrackIndex === 0 ? 1 : 0;
      
      if (index === pendingIndex) {
          const videoEl = videoRefs.current[index];
          if (videoEl) {
              // Try to play
              const playPromise = videoEl.play();
              if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                        // Once playing, switch focus to this track
                        setActiveTrackIndex(pendingIndex); 
                    })
                    .catch(e => console.log("Auto-play blocked or interrupted", e));
              }
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
                preload="auto"
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
                preload="auto"
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