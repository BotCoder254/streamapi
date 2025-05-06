document.addEventListener('DOMContentLoaded', () => {
    const playerContainer = document.getElementById('player-container');
    const moviePlayer = document.getElementById('movie-player');
    const playerLoadingOverlay = document.getElementById('player-loading-overlay');
    const playerLoadingTitle = document.getElementById('player-loading-title');
    const playerTitle = document.getElementById('player-title');
    const closePlayerBtn = document.getElementById('close-player');
    const fullscreenBtn = document.getElementById('player-fullscreen-btn');
    const openDedicatedPlayer = document.getElementById('open-dedicated-player');
    
    // Handle player options
    document.querySelectorAll('.player-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const url = e.currentTarget.href;
            const isExternal = e.currentTarget.hasAttribute('target');
            
            if (isExternal) {
                // Open external player in new tab
                window.open(url, '_blank');
            } else {
                // Load internal player
                loadPlayer(url);
            }
        });
    });
    
    // Load player function
    function loadPlayer(url) {
        playerContainer.classList.remove('hidden');
        playerLoadingOverlay.classList.remove('hidden');
        playerLoadingTitle.textContent = document.querySelector('h1').textContent;
        
        // Scroll to player
        playerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Set player source
        moviePlayer.src = url;
        
        // Update player title
        playerTitle.textContent = document.querySelector('h1').textContent;
        
        // Store current URL for dedicated player
        openDedicatedPlayer.href = url;
        
        // Handle player load
        moviePlayer.onload = () => {
            setTimeout(() => {
                playerLoadingOverlay.classList.add('hidden');
            }, 1000);
        };
    }
    
    // Close player
    closePlayerBtn.addEventListener('click', () => {
        playerContainer.classList.add('hidden');
        moviePlayer.src = '';
    });
    
    // Fullscreen button
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            playerContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
    
    // Handle fullscreen change
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    });
    
    // Handle player hover controls
    const playerControls = document.querySelector('.player-controls');
    if (playerControls) {
        let timeout;
        playerContainer.addEventListener('mousemove', () => {
            playerControls.style.opacity = '1';
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (!playerControls.matches(':hover')) {
                    playerControls.style.opacity = '0';
                }
            }, 2000);
        });
        
        playerContainer.addEventListener('mouseleave', () => {
            playerControls.style.opacity = '0';
        });
        
        playerControls.addEventListener('mouseenter', () => {
            clearTimeout(timeout);
            playerControls.style.opacity = '1';
        });
    }
    
    // Handle escape key to exit fullscreen or close player
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (!playerContainer.classList.contains('hidden')) {
                playerContainer.classList.add('hidden');
                moviePlayer.src = '';
            }
        }
    });
}); 