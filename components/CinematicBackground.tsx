import React, { useEffect, useRef, useState } from 'react';
import { MatrixBackground } from './MatrixBackground';

interface CinematicBackgroundProps {
  videoBlob: Blob | null;
  isActive: boolean;
}

export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ videoBlob, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (videoBlob) {
        const url = URL.createObjectURL(videoBlob);
        setCurrentUrl(url);
        return () => URL.revokeObjectURL(url);
    } else {
        setCurrentUrl(null);
    }
  }, [videoBlob]);

  useEffect(() => {
    if (videoRef.current && currentUrl) {
        videoRef.current.load();
        videoRef.current.play().catch(e => console.log("Video Play Error (Autoplay restricted?):", e));
        setOpacity(1); // Fade in
    } else {
        setOpacity(0); // Fade out if no video
    }
  }, [currentUrl]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Fallback Matrix Background - Always there, bottom layer */}
        <MatrixBackground />
        
        {/* Veo Video Layer */}
        {currentUrl && (
            <video
                ref={videoRef}
                src={currentUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out mix-blend-screen opacity-60"
                style={{ opacity: isActive ? 0.6 : 0 }} 
            />
        )}
        
        {/* Vignette Overlay to blend edges */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/90 pointer-events-none"></div>
    </div>
  );
};