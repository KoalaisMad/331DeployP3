import React, {useEffect, useRef, useState} from 'react';

const SCRIPT_URL = 'https://w.soundcloud.com/player/api.js';


// Custom hook to load SoundCloud Widget API script
const useSoundCloudScript = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Load the SoundCloud Widget API script
    useEffect(() => {
        if(typeof window.SC !== 'undefined') {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = SCRIPT_URL;
        script.async = true;

        script.onload = () => {
            setIsLoaded(true);
        };

        document.body.appendChild(script);

        return () => {
            if(document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);  

        return isLoaded;
};

// SoundCloud Player Component
const SoundCloudPlayer = ({playlistUrl}) => {
    const isLoaded = useSoundCloudScript();
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [minimized, setMinimized] = useState(true);

    const iframeRef = useRef(null);
    const playerInstance = useRef(null);

    // Default playlist if none provided
    const defaultPlaylist = 'https://api.soundcloud.com/playlists/soundcloud:playlists:2118920390';
    const playlist = playlistUrl && playlistUrl !== 'https://w.soundcloud.com/player/api.js' ? playlistUrl : defaultPlaylist;
    const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(playlist)}&color=%23E21B24&auto_play=false&hide_related=false&show_comments=true&show_user=false&show_reposts=false&show_teaser=true&visual=true`;

    useEffect(() => {
        setIframeLoaded(false);
    }, [playlistUrl]);


    // Manage SoundCloud Widget
    useEffect(() => {
        let player = null;

        if(isLoaded && iframeLoaded && iframeRef.current){
            player = window.SC.Widget(iframeRef.current);
            playerInstance.current = player;
            player.bind(window.SC.Widget.Events.READY, function() {
                console.log("SoundCloud player ready");
            });

            player.bind(window.SC.Widget.Events.FINISH, function() {
                player.getCurrentSoundIndex(function(index) {
                    player.skip(0);
                    player.play();
                    console.log("Reset to start of playlist");
                });
            });
        }

        return () => {
            try {
                if(playerInstance.current) {
                    playerInstance.current.unbind();
                }
            } catch (e) {
                console.warn('Error unbinding SoundCloud player:', e);
            }
            playerInstance.current = null;
        };
    }, [isLoaded, iframeLoaded, playlistUrl]);

    return (
        <div className="music-player-container">
            {minimized ? (
                <button
                    onClick={() => setMinimized(false)}
                    className="music-player-minimized"
                    aria-label="Restore Music Player"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                        <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
                    </svg>
                </button>
            ) : null}
            <div className="music-player-expanded" style={{display: minimized ? 'none' : 'block'}}>
                <div className="music-player-header">
                    <span style={{color: 'white', fontWeight: 600}}>Music Player</span>
                    <button
                        onClick={() => setMinimized(true)}
                        className="music-player-minimize-btn"
                        aria-label="Minimize Music Player"
                    >
                        Minimize
                    </button>
                </div>
                <iframe 
                    ref={iframeRef} 
                    width="100%" 
                    height="300" 
                    scrolling="no" 
                    frameBorder="no" 
                    src={src} 
                    onLoad={() => setIframeLoaded(true)}
                    title="SoundCloud Player"
                />
            </div>
        </div>
    );
};

export default SoundCloudPlayer;