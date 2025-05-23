// Player script to handle mobile interactions and prevent unwanted redirects
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Video.js player with improved options
    const player = videojs('video-player', {
        fluid: true,
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        userActions: {
            hotkeys: true,
            doubleClick: false // Disable default double click behavior
        },
        controlBar: {
            children: [
                'playToggle',
                'volumePanel',
                'currentTimeDisplay',
                'timeDivider',
                'durationDisplay',
                'progressControl',
                'playbackRateMenuButton',
                'qualitySelector',
                'fullscreenToggle'
            ]
        }
    });

    const playerContainer = document.getElementById('player-container');
    const controls = document.querySelector('.player-controls');
    const quickActions = document.getElementById('quick-actions');
    let controlsTimeout;
    let isControlsVisible = false;

    // Prevent default browser behaviors
    playerContainer.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Improved controls visibility management
    function showControls() {
        if (controls) {
            controls.style.opacity = '1';
            isControlsVisible = true;
            clearTimeout(controlsTimeout);
            controlsTimeout = setTimeout(hideControls, 3000);
        }
    }

    function hideControls() {
        if (controls && !controls.matches(':hover')) {
            controls.style.opacity = '0';
            isControlsVisible = false;
        }
    }

    // Quick Actions Menu Toggle with improved touch handling
    let isQuickActionsVisible = false;
    
    function toggleQuickActions(event) {
        if (event) {
            event.stopPropagation();
        }
        isQuickActionsVisible = !isQuickActionsVisible;
        quickActions.style.display = isQuickActionsVisible ? 'grid' : 'none';
        if (isQuickActionsVisible) {
            showControls();
        }
    }

    // Improved touch handling
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwiping = false;
    const SWIPE_THRESHOLD = 50;
    const TAP_THRESHOLD = 10;
    const TAP_TIMEOUT = 200;
    let lastTap = 0;

    playerContainer.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isSwiping = false;
    }, { passive: true });

    playerContainer.addEventListener('touchmove', function(e) {
        if (!isSwiping) {
            const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
            if (deltaX > SWIPE_THRESHOLD || deltaY > SWIPE_THRESHOLD) {
                isSwiping = true;
            }
        }
    }, { passive: true });

    playerContainer.addEventListener('touchend', function(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();
        
        const deltaX = Math.abs(touchEndX - touchStartX);
        const deltaY = Math.abs(touchEndY - touchStartY);
        const deltaTime = touchEndTime - touchStartTime;

        // Handle double tap
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 500 && tapLength > 0 && !isSwiping) {
            toggleQuickActions(e);
            e.preventDefault();
        }
        
        // Handle single tap
        if (deltaX < TAP_THRESHOLD && deltaY < TAP_THRESHOLD && deltaTime < TAP_TIMEOUT && !isSwiping) {
            if (isControlsVisible) {
                hideControls();
            } else {
                showControls();
            }
        }
        
        lastTap = currentTime;
    }, { passive: false });

    // Improved control button handling
    const playButton = document.getElementById('play-button');
    const backwardButton = document.getElementById('backward-button');
    const forwardButton = document.getElementById('forward-button');
    const fullscreenButton = document.getElementById('fullscreen-button');

    // Prevent event propagation for control buttons
    [playButton, backwardButton, forwardButton, fullscreenButton].forEach(button => {
        if (button) {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    });

    if (playButton) {
        playButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (player.paused()) {
                player.play();
            } else {
                player.pause();
            }
        });
    }

    // Update play button state
    player.on('play', function() {
        if (playButton) {
            playButton.querySelector('i').className = 'fas fa-pause';
        }
    });

    player.on('pause', function() {
        if (playButton) {
            playButton.querySelector('i').className = 'fas fa-play';
        }
    });

    if (backwardButton) {
        backwardButton.addEventListener('click', function(e) {
            e.stopPropagation();
            const newTime = player.currentTime() - 10;
            player.currentTime(Math.max(0, newTime));
        });
    }

    if (forwardButton) {
        forwardButton.addEventListener('click', function(e) {
            e.stopPropagation();
            const newTime = player.currentTime() + 10;
            player.currentTime(Math.min(player.duration(), newTime));
        });
    }

    // Improved fullscreen handling
    function toggleFullscreen(e) {
        if (e) {
            e.stopPropagation();
        }
        
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (playerContainer.requestFullscreen) {
                playerContainer.requestFullscreen().catch(err => {
                    console.warn('Fullscreen request failed:', err);
                });
            } else if (playerContainer.webkitRequestFullscreen) {
                playerContainer.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                    console.warn('Exit fullscreen failed:', err);
                });
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', toggleFullscreen);
    }

    // Quick action buttons with improved handling
    document.getElementById('expand-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        toggleFullscreen();
        toggleQuickActions();
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName.toLowerCase() === 'input') return;
        
        switch(e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault();
                if (player.paused()) {
                    player.play();
                } else {
                    player.pause();
                }
                break;
            case 'f':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'arrowleft':
                e.preventDefault();
                player.currentTime(Math.max(0, player.currentTime() - 5));
                break;
            case 'arrowright':
                e.preventDefault();
                player.currentTime(Math.min(player.duration(), player.currentTime() + 5));
                break;
            case 'm':
                e.preventDefault();
                player.muted(!player.muted());
                break;
        }
    });

    // Clean up
    window.addEventListener('beforeunload', function() {
        player.dispose();
    });
});
