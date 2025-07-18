document.addEventListener('DOMContentLoaded', function() {
    // Mobile dropdown functionality
    const dropdownBtn = document.getElementById('category-dropdown-btn');
    const dropdownContent = document.getElementById('category-dropdown');
    const categoryOptions = document.querySelectorAll('.category-option');
    const selectedCategory = document.getElementById('selected-category');
    const certificateSliders = document.querySelectorAll('.certificate-slider');
    
    // Touch-friendly dropdown toggle
    dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
        dropdownContent.classList.toggle('show');
    });
    
    // Close dropdown when tapping outside
    document.addEventListener('click', function(e) {
        if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownBtn.setAttribute('aria-expanded', 'false');
            dropdownContent.classList.remove('show');
        }
    });
    
    // Category selection with touch support
    categoryOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            
            // Update selected category
            selectedCategory.textContent = this.textContent.trim();
            
            // Update active option
            categoryOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding slider
            certificateSliders.forEach(slider => {
                slider.classList.remove('active');
                if (slider.getAttribute('data-category') === category) {
                    slider.classList.add('active');
                    initSlider(slider); // Initialize slider if not already
                }
            });
            
            // Close dropdown
            dropdownBtn.setAttribute('aria-expanded', 'false');
            dropdownContent.classList.remove('show');
        });
    });
    
    // Initialize first slider
    if (certificateSliders.length > 0) {
        initSlider(certificateSliders[0]);
    }
    
    // Mobile slider initialization with touch events
    function initSlider(slider) {
        const track = slider.querySelector('.slider-track');
        const dotsContainer = slider.querySelector('.slider-dots');
        const cards = slider.querySelectorAll('.certificate-card');
        
        if (!cards.length) return;
        
        // Create dots for mobile indicator
        dotsContainer.innerHTML = '';
        cards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('slider-dot');
            if (index === 0) dot.classList.add('active');
            dotsContainer.appendChild(dot);
        });
        
        // Handle scroll events to update dots
        let isScrolling;
        track.addEventListener('scroll', function() {
            // Clear our timeout throughout the scroll
            window.clearTimeout(isScrolling);
            
            // Set a timeout to run after scrolling ends
            isScrolling = setTimeout(function() {
                const scrollPos = track.scrollLeft;
                const cardWidth = cards[0].offsetWidth + parseInt(getComputedStyle(track).gap);
                const activeIndex = Math.round(scrollPos / cardWidth);
                
                // Update dots
                const dots = dotsContainer.querySelectorAll('.slider-dot');
                dots.forEach((dot, index) => {
                    if (index === activeIndex) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
            }, 100);
        }, false);
        
        // Add touch event for better mobile experience
        let startX, moveX;
        track.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        track.addEventListener('touchmove', function(e) {
            moveX = e.touches[0].clientX;
        }, { passive: true });
        
        track.addEventListener('touchend', function(e) {
            if (startX - moveX > 50) {
                // Swipe left - scroll right
                track.scrollBy({ left: track.offsetWidth, behavior: 'smooth' });
            } else if (moveX - startX > 50) {
                // Swipe right - scroll left
                track.scrollBy({ left: -track.offsetWidth, behavior: 'smooth' });
            }
        }, { passive: true });
    }
    
    // Modal functionality for certificate cards
    const certificateCards = document.querySelectorAll('.certificate-card');
    const modal = document.createElement('div');
    modal.className = 'certificate-modal';
    modal.innerHTML = `
        <span class="close-modal">&times;</span>
        <div class="certificate-modal-content">
            <img src="" alt="Certificate">
        </div>
    `;
    document.body.appendChild(modal);
    
    const modalImg = modal.querySelector('img');
    const closeModal = modal.querySelector('.close-modal');
    
    // Open modal when tapping on certificate card
    certificateCards.forEach(card => {
        card.addEventListener('click', function() {
            const imgSrc = this.querySelector('img').src;
            modalImg.src = imgSrc;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            modal.style.animation = 'fadeIn 0.3s ease-out';
        });
    });
    
    // Close modal
    closeModal.addEventListener('click', function() {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 250);
    });
    
    // Close when tapping outside image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 250);
        }
    });
    
    // View All Button - could link to a full gallery page
    const viewAllBtn = document.getElementById('view-all-certificates');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            // In a real implementation, this would navigate to a full certificates page
            // For demo purposes, we'll show the first category expanded
            const firstCategory = document.querySelector('.certificate-slider');
            if (firstCategory) {
                certificateSliders.forEach(s => s.classList.remove('active'));
                firstCategory.classList.add('active');
                initSlider(firstCategory);
                
                // Scroll to section
                document.getElementById('certificates').scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    }
});