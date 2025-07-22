/**
 * Damka Swimwear - Firebase Configuration
 * 
 * This file contains Firebase configuration and initialization code
 * as well as helper functions for authentication and data management.
 */

// Your Firebase configuration
// TODO: Replace with your actual Firebase project configuration for Damka
const firebaseConfig = {
    apiKey: "AIzaSyALgJWl9KfmRka_U62lX3Lu83f6kmFxIEA",
    authDomain: "damkaswimwear.firebaseapp.com",
    projectId: "damkaswimwear",
    storageBucket: "damkaswimwear.appspot.com", // <-- FIXED
    messagingSenderId: "595715420780",
    appId: "1:595715420780:web:a5ba24495ac186f68e5e49",
    measurementId: "G-M0YC51PGXG"
};

// Initialize Firebase
let app, db, auth, storage;

try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    storage = firebase.storage();
} catch (error) {
    console.error('Firebase initialization error:', error);
    // Show user-friendly error message
    if (typeof showToast === 'function') {
        showToast('שגיאה באתחול Firebase. אנא בדקי את הגדרות הפרויקט.', 'error');
    }
}

// Collections references
const productsRef = db ? db.collection('products') : null;
const categoriesRef = db ? db.collection('categories') : null;
const ordersRef = db ? db.collection('orders') : null;
const adminsRef = db ? db.collection('admins') : null;
const customersRef = db ? db.collection('customers') : null;
const messagesRef = db ? db.collection('messages') : null;
const newsletterRef = db ? db.collection('newsletter') : null;

/**
 * Authentication Functions
 */

// Sign in with email and password
function signIn(email, password) {
    if (!auth) {
        return Promise.reject(new Error('Firebase Auth not initialized'));
    }
    return auth.signInWithEmailAndPassword(email, password);
}

// Sign out
function signOut() {
    if (!auth) {
        return Promise.reject(new Error('Firebase Auth not initialized'));
    }
    return auth.signOut();
}

// Get current user
function getCurrentUser() {
    if (!auth) {
        return Promise.reject(new Error('Firebase Auth not initialized'));
    }
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
}

// Register a new customer
function registerCustomer(email, password, userData) {
    if (!auth || !customersRef) {
        return Promise.reject(new Error('Firebase not initialized'));
    }
    return auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Add customer data to Firestore
            return customersRef.doc(userCredential.user.uid).set({
                ...userData,
                email: email,
                role: 'customer',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
}

// Register a new admin (for manual admin creation only)
function registerAdmin(email, password, userData) {
    if (!auth || !adminsRef) {
        return Promise.reject(new Error('Firebase not initialized'));
    }
    return auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Add admin data to Firestore
            return adminsRef.doc(userCredential.user.uid).set({
                ...userData,
                email: email,
                role: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
}

// Update user profile (works for both admins and customers)
function updateUserProfile(userId, userData) {
    if (!adminsRef || !customersRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    
    // First try to update in admins collection
    return adminsRef.doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                return adminsRef.doc(userId).update(userData);
            }
            // If not admin, try customers
            return customersRef.doc(userId).update(userData);
        });
}

// Get user data (check both admins and customers)
function getUserData(userId) {
    if (!adminsRef || !customersRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    
    // First check in admins collection
    return adminsRef.doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                return doc.data();
            }
            // If not found in admins, check customers
            return customersRef.doc(userId).get()
                .then(customerDoc => {
                    return customerDoc.exists ? customerDoc.data() : null;
                });
        });
}

/**
 * Products Functions
 */

// Get featured products
function getFeaturedProducts(limit = 4) {
    if (!productsRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    return productsRef
        .where('featured', '==', true)
        .where('active', '==', true)
        .limit(limit)
        .get()
        .then(snapshot => {
            const products = [];
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return products;
        });
}

// Get products by category
function getProductsByCategory(category, limit = 12) {
    if (!productsRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    let query = productsRef
        .where('active', '==', true)
        .where('category', '==', category)
        .limit(limit);
    
    return query.get()
        .then(snapshot => {
            const products = [];
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return products;
        });
}

// Get products by collection
function getProductsByCollection(collection, limit = 12) {
    if (!productsRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    let query = productsRef
        .where('active', '==', true)
        .where('collections', 'array-contains', collection)
        .limit(limit);
    
    return query.get()
        .then(snapshot => {
            const products = [];
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return products;
        });
}

// Get all products with optional filtering
function getAllProducts(filters = {}, limit = 12, startAfter = null) {
    if (!productsRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    
    // Simplified query - just get active products without any complex filters for now
    let query = productsRef.where('active', '==', true);
    
    // Skip all other filters and sorting for now to avoid index issues
    // Just get the basic products and we'll filter/sort in JavaScript
    
    return query.get()
        .then(snapshot => {
            let products = [];
            
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Apply filters in JavaScript
            if (filters.category) {
                products = products.filter(p => p.category === filters.category);
            }
            
            if (filters.collection) {
                products = products.filter(p => p.collections && p.collections.includes(filters.collection));
            }
            
            if (filters.minPrice !== undefined) {
                products = products.filter(p => p.price >= filters.minPrice);
            }
            
            if (filters.maxPrice !== undefined) {
                products = products.filter(p => p.price <= filters.maxPrice);
            }
            
            if (filters.inStock !== undefined) {
                products = products.filter(p => p.inStock === filters.inStock);
            }
            
            // Apply sorting in JavaScript
            if (filters.sort) {
                switch (filters.sort) {
                    case 'price-asc':
                        products.sort((a, b) => a.price - b.price);
                        break;
                    case 'price-desc':
                        products.sort((a, b) => b.price - a.price);
                        break;
                    case 'name-asc':
                        products.sort((a, b) => a.title.localeCompare(b.title));
                        break;
                    case 'newest':
                    default:
                        // Sort by creation date if available, otherwise by title
                        products.sort((a, b) => {
                            if (a.createdAt && b.createdAt) {
                                return b.createdAt.toDate() - a.createdAt.toDate();
                            }
                            return a.title.localeCompare(b.title);
                        });
                }
            } else {
                // Default sorting
                products.sort((a, b) => a.title.localeCompare(b.title));
            }
            
            // Apply pagination in JavaScript
            const startIndex = 0; // For now, start from beginning
            const endIndex = Math.min(startIndex + limit, products.length);
            const paginatedProducts = products.slice(startIndex, endIndex);
            
            return {
                products: paginatedProducts,
                lastDoc: null, // Pagination disabled for simplicity
                hasMore: endIndex < products.length
            };
        });
}

// Get product details by ID
function getProductDetails(productId) {
    if (!productsRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    return productsRef.doc(productId).get()
        .then(doc => {
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                return null;
            }
        });
}

// Search products
function searchProducts(query, limit = 12) {
    if (!productsRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    // In a real Firestore implementation, you'd want to use a third-party service like Algolia
    // for proper full-text search. This is a simple implementation for demonstration.
    query = query.toLowerCase();
    
    return productsRef
        .where('active', '==', true)
        .get()
        .then(snapshot => {
            const products = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const title = data.title.toLowerCase();
                const description = data.description ? data.description.toLowerCase() : '';
                const tags = data.tags ? data.tags.map(tag => tag.toLowerCase()) : [];
                
                if (title.includes(query) || description.includes(query) || 
                    tags.some(tag => tag.includes(query))) {
                    products.push({
                        id: doc.id,
                        ...data
                    });
                }
            });
            
            return products.slice(0, limit);
        });
}

// Add new product
function addProduct(productData) {
    if (!productsRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    return productsRef.add({
        ...productData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Update product
function updateProduct(productId, productData) {
    if (!productsRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    return productsRef.doc(productId).update({
        ...productData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Delete product
function deleteProduct(productId) {
    if (!productsRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    return productsRef.doc(productId).delete();
}

// Upload product image
function uploadProductImage(file, productId) {
    if (!storage) {
        return Promise.reject(new Error('Firebase Storage not initialized'));
    }
    const storageRef = storage.ref();
    const imageRef = storageRef.child(`products/${productId}/${file.name}`);
    
    return imageRef.put(file).then(snapshot => {
        return snapshot.ref.getDownloadURL();
    });
}

/**
 * Cart Functions
 */

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('damka-cart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('damka-cart', JSON.stringify(cart));
}

// Add item to cart
function addToCart(product, quantity = 1, color = null, size = null) {
    const cart = getCart();
    
    // Check if product already exists in cart
    const existingIndex = cart.findIndex(item => 
        item.id === product.id && 
        item.color === color && 
        item.size === size
    );
    
    if (existingIndex > -1) {
        // Update quantity of existing item
        cart[existingIndex].quantity += quantity;
    } else {
        // Add new item
        cart.push({
            id: product.id,
            title: product.title,
            price: product.salePrice || product.price,
            originalPrice: product.price,
            image: product.images ? product.images[0] : null,
            quantity: quantity,
            color: color,
            size: size,
            sku: product.sku || null
        });
    }
    
    saveCart(cart);
    updateCartUI();
    
    return cart;
}

// Update cart item quantity
function updateCartItemQuantity(index, quantity) {
    const cart = getCart();
    
    if (index >= 0 && index < cart.length) {
        if (quantity <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = quantity;
        }
        
        saveCart(cart);
        updateCartUI();
    }
    
    return cart;
}

// Remove item from cart
function removeFromCart(index) {
    const cart = getCart();
    
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        saveCart(cart);
        updateCartUI();
    }
    
    return cart;
}

// Clear cart
function clearCart() {
    localStorage.removeItem('damka-cart');
    updateCartUI();
}

// Get cart total
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

// Update cart UI
function updateCartUI() {
    const cart = getCart();
    const cartCount = document.querySelector('.cart-count');
    const cartIcon = document.getElementById('cart-icon');
    
    // Update cart count
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }
    
    // Update cart icon animation
    if (cartIcon && cart.length > 0) {
        cartIcon.classList.add('cart-updated');
        setTimeout(() => {
            cartIcon.classList.remove('cart-updated');
        }, 300);
    }
    
    // Update cart page if it exists
    const cartContainer = document.getElementById('cart-items');
    if (cartContainer) {
        renderCartItems();
    }
}

// Render cart items (for cart page)
function renderCartItems() {
    const cart = getCart();
    const cartContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const emptyCart = document.getElementById('empty-cart');
    
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '';
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartTotal) cartTotal.style.display = 'none';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartTotal) cartTotal.style.display = 'block';
    
    cartContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <div class="cart-item-image">
                <img src="${item.image || 'img/placeholder.svg'}" alt="${item.title}">
            </div>
            <div class="cart-item-details">
                <h4>${item.title}</h4>
                ${item.color ? `<p>צבע: ${item.color}</p>` : ''}
                ${item.size ? `<p>מידה: ${item.size}</p>` : ''}
                <div class="cart-item-price">
                    <span class="current-price">₪${item.price}</span>
                    ${item.originalPrice !== item.price ? `<span class="original-price">₪${item.originalPrice}</span>` : ''}
                </div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn minus" onclick="updateCartItemQuantity(${index}, ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn plus" onclick="updateCartItemQuantity(${index}, ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-total">
                ₪${(item.price * item.quantity).toFixed(2)}
            </div>
            <button class="remove-item" onclick="removeFromCart(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // Update total
    if (cartTotal) {
        const total = getCartTotal();
        cartTotal.textContent = `₪${total.toFixed(2)}`;
    }
}

/**
 * Wishlist Functions
 */

// Get wishlist from localStorage
function getWishlist() {
    const wishlist = localStorage.getItem('damka-wishlist');
    return wishlist ? JSON.parse(wishlist) : [];
}

// Save wishlist to localStorage
function saveWishlist(wishlist) {
    localStorage.setItem('damka-wishlist', JSON.stringify(wishlist));
}

// Check if product is in wishlist
function checkIfInWishlist(productId) {
    const wishlist = getWishlist();
    return wishlist.includes(productId);
}

// Toggle wishlist item
function toggleWishlist(productId) {
    const wishlist = getWishlist();
    const index = wishlist.indexOf(productId);
    
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(productId);
    }
    
    saveWishlist(wishlist);
    updateWishlistUI();
    
    return wishlist;
}

// Update wishlist UI
function updateWishlistUI() {
    const wishlist = getWishlist();
    const wishlistCount = document.querySelector('.wishlist-count');
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    
    // Update wishlist count
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
        wishlistCount.style.display = wishlist.length > 0 ? 'block' : 'none';
    }
    
    // Update wishlist buttons
    wishlistButtons.forEach(button => {
        const productId = button.dataset.productId;
        if (productId) {
            const isInWishlist = wishlist.includes(productId);
            button.classList.toggle('active', isInWishlist);
            button.innerHTML = isInWishlist ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        }
    });
}

/**
 * Order Functions
 */

// Create new order
function createOrder(orderData) {
    if (!ordersRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    return ordersRef.add({
        ...orderData,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Get user orders
function getUserOrders(userId) {
    if (!ordersRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    return ordersRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            const orders = [];
            snapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return orders;
        });
}

/**
 * Newsletter Functions
 */

// Subscribe to newsletter
function subscribeToNewsletter(email) {
    if (!newsletterRef) {
        return Promise.reject(new Error('Firestore not initialized'));
    }
    return newsletterRef.add({
        email: email,
        subscribed: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Initialize Firebase when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart UI
    updateCartUI();
    updateWishlistUI();
    
    // Add event listeners for wishlist buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.wishlist-btn')) {
            const button = e.target.closest('.wishlist-btn');
            const productId = button.dataset.productId;
            if (productId) {
                toggleWishlist(productId);
            }
        }
    });
});