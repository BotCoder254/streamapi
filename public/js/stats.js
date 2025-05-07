document.addEventListener('DOMContentLoaded', () => {
    // Initialize progress bars
    document.querySelectorAll('.progress-bar').forEach(bar => {
        const progress = bar.dataset.progress;
        bar.style.width = `${progress}%`;
    });
}); 