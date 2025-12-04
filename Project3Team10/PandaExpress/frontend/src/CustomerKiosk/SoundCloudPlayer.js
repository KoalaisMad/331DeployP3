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

    const iframeRef = useRef(null);
    const playerInstance = useRef(null);

    // Default playlist if none provided
    const defaultPlaylist = 'https://api.soundcloud.com/playlists/soundcloud:playlists:2118920390';
    const playlist = playlistUrl && playlistUrl !== 'https://w.soundcloud.com/player/api.js' ? playlistUrl : defaultPlaylist;
    const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(playlist)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=false&show_reposts=false&show_teaser=true&visual=true`;

    useEffect(() => {
        setIframeLoaded(false);
    }, [playlistUrl]);


    // Initialize and manage SoundCloud Widget
    useEffect(() => {
        let player = null;

        if(isLoaded && iframeLoaded && iframeRef.current){
            player = window.SC.Widget(iframeRef.current);
            playerInstance.current = player;
            player.bind(window.SC.Widget.Events.READY, function() {
                console.log("Playing music");
                player.play();
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
        <div>
            <iframe ref={iframeRef} width="100%" height="300" scrolling="no" frameborder="no" src={src} onLoad={() => setIframeLoaded(true)}></iframe><div style={{
                fontSize: '10px',
                color: '#cccccc',
                lineBreak: 'anywhere',
                wordBreak: 'normal',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                fontFamily: 'Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif',
                fontWeight: 100
            }}><a href="https://soundcloud.com/andrewb27" title="Andythedinosaur21 21" target="_blank"
                style={{
                    color: '#cccccc',
                    textDecoration: 'none'
                }}></a> · <a
                    href="https://soundcloud.com/andrewb27/sets/panda-express"
                    title="Panda Express"
                    target="_blank"
                    style={{
                        color: '#cccccc',
                        textDecoration: 'none' // <-- Corrected to camelCase
                    }}
                >
                    Panda Express
                </a></div>
        </div>
    );
};

export default SoundCloudPlayer;