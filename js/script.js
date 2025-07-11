document.addEventListener('DOMContentLoaded', () => {

    // --- Initialize AOS ---
    // Initialize AOS for non-tour scrolling. It will be overridden by GSAP during the tour.
    // mirror: false prevents AOS animations from playing again when scrolling back up,
    // which is good practice alongside a tour feature.
    AOS.init({ duration: 800, offset: 100, once: true, easing: 'ease-in-out', mirror: false });

    // --- GSAP Plugin Registration ---
    // Register the ScrollToPlugin which is needed for smooth scrolling to elements/positions
    gsap.registerPlugin(ScrollToPlugin);

    // --- DOM Element References ---
    // Get references to all necessary HTML elements
    const startTourBtn = document.getElementById('start-tour-btn');
    const cancelTourBtn = document.getElementById('cancel-tour-btn');
    const audioPlayer = document.getElementById('background-audio'); // Your background music element
    const narrationBox = document.getElementById('narration-box'); // The box that shows text narration
    const narrationText = document.getElementById('narration-text'); // The paragraph inside the narration box
    // const transitionOverlay = document.getElementById('transition-overlay'); // Removed from HTML and use
    const header = document.querySelector('.main-header'); // Your fixed header (updated selector)
    const mainContent = document.getElementById('main-content'); // The main content container (needs id="main-content")
    // Calculate header height dynamically for scroll offset, default to 70px if header not found
    const headerHeight = header ? header.offsetHeight : 70;

    // --- State Variables ---
    // Track if the tour is currently active to prevent conflicts
    let isTourActive = false;
    // Hold the main GSAP timeline instance for the current tour
    let currentTourTimeline = null;

    // --- Section Order and Narration Content ---
    // Define the order of sections the tour will visit by their IDs
    // Make sure these IDs match the section IDs in your HTML exactly
    const tourSections = ['#home', '#about', '#skills', '#tech-showcase', '#projects', '#education', '#experience', '#solved-problems', '#contact', '#resume-download'];

    // Define the narration text for each section ID
    const narrationContent = {
        '#home': "Welcome! I'm Pritom Bhowmik. Let's explore my skills and projects.", // Updated name
        '#about': "Here's a bit about my journey as a Full Stack Developer and what drives my passion.",
        '#skills': "Discover the technologies and tools I master, from frontend frameworks to backend systems.",
        '#tech-showcase': "A glimpse into visualizing the layers of technology I work with.", // Narration for 3D model section
        '#projects': "Browse through my featured projects showcasing real-world applications of my skills.",
        '#education': "My foundation in Computer Science from BRAC University and continuous learning experiences.",
        '#solved-problems': "Here are some of the coding challenges and problems I've solved, demonstrating my problem-solving skills.",
        '#experience': "Highlights of my professional journey and contributions to projects.", // Narration for experience section
        '#contact': "Ready to build something together? Let's connect and discuss your project.",
        '#resume-download': "For a comprehensive overview, you can download my resume here. Thanks for taking the tour!",
    };

    // --- Helper Functions for Audio ---
    const playAudio = () => {
        audioPlayer.currentTime = 0; // Ensure audio starts from the beginning each time
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Audio play was prevented:", error);
            });
        }
    };
    const pauseAudio = () => { audioPlayer.pause(); };

    // --- Helper Functions for Narration Box ---
    const showNarration = (text) => {
         if (text && isTourActive) { // Only show narration if the tour is still active and text is provided
            narrationText.textContent = text; // Set the narration text
            narrationBox.style.display = 'block'; // Make display block BEFORE animating opacity
            // Animate the narration box into view
            gsap.to(narrationBox, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' });
            narrationBox.classList.add('visible'); // Add class for potential CSS styling/state
        } else {
             hideNarration(true); // If tour is not active or no text, hide immediately
        }
    };

    const hideNarration = (immediately = false) => {
        if (immediately) {
            gsap.killTweensOf(narrationBox); // Stop any ongoing narration animations instantly
            gsap.set(narrationBox, { autoAlpha: 0, y: 20 }); // Instantly set state
            narrationBox.style.display = 'none'; // Hide element completely
            narrationBox.classList.remove('visible'); // Remove class
        } else {
            // Animated hide - only perform if the tour is still active
            if (!isTourActive) return;
            gsap.to(narrationBox, {
                autoAlpha: 0, y: 20, duration: 0.3, ease: 'power2.in',
                onComplete: () => {
                    // Final check before setting display none after animation finishes
                    if (!isTourActive) {
                        narrationBox.style.display = 'none';
                        narrationBox.classList.remove('visible');
                    }
                }
             });
        }
    };

    // --- playTransition (Removed) ---
    // This function is no longer needed as the wipe transition is removed.
    // Keeping a placeholder to avoid errors if it's still referenced elsewhere by mistake.
     const playTransition = (onCompleteCallback) => {
         console.log("playTransition called - this effect is removed from the tour.");
         // Call the callback immediately as there's no visual transition to wait for
         if (onCompleteCallback) onCompleteCallback();
         // Return an empty timeline or null, though it's not added to the main timeline anymore
         return null; // Or return gsap.timeline(); depending on how it was previously used
     };


    // --- Helper Function for Animating Content within a Section (Step-by-Step Reveal) ---
    const animateSectionContent = (sectionId) => {
        const sectionElement = document.querySelector(sectionId);
        if (!sectionElement || !isTourActive) return null;

        const contentElements = sectionElement.querySelectorAll('.tour-anim-item');
        if (contentElements.length === 0) return null;

        const sectionTl = gsap.timeline();

        // Group elements by their closest parent container
        const subSections = new Map();
        contentElements.forEach(el => {
            // Find the closest parent container based on common section groupings
            const container = el.closest('.skill-category, .project-card, .education-item, .experience-item, .contact-wrapper, .about-content') || sectionElement;
            if (!subSections.has(container)) {
                subSections.set(container, []);
            }
            subSections.get(container).push(el);
        });

        let delay = 0;
        // Animate each sub-section group
        subSections.forEach((elements, container) => {
            // Only scroll to container if it's not the main section element itself
            if (container !== sectionElement) {
                sectionTl.to(window, {
                    duration: 1,
                    scrollTo: {
                        y: container,
                        offsetY: headerHeight + 20,
                        autoKill: false
                    },
                    ease: "power2.inOut"
                }, delay);
                delay += 1; // Add delay after scroll
            }

            // Animate elements within the container
            elements.forEach((el, index) => {
                sectionTl.fromTo(el,
                    {
                        opacity: 0,
                        y: 25,
                        rotation: (index % 3 - 1) * 4,
                        scale: 0.97
                    },
                    {
                        opacity: 1,
                        y: 0,
                        rotation: 0,
                        scale: 1,
                        duration: 0.8,
                        ease: 'power1.out'
                    },
                    delay + (index * 0.2) // Stagger the animations
                );
            });

            // Add pause after each sub-section
            delay += Math.max(elements.length * 0.5 + 1, 2);
        });

        return sectionTl;
    };


    // --- The Core Interactive Tour Logic (REVISED: No Transition Wipe) ---
    const startTour = () => {
        // If the tour is already active, do nothing
        if (isTourActive) return;

        // Set the tour active flag immediately to prevent re-triggering
        isTourActive = true;
        console.log("Starting interactive tour...");

        // --- Set up UI and initial state for the tour ---
        document.body.classList.add('tour-active'); // Add class to body to disable scroll (via CSS)
        startTourBtn.style.display = 'none'; // Hide the "Start Tour" button
        cancelTourBtn.style.display = 'flex'; // Show the "Cancel Tour" button
        startTourBtn.disabled = true; // Disable buttons to prevent multiple clicks
        cancelTourBtn.disabled = false;

        // Reset the visual state of all animatable items *before* the tour starts
        // This is crucial to ensure the GSAP tour animations work correctly regardless of
        // the element's state before the tour (e.g., from AOS or previous tour runs)
        gsap.set(".tour-anim-item", { opacity: 0, y: 30, rotation: 0, scale: 1 });
        hideNarration(true); // Hide the narration box immediately
        // No blur applied here as the transition wipe is removed
        gsap.set(mainContent, { clearProps: "filter" }); // Ensure filter is off


        playAudio(); // Start background audio playback

        // Create the main GSAP timeline that orchestrates the entire tour sequence
        currentTourTimeline = gsap.timeline({
            // Callback function that runs when the entire timeline completes naturally
            onComplete: () => {
                 console.log("Main tour timeline completed naturally.");
                 // Only call endTour if the tour wasn't cancelled manually beforehand
                 if (isTourActive) {
                     endTour(); // Call the endTour function to clean up state
                 }
            },
            // We do NOT use onInterrupt here, as endTour handles killing the timeline directly
        });

        // --- Build the timeline sequence section by section ---

        // Start by scrolling to the very top first - provides a clean beginning
        currentTourTimeline.to(window, { duration: 1.8, scrollTo: 0, ease: "power2.inOut" }); // Initial scroll duration

        // Define the pause duration *after* a section's content animation sequence finishes and narration is shown
        const pauseAfterContentAnimation = 2.5; // e.g., Wait 2.5 seconds after content appears/animates and narration is shown

        // Variable to track the current position in the main timeline where the next step should be added
        // Start adding steps after the initial scroll (">")
        let timelineCursor = ">";

        // Loop through each section ID defined in the tourSections array
        tourSections.forEach((sectionId, index) => {
            // Get the actual HTML element for the current section ID
            // If the element doesn't exist (e.g., experience section is commented out), skip this iteration
            const sectionElement = document.querySelector(sectionId);
            if (!sectionElement) {
                console.warn(`Tour section element not found for selector: ${sectionId}. Skipping this section in the tour.`);
                return;
            }

            const sectionName = sectionId.substring(1); // Get section name (e.g., "home", "about") from the ID
            const narration = narrationContent[sectionId] || ''; // Get the narration text for this section
            const isLastSection = index === tourSections.length - 1;


            // --- Add Steps for the Current Section's Sequence ---

            // Add a label at the current cursor position in the main timeline
            // This label acts as the synchronized start point for this section's sequence (scroll, animate, narrate)
            const sectionSequenceLabel = `section_start_${sectionName}`;
            currentTourTimeline.addLabel(sectionSequenceLabel, timelineCursor);


            // 1. Smooth Scroll to the Section's Position
            // Start the scroll animation at the position defined by the sectionSequenceLabel
            const scrollDuration = 2.8; // Duration of the smooth scroll to this section
            currentTourTimeline.to(window, {
                duration: scrollDuration,
                scrollTo: { y: sectionId, offsetY: headerHeight + 20 }, // Scroll target, offset by header height
                ease: "power2.inOut", // Easing for the scroll
            }, sectionSequenceLabel); // Place the scroll animation's start at the current label


            // 2. Show Narration for the section
            // Schedule the narration to appear shortly after the scroll animation begins
             currentTourTimeline.call(showNarration, [narration], `${sectionSequenceLabel}+=0.5`); // Start showing narration 0.5s after scroll begins


            // 3. Animate Section Content (Step-by-Step Reveal)
            // Call the animateSectionContent function which creates and returns a nested timeline for animating items within the section
            const sectionAnimationTl = animateSectionContent(sectionId);
            let sectionContentAnimationDuration = 0; // Default duration if no animation occurs

            if (sectionAnimationTl) {
                // Add the nested content animation timeline to the main timeline
                // Start it after the scroll animation finishes
                currentTourTimeline.add(sectionAnimationTl, `${sectionSequenceLabel}+=${scrollDuration}`); // Start content animation AFTER scroll finishes
                // Get the total duration of the nested content animation timeline (from animateSectionContent)
                sectionContentAnimationDuration = sectionAnimationTl.duration();
                console.log(`Section ${sectionName} content animation duration: ${sectionContentAnimationDuration.toFixed(2)}s`);
            } else {
                 // If no animatable items were found or animation was skipped, duration is 0
                console.log(`No .tour-anim-item found or animating for section: ${sectionId}. Content animation duration is 0.`);
            }


            // --- Schedule the end of this section's display period and update cursor for the next section ---

            // Calculate the total time this section should be displayed, starting from when its content animation finishes
            // It's the duration of the content animation (if any) PLUS the desired pause duration
            // The content animation finishes at: sectionSequenceLabel + scrollDuration + sectionContentAnimationDuration
            const endOfAnimationTime = `${sectionSequenceLabel}+=${scrollDuration + (sectionContentAnimationDuration || 0)}`;
            const timeForNextSectionStart = `${endOfAnimationTime}+=${pauseAfterContentAnimation}`;
             console.log(`End of content animation for ${sectionName}: ${endOfAnimationTime}`);
             console.log(`Next section (${tourSections[index + 1] || 'End'}) will start at: ${timeForNextSectionStart}`);


            // Hide Narration (Schedule it to hide before the next section starts)
             if (!isLastSection) {
                 // Schedule narration to hide slightly before the next section starts
                 currentTourTimeline.call(hideNarration, [], `${timeForNextSectionStart}-=0.5`); // Hide 0.5s before the next section starts
             } else {
                 // For the very last section, hide narration right at the end of its display time
                 currentTourTimeline.call(hideNarration, [], timeForNextSectionStart);
             }

            // Update the timelineCursor to the start time of the NEXT section's sequence
            timelineCursor = timeForNextSectionStart;


        }); // End forEach loop over sections

        // Add a final step to explicitly hide the narration box after the very last step completes
        // This is a fallback in case the hideNarration call inside the loop was skipped or timed differently.
         currentTourTimeline.call(hideNarration, [], timelineCursor); // Hide it at the final cursor position


         console.log("Main tour timeline construction complete. Total estimated duration:", currentTourTimeline.duration().toFixed(2), "seconds.");

    }; // end startTour


    // --- Function to End the Tour ---
    // Called when the tour completes naturally or when the "Cancel Tour" button is clicked
    const endTour = (cancelled = false) => {
        // *** GUARD ***: If the tour is not currently active (isTourActive is already false),
        // it means endTour is being called redundantly. Do nothing and return immediately.
        // This is crucial to prevent the "Maximum call stack size exceeded" recursion error.
        if (!isTourActive) {
            console.log("endTour called but tour not active. Already cleaning up or not in tour.");
            return;
        }

        // Set the flag FIRST to false to prevent re-entry or timing issues
        isTourActive = false;
        console.log(`Ending interactive tour... ${cancelled ? '(Cancelled by user)' : '(Completed naturally)'}`);

        // --- Stop the GSAP timeline ---
        // Kill the main timeline immediately. This stops all nested timelines and ongoing animations controlled by it.
        if (currentTourTimeline) {
            console.log("Killing current tour timeline.");
            currentTourTimeline.kill();
            currentTourTimeline = null; // Clear the reference
        }

        // --- Clean up tour-specific states and UI ---
        pauseAudio(); // Stop background audio playback
        hideNarration(true); // Hide narration box immediately (no animation)

        // No blur to remove from main content as transition wipe is removed
        gsap.set(mainContent, { clearProps: "filter" }); // Ensure filter is removed if somehow applied


        // --- Restore the default UI state ---
        document.body.classList.remove('tour-active'); // Remove class to re-enable manual page scrolling
        startTourBtn.style.display = 'flex'; // Show the "Start Tour" button again
        cancelTourBtn.style.display = 'none'; // Hide the "Cancel Tour" button
        startTourBtn.disabled = false; // Enable the "Start Tour" button
        cancelTourBtn.disabled = true; // Disable "Cancel Tour" (it's hidden anyway)

        // --- Reset element states ---
        // Clear any inline styles (like opacity, transform, filter) that GSAP applied during the tour animations.
        // This makes the elements revert back to their styles defined in CSS or managed by AOS.
        // Using "all" clears all GSAP-set properties. Use with caution if other non-tour GSAP is active.
        gsap.set(".tour-anim-item", { clearProps: "all" });

        // Refresh AOS. This tells AOS to re-evaluate the position of elements on the page
        // and apply its scroll-based animations if they are in the viewport now that the tour is over.
        AOS.refresh();
        console.log("Interactive tour end process complete. Ready for manual scrolling.");

    }; // end endTour


    // --- Event Listeners ---
    // Listen for a click on the "Start Tour" button to begin the tour
    startTourBtn.addEventListener('click', startTour);
    // Listen for a click on the "Cancel Tour" button to immediately stop the tour
    // We pass `true` to `endTour` to indicate it was user-cancelled
    cancelTourBtn.addEventListener('click', () => endTour(true));

    // --- Simple Mobile Navigation Toggle ---
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            // Optional: Change hamburger icon to 'X'
            const icon = navToggle.querySelector('i');
            if (mainNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
                navToggle.setAttribute('aria-expanded', 'true');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                 navToggle.setAttribute('aria-expanded', 'false');
            }
        });
         // Close nav when a link is clicked (optional)
         mainNav.querySelectorAll('a').forEach(link => {
             link.addEventListener('click', () => {
                 // Close only if it's a hash link targeting a section
                 if(link.getAttribute('href').startsWith('#') && mainNav.classList.contains('active')){
                    mainNav.classList.remove('active');
                    navToggle.querySelector('i').classList.remove('fa-times');
                    navToggle.querySelector('i').classList.add('fa-bars');
                    navToggle.setAttribute('aria-expanded', 'false');
                 }
             });
         });
    }


    // --- Smooth Scroll for Anchor Links (Manual Scrolling) ---
     // This is for when the user clicks a link in the navigation manually (not part of the tour)
     document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Prevent default only if it's truly an internal hash link and tour is NOT active
            if (this.getAttribute('href').startsWith('#') && this.getAttribute('href').length > 1 && !isTourActive) {
                e.preventDefault(); // Prevent default jump
                const targetId = this.getAttribute('href');
                // Use try/catch in case the selector is invalid
                try {
                     const targetElement = document.querySelector(targetId);
                     if(targetElement){
                        // Calculate offset for sticky header
                        const headerOffset = document.querySelector('.main-header')?.offsetHeight || 70;
                        // Use GSAP's ScrollToPlugin for smooth scroll animation
                        gsap.to(window, {
                            duration: 0.8, // Scroll duration for manual clicks
                            scrollTo: {
                                y: targetElement, // Scroll to the element
                                offsetY: headerOffset + 20 // Offset from the top, accounting for header
                            },
                            ease: 'power2.inOut' // Easing
                        });
                     }
                } catch (error) {
                    console.error("Error finding element for smooth scroll:", error);
                }
            }
        });
    });


    // --- Initial Page Load Animation for Home Section ---
    // This animation runs automatically once when the page finishes loading
     const initialLoadTl = gsap.timeline({ delay: 1.5 }); // Add a short delay before starting after DOMContentLoaded
     // Animate elements with the class ".tour-anim-item" specifically within the ".hero" section (updated selector)
     // Use gsap.from() to animate FROM the specified state TO the element's default CSS state
     initialLoadTl.from(".hero .tour-anim-item", { // Updated selector
         opacity: 0, // Start from invisible
         y: 30, // Start slightly below final position
         rotation: -3, // Start with a slight rotation (example: -3 degrees)
         scale: 0.98, // Start slightly smaller (example: 98% of normal size)
         duration: 1.8, // Animation duration for each item
         stagger: 0.2, // Delay between animating each consecutive item
         ease: 'back.out(1.2)' // Easing function (adds a slight overshoot effect)
     });

     // --- Simple Parallax for Hero Background (Manual Scrolling) ---
     // This effect is handled via CSS background-attachment: fixed mostly,
     // but this JS can enhance it or provide a fallback if needed.
     // It won't run while body overflow is hidden during the tour.
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
         window.addEventListener('scroll', function() {
            if (!isTourActive) { // Only apply parallax if tour is NOT active
                const scrolled = window.pageYOffset;
                // Adjust the multiplier (0.2) to control the speed/intensity of the parallax effect
                const parallaxValue = -(scrolled * 0.2);
                // Apply the transformation directly to backgroundPositionY
                heroSection.style.backgroundPositionY = `calc(50% + ${parallaxValue}px)`; // Maintain center start, add parallax
            }
        }, { passive: true }); // Use passive: true for better scroll performance

    }


    // --- Contact Form Handling (using Fetch API for Formspree) ---
    // Handles the submission of the contact form without a full page reload
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status'); // Element to display status messages (e.g., Sending..., Success, Error)
    if (contactForm) { // Check if the contact form element exists on the page
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent the default browser form submission action
            const formData = new FormData(contactForm); // Create a FormData object from the form

            formStatus.textContent = 'Sending...'; // Update status text to indicate processing
            formStatus.className = ''; // Remove any previous status classes (success/error)

            // Use the Fetch API to send the form data asynchronously
            fetch(contactForm.action, {
                method: 'POST', // Use the POST method specified in the form HTML
                body: formData, // The form data to send
                headers: {
                    'Accept': 'application/json' // Formspree requires this header
                }
            })
            .then(response => {
                if (response.ok) { // Check if the HTTP response status is successful (200-299)
                    formStatus.textContent = "Message sent successfully! Thanks for reaching out.";
                    formStatus.classList.add('success'); // Add a class for styling the success message
                    contactForm.reset(); // Clear all input fields in the form
                } else {
                    // If the response is not OK, try to parse the JSON error response from Formspree
                    response.json().then(data => {
                        // Display specific error messages provided by Formspree if available, otherwise a generic message
                        formStatus.textContent = data.errors?.map(err => err.message).join(", ") || "Oops! There was a problem submitting your form.";
                        formStatus.classList.add('error'); // Add a class for styling the error message
                    }).catch(() => {
                         // Handle cases where the server response is not valid JSON (unexpected error)
                         formStatus.textContent = "Oops! An unknown error occurred. Please try again.";
                         formStatus.classList.add('error');
                     });
                }
            })
            .catch(error => {
                // Handle network errors (e.g., no internet)
                console.error("Form submission error:", error);
                formStatus.textContent = "Network error. Could not send message. Please check your connection.";
                formStatus.classList.add('error'); // Add an error class
            });
        });
    }

    // --- Set Current Year in Footer ---
    // Find the span with the ID "currentYear" and set its text content to the current full year
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) { // Check if the element exists
        currentYearSpan.textContent = new Date().getFullYear();
    }

}); // End DOMContentLoaded event listener