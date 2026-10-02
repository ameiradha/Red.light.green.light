import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface BackgroundMusicPlayerProps {
  isTeacherPanel: boolean; // true = in teacher control panel, false = in game
  isPaused: boolean;
  soundEnabled: boolean;
  volume?: number; // 0 to 100
}

const TEACHER_PANEL_VIDEO_ID = 'q7uTnxYFDSw'; // https://youtu.be/q7uTnxYFDSw
const GAMEPLAY_VIDEO_ID = '7lkTqbH3WaI';       // https://youtu.be/7lkTqbH3WaI

export const BackgroundMusicPlayer: React.FC<BackgroundMusicPlayerProps> = ({
  isTeacherPanel,
  isPaused,
  soundEnabled,
  volume = 40,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const currentVideoIdRef = useRef<string>(isTeacherPanel ? TEACHER_PANEL_VIDEO_ID : GAMEPLAY_VIDEO_ID);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const activeVideoId = isTeacherPanel ? TEACHER_PANEL_VIDEO_ID : GAMEPLAY_VIDEO_ID;
  const shouldPlay = soundEnabled && (!isTeacherPanel ? !isPaused : true);

  // 1. Load YouTube IFrame API script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      setIsApiReady(true);
    };
  }, []);

  // 2. Initialize YouTube Player
  useEffect(() => {
    if (!isApiReady || !containerRef.current || playerRef.current) return;

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '10',
        width: '10',
        videoId: activeVideoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          loop: 1,
          playlist: activeVideoId,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            currentVideoIdRef.current = activeVideoId;
            try {
              event.target.setVolume(volume);
              if (shouldPlay) {
                event.target.unMute();
                event.target.playVideo();
              } else {
                event.target.pauseVideo();
              }
            } catch (err) {
              console.warn('YouTube onReady interaction notice:', err);
            }
          },
          onStateChange: (event: any) => {
            // State 0 = ENDED -> loop infinitely
            if (event.data === 0) {
              try {
                event.target.seekTo(0);
                event.target.playVideo();
              } catch (err) {
                console.warn('YouTube loop error:', err);
              }
            }
          },
          onError: (err: any) => {
            console.warn('YouTube player error:', err);
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize YouTube player:', e);
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [isApiReady]);

  // 3. Switch Track between Teacher Panel (q7uTnxYFDSw) and Gameplay (7lkTqbH3WaI)
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;

    try {
      if (currentVideoIdRef.current !== activeVideoId) {
        currentVideoIdRef.current = activeVideoId;
        if (playerRef.current.loadVideoById) {
          playerRef.current.loadVideoById({
            videoId: activeVideoId,
            startSeconds: 0,
          });
        }
      }

      if (shouldPlay) {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (err) {
      console.warn('Error changing track:', err);
    }
  }, [activeVideoId, shouldPlay, volume, isPlayerReady]);

  // 4. User Interaction helper to unlock browser audio policy
  useEffect(() => {
    const handleUnlockAudio = () => {
      if (isPlayerReady && playerRef.current && shouldPlay) {
        try {
          const state = playerRef.current.getPlayerState();
          if (state !== 1) { // Not playing
            playerRef.current.unMute();
            playerRef.current.setVolume(volume);
            playerRef.current.playVideo();
          }
        } catch (e) {
          // Ignore
        }
      }
    };

    window.addEventListener('click', handleUnlockAudio, { once: false });
    window.addEventListener('keydown', handleUnlockAudio, { once: false });

    return () => {
      window.removeEventListener('click', handleUnlockAudio);
      window.removeEventListener('keydown', handleUnlockAudio);
    };
  }, [isPlayerReady, shouldPlay, volume]);

  return (
    <div
      aria-hidden="true"
      className="fixed -left-[9999px] -top-[9999px] w-1 h-1 pointer-events-none opacity-0 overflow-hidden"
    >
      <div ref={containerRef} />
    </div>
  );
};
