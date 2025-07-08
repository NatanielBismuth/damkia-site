/**
 * Damka Swimwear - Firebase Configuration
 * 
 * This file contains Firebase configuration and initialization code
 * as well as helper functions for authentication and data management.
 */

// Your Firebase configuration
// Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBAOlRUZIxoDXxT7pPVgeitO3isD80xqVA",
    authDomain: "darkcrypto-backtest.firebaseapp.com",
    projectId: "darkcrypto-backtest",
    storageBucket: "darkcrypto-backtest.firebasestorage.app",
    messagingSenderId: "21592447655",
    appId: "1:21592447655:web:4531ed932e7551e9d09982",
    measurementId: "G-2GY26LPV9S"
  };
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Collections references
const productsRef = db.collection('products');
const categoriesRef = db.collection('categories');
const ordersRef = db.collection('orders');
const usersRef = db.collection('users');
const newsletterRef = db.collection('newsletter');

/**
 * Authentication Functions
 */

// Sign in with email and password
function signIn(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

// Sign out
function signOut() {
    return auth.signOut();
}

// Get current user
function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
}

// Register a new user
function registerUser(email, password, userData) {
    return auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Add user data to Firestore
            return usersRef.doc(userCredential.user.uid).set({
                ...userData,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
}

// Update user profile
function updateUserProfile(userId, userData) {
    return usersRef.doc(userId).update(userData);
}

// Get user data
function getUserData(userId) {
    return usersRef.doc(userId).get()
        .then(doc => doc.exists ? doc.data() : null);
}

/**
 * Products Functions
 */

// Get featured products
function getFeaturedProducts(limit = 4) {
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
    let query = productsRef.where('active', '==', true);
    
    // Apply filters
    if (filters.category) {
        query = query.where('category', '==', filters.category);
    }
    
    if (filters.collection) {
        query = query.where('collections', 'array-contains', filters.collection);
    }
    
    if (filters.minPrice !== undefined) {
        query = query.where('price', '>=', filters.minPrice);
    }
    
    if (filters.maxPrice !== undefined) {
        query = query.where('price', '<=', filters.maxPrice);
    }
    
    if (filters.inStock !== undefined) {
        query = query.where('inStock', '==', filters.inStock);
    }
    
    // Apply sorting
    if (filters.sort) {
        switch (filters.sort) {
            case 'price-asc':
                query = query.orderBy('price', 'asc');
                break;
            case 'price-desc':
                query = query.orderBy('price', 'desc');
                break;
            case 'newest':
                query = query.orderBy('createdAt', 'desc');
                break;
            case 'name-asc':
                query = query.orderBy('title', 'asc');
                break;
            default:
                query = query.orderBy('createdAt', 'desc');
        }
    } else {
        query = query.orderBy('createdAt', 'desc');
    }
    
    // Apply pagination
    if (startAfter) {
        query = query.startAfter(startAfter);
    }
    
    query = query.limit(limit);
    
    return query.get()
        .then(snapshot => {
            const products = [];
            let lastDoc = null;
            
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
                lastDoc = doc;
            });
            
            return {
                products,
                lastDoc,
                hasMore: products.length === limit
            };
        });
}

// Get product details by ID
function getProductDetails(productId) {
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
                
                if (
                    title.includes(query) || 
                    description.includes(query) || 
                    tags.some(tag => tag.includes(query))
                ) {
                    products.push({
                        id: doc.id,
                        ...data
                    });
                }
            });
            
            return products.slice(0, limit);
        });
}

// Add a new product
function addProduct(productData) {
    productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    productData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    
    return productsRef.add(productData);
}

// Update a product
function updateProduct(productId, productData) {
    productData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    
    return productsRef.doc(productId).update(productData);
}

// Delete a product
function deleteProduct(productId) {
    return productsRef.doc(productId).delete();
}

// Upload product image
function uploadProductImage(file, productId) {
    const extension = file.name.split('.').pop();
    const fileName = `${productId}_${Date.now()}.${extension}`;
    const storageRef = storage.ref(`products/${fileName}`);
    
    return storageRef.put(file)
        .then(() => storageRef.getDownloadURL());
}

/**
 * Cart Functions
 */

// Get cart from local storage
function getCart() {
    const cart = localStorage.getItem('damkaCart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to local storage
function saveCart(cart) {
    localStorage.setItem('damkaCart', JSON.stringify(cart));
    updateCartUI();
}

// Add product to cart
function addToCart(product, quantity = 1, color = null, size = null) {
    const cart = getCart();
    
    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => 
        item.id === product.id && 
        item.color === color && 
        item.size === size
    );
    
    if (existingItemIndex !== -1) {
        // Update quantity if product already exists
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item to cart
        cart.push({
            id: product.id,
            title: product.title,
            price: product.salePrice || product.price,
            image: product.images[0],
            quantity: quantity,
            color: color,
            size: size
        });
    }
    
    saveCart(cart);
    return cart;
}

// Update product quantity in cart
function updateCartItemQuantity(index, quantity) {
    const cart = getCart();
    
    if (index >= 0 && index < cart.length) {
        cart[index].quantity = quantity;
        saveCart(cart);
    }
    
    return cart;
}

// Remove product from cart
function removeFromCart(index) {
    const cart = getCart();
    
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        saveCart(cart);
    }
    
    return cart;
}

// Clear cart
function clearCart() {
    localStorage.removeItem('damkaCart');
    updateCartUI();
    return [];
}

// Calculate cart total
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
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    // Update cart count
    if (cartCount) {
        cartCount.textContent = cart.reduce((count, item) => count + item.quantity, 0);
    }
    
    // Update cart items if element exists
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>סל הקניות שלך ריק</h3>
                    <p>הוסיפי מוצרים לסל הקניות שלך</p>
                    <a href="shop.html" class="cta-button">המשיכי בקניות</a>
                </div>
            `;
        } else {
            cartItems.innerHTML = cart.map((item, index) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3 class="cart-item-title">${item.title}</h3>
                        ${item.color || item.size ? `
                            <div class="cart-item-variant">
                                ${item.color ? `צבע: ${item.color}` : ''}
                                ${item.color && item.size ? ' | ' : ''}
                                ${item.size ? `מידה: ${item.size}` : ''}
                            </div>
                        ` : ''}
                        <div class="cart-item-price">₪${item.price}</div>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" data-index="${index}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10" data-index="${index}">
                        <button class="quantity-btn plus" data-index="${index}">+</button>
                    </div>
                    <button class="cart-item-remove" data-index="${index}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `).join('');
            
            // Add event listeners for quantity buttons
            const minusBtns = cartItems.querySelectorAll('.quantity-btn.minus');
            const plusBtns = cartItems.querySelectorAll('.quantity-btn.plus');
            const quantityInputs = cartItems.querySelectorAll('.quantity-input');
            const removeButtons = cartItems.querySelectorAll('.cart-item-remove');
            
            minusBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    const currentValue = parseInt(quantityInputs[index].value);
                    
                    if (currentValue > 1) {
                        updateCartItemQuantity(index, currentValue - 1);
                    }
                });
            });
            
            plusBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    const currentValue = parseInt(quantityInputs[index].value);
                    
                    if (currentValue < 10) {
                        updateCartItemQuantity(index, currentValue + 1);
                    }
                });
            });
            
            quantityInputs.forEach(input => {
                input.addEventListener('change', function() {
                    const index = parseInt(this.dataset.index);
                    let value = parseInt(this.value);
                    
                    if (isNaN(value) || value < 1) {
                        value = 1;
                    } else if (value > 10) {
                        value = 10;
                    }
                    
                    this.value = value;
                    updateCartItemQuantity(index, value);
                });
            });
            
            removeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    removeFromCart(index);
                });
            });
        }
    }
    
    // Update cart total
    if (cartTotal) {
        cartTotal.textContent = `₪${getCartTotal()}`;
    }
}

/**
 * Wishlist Functions
 */

// Get wishlist from local storage
function getWishlist() {
    const wishlist = localStorage.getItem('damkaWishlist');
    return wishlist ? JSON.parse(wishlist) : [];
}

// Save wishlist to local storage
function saveWishlist(wishlist) {
    localStorage.setItem('damkaWishlist', JSON.stringify(wishlist));
    updateWishlistUI();
}

// Check if a product is in wishlist
function checkIfInWishlist(productId) {
    const wishlist = getWishlist();
    return wishlist.some(item => item.id === productId);
}

// Toggle product in wishlist
function toggleWishlist(productId) {
    const wishlist = getWishlist();
    const index = wishlist.findIndex(item => item.id === productId);
    
    if (index !== -1) {
        // Remove from wishlist
        wishlist.splice(index, 1);
    } else {
        // Add to wishlist - fetch product details first
        getProductDetails(productId)
            .then(product => {
                if (product) {
                    wishlist.push({
                        id: product.id,
                        title: product.title,
                        price: product.salePrice || product.price,
                        image: product.images[0]
                    });
                    saveWishlist(wishlist);
                }
            });
        return;
    }
    
    saveWishlist(wishlist);
    return wishlist;
}

// Update wishlist UI
function updateWishlistUI() {
    const wishlist = getWishlist();
    const wishlistCount = document.querySelector('.wishlist-count');
    
    // Update wishlist count
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
    }
}

/**
 * Order Functions
 */

// Create a new order
function createOrder(orderData) {
    orderData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    orderData.status = 'pending';
    
    return ordersRef.add(orderData)
        .then(docRef => {
            // Clear cart after successful order
            clearCart();
            return docRef.id;
        });
}

// Get user orders
function getUserOrders(userId) {
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
    return newsletterRef.add({
        email: email,
        subscribed: true,
        subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Initialize UI elements after page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartUI();
    updateWishlistUI();
});