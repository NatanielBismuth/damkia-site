/**
 * Damka Swimwear - Main JavaScript
 * 
 * This file contains the core functionality for the Damka Swimwear website
 * including UI interactions, animations, and general site behavior.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initPreloader();
    initHeaderScroll();
    initMobileMenu();
    initSearchToggle();
    initBackToTop();
    initHeroSlider();
    initTestimonialsSlider();
    initAOS();
    initCartSidebar();
    initQuickViewModal();
    initNewsletterForm();
    initAuthStateListener();
});

/**
 * Initialize Preloader
 */
function initPreloader() {
    const preloader = document.querySelector('.preloader');
    
    if (preloader) {
        // Add a small delay for smoother experience
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 800);
    }
}

/**
 * Initialize Header Scroll Effect
 */
function initHeaderScroll() {
    const header = document.querySelector('.header');
    
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

/**
 * Initialize Mobile Menu
 */
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.nav');
    
    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', function() {
            mobileToggle.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (
                nav.classList.contains('active') && 
                !nav.contains(e.target) && 
                !mobileToggle.contains(e.target)
            ) {
                mobileToggle.classList.remove('active');
                nav.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
        
        // Close menu when window is resized to desktop size
        window.addEventListener('resize', function() {
            if (window.innerWidth > 992 && nav.classList.contains('active')) {
                mobileToggle.classList.remove('active');
                nav.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }
}

/**
 * Initialize Search Toggle
 */
function initSearchToggle() {
    const searchToggle = document.querySelector('.search-toggle');
    const searchOverlay = document.querySelector('.search-overlay');
    const searchClose = document.querySelector('.search-close');
    const searchInput = document.querySelector('.search-input');
    
    if (searchToggle && searchOverlay) {
        searchToggle.addEventListener('click', function(e) {
            e.preventDefault();
            searchOverlay.classList.add('active');
            setTimeout(() => {
                searchInput.focus();
            }, 300);
        });
        
        if (searchClose) {
            searchClose.addEventListener('click', function() {
                searchOverlay.classList.remove('active');
            });
        }
        
        // Close search overlay when ESC key is pressed
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                searchOverlay.classList.remove('active');
            }
        });
    }
}

/**
 * Initialize Back to Top Button
 */
function initBackToTop() {
    const backToTop = document.querySelector('.back-to-top');
    
    if (backToTop) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                backToTop.classList.add('active');
            } else {
                backToTop.classList.remove('active');
            }
        });
        
        backToTop.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Initialize Hero Slider
 */
function initHeroSlider() {
    const heroSwiper = document.querySelector('.hero-swiper');
    
    if (heroSwiper) {
        new Swiper('.hero-swiper', {
            speed: 800,
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
        });
    }
}

/**
 * Initialize Testimonials Slider
 */
function initTestimonialsSlider() {
    const testimonialsSwiper = document.querySelector('.testimonials-swiper');
    
    if (testimonialsSwiper) {
        new Swiper('.testimonials-swiper', {
            speed: 600,
            loop: true,
            autoplay: {
                delay: 6000,
                disableOnInteraction: false,
            },
            slidesPerView: 1,
            spaceBetween: 30,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                640: {
                    slidesPerView: 1,
                },
                768: {
                    slidesPerView: 2,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
            }
        });
    }
}

/**
 * Initialize AOS (Animate On Scroll)
 */
function initAOS() {
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100,
    });
    
    // Re-initialize AOS after asynchronous content is loaded
    document.addEventListener('contentLoaded', function() {
        AOS.refresh();
    });
}

/**
 * Initialize Cart Sidebar
 */
function initCartSidebar() {
    const cartIcon = document.getElementById('cart-icon');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const cartClose = document.querySelector('.cart-close');
    
    if (cartIcon && cartSidebar) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            cartSidebar.classList.add('active');
            document.body.classList.add('sidebar-open');
        });
        
        if (cartClose) {
            cartClose.addEventListener('click', function() {
                cartSidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            });
        }
        
        // Close cart sidebar when clicking outside
        document.addEventListener('click', function(e) {
            if (
                cartSidebar.classList.contains('active') && 
                !cartSidebar.contains(e.target) && 
                !cartIcon.contains(e.target)
            ) {
                cartSidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
        
        // Close cart sidebar when ESC key is pressed
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && cartSidebar.classList.contains('active')) {
                cartSidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    }
}

/**
 * Initialize Quick View Modal
 */
function initQuickViewModal() {
    const modal = document.querySelector('.quick-view-modal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const modalClose = document.querySelector('.modal-close');
    
    if (modal && modalOverlay && modalClose) {
        // Quick view button event - will be added dynamically for products
        document.addEventListener('click', function(e) {
            if (e.target.closest('.quick-view')) {
                e.preventDefault();
                const productId = e.target.closest('.product-card').dataset.id;
                openQuickView(productId);
            }
        });
        
        // Close modal when clicking the close button
        modalClose.addEventListener('click', function() {
            closeQuickView();
        });
        
        // Close modal when clicking the overlay
        modalOverlay.addEventListener('click', function() {
            closeQuickView();
        });
        
        // Close modal when ESC key is pressed
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeQuickView();
            }
        });
    }
}

/**
 * Open Quick View Modal
 * @param {string} productId - The ID of the product to display
 */
function openQuickView(productId) {
    const modal = document.querySelector('.quick-view-modal');
    const modalContent = document.querySelector('.modal-content');
    
    if (modal && modalContent) {
        // Show loading state
        modalContent.innerHTML = '<div class="text-center p-5"><div class="spinner"></div><p>טוען מוצר...</p></div>';
        
        // Show modal
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        // Fetch product data from Firebase and display
        getProductDetails(productId)
            .then(product => {
                if (product) {
                    displayQuickViewProduct(product);
                } else {
                    modalContent.innerHTML = '<div class="text-center p-5"><p>המוצר לא נמצא.</p></div>';
                }
            })
            .catch(error => {
                console.error('Error loading product:', error);
                modalContent.innerHTML = '<div class="text-center p-5"><p>שגיאה בטעינת המוצר. נסי שוב.</p></div>';
            });
    }
}

/**
 * Display Product in Quick View Modal
 * @param {Object} product - The product object to display
 */
function displayQuickViewProduct(product) {
    const modalContent = document.querySelector('.modal-content');
    
    if (modalContent) {
        let colorsHtml = '';
        if (product.colors && product.colors.length > 0) {
            colorsHtml = '<div class="product-colors"><h4>צבע:</h4><div class="color-options">';
            product.colors.forEach(color => {
                colorsHtml += `<span class="color-option color-${color.code}" title="${color.name}" data-color="${color.code}"></span>`;
            });
            colorsHtml += '</div></div>';
        }
        
        let sizesHtml = '';
        if (product.sizes && product.sizes.length > 0) {
            sizesHtml = '<div class="product-sizes"><h4>מידה:</h4><div class="size-options">';
            product.sizes.forEach(size => {
                sizesHtml += `<span class="size-option" data-size="${size}">${size}</span>`;
            });
            sizesHtml += '</div></div>';
        }
        
        let priceHtml = '';
        if (product.salePrice) {
            priceHtml = `
                <div class="product-price">
                    <span class="price-original">₪${product.price}</span>
                    <span class="price-current">₪${product.salePrice}</span>
                </div>
            `;
        } else {
            priceHtml = `
                <div class="product-price">
                    <span class="price-current">₪${product.price}</span>
                </div>
            `;
        }
        
        const stockStatus = product.inStock ? 
            '<span class="stock-status in-stock"><i class="fas fa-check-circle"></i> במלאי</span>' : 
            '<span class="stock-status out-of-stock"><i class="fas fa-times-circle"></i> אזל מהמלאי</span>';
        
        modalContent.innerHTML = `
            <div class="quick-view-product">
                <div class="product-images">
                    <div class="product-main-image">
                        <img src="${product.images[0]}" alt="${product.title}">
                    </div>
                    ${product.images.length > 1 ? `
                        <div class="product-thumbnails">
                            ${product.images.map(img => `
                                <div class="product-thumbnail">
                                    <img src="${img}" alt="${product.title}">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="product-details">
                    <h2 class="product-title">${product.title}</h2>
                    ${priceHtml}
                    <div class="product-description">
                        ${product.description}
                    </div>
                    
                    ${colorsHtml}
                    ${sizesHtml}
                    
                    <div class="product-quantity">
                        <h4>כמות:</h4>
                        <div class="quantity-selector">
                            <button class="quantity-btn quantity-minus">-</button>
                            <input type="number" class="quantity-input" value="1" min="1" max="10">
                            <button class="quantity-btn quantity-plus">+</button>
                        </div>
                    </div>
                    
                    <div class="product-stock">
                        ${stockStatus}
                    </div>
                    
                    <div class="product-actions">
                        <button class="add-to-cart-btn ${!product.inStock ? 'disabled' : ''}" data-product-id="${product.id}">
                            <i class="fas fa-shopping-bag"></i> הוסיפי לסל
                        </button>
                        <button class="wishlist-btn" data-product-id="${product.id}">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                    
                    <div class="product-meta">
                        <p><strong>קטגוריה:</strong> <a href="shop.html?category=${product.category}">${getCategoryName(product.category)}</a></p>
                        ${product.tags ? `<p><strong>תגיות:</strong> ${product.tags.map(tag => `<a href="shop.html?tag=${tag}">${tag}</a>`).join(', ')}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Initialize quick view functionality
        initQuickViewProductFunctionality(product);
    }
}

/**
 * Initialize Functionality for Quick View Product
 * @param {Object} product - The product object
 */
function initQuickViewProductFunctionality(product) {
    // Color selection
    const colorOptions = document.querySelectorAll('.quick-view-modal .color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Size selection
    const sizeOptions = document.querySelectorAll('.quick-view-modal .size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            sizeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Quantity selector
    const quantityMinus = document.querySelector('.quick-view-modal .quantity-minus');
    const quantityPlus = document.querySelector('.quick-view-modal .quantity-plus');
    const quantityInput = document.querySelector('.quick-view-modal .quantity-input');
    
    if (quantityMinus && quantityPlus && quantityInput) {
        quantityMinus.addEventListener('click', function() {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
        
        quantityPlus.addEventListener('click', function() {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue < parseInt(quantityInput.max)) {
                quantityInput.value = currentValue + 1;
            }
        });
        
        quantityInput.addEventListener('change', function() {
            let value = parseInt(this.value);
            if (isNaN(value) || value < 1) {
                this.value = 1;
            } else if (value > parseInt(this.max)) {
                this.value = this.max;
            }
        });
    }
    
    // Thumbnails navigation
    const thumbnails = document.querySelectorAll('.quick-view-modal .product-thumbnail');
    const mainImage = document.querySelector('.quick-view-modal .product-main-image img');
    
    if (thumbnails.length > 0 && mainImage) {
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', function() {
                mainImage.src = product.images[index];
                thumbnails.forEach(thumb => thumb.classList.remove('active'));
                this.classList.add('active');
            });
            
            // Set first thumbnail as active
            if (index === 0) {
                thumbnail.classList.add('active');
            }
        });
    }
    
    // Add to cart button
    const addToCartBtn = document.querySelector('.quick-view-modal .add-to-cart-btn');
    
    if (addToCartBtn && product.inStock) {
        addToCartBtn.addEventListener('click', function() {
            const selectedColor = document.querySelector('.quick-view-modal .color-option.active');
            const selectedSize = document.querySelector('.quick-view-modal .size-option.active');
            const quantity = parseInt(quantityInput.value);
            
            const color = selectedColor ? selectedColor.dataset.color : null;
            const size = selectedSize ? selectedSize.dataset.size : null;
            
            // Add to cart
            addToCart(product, quantity, color, size);
            
            // Show confirmation message
            showNotification('המוצר נוסף לסל הקניות!', 'success');
            
            // Close modal
            setTimeout(() => {
                closeQuickView();
            }, 1000);
        });
    }
    
    // Wishlist button
    const wishlistBtn = document.querySelector('.quick-view-modal .wishlist-btn');
    
    if (wishlistBtn) {
        // Check if product is already in wishlist
        const isInWishlist = checkIfInWishlist(product.id);
        
        if (isInWishlist) {
            wishlistBtn.classList.add('active');
            wishlistBtn.querySelector('i').classList.remove('far');
            wishlistBtn.querySelector('i').classList.add('fas');
        }
        
        wishlistBtn.addEventListener('click', function() {
            toggleWishlist(product.id);
            
            // Toggle button appearance
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            
            if (this.classList.contains('active')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                showNotification('המוצר נוסף למועדפים!', 'success');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                showNotification('המוצר הוסר מהמועדפים.', 'info');
            }
        });
    }
}

/**
 * Close Quick View Modal
 */
function closeQuickView() {
    const modal = document.querySelector('.quick-view-modal');
    
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

/**
 * Show a Notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} slide-up`;
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after animation completes
    setTimeout(() => {
        notification.classList.add('slide-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Initialize Newsletter Form
 */
function initNewsletterForm() {
    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterConfirmation = document.getElementById('newsletter-confirmation');
    
    if (newsletterForm && newsletterConfirmation) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (email) {
                // Here you would save the email to your mailing list in Firebase
                // For now, we'll just show the confirmation message
                newsletterForm.style.display = 'none';
                newsletterConfirmation.style.display = 'block';
                
                // Clear the form
                emailInput.value = '';
                
                // Reset after some time
                setTimeout(() => {
                    newsletterForm.style.display = 'flex';
                    newsletterConfirmation.style.display = 'none';
                }, 5000);
            }
        });
    }
}

/**
 * Get Category Name from Category Code
 * @param {string} categoryCode - The category code
 * @return {string} The category name
 */
function getCategoryName(categoryCode) {
    const categories = {
        'one-piece': 'בגדי ים שלמים',
        'bikini': 'ביקיני',
        'beachwear': 'בגדי חוף',
        'accessories': 'אקססוריז'
    };
    
    return categories[categoryCode] || categoryCode;
}

/**
 * Format Currency (ILS)
 * @param {number} amount - The amount to format
 * @return {string} The formatted amount
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('he-IL', { 
        style: 'currency', 
        currency: 'ILS',
        maximumFractionDigits: 0 
    }).format(amount);
}

// Utility Event - Content Loaded
function dispatchContentLoaded() {
    document.dispatchEvent(new Event('contentLoaded'));
}

/**
 * Initialize Authentication State Listener
 */
function initAuthStateListener() {
    if (typeof auth !== 'undefined' && auth) {
        console.log('🔧 Initializing auth state listener...');
        auth.onAuthStateChanged(function(user) {
            console.log('🔥 Auth state changed:', user ? `User: ${user.email}` : 'No user');
            updateUserIcon(user);
        });
    } else {
        console.log('⚠️ Auth not available, retrying in 1 second...');
        setTimeout(initAuthStateListener, 1000);
    }
}

/**
 * Update User Icon Based on Authentication State
 */
function updateUserIcon(user) {
    const userIcon = document.querySelector('a[href="account.html"] i');
    const userLink = document.querySelector('a[href="account.html"]');
    
    console.log('🔧 Updating user icon...', user ? 'User logged in' : 'No user');
    
    if (user && userIcon && userLink) {
        console.log('👤 User found, checking role...');
        
        // First set a basic logged-in state immediately
        userIcon.className = 'fas fa-user';
        userLink.style.color = '#4caf50';
        userLink.setAttribute('title', 'מחובר');
        
        // Then check if user is a customer for more detailed info
        if (typeof getUserData === 'function') {
            getUserData(user.uid)
                .then(userData => {
                    console.log('📄 User data:', userData);
                    if (userData && userData.role === 'customer') {
                        // User is confirmed as customer - update with name
                        userIcon.className = 'fas fa-user';
                        userLink.setAttribute('title', `שלום, ${userData.name || user.email}!`);
                        userLink.style.color = '#4caf50';
                        
                        // Add a small indicator badge
                        addUserBadge(userLink);
                        
                        // Add logout functionality
                        addLogoutMenu(userLink, userData.name || user.email);
                        
                        // Show welcome message if user just logged in
                        showWelcomeMessage(userData.name || user.email);
                        
                        console.log('✅ Customer confirmed and icon updated');
                    } else if (userData && userData.role === 'admin') {
                        // Reset if admin tries to access
                        resetUserIcon(userIcon, userLink);
                    }
                })
                .catch(error => {
                    console.log('❌ Could not get user data:', error);
                    // Keep the basic logged-in state even if we can't get detailed data
                });
        }
    } else {
        console.log('🔄 Resetting user icon - no user');
        resetUserIcon(userIcon, userLink);
    }
}

/**
 * Reset User Icon to Default State
 */
function resetUserIcon(userIcon, userLink) {
    if (userIcon && userLink) {
        userIcon.className = 'far fa-user';
        userLink.removeAttribute('title');
        userLink.style.color = '';
        removeUserBadge(userLink);
        removeLogoutMenu(userLink);
    }
}

/**
 * Add a small badge to indicate logged in user
 */
function addUserBadge(userLink) {
    // Remove existing badge first
    removeUserBadge(userLink);
    
    // Create badge element
    const badge = document.createElement('span');
    badge.className = 'user-logged-badge';
    badge.style.cssText = `
        position: absolute;
        top: 8px;
        left: 8px;
        width: 8px;
        height: 8px;
        background: #4caf50;
        border-radius: 50%;
        border: 2px solid white;
        pointer-events: none;
    `;
    
    // Make sure parent has relative positioning
    userLink.style.position = 'relative';
    userLink.appendChild(badge);
}

/**
 * Remove user badge
 */
function removeUserBadge(userLink) {
    const existingBadge = userLink.querySelector('.user-logged-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
}

/**
 * Add logout dropdown menu to user icon
 */
function addLogoutMenu(userLink, userName) {
    // Remove existing menu first
    removeLogoutMenu(userLink);
    
    // Prevent default link behavior when logged in
    userLink.addEventListener('click', handleUserIconClick);
    userLink.href = '#';
    
    // Store user name for the menu
    userLink.dataset.userName = userName;
}

/**
 * Remove logout menu functionality
 */
function removeLogoutMenu(userLink) {
    if (userLink) {
        userLink.removeEventListener('click', handleUserIconClick);
        userLink.href = 'account.html';
        delete userLink.dataset.userName;
        
        // Remove any existing dropdown
        const existingDropdown = document.querySelector('.user-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
    }
}

/**
 * Handle user icon click when logged in
 */
function handleUserIconClick(e) {
    e.preventDefault();
    
    const userLink = e.currentTarget;
    const userName = userLink.dataset.userName;
    
    // Remove existing dropdown
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
        return;
    }
    
    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 200px;
        z-index: 1000;
        direction: rtl;
        overflow: hidden;
    `;
    
    dropdown.innerHTML = `
        <div style="padding: 1rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
            <div style="font-weight: 600; color: #374151;">שלום, ${userName}!</div>
            <div style="font-size: 0.8rem; color: #6b7280; margin-top: 0.25rem;">מחוברת לחנות</div>
        </div>
        <div class="dropdown-item logout-item" style="
            padding: 0.75rem 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #dc2626;
            transition: background-color 0.2s;
        ">
            <i class="fas fa-sign-out-alt"></i>
            <span>התנתקות</span>
        </div>
    `;
    
    // Add hover effect
    const logoutItem = dropdown.querySelector('.logout-item');
    logoutItem.addEventListener('mouseenter', () => {
        logoutItem.style.backgroundColor = '#fee2e2';
    });
    logoutItem.addEventListener('mouseleave', () => {
        logoutItem.style.backgroundColor = '';
    });
    
    // Add logout functionality
    logoutItem.addEventListener('click', () => {
        if (typeof auth !== 'undefined' && auth) {
            auth.signOut()
                .then(() => {
                    console.log('User signed out successfully');
                    // Show logout message
                    showLogoutMessage();
                })
                .catch(error => {
                    console.error('Logout error:', error);
                });
        }
        dropdown.remove();
    });
    
    // Position dropdown relative to user icon
    userLink.style.position = 'relative';
    userLink.appendChild(dropdown);
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !userLink.contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

/**
 * Show logout message
 */
function showLogoutMessage() {
    const logoutToast = document.createElement('div');
    logoutToast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #6b7280;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        direction: rtl;
        animation: slideInRight 0.5s ease-out;
    `;
    
    logoutToast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-sign-out-alt"></i>
            <span>התנתקת בהצלחה</span>
        </div>
    `;
    
    document.body.appendChild(logoutToast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        logoutToast.style.animation = 'slideOutRight 0.5s ease-in';
        setTimeout(() => {
            if (logoutToast.parentNode) {
                logoutToast.parentNode.removeChild(logoutToast);
            }
        }, 500);
    }, 3000);
}

/**
 * Show welcome message for newly logged in users
 */
function showWelcomeMessage(userName) {
    // Check if we just came from account page (using URL parameters or session storage)
    const urlParams = new URLSearchParams(window.location.search);
    const fromAccount = urlParams.get('from') === 'account' || sessionStorage.getItem('justLoggedIn') === 'true';
    
    if (fromAccount) {
        // Clear the flag
        sessionStorage.removeItem('justLoggedIn');
        
        // Create and show welcome toast
        const welcomeToast = document.createElement('div');
        welcomeToast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
            direction: rtl;
            animation: slideInRight 0.5s ease-out;
        `;
        
        welcomeToast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-check-circle"></i>
                <span>שלום ${userName}, התחברת בהצלחה! 🎉</span>
            </div>
        `;
        
        // Add CSS animation
        if (!document.querySelector('#welcome-toast-style')) {
            const style = document.createElement('style');
            style.id = 'welcome-toast-style';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(welcomeToast);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            welcomeToast.style.animation = 'slideOutRight 0.5s ease-in';
            setTimeout(() => {
                if (welcomeToast.parentNode) {
                    welcomeToast.parentNode.removeChild(welcomeToast);
                }
            }, 500);
        }, 4000);
        
        // Remove URL parameter if exists
        if (urlParams.get('from')) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }
}