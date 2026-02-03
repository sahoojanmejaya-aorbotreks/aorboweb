document.addEventListener('DOMContentLoaded', () => {
    const initCarousel = (container) => {
        const track = container.querySelector('.carousel-track');
        const slides = Array.from(track.querySelectorAll('.carousel-slide'));
        
        let currentIndex = 0;
        let autoPlayInterval;
        let isHovered = false;
        
        // Get number of slides to show based on screen width
        const getSlidesToShow = () => {
            if (window.innerWidth >= 1024) return 3;
            if (window.innerWidth >= 768) return 2;
            return 1;
        };
        
        const updateSlidePosition = (withFade = false) => {
            const slidesToShow = getSlidesToShow();
            const slideWidth = container.offsetWidth / slidesToShow;
            const offset = -currentIndex * slideWidth;
            
            if (withFade) {
                track.style.opacity = '0';
                setTimeout(() => {
                    track.style.transform = `translateX(${offset}px)`;
                    track.style.opacity = '1';
                }, 200);
            } else {
                track.style.transform = `translateX(${offset}px)`;
            }
            
            // Update active state for slides
            slides.forEach((slide, index) => {
                if (index >= currentIndex && index < currentIndex + slidesToShow) {
                    slide.classList.add('active');
                } else {
                    slide.classList.remove('active');
                }
            });
        };
        
        const moveToSlide = (direction, withFade = false) => {
            const slidesToShow = getSlidesToShow();
            const maxIndex = slides.length - slidesToShow;
            
            if (direction === 'next' && currentIndex < maxIndex) {
                currentIndex++;
            } else if (direction === 'prev' && currentIndex > 0) {
                currentIndex--;
            } else if (direction === 'next' && currentIndex >= maxIndex) {
                // Loop back to start
                currentIndex = 0;
            }
            
            updateSlidePosition(withFade);
        };
        
        // Auto-advance functionality
        const startAutoPlay = () => {
            if (autoPlayInterval) clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(() => {
                if (!isHovered) {
                    moveToSlide('next', true);
                }
            }, 5000);
        };
        
        const stopAutoPlay = () => {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        };
        
        // Keyboard navigation
        container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                moveToSlide('prev', true);
                stopAutoPlay();
                startAutoPlay();
            } else if (e.key === 'ArrowRight') {
                moveToSlide('next', true);
                stopAutoPlay();
                startAutoPlay();
            }
        });
        
        // Touch events
        let startX = 0;
        let isDragging = false;
        let startPos = 0;
        
        const startDragging = (e) => {
            isDragging = true;
            startX = e.type === 'mousedown' ? e.pageX : e.touches[0].pageX;
            startPos = currentIndex;
            track.style.transition = 'none';
            track.style.cursor = 'grabbing';
        };
        
        const stopDragging = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            const currentX = e.type === 'mouseup' ? e.pageX : e.changedTouches[0].pageX;
            const diff = startX - currentX;
            track.style.transition = 'transform 0.5s ease, opacity 0.2s ease';
            track.style.cursor = 'grab';
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    moveToSlide('next');
                } else {
                    moveToSlide('prev');
                }
            } else {
                updateSlidePosition();
            }
            
            stopAutoPlay();
            startAutoPlay();
        };
        
        const drag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            const currentX = e.type === 'mousemove' ? e.pageX : e.touches[0].pageX;
            const diff = startX - currentX;
            const slidesToShow = getSlidesToShow();
            const slideWidth = container.offsetWidth / slidesToShow;
            
            const offset = -(startPos * slideWidth + diff);
            track.style.transform = `translateX(${offset}px)`;
        };
        
        // Add touch and mouse events
        track.addEventListener('mousedown', startDragging);
        track.addEventListener('touchstart', startDragging);
        
        window.addEventListener('mousemove', drag);
        window.addEventListener('touchmove', drag);
        
        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('touchend', stopDragging);
        
        // Pause auto-advance on hover
        container.addEventListener('mouseenter', () => {
            isHovered = true;
        });
        
        container.addEventListener('mouseleave', () => {
            isHovered = false;
        });
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                updateSlidePosition();
                stopAutoPlay();
                startAutoPlay();
            }, 250);
        });
        
        // Load event listeners for images
        slides.forEach(slide => {
            const img = slide.querySelector('img');
            if (img) {
                img.addEventListener('load', () => {
                    slide.classList.add('loaded');
                });
                
                if (img.complete) {
                    slide.classList.add('loaded');
                }
            }
        });
        
        // Initialize
        updateSlidePosition();
        startAutoPlay();
    };
    
    // Initialize all carousels
    document.querySelectorAll('.carousel-container').forEach(initCarousel);
});
