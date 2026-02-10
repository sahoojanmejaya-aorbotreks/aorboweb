document.addEventListener('DOMContentLoaded', function() {
    // Get all carousel containers
    const carouselContainers = document.querySelectorAll('.carousel-container');
    
    carouselContainers.forEach(container => {
        const track = container.querySelector('.carousel-track');
        const slides = Array.from(track.querySelectorAll('.carousel-slide'));
        
        if (!track || slides.length === 0) return;
        
        // Variables to track state
        let isHovered = false;
        let originalTransform = '';
        let slidesToShow = getSlidesToShow();
        
        // Get number of slides to show based on screen width
        function getSlidesToShow() {
            if (window.innerWidth >= 1024) return 3;
            if (window.innerWidth >= 768) return 2;
            return 1;
        }
        
        // Calculate slide width
        function getSlideWidth() {
            // Get the first slide's width including margin/gap
            const slideWidth = slides[0].offsetWidth;
            const style = window.getComputedStyle(slides[0]);
            const marginRight = parseInt(style.marginRight) || 20; // Default gap of 20px
            return slideWidth + marginRight;
        }
        
        // Handle mouse enter
        container.addEventListener('mouseenter', function() {
            isHovered = true;
            originalTransform = track.style.transform;
            
            // Calculate how much to move
            const slideWidth = getSlideWidth();
            const slidesToShow = getSlidesToShow();
            const maxIndex = slides.length - slidesToShow;
            
            if (maxIndex <= 0) return; // Don't scroll if all slides are visible
            
            // Move to show next set of slides
            const offset = -slideWidth; // Move by one slide width
            
            track.style.transition = 'transform 0.8s ease';
            track.style.transform = `translateX(${offset}px)`;
        });
        
        // Handle mouse leave
        container.addEventListener('mouseleave', function() {
            isHovered = false;
            
            // Reset to original position
            track.style.transition = 'transform 0.5s ease';
            track.style.transform = originalTransform;
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            slidesToShow = getSlidesToShow();
        });
    });
});
