// Testimonial Data
const testimonials = [
    {
        name: 'Abhichinnu',
        rating: 5,
        text: 'Quis aute aute enim veniam aliquip consectetur nisi esse magna ea ex irure excepteur ea irure non aliqua officia aliqua.'
    },
    {
        name: 'Ravi Kishore',
        rating: 5,
        text: 'Quis aute aute enim veniam aliquip consectetur nisi esse magna ea ex irure excepteur ea irure non aliqua officia aliqua.'
    },
    {
        name: 'Sai Anurag',
        rating: 5,
        text: 'Quis aute aute enim veniam aliquip consectetur nisi esse magna ea ex irure excepteur ea irure non aliqua officia aliqua.'
    },
    {
        name: 'vyshnavi',
        rating: 5,
        text: 'Quis aute aute enim veniam aliquip consectetur nisi esse magna ea ex irure excepteur ea irure non aliqua officia aliqua.'
    },
    {
        name: 'thejaswini',
        rating: 5,
        text: 'Quis aute aute enim veniam aliquip consectetur nisi esse magna ea ex irure excepteur ea irure non aliqua officia aliqua.'
    }
];

// FAQ Data organized by categories
const faqData = {
    trek: [
        {
            question: 'Do I need prior trekking experience for this trek?',
            answer: 'Not necessarily! We list treks based on difficulty, and many treks are beginner-friendly. Check the trek details in our app before booking.'
        },
        {
            question: 'What should I pack for the trek?',
            answer: 'It depends on the trek, but essentials include good trekking shoes, a backpack, water, snacks, and weather-appropriate clothing. Detailed packing lists are provided in the trek description.'
        },
        {
            question: 'Are meals provided during the trek?',
            answer: 'Some trek packages include meals, while others don\'t. Check the trek details in the app to know what\'s included.'
        }
    ],
    bookings: [
        {
            question: 'How do I book a trek?',
            answer: 'You can book a trek through our website or mobile app. Simply select your desired trek, choose your dates, and follow the booking process.'
        },
        {
            question: 'Can I modify my booking dates?',
            answer: 'Yes, you can modify your booking dates subject to availability. Please contact our support team for assistance.'
        }
    ],
    cancellation: [
        {
            question: 'What is your cancellation policy?',
            answer: 'Our cancellation policy varies depending on how close to the trek date you cancel. Generally, full refunds are available if cancelled 30 days before the trek.'
        },
        {
            question: 'How long does it take to process a refund?',
            answer: 'Refunds typically process within 5-7 business days, depending on your payment method and bank.'
        }
    ],
    payment: [
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit/debit cards, UPI, and net banking. All payments are processed securely.'
        },
        {
            question: 'Is there an option for installment payments?',
            answer: 'Yes, for certain treks we offer installment payment options. Check the trek details for available payment plans.'
        }
    ],
    support: [
        {
            question: 'How can I contact customer support?',
            answer: 'You can reach our customer support team through email at support@example.com or call us at +1234567890.'
        },
        {
            question: 'What are your support hours?',
            answer: 'Our customer support team is available 24/7 to assist you with any queries or concerns.'
        }
    ]
};

// Initialize Testimonials
function initializeTestimonials() {
    const testimonialGrid = document.getElementById('testimonialGrid');
    
    testimonials.forEach(testimonial => {
        const card = document.createElement('div');
        card.className = 'testimonial-card';
        
        const stars = '★'.repeat(testimonial.rating);
        
        card.innerHTML = `
            <h3>${testimonial.name}</h3>
            <div class="stars">${stars}</div>
            <p>${testimonial.text}</p>
        `;
        
        testimonialGrid.appendChild(card);
    });
}

// Initialize carousels
document.addEventListener('DOMContentLoaded', function() {
    // Get all carousel containers
    const carousels = document.querySelectorAll('.carousel-container');
    
    carousels.forEach(carousel => {
        const track = carousel.querySelector('.carousel-track');
        
        // Reset transform on mouse leave
        carousel.addEventListener('mouseleave', () => {
            track.style.transform = 'translateX(0)';
        });
        
        // Handle touch events for mobile
        let touchStart = null;
        let currentTranslate = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            touchStart = e.touches[0].clientX;
            track.style.transition = 'none';
        }, { passive: true });
        
        carousel.addEventListener('touchmove', (e) => {
            if (touchStart === null) return;
            
            const currentTouch = e.touches[0].clientX;
            const diff = touchStart - currentTouch;
            
            // Calculate maximum scroll based on content width
            const maxScroll = track.scrollWidth - carousel.offsetWidth;
            currentTranslate = Math.max(Math.min(diff, maxScroll), 0);
            
            track.style.transform = `translateX(-${currentTranslate}px)`;
        }, { passive: true });
        
        carousel.addEventListener('touchend', () => {
            touchStart = null;
            track.style.transition = 'transform 0.5s ease';
            
            // Snap to nearest position
            const slideWidth = track.children[0].offsetWidth;
            const snapPosition = Math.round(currentTranslate / slideWidth) * slideWidth;
            track.style.transform = `translateX(-${snapPosition}px)`;
        });
    });
});

// Initialize FAQ Tabs and Content
function initializeFAQTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const faqContainer = document.querySelector('.faq-container');

    // Function to create FAQ items
    function createFAQItems(category) {
        faqContainer.innerHTML = ''; // Clear existing content
        
        faqData[category].forEach(faq => {
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';
            
            faqItem.innerHTML = `
                <button class="faq-question" aria-expanded="false">
                    <span>${faq.question}</span>
                    <svg class="arrow-icon" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                </button>
                <div class="faq-answer">
                    <p>${faq.answer}</p>
                </div>
            `;
            
            faqContainer.appendChild(faqItem);
        });

        // Initialize accordion functionality for new items
        initializeFAQ();
    }

    // Add click event listeners to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get the category from data-tab attribute and update content
            const category = button.getAttribute('data-tab');
            createFAQItems(category);
        });
    });

    // Initialize with first category (trek)
    createFAQItems('trek');
}

// FAQ Accordion functionality
function initializeFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const isExpanded = question.getAttribute('aria-expanded') === 'true';
            
            // Close all other questions
            faqQuestions.forEach(q => {
                if (q !== question) {
                    q.setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current question
            question.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        });
    });
}

// FAQ Navigation
function initializeFAQNav() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    const faqNavBtns = document.querySelectorAll('.faq-nav-btn');

    // Handle FAQ accordion
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isExpanded = question.getAttribute('aria-expanded') === 'true';

            // Close all other answers
            document.querySelectorAll('.faq-answer').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelectorAll('.faq-question').forEach(item => {
                item.setAttribute('aria-expanded', 'false');
            });

            // Toggle current answer
            if (!isExpanded) {
                answer.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // Handle FAQ navigation
    faqNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            faqNavBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
        });
    });
}

// Scroll functionality for trek locations and testimonials
document.addEventListener('DOMContentLoaded', function() {
    const scrollContainers = [
        document.querySelector('.location-cards'),
        document.querySelector('.testimonials-grid')
    ];

    scrollContainers.forEach(container => {
        if (!container) return;

        const parent = container.closest('section');
        const leftBtn = parent.querySelector('.scroll-left');
        const rightBtn = parent.querySelector('.scroll-right');
        const scrollAmount = 300; // Width of one card

        if (leftBtn) {
            leftBtn.addEventListener('click', () => {
                container.scrollBy({
                    left: -scrollAmount,
                    behavior: 'smooth'
                });
            });
        }

        if (rightBtn) {
            rightBtn.addEventListener('click', () => {
                container.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            });
        }

        // Pause animation on hover
        container.addEventListener('mouseenter', () => {
            container.style.animationPlayState = 'paused';
        });

        container.addEventListener('mouseleave', () => {
            container.style.animationPlayState = 'running';
        });
    });
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCarousels();
    initializeFAQTabs();
});

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add mobile menu toggle
const mobileMenuButton = document.createElement('button');
mobileMenuButton.classList.add('mobile-menu-btn');
mobileMenuButton.innerHTML = '☰';
document.querySelector('.nav-content').prepend(mobileMenuButton);

mobileMenuButton.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('show');
});

// Add scroll-based navbar styling
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Testimonials Navigation
document.addEventListener('DOMContentLoaded', function() {
    const testimonialsWrapper = document.querySelector('.testimonials-wrapper');
    const testimonialsGrid = document.querySelector('.testimonials-grid');
    const testimonialCards = Array.from(document.querySelectorAll('.testimonial-card'));
    const prevTestimonial = document.querySelector('.prev-testimonial');
    const nextTestimonial = document.querySelector('.next-testimonial');
    
    let currentIndex = 0;
    
    function updateNavigation() {
        // Update button states
        prevTestimonial.classList.toggle('disabled', currentIndex === 0);
        nextTestimonial.classList.toggle('disabled', 
            currentIndex >= testimonialCards.length - 1);
    }
    
    function scrollTestimonials(direction) {
        const cardWidth = testimonialCards[0].offsetWidth + 20; // width + gap
        if (direction === 'next' && currentIndex < testimonialCards.length - 1) {
            currentIndex++;
            testimonialsGrid.style.transform = `translateX(-${cardWidth * currentIndex}px)`;
        } else if (direction === 'prev' && currentIndex > 0) {
            currentIndex--;
            testimonialsGrid.style.transform = `translateX(-${cardWidth * currentIndex}px)`;
        }
        updateNavigation();
    }
    
    // Add click handlers
    prevTestimonial.addEventListener('click', () => scrollTestimonials('prev'));
    nextTestimonial.addEventListener('click', () => scrollTestimonials('next'));
    
    // Initial setup
    updateNavigation();
});
