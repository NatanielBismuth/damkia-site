/**
 * Damka Swimwear - Products Management
 * 
 * This file contains code for displaying and managing products
 * across the website, including product listings and filtering.
 */

// DOM elements
const featuredProductsContainer = document.getElementById('featured-products');
const productListingsContainer = document.getElementById('product-listings');
const productFiltersForm = document.getElementById('product-filters');
const productSortSelect = document.getElementById('product-sort');
const productSearchInput = document.getElementById('product-search');
const loadMoreButton = document.getElementById('load-more-products');

// Products state
let currentProducts = [];
let lastDocument = null;
let currentFilters = {};
let hasMore = false;
let isLoading = false;

/**
 * Initialize Products
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize featured products on homepage
    if (featuredProductsContainer) {
        loadFeaturedProducts();
    }
    
    // Initialize product listings on shop page
    if (productListingsContainer) {
        // Get URL parameters for initial filtering
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('category')) {
            currentFilters.category = urlParams.get('category');
        }
        
        if (urlParams.has('collection')) {
            currentFilters.collection = urlParams.get('collection');
        }
        
        if (urlParams.has('min_price')) {
            currentFilters.minPrice = parseInt(urlParams.get('min_price'));
        }
        
        if (urlParams.has('max_price')) {
            currentFilters.maxPrice = parseInt(urlParams.get('max_price'));
        }
        
        if (urlParams.has('sort')) {
            currentFilters.sort = urlParams.get('sort');
            
            // Set select value if available
            if (productSortSelect) {
                productSortSelect.value = currentFilters.sort;
            }
        }
        
        // If search parameter exists, perform search
        if (urlParams.has('search')) {
            const searchQuery = urlParams.get('search');
            
            if (productSearchInput) {
                productSearchInput.value = searchQuery;
            }
            
            searchProducts(searchQuery)
                .then(products => {
                    renderProductListing(products, true);
                })
                .catch(error => {
                    console.error('Error searching products:', error);
                    renderProductListing([], true);
                });
        } else {
            // Load products with current filters
            loadProducts(true);
        }
        
        // Initialize filter and sort event listeners
        initProductFilters();
    }
    
    // Initialize product detail page
    const productDetailContainer = document.getElementById('product-detail');
    if (productDetailContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (productId) {
            loadProductDetail(productId);
        } else {
            productDetailContainer.innerHTML = '<div class="error-message">מוצר לא נמצא.</div>';
        }
    }
});

/**
 * Load and Display Featured Products
 */
function loadFeaturedProducts() {
    if (!featuredProductsContainer) return;
    
    // Display loading state
    featuredProductsContainer.innerHTML = `
        <div class="products-loading">
            <div class="spinner"></div>
            <p>טוען מוצרים מומלצים...</p>
        </div>
    `;
    
    // Fetch featured products from Firebase
    getFeaturedProducts(4)
        .then(products => {
            if (products.length === 0) {
                featuredProductsContainer.innerHTML = `
                    <div class="no-products">
                        <p>אין כרגע מוצרים מומלצים.</p>
                    </div>
                `;
                return;
            }
            
            renderProducts(products, featuredProductsContainer);
        })
        .catch(error => {
            console.error('Error loading featured products:', error);
            featuredProductsContainer.innerHTML = `
                <div class="error-message">
                    <p>שגיאה בטעינת מוצרים. נסי לרענן את הדף.</p>
                </div>
            `;
        });
}

/**
 * Load Products with Filters
 * @param {boolean} resetListing - Whether to reset current listing or append
 */
function loadProducts(resetListing = false) {
    if (!productListingsContainer) return;
    
    isLoading = true;
    
    // Display loading state
    if (resetListing) {
        lastDocument = null;
        currentProducts = [];
        
        productListingsContainer.innerHTML = `
            <div class="products-loading">
                <div class="spinner"></div>
                <p>טוען מוצרים...</p>
            </div>
        `;
    } else {
        if (loadMoreButton) {
            loadMoreButton.disabled = true;
            loadMoreButton.innerHTML = '<div class="spinner-small"></div> טוען...';
        }
    }
    
    // Fetch products from Firebase
    getAllProducts(currentFilters, 12, resetListing ? null : lastDocument)
        .then(({ products, lastDoc, hasMore: more }) => {
            // Update state
            if (resetListing) {
                currentProducts = products;
            } else {
                currentProducts = [...currentProducts, ...products];
            }
            
            lastDocument = lastDoc;
            hasMore = more;
            
            renderProductListing(currentProducts, resetListing);
        })
        .catch(error => {
            console.error('Error loading products:', error);
            
            if (resetListing) {
                productListingsContainer.innerHTML = `
                    <div class="error-message">
                        <p>שגיאה בטעינת מוצרים. נסי לרענן את הדף.</p>
                    </div>
                `;
            }
        })
        .finally(() => {
            isLoading = false;
            
            if (loadMoreButton) {
                loadMoreButton.disabled = false;
                loadMoreButton.innerHTML = 'טען עוד מוצרים';
                loadMoreButton.style.display = hasMore ? 'block' : 'none';
            }
        });
}

/**
 * Render Product Listing
 * @param {Array} products - Products to render
 * @param {boolean} resetListing - Whether to reset current listing or append
 */
function renderProductListing(products, resetListing = false) {
    if (!productListingsContainer) return;
    
    // Display no products message if needed
    if (products.length === 0 && resetListing) {
        productListingsContainer.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>לא נמצאו מוצרים</h3>
                <p>נסי לשנות את הסינון או לחפש מחדש.</p>
                <button id="reset-filters" class="cta-button">נקה סינונים</button>
            </div>
        `;
        
        const resetFiltersBtn = document.getElementById('reset-filters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', function() {
                resetFilters();
            });
        }
        
        return;
    }
    
    // Render products
    if (resetListing) {
        productListingsContainer.innerHTML = '';
    }
    
    renderProducts(products, productListingsContainer, resetListing);
    
    // Update load more button
    if (loadMoreButton) {
        loadMoreButton.style.display = hasMore ? 'block' : 'none';
    }
    
    // Refresh AOS for newly loaded content
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

/**
 * Render Products to Container
 * @param {Array} products - Products to render
 * @param {HTMLElement} container - Container to render into
 * @param {boolean} append - Whether to append or replace content
 */
function renderProducts(products, container, append = false) {
    if (!container) return;
    
    const productsHTML = products.map(product => {
        // Determine product tag (new, sale, out of stock)
        let tagHTML = '';
        if (!product.inStock) {
            tagHTML = '<span class="product-tag out-of-stock">אזל מהמלאי</span>';
        } else if (product.salePrice) {
            const discountPercentage = Math.round((1 - product.salePrice / product.price) * 100);
            tagHTML = `<span class="product-tag sale">-${discountPercentage}%</span>`;
        } else if (product.isNew) {
            tagHTML = '<span class="product-tag">חדש</span>';
        }
        
        // Create price HTML
        let priceHTML = '';
        if (product.salePrice) {
            priceHTML = `
                <div class="product-price">
                    <span class="price-original">₪${product.price}</span>
                    <span class="price-current">₪${product.salePrice}</span>
                </div>
            `;
        } else {
            priceHTML = `
                <div class="product-price">
                    <span class="price-current">₪${product.price}</span>
                </div>
            `;
        }
        
        // Create color options HTML
        let colorsHTML = '';
        if (product.colors && product.colors.length > 0) {
            colorsHTML = `
                <div class="color-options">
                    ${product.colors.map(color => `
                        <span class="color-option color-${color.code}" title="${color.name}"></span>
                    `).join('')}
                </div>
            `;
        }
        
        return `
            <div class="product-card" data-id="${product.id}" data-aos="fade-up">
                <div class="product-image">
                    ${tagHTML}
                    <img src="${product.images[0]}" alt="${product.title}">
                    <div class="product-overlay">
                        <span class="quick-view">צפייה מהירה</span>
                    </div>
                    <button class="product-wishlist" data-product-id="${product.id}" aria-label="הוסף למועדפים">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    ${priceHTML}
                    <div class="product-actions">
                        ${colorsHTML}
                        <button class="add-to-cart" data-product-id="${product.id}" aria-label="הוסף לסל">
                            <i class="fas fa-shopping-bag"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    if (append) {
        container.insertAdjacentHTML('beforeend', productsHTML);
    } else {
        container.innerHTML = productsHTML;
    }
    
    // Initialize product card functionality
    initProductCards();
}

/**
 * Initialize Product Cards Functionality
 */
function initProductCards() {
    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = this.dataset.productId;
            
            getProductDetails(productId)
                .then(product => {
                    if (product && product.inStock) {
                        addToCart(product, 1);
                        showNotification('המוצר נוסף לסל הקניות!', 'success');
                    } else {
                        showNotification('המוצר אינו זמין כרגע.', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error adding product to cart:', error);
                    showNotification('שגיאה בהוספת המוצר לסל.', 'error');
                });
        });
    });
    
    // Wishlist functionality
    const wishlistButtons = document.querySelectorAll('.product-wishlist');
    wishlistButtons.forEach(button => {
        const productId = button.dataset.productId;
        const isInWishlist = checkIfInWishlist(productId);
        
        // Update button appearance based on wishlist status
        if (isInWishlist) {
            button.classList.add('active');
            button.querySelector('i').classList.remove('far');
            button.querySelector('i').classList.add('fas');
        }
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            toggleWishlist(productId);
            
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
    });
    
    // Quick view functionality
    const quickViewButtons = document.querySelectorAll('.quick-view');
    quickViewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = this.closest('.product-card').dataset.id;
            openQuickView(productId);
        });
    });
    
    // Product card click to go to product page
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.dataset.id;
            window.location.href = `product.html?id=${productId}`;
        });
    });
}

/**
 * Initialize Product Filters
 */
function initProductFilters() {
    // Sort select
    if (productSortSelect) {
        productSortSelect.addEventListener('change', function() {
            currentFilters.sort = this.value;
            loadProducts(true);
            
            // Update URL
            updateFiltersInURL();
        });
    }
    
    // Category filter
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        // Set active class for current category
        if (currentFilters.category && filter.dataset.category === currentFilters.category) {
            filter.classList.add('active');
        }
        
        filter.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Toggle category filter
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                delete currentFilters.category;
            } else {
                categoryFilters.forEach(f => f.classList.remove('active'));
                this.classList.add('active');
                currentFilters.category = this.dataset.category;
            }
            
            loadProducts(true);
            
            // Update URL
            updateFiltersInURL();
        });
    });
    
    // Collection filter
    const collectionFilters = document.querySelectorAll('.collection-filter');
    collectionFilters.forEach(filter => {
        // Set active class for current collection
        if (currentFilters.collection && filter.dataset.collection === currentFilters.collection) {
            filter.classList.add('active');
        }
        
        filter.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Toggle collection filter
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                delete currentFilters.collection;
            } else {
                collectionFilters.forEach(f => f.classList.remove('active'));
                this.classList.add('active');
                currentFilters.collection = this.dataset.collection;
            }
            
            loadProducts(true);
            
            // Update URL
            updateFiltersInURL();
        });
    });
    
    // Price range filter
    const priceRange = document.getElementById('price-range');
    const minPriceDisplay = document.getElementById('min-price-display');
    const maxPriceDisplay = document.getElementById('max-price-display');
    
    if (priceRange && minPriceDisplay && maxPriceDisplay) {
        // Initialize noUiSlider if available
        if (typeof noUiSlider !== 'undefined') {
            noUiSlider.create(priceRange, {
                start: [currentFilters.minPrice || 100, currentFilters.maxPrice || 500],
                connect: true,
                step: 10,
                range: {
                    'min': 100,
                    'max': 500
                },
                format: {
                    to: value => Math.round(value),
                    from: value => Math.round(value)
                }
            });
            
            priceRange.noUiSlider.on('update', function(values, handle) {
                const minPrice = values[0];
                const maxPrice = values[1];
                
                minPriceDisplay.textContent = `₪${minPrice}`;
                maxPriceDisplay.textContent = `₪${maxPrice}`;
            });
            
            priceRange.noUiSlider.on('change', function(values, handle) {
                const minPrice = parseInt(values[0]);
                const maxPrice = parseInt(values[1]);
                
                currentFilters.minPrice = minPrice;
                currentFilters.maxPrice = maxPrice;
                
                loadProducts(true);
                
                // Update URL
                updateFiltersInURL();
            });
        }
    }
    
    // In stock filter
    const inStockFilter = document.getElementById('in-stock-filter');
    
    if (inStockFilter) {
        // Set checked if filter is active
        if (currentFilters.inStock) {
            inStockFilter.checked = true;
        }
        
        inStockFilter.addEventListener('change', function() {
            if (this.checked) {
                currentFilters.inStock = true;
            } else {
                delete currentFilters.inStock;
            }
            
            loadProducts(true);
            
            // Update URL
            updateFiltersInURL();
        });
    }
    
    // Reset filters button
    const resetFiltersButton = document.getElementById('reset-filters');
    
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', function(e) {
            e.preventDefault();
            resetFilters();
        });
    }
    
    // Search form
    const searchForm = document.getElementById('product-search-form');
    
    if (searchForm && productSearchInput) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const searchQuery = productSearchInput.value.trim();
            
            if (searchQuery) {
                // Clear other filters
                resetFilters(false);
                
                // Perform search
                searchProducts(searchQuery)
                    .then(products => {
                        renderProductListing(products, true);
                    })
                    .catch(error => {
                        console.error('Error searching products:', error);
                        renderProductListing([], true);
                    });
                
                // Update URL
                const searchParams = new URLSearchParams(window.location.search);
                searchParams.set('search', searchQuery);
                const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
                window.history.pushState({ search: searchQuery }, '', newUrl);
            }
        });
    }
    
    // Load more button
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', function() {
            if (!isLoading && hasMore) {
                loadProducts(false);
            }
        });
    }
}

/**
 * Reset all filters
 * @param {boolean} reload - Whether to reload products after reset
 */
function resetFilters(reload = true) {
    currentFilters = {};
    
    // Reset category filters
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => filter.classList.remove('active'));
    
    // Reset collection filters
    const collectionFilters = document.querySelectorAll('.collection-filter');
    collectionFilters.forEach(filter => filter.classList.remove('active'));
    
    // Reset price range
    const priceRange = document.getElementById('price-range');
    if (priceRange && priceRange.noUiSlider) {
        priceRange.noUiSlider.reset();
    }
    
    // Reset in stock filter
    const inStockFilter = document.getElementById('in-stock-filter');
    if (inStockFilter) {
        inStockFilter.checked = false;
    }
    
    // Reset sort select
    if (productSortSelect) {
        productSortSelect.value = 'newest';
    }
    
    // Reset search input
    if (productSearchInput) {
        productSearchInput.value = '';
    }
    
    // Update URL
    updateFiltersInURL();
    
    // Reload products
    if (reload) {
        loadProducts(true);
    }
}

/**
 * Update Filters in URL
 */
function updateFiltersInURL() {
    const searchParams = new URLSearchParams();
    
    // Add active filters to URL
    if (currentFilters.category) {
        searchParams.set('category', currentFilters.category);
    }
    
    if (currentFilters.collection) {
        searchParams.set('collection', currentFilters.collection);
    }
    
    if (currentFilters.minPrice) {
        searchParams.set('min_price', currentFilters.minPrice);
    }
    
    if (currentFilters.maxPrice) {
        searchParams.set('max_price', currentFilters.maxPrice);
    }
    
    if (currentFilters.sort) {
        searchParams.set('sort', currentFilters.sort);
    }
    
    // Update browser URL without reloading the page
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState(currentFilters, '', newUrl);
}

/**
 * Load and Display Product Detail
 * @param {string} productId - Product ID to load
 */
function loadProductDetail(productId) {
    const productDetailContainer = document.getElementById('product-detail');
    
    if (!productDetailContainer) return;
    
    // Display loading state
    productDetailContainer.innerHTML = `
        <div class="products-loading">
            <div class="spinner"></div>
            <p>טוען מוצר...</p>
        </div>
    `;
    
    // Fetch product details from Firebase
    getProductDetails(productId)
        .then(product => {
            if (!product) {
                productDetailContainer.innerHTML = '<div class="error-message">מוצר לא נמצא.</div>';
                return;
            }
            
            renderProductDetail(product);
        })
        .catch(error => {
            console.error('Error loading product details:', error);
            productDetailContainer.innerHTML = `
                <div class="error-message">
                    <p>שגיאה בטעינת המוצר. נסי לרענן את הדף.</p>
                </div>
            `;
        });
}

/**
 * Render Product Detail
 * @param {Object} product - Product object to render
 */
function renderProductDetail(product) {
    const productDetailContainer = document.getElementById('product-detail');
    
    if (!productDetailContainer) return;
    
    let colorsHTML = '';
    if (product.colors && product.colors.length > 0) {
        colorsHTML = `
            <div class="product-colors">
                <h4>צבע:</h4>
                <div class="color-options">
                    ${product.colors.map((color, index) => `
                        <span class="color-option color-${color.code} ${index === 0 ? 'active' : ''}" 
                              title="${color.name}" 
                              data-color="${color.code}"></span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    let sizesHTML = '';
    if (product.sizes && product.sizes.length > 0) {
        sizesHTML = `
            <div class="product-sizes">
                <h4>מידה:</h4>
                <div class="size-options">
                    ${product.sizes.map((size, index) => `
                        <span class="size-option ${index === 0 ? 'active' : ''}" 
                              data-size="${size}">${size}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    let priceHTML = '';
    if (product.salePrice) {
        const discountPercentage = Math.round((1 - product.salePrice / product.price) * 100);
        
        priceHTML = `
            <div class="product-price">
                <span class="price-original">₪${product.price}</span>
                <span class="price-current">₪${product.salePrice}</span>
                <span class="discount-badge">-${discountPercentage}%</span>
            </div>
        `;
    } else {
        priceHTML = `
            <div class="product-price">
                <span class="price-current">₪${product.price}</span>
            </div>
        `;
    }
    
    const stockStatus = product.inStock ? 
        '<span class="stock-status in-stock"><i class="fas fa-check-circle"></i> במלאי</span>' : 
        '<span class="stock-status out-of-stock"><i class="fas fa-times-circle"></i> אזל מהמלאי</span>';
    
    productDetailContainer.innerHTML = `
        <div class="product-detail-container">
            <div class="product-gallery">
                <div class="product-main-image">
                    <img src="${product.images[0]}" alt="${product.title}" id="main-product-image">
                    ${product.salePrice ? `<span class="discount-tag">-${Math.round((1 - product.salePrice / product.price) * 100)}%</span>` : ''}
                    ${!product.inStock ? '<span class="out-of-stock-tag">אזל מהמלאי</span>' : ''}
                </div>
                
                ${product.images.length > 1 ? `
                    <div class="product-thumbnails">
                        ${product.images.map((img, index) => `
                            <div class="product-thumbnail ${index === 0 ? 'active' : ''}">
                                <img src="${img}" alt="${product.title}" data-index="${index}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="product-info">
                <nav class="product-breadcrumb">
                    <a href="index.html">דף הבית</a> /
                    <a href="shop.html">חנות</a> /
                    <a href="shop.html?category=${product.category}">${getCategoryName(product.category)}</a> /
                    <span>${product.title}</span>
                </nav>
                
                <h1 class="product-title">${product.title}</h1>
                
                ${priceHTML}
                
                <div class="product-description">
                    ${product.description}
                </div>
                
                ${colorsHTML}
                ${sizesHTML}
                
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
                    <button class="add-to-cart-btn ${!product.inStock ? 'disabled' : ''}" id="add-to-cart" data-product-id="${product.id}">
                        <i class="fas fa-shopping-bag"></i> הוסיפי לסל
                    </button>
                    <button class="wishlist-btn" id="add-to-wishlist" data-product-id="${product.id}">
                        <i class="${checkIfInWishlist(product.id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                
                <div class="product-meta">
                    <p><strong>קטגוריה:</strong> <a href="shop.html?category=${product.category}">${getCategoryName(product.category)}</a></p>
                    ${product.sku ? `<p><strong>מק"ט:</strong> ${product.sku}</p>` : ''}
                    ${product.tags ? `<p><strong>תגיות:</strong> ${product.tags.map(tag => `<a href="shop.html?tag=${tag}">${tag}</a>`).join(', ')}</p>` : ''}
                </div>
                
                <div class="product-share">
                    <span>שתפי:</span>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" rel="noopener noreferrer" aria-label="שתפי בפייסבוק">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.title)}" target="_blank" rel="noopener noreferrer" aria-label="שתפי בטוויטר">
                        <i class="fab fa-twitter"></i>
                    </a>
                    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(product.title + ' ' + window.location.href)}" target="_blank" rel="noopener noreferrer" aria-label="שתפי בוואטסאפ">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                    <a href="mailto:?subject=${encodeURIComponent(product.title)}&body=${encodeURIComponent('בדקי את המוצר הזה: ' + window.location.href)}" aria-label="שתפי באימייל">
                        <i class="far fa-envelope"></i>
                    </a>
                </div>
            </div>
        </div>
        
        <div class="product-tabs">
            <ul class="tab-nav">
                <li class="tab-link active" data-tab="tab-description">תיאור מוצר</li>
                <li class="tab-link" data-tab="tab-details">מפרט</li>
                <li class="tab-link" data-tab="tab-shipping">משלוח והחזרות</li>
            </ul>
            
            <div class="tab-content">
                <div id="tab-description" class="tab-pane active">
                    ${product.longDescription || product.description}
                </div>
                
                <div id="tab-details" class="tab-pane">
                    <table class="details-table">
                        <tbody>
                            ${product.details ? Object.entries(product.details).map(([key, value]) => `
                                <tr>
                                    <th>${key}</th>
                                    <td>${value}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="2">מידע נוסף על המוצר יתווסף בקרוב.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                
                <div id="tab-shipping" class="tab-pane">
                    <h3>מדיניות משלוחים והחזרות</h3>
                    <p>אנו מציעים מספר אפשרויות משלוח:</p>
                    <ul>
                        <li>משלוח סטנדרטי: 30 ₪ (2-5 ימי עסקים)</li>
                        <li>משלוח מהיר: 50 ₪ (1-2 ימי עסקים)</li>
                        <li>איסוף עצמי מהסטודיו במודיעין: ללא עלות (בתיאום מראש)</li>
                    </ul>
                    <p>משלוח חינם בהזמנות מעל 500 ₪.</p>
                    
                    <h3>החזרות והחלפות</h3>
                    <p>ניתן להחזיר או להחליף מוצרים תוך 14 יום מיום קבלת ההזמנה, בכפוף למדיניות ההחזרות שלנו:</p>
                    <ul>
                        <li>המוצר חייב להיות במצב חדש, ללא פגמים ועם כל התגיות המקוריות.</li>
                        <li>לא ניתן להחזיר פריטים בלתי הפיכים כמו בגדי ים שנחתכו בהתאמה אישית.</li>
                        <li>עלות דמי המשלוח חזרה למוצרים שאינם פגומים הינה באחריות הלקוח.</li>
                    </ul>
                    <p>למידע נוסף, אנא צרי קשר עם שירות הלקוחות שלנו.</p>
                </div>
            </div>
        </div>
        
        <div class="related-products">
            <h2>מוצרים דומים</h2>
            <div id="related-products-container" class="products-grid">
                <div class="products-loading">
                    <div class="spinner"></div>
                    <p>טוען מוצרים דומים...</p>
                </div>
            </div>
        </div>
    `;
    
    // Initialize product detail functionality
    initProductDetailFunctionality(product);
    
    // Load related products
    loadRelatedProducts(product.id, product.category);
}

/**
 * Initialize Product Detail Functionality
 * @param {Object} product - Product object
 */
function initProductDetailFunctionality(product) {
    // Product thumbnails
    const thumbnails = document.querySelectorAll('.product-thumbnail img');
    const mainImage = document.getElementById('main-product-image');
    
    if (thumbnails.length > 0 && mainImage) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                // Update main image
                mainImage.src = this.src;
                
                // Update active thumbnail
                document.querySelectorAll('.product-thumbnail').forEach(thumb => {
                    thumb.classList.remove('active');
                });
                this.parentElement.classList.add('active');
            });
        });
    }
    
    // Color selection
    const colorOptions = document.querySelectorAll('.product-detail-container .color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Size selection
    const sizeOptions = document.querySelectorAll('.product-detail-container .size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            sizeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Quantity selector
    const quantityMinus = document.querySelector('.product-detail-container .quantity-minus');
    const quantityPlus = document.querySelector('.product-detail-container .quantity-plus');
    const quantityInput = document.querySelector('.product-detail-container .quantity-input');
    
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
    
    // Add to cart button
    const addToCartBtn = document.getElementById('add-to-cart');
    
    if (addToCartBtn && product.inStock) {
        addToCartBtn.addEventListener('click', function() {
            const selectedColor = document.querySelector('.product-detail-container .color-option.active');
            const selectedSize = document.querySelector('.product-detail-container .size-option.active');
            const quantity = parseInt(quantityInput.value);
            
            const color = selectedColor ? selectedColor.dataset.color : null;
            const size = selectedSize ? selectedSize.dataset.size : null;
            
            // Add to cart
            addToCart(product, quantity, color, size);
            
            // Show confirmation message
            showNotification('המוצר נוסף לסל הקניות!', 'success');
        });
    }
    
    // Wishlist button
    const wishlistBtn = document.getElementById('add-to-wishlist');
    
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
    
    // Tabs
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    if (tabLinks.length > 0 && tabPanes.length > 0) {
        tabLinks.forEach(link => {
            link.addEventListener('click', function() {
                // Remove active class from all tabs
                tabLinks.forEach(tab => tab.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to current tab
                this.classList.add('active');
                document.getElementById(this.dataset.tab).classList.add('active');
            });
        });
    }
}

/**
 * Load Related Products
 * @param {string} productId - Current product ID
 * @param {string} category - Current product category
 */
function loadRelatedProducts(productId, category) {
    const relatedContainer = document.getElementById('related-products-container');
    
    if (!relatedContainer) return;
    
    // Get products from the same category
    getProductsByCategory(category, 4)
        .then(products => {
            // Filter out current product
            const relatedProducts = products.filter(product => product.id !== productId);
            
            if (relatedProducts.length === 0) {
                relatedContainer.innerHTML = '<p>אין מוצרים דומים כרגע.</p>';
                return;
            }
            
            // Display up to 4 related products
            renderProducts(relatedProducts.slice(0, 4), relatedContainer);
        })
        .catch(error => {
            console.error('Error loading related products:', error);
            relatedContainer.innerHTML = '<p>שגיאה בטעינת מוצרים דומים.</p>';
        });
}

/**
 * Show Notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
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