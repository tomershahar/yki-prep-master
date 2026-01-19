import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";

export default function AudioPlayer({ 
  audioBase64, 
  className = "" 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  // Effect to handle setting the audio source and resetting state
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      // Reset state for new audio source
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setError(null);

      // Clean up previous blob URL if it exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }

      if (audioBase64) {
        try {
          // Handle both data URI and raw base64
          let base64Data = audioBase64;
          if (audioBase64.includes('data:audio')) {
            // Extract base64 data after the comma
            base64Data = audioBase64.split(',')[1];
          }
          
          // Convert base64 to Blob URL for better performance
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'audio/mp3' });
          const blobUrl = URL.createObjectURL(blob);
          
          blobUrlRef.current = blobUrl;
          audio.src = blobUrl;
          audio.load();
        } catch (err) {
          console.error('Failed to convert audio:', err);
          setError('Failed to load audio');
        }
      } else {
        // If no audio, clear the source
        audio.removeAttribute('src');
        audio.load();
      }
    }

    // Cleanup on unmount or when audioBase64 changes
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [audioBase64]); // This effect runs whenever the audioBase64 prop changes

  // Effect to manage audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      // Ensure duration is a valid number before setting
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = (e) => {
      console.error('Audio error:', e);
      let errorMessage = 'Failed to load audio.';
      if (audio.error) {
        switch (audio.error.code) {
          case 1: errorMessage = 'Audio request aborted.'; break;
          case 2: errorMessage = 'A network error caused the audio to fail.'; break;
          case 3: errorMessage = 'The audio could not be decoded.'; break;
          case 4: errorMessage = 'The audio is not supported.'; break;
          default: errorMessage = 'An unknown audio error occurred.'; break;
        }
      }
      setError(errorMessage);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []); // Listeners are attached once to the audio element instance

  const handlePlayPause = async () => {
    if (!audioBase64) {
      setError('No audio available');
      return;
    }

    const audio = audioRef.current;
    if (!audio || !audio.src) {
      setError('Audio player not ready');
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        if (audio.ended) {
          audio.currentTime = 0;
        }
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Play error:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      if (isPlaying) {
        audio.play();
      }
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || time < 0) return "0:00";
    
    const totalSeconds = Math.floor(time);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <audio ref={audioRef} preload="metadata" />
      
      {error && (
        <div className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handlePlayPause}
            disabled={!audioBase64 || !!error}
            size="lg"
            className="flex items-center gap-2 min-w-[120px]"
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Play
              </>
            )}
          </Button>
          
          <Button
            onClick={handleRestart}
            disabled={!audioBase64 || !!error}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </Button>
        </div>
        
        <div className="flex items-center gap-3 text-gray-600">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <span className="font-mono text-lg">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
      
      {duration > 0 && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}