/**
 * Damka Swimwear - Admin Panel JavaScript
 * 
 * This file contains all the functionality for the admin panel,
 * including authentication, data management, and UI interactions.
 */

// DOM Content Loaded - Initialize Admin Panel
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is properly initialized
    if (!firebase || !firebase.apps.length) {
        console.error('Firebase not loaded. Please check your Firebase configuration.');
        showToast('שגיאה באתחול Firebase. אנא בדקי את הגדרות הפרויקט.', 'error');
        return;
    }
    
    // Initialize auth state listeners
    initAuthListeners();
    
    // Initialize UI interactions
    initSidebarToggle();
    initNavigationTabs();
    initFormTabs();
    
    // Initialize modals
    initModals();
    
    // Initialize product actions (for add product button)
    initProductActions();
    
    // Initialize other components when authenticated
    authStateChanged();
    
    // Add global error handler
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        if (typeof showToast === 'function') {
            showToast('אירעה שגיאה במערכת. אנא רענני את הדף.', 'error');
        }
    });
    
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup-link');
    const backToLoginFromSignup = document.getElementById('back-to-login-from-signup');
    const loginForm = document.getElementById('login-form');
    const resetForm = document.getElementById('reset-form');

    if (showSignupLink && signupForm && loginForm) {
        showSignupLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.style.display = 'none';
            if (resetForm) resetForm.style.display = 'none';
            signupForm.style.display = 'block';
        });
    }
    if (backToLoginFromSignup && signupForm && loginForm) {
        backToLoginFromSignup.addEventListener('click', function(e) {
            e.preventDefault();
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const passwordConfirm = document.getElementById('signup-password-confirm').value;
            const signupMessage = document.getElementById('signup-message');
            signupMessage.textContent = '';
            signupMessage.className = 'form-message';

            if (!name || !email || !password || !passwordConfirm) {
                signupMessage.textContent = 'יש למלא את כל השדות';
                signupMessage.className = 'form-message error';
                return;
            }
            if (password.length < 6) {
                signupMessage.textContent = 'הסיסמה חייבת להכיל לפחות 6 תווים';
                signupMessage.className = 'form-message error';
                return;
            }
            if (password !== passwordConfirm) {
                signupMessage.textContent = 'הסיסמאות אינן תואמות';
                signupMessage.className = 'form-message error';
                return;
            }
            signupMessage.textContent = 'בודק הרשאות...';
            signupMessage.className = 'form-message';
            try {
                // Check if any admin exists
                const adminsSnap = await usersRef.where('role', '==', 'admin').limit(1).get();
                if (!adminsSnap.empty) {
                    signupMessage.textContent = 'הרשמה סגורה. יש כבר מנהל במערכת.';
                    signupMessage.className = 'form-message error';
                    return;
                }
                signupMessage.textContent = 'יוצר משתמש...';
                // Create user in Firebase Auth
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Wait for authentication state to be ready
                auth.onAuthStateChanged(async (authUser) => {
                    if (authUser && authUser.uid === user.uid) {
                        try {
                            await usersRef.doc(user.uid).set({
                                name: name,
                                email: email,
                                role: 'admin',
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                isActive: true
                            });
                            signupMessage.textContent = 'נרשמת בהצלחה! מעביר ללוח הניהול...';
                            signupMessage.className = 'form-message success';
                            setTimeout(() => {
                                signupForm.style.display = 'none';
                                if (loginForm) loginForm.style.display = 'none';
                                if (resetForm) resetForm.style.display = 'none';
                                authStateChanged();
                            }, 1000);
                        } catch (firestoreError) {
                            console.error('Firestore write error:', firestoreError);
                            signupMessage.textContent = 'שגיאה בשמירת נתוני המשתמש. פנה למנהל המערכת.';
                            signupMessage.className = 'form-message error';
                        }
                    }
                });
            } catch (error) {
                console.error('Signup error:', error);
                let errorMessage = 'אירעה שגיאה בהרשמה. נסה שוב.';
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'אימייל זה כבר רשום.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'אימייל לא תקין.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'הסיסמה חלשה מדי.';
                }
                signupMessage.textContent = errorMessage;
                signupMessage.className = 'form-message error';
            }
        });
    }
});

/**
 * Initialize Firebase Authentication Listeners
 */
function initAuthListeners() {
    const loginForm = document.getElementById('login-form');
    const resetForm = document.getElementById('reset-form');
    const resetLink = document.getElementById('reset-password-link');
    const backToLoginLink = document.getElementById('back-to-login');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginMessage = document.getElementById('login-message');
            
            // Reset message
            loginMessage.textContent = '';
            loginMessage.className = 'form-message';
            
            // Show loading state
            loginMessage.textContent = 'מתחבר...';
            loginMessage.className = 'form-message';
            loginMessage.style.display = 'block';
            
            // Sign in with Firebase
            signIn(email, password)
                .then(() => {
                    // Login successful - UI will update via authStateChanged
                    loginMessage.textContent = 'התחברת בהצלחה, מעביר לממשק הניהול...';
                    loginMessage.className = 'form-message success';
                })
                .catch(error => {
                    console.error('Login error:', error);
                    
                    let errorMessage = 'אירעה שגיאה בהתחברות. נסי שוב.';
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                        errorMessage = 'אימייל או סיסמה שגויים. נסי שוב.';
                    } else if (error.code === 'auth/too-many-requests') {
                        errorMessage = 'יותר מדי ניסיונות התחברות. נסי שוב מאוחר יותר.';
                    }
                    
                    loginMessage.textContent = errorMessage;
                    loginMessage.className = 'form-message error';
                });
        });
    }
    
    // Reset password form submission
    if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('reset-email').value;
            const resetMessage = document.getElementById('reset-message');
            
            // Reset message
            resetMessage.textContent = '';
            resetMessage.className = 'form-message';
            
            // Show loading state
            resetMessage.textContent = 'שולח הוראות איפוס...';
            resetMessage.className = 'form-message';
            resetMessage.style.display = 'block';
            
            // Send password reset email
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    resetMessage.textContent = 'הוראות לאיפוס הסיסמה נשלחו לאימייל שלך.';
                    resetMessage.className = 'form-message success';
                })
                .catch(error => {
                    console.error('Reset password error:', error);
                    
                    let errorMessage = 'אירעה שגיאה בשליחת הוראות האיפוס. נסי שוב.';
                    if (error.code === 'auth/user-not-found') {
                        errorMessage = 'לא נמצא משתמש עם אימייל זה.';
                    }
                    
                    resetMessage.textContent = errorMessage;
                    resetMessage.className = 'form-message error';
                });
        });
    }
    
    // Toggle between login and reset forms
    if (resetLink && backToLoginLink) {
        resetLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.style.display = 'none';
            resetForm.style.display = 'block';
        });
        
        backToLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            resetForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            signOut()
                .then(() => {
                    // Logout successful - UI will update via authStateChanged
                    showToast('התנתקת בהצלחה', 'success');
                })
                .catch(error => {
                    console.error('Logout error:', error);
                    showToast('אירעה שגיאה בהתנתקות', 'error');
                });
        });
    }
}

/**
 * Handle authentication state changes
 */
function authStateChanged() {
    getCurrentUser()
        .then(user => {
            const loginScreen = document.getElementById('login-screen');
            const adminDashboard = document.getElementById('admin-dashboard');
            
            if (user) {
                // User is signed in - check if they have admin role
                checkAdminRole(user.uid)
                    .then(isAdmin => {
                        if (isAdmin) {
                            // User is admin - show admin dashboard
                            if (loginScreen) loginScreen.style.display = 'none';
                            if (adminDashboard) adminDashboard.style.display = 'grid';
                            
                            // Set user info
                            setUserInfo(user);
                            
                            // Initialize dashboard data
                            initDashboard();
                            
                            // Load initial data for tables
                            loadProducts();
                            loadOrders();
                            loadMessages();
                            loadCustomers();
                            
                            // Initialize product actions (for add product button)
                            initProductActions();
                            
                            // Update unread counts
                            updateUnreadCounts();
                        } else {
                            // User is not admin - show error and logout
                            showToast('אין לך הרשאות גישה לפאנל הניהול', 'error');
                            signOut();
                        }
                    })
                    .catch(error => {
                        console.error('Error checking admin role:', error);
                        showToast('שגיאה בבדיקת הרשאות', 'error');
                        signOut();
                    });
            } else {
                // No user is signed in - show login screen
                if (loginScreen) loginScreen.style.display = 'flex';
                if (adminDashboard) adminDashboard.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Auth state error:', error);
        });
}

/**
 * Check if user has admin role
 */
function checkAdminRole(userId) {
    return getUserData(userId)
        .then(userData => {
            return userData && userData.role === 'admin';
        });
}

/**
 * Set user information in UI
 * @param {Object} user - The Firebase user object
 */
function setUserInfo(user) {
    const userName = document.getElementById('user-name');
    
    if (userName) {
        // Try to get display name, fallback to email
        userName.textContent = user.displayName || user.email || 'משתמש';
    }
    
    // Get additional user info from Firestore
    getUserData(user.uid)
        .then(userData => {
            if (!userData) return;
            
            const userRole = document.getElementById('user-role');
            if (userRole) {
                userRole.textContent = userData.role || 'מנהל';
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
        });
}

/**
 * Initialize Dashboard Data
 */
function initDashboard() {
    // Load dashboard stats
    loadDashboardStats();
    
    // Initialize sales chart
    initSalesChart();
    
    // Load recent orders and products
    loadRecentOrders();
    loadTopProducts();
    loadRecentMessages();
}

/**
 * Load Dashboard Statistics
 */
function loadDashboardStats() {
    // Orders count
    db.collection('orders')
        .where('status', '==', 'pending')
        .get()
        .then(snapshot => {
            const countElement = document.getElementById('new-orders-count');
            if (countElement) {
                countElement.textContent = snapshot.size;
            }
        })
        .catch(error => {
            console.error('Error fetching new orders count:', error);
        });
    
    // Customers count
    db.collection('users')
        .get()
        .then(snapshot => {
            const countElement = document.getElementById('customers-count');
            if (countElement) {
                countElement.textContent = snapshot.size;
            }
        })
        .catch(error => {
            console.error('Error fetching customers count:', error);
        });
    
    // Monthly revenue
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    
    db.collection('orders')
        .where('status', 'in', ['processing', 'shipped', 'delivered'])
        .where('createdAt', '>=', startOfMonth)
        .get()
        .then(snapshot => {
            let revenue = 0;
            snapshot.forEach(doc => {
                const orderData = doc.data();
                revenue += orderData.total || 0;
            });
            
            const revenueElement = document.getElementById('monthly-revenue');
            if (revenueElement) {
                revenueElement.textContent = `₪${revenue.toLocaleString()}`;
            }
        })
        .catch(error => {
            console.error('Error fetching monthly revenue:', error);
        });
    
    // Active products
    db.collection('products')
        .where('active', '==', true)
        .get()
        .then(snapshot => {
            const countElement = document.getElementById('active-products');
            if (countElement) {
                countElement.textContent = snapshot.size;
            }
        })
        .catch(error => {
            console.error('Error fetching active products count:', error);
        });
}

/**
 * Initialize Sales Chart
 */
function initSalesChart() {
    const ctx = document.getElementById('sales-chart-canvas');
    if (!ctx) return;
    
    // Sample data
    const weeklyData = {
        labels: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
        datasets: [{
            label: 'מכירות',
            data: [5, 7, 8, 10, 12, 15, 9],
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderColor: '#4caf50',
            borderWidth: 2,
            tension: 0.4
        }]
    };
    
    const monthlyData = {
        labels: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
        datasets: [{
            label: 'מכירות',
            data: [65, 59, 80, 81, 56, 55, 40, 45, 60, 70, 85, 90],
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderColor: '#4caf50',
            borderWidth: 2,
            tension: 0.4
        }]
    };
    
    const yearlyData = {
        labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
        datasets: [{
            label: 'מכירות',
            data: [600, 750, 820, 980, 1200, 400],
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderColor: '#4caf50',
            borderWidth: 2,
            tension: 0.4
        }]
    };
    
    // Create chart
    const salesChart = new Chart(ctx, {
        type: 'line',
        data: weeklyData,
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Period selector buttons
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            periodBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const period = this.dataset.period;
            
            if (period === 'weekly') {
                salesChart.data = weeklyData;
            } else if (period === 'monthly') {
                salesChart.data = monthlyData;
            } else if (period === 'yearly') {
                salesChart.data = yearlyData;
            }
            
            salesChart.update();
        });
    });
}

/**
 * Load Recent Orders for Dashboard
 */
function loadRecentOrders() {
    const tbody = document.getElementById('recent-orders-tbody');
    if (!tbody) return;
    
    // Show loading
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">טוען הזמנות...</td></tr>';
    
    // Fetch recent orders
    db.collection('orders')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">אין הזמנות חדשות</td></tr>';
                return;
            }
            
            let html = '';
            snapshot.forEach(doc => {
                const order = doc.data();
                order.id = doc.id;
                
                // Format date
                const orderDate = order.createdAt ? order.createdAt.toDate() : new Date();
                const formattedDate = orderDate.toLocaleDateString('he-IL');
                
                // Get status badge class
                const statusClass = `status-${order.status || 'pending'}`;
                
                html += `
                    <tr>
                        <td>#${order.id.substring(0, 6)}</td>
                        <td>${order.customer?.name || 'לקוח לא רשום'}</td>
                        <td>${formattedDate}</td>
                        <td>₪${order.total?.toLocaleString() || '0'}</td>
                        <td><span class="status-badge ${statusClass}">${getStatusLabel(order.status)}</span></td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching recent orders:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">אירעה שגיאה בטעינת ההזמנות</td></tr>';
        });
}

/**
 * Load Top Products for Dashboard
 */
function loadTopProducts() {
    const tbody = document.getElementById('top-products-tbody');
    if (!tbody) return;
    
    // Show loading
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">טוען מוצרים...</td></tr>';
    
    // Fetch top products (in a real system, this would be based on sales data)
    db.collection('products')
        .where('featured', '==', true)
        .limit(5)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">אין מוצרים מובילים</td></tr>';
                return;
            }
            
            let html = '';
            snapshot.forEach(doc => {
                const product = doc.data();
                product.id = doc.id;
                
                // Get sales count (placeholder for now)
                const salesCount = Math.floor(Math.random() * 50) + 1;
                
                html += `
                    <tr>
                        <td>
                            <div class="d-flex align-center gap-sm">
                                <img src="${product.images?.[0] || '/img/placeholder.jpg'}" alt="${product.title}" width="40" height="40" style="object-fit: cover; border-radius: 4px;">
                                <div>${product.title}</div>
                            </div>
                        </td>
                        <td>${getCategoryLabel(product.category)}</td>
                        <td>${product.salePrice ? `₪${product.salePrice}` : `₪${product.price}`}</td>
                        <td>${salesCount}</td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching top products:', error);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">אירעה שגיאה בטעינת המוצרים</td></tr>';
        });
}

/**
 * Load Recent Messages for Dashboard
 */
function loadRecentMessages() {
    const messagesContainer = document.getElementById('recent-messages-list');
    if (!messagesContainer) return;
    
    // Show loading
    messagesContainer.innerHTML = '<div class="loading-placeholder">טוען הודעות...</div>';
    
    // Fetch recent messages
    db.collection('contact_messages')
        .orderBy('timestamp', 'desc')
        .limit(3)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                messagesContainer.innerHTML = '<div class="loading-placeholder">אין הודעות חדשות</div>';
                return;
            }
            
            let html = '';
            snapshot.forEach(doc => {
                const message = doc.data();
                message.id = doc.id;
                
                // Format date
                const messageDate = message.timestamp ? message.timestamp.toDate() : new Date();
                const formattedDate = messageDate.toLocaleDateString('he-IL');
                
                // Truncate message preview
                const messagePreview = message.message ? (message.message.length > 100 ? 
                                       message.message.substring(0, 100) + '...' : message.message) : '';
                
                // Get status badge
                const statusBadge = message.status === 'read' ? 
                                    '<span class="message-tag reply">נקרא</span>' : 
                                    '<span class="message-tag new">חדש</span>';
                
                html += `
                    <div class="message-item ${message.status !== 'read' ? 'unread' : ''}" data-id="${message.id}">
                        <div class="message-sender">
                            <div>${message.name} ${statusBadge}</div>
                            <div class="message-date">${formattedDate}</div>
                        </div>
                        <div class="message-subject">${message.subject || 'ללא נושא'}</div>
                        <div class="message-preview">${messagePreview}</div>
                    </div>
                `;
            });
            
            messagesContainer.innerHTML = html;
            
            // Add click events to message items
            const messageItems = messagesContainer.querySelectorAll('.message-item');
            messageItems.forEach(item => {
                item.addEventListener('click', function() {
                    // Redirect to messages tab with this message selected
                    navigateToSection('messages');
                    
                    // Select the message after a small delay to allow section change
                    setTimeout(() => {
                        selectMessage(this.dataset.id);
                    }, 100);
                });
            });
        })
        .catch(error => {
            console.error('Error fetching recent messages:', error);
            messagesContainer.innerHTML = '<div class="loading-placeholder">אירעה שגיאה בטעינת ההודעות</div>';
        });
}

/**
 * Load Products Data
 */
function loadProducts() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    
    // Show loading
    tbody.innerHTML = '<tr><td colspan="9" class="text-center">טוען מוצרים...</td></tr>';
    
    // Get filters
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const stockFilter = document.getElementById('stock-filter')?.value || '';
    const searchQuery = document.getElementById('products-search')?.value || '';
    
    // Create query
    let query = db.collection('products');
    
    // Apply filters
    if (categoryFilter) {
        query = query.where('category', '==', categoryFilter);
    }
    
    if (statusFilter) {
        query = query.where('active', '==', statusFilter === 'true');
    }
    
    if (stockFilter) {
        query = query.where('inStock', '==', stockFilter === 'true');
    }
    
    // Order by created date
    query = query.orderBy('createdAt', 'desc');
    
    // Execute query
    query.get()
        .then(snapshot => {
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center">לא נמצאו מוצרים</td></tr>';
                return;
            }
            
            // Get all products
            let products = [];
            snapshot.forEach(doc => {
                const product = doc.data();
                product.id = doc.id;
                products.push(product);
            });
            
            // Filter by search query if needed
            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                products = products.filter(product => {
                    return (
                        (product.title && product.title.toLowerCase().includes(lowerQuery)) ||
                        (product.description && product.description.toLowerCase().includes(lowerQuery)) ||
                        (product.sku && product.sku.toLowerCase().includes(lowerQuery))
                    );
                });
            }
            
            // Check if we have products after filtering
            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center">לא נמצאו מוצרים התואמים את החיפוש</td></tr>';
                return;
            }
            
            // Render products
            let html = '';
            products.forEach(product => {
                // Format date
                const createdDate = product.createdAt ? product.createdAt.toDate() : new Date();
                const formattedDate = createdDate.toLocaleDateString('he-IL');
                
                html += `
                    <tr>
                        <td>
                            <img src="${product.images?.[0] || '/img/placeholder.jpg'}" alt="${product.title}" width="50" height="50" style="object-fit: cover; border-radius: 4px;">
                        </td>
                        <td>${product.title}</td>
                        <td>${getCategoryLabel(product.category)}</td>
                        <td>₪${product.price}</td>
                        <td>${product.salePrice ? `₪${product.salePrice}` : '-'}</td>
                        <td>
                            <span class="badge ${product.inStock ? 'badge-success' : 'badge-danger'}">
                                ${product.inStock ? 'במלאי' : 'אזל מהמלאי'}
                            </span>
                        </td>
                        <td>
                            <span class="badge ${product.active ? 'badge-success' : 'badge-light'}">
                                ${product.active ? 'פעיל' : 'לא פעיל'}
                            </span>
                        </td>
                        <td>${formattedDate}</td>
                        <td>
                            <div class="row-actions">
                                <button class="btn-icon edit-product" data-id="${product.id}" title="ערוך מוצר">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon view-product" data-id="${product.id}" title="צפה במוצר">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon delete-product" data-id="${product.id}" title="מחק מוצר">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
            
            // Add event listeners for actions
            initProductActions();
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">אירעה שגיאה בטעינת המוצרים</td></tr>';
        });
}

/**
 * Initialize Product Actions
 */
function initProductActions() {
    console.log('Initializing product actions...');
    
    // Edit product buttons
    const editButtons = document.querySelectorAll('.edit-product');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.id;
            openProductModal('edit', productId);
        });
    });
    
    // View product buttons
    const viewButtons = document.querySelectorAll('.view-product');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.id;
            // Open product in new tab
            window.open(`product.html?id=${productId}`, '_blank');
        });
    });
    
    // Delete product buttons
    const deleteButtons = document.querySelectorAll('.delete-product');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.id;
            confirmDeleteProduct(productId);
        });
    });
    
    // Add product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        console.log('Add product button found, adding event listener');
        addProductBtn.addEventListener('click', function() {
            console.log('Add product button clicked');
            openProductModal('add');
        });
    } else {
        console.error('Add product button not found!');
    }
    
    // Cancel product button
    const cancelProductBtn = document.getElementById('cancel-product');
    if (cancelProductBtn) {
        console.log('✅ Cancel product button found in initProductActions, adding event listener');
        cancelProductBtn.addEventListener('click', function() {
            console.log('✅ Cancel product button clicked from initProductActions');
            const modal = document.getElementById('product-modal');
            if (modal) {
                modal.classList.remove('show');
                console.log('✅ Modal closed from initProductActions');
            }
        });
    } else {
        console.error('❌ Cancel product button not found in initProductActions!');
    }
    
    console.log('Product actions initialization complete');
}

/**
 * Open Product Modal
 * @param {string} mode - 'add' or 'edit'
 * @param {string} productId - Product ID (for edit mode)
 */
function openProductModal(mode, productId = null) {
    console.log('Opening product modal in mode:', mode);
    
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('product-modal-title');
    const productForm = document.getElementById('product-form');
    const productIdInput = document.getElementById('product-id');
    
    if (!modal || !modalTitle || !productForm || !productIdInput) {
        console.error('Modal elements not found:', {
            modal: !!modal,
            modalTitle: !!modalTitle,
            productForm: !!productForm,
            productIdInput: !!productIdInput
        });
        return;
    }
    
    // Set modal title and mode
    modalTitle.textContent = mode === 'add' ? 'הוספת מוצר חדש' : 'עריכת מוצר';
    productIdInput.value = productId || '';
    
    // Reset form
    productForm.reset();
    
    // Remove any previous submit event listeners
    const newForm = productForm.cloneNode(true);
    productForm.parentNode.replaceChild(newForm, productForm);
    
    // In edit mode, load product data
    if (mode === 'edit' && productId) {
        // Show loading state
        modal.classList.add('show');
        
        // Get product data
        getProductDetails(productId)
            .then(product => {
                if (!product) {
                    showToast('לא נמצא מוצר עם המזהה הזה', 'error');
                    modal.classList.remove('show');
                    return;
                }
                // Fill form with product data
                fillProductForm(product);
            })
            .catch(error => {
                console.error('Error loading product for edit:', error);
                showToast('אירעה שגיאה בטעינת המוצר', 'error');
                modal.classList.remove('show');
            });
    } else {
        // In add mode, just show the empty form
        modal.classList.add('show');
        // Set default status to 'פעיל' (true)
        const statusSelect = document.getElementById('product-status');
        if (statusSelect) statusSelect.value = 'true';
        console.log('Modal should be visible now');
    }
    
    // Ensure cancel button is working (backup)
    const cancelBtn = document.getElementById('cancel-product');
    if (cancelBtn) {
        console.log('✅ Cancel button found when opening modal');
        
        // Remove any existing listeners to avoid duplicates
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newCancelBtn.addEventListener('click', function() {
            console.log('✅ Cancel button clicked from modal open');
            modal.classList.remove('show');
        });
        
        // Test click handler
        newCancelBtn.addEventListener('click', function() {
            console.log('✅ Cancel button event listener is working');
        });
        
        // Log that the button is ready
        console.log('✅ Cancel button is ready for clicks');
    } else {
        console.error('❌ Cancel button NOT found when opening modal');
    }

    // Add submit event handler
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Collect form data
        const title = document.getElementById('product-title').value.trim();
        const category = document.getElementById('product-category').value;
        const images = document.getElementById('product-images-urls').value.trim();
        const price = parseFloat(document.getElementById('product-price').value) || 0;
        const salePrice = document.getElementById('product-sale-price').value ? parseFloat(document.getElementById('product-sale-price').value) : null;
        const inStock = document.getElementById('product-stock').value === 'true';
        const active = document.getElementById('product-status').value === 'true';
        
        // Validate required fields
        if (!title || !category || !images || price <= 0) {
            showToast('נא למלא את כל השדות החובה (שם, קטגוריה, תמונה ומחיר חייבים להיות גדולים מ-0)', 'error');
            return;
        }
        
        // Validate sale price
        if (salePrice !== null && salePrice >= price) {
            showToast('מחיר המבצע חייב להיות נמוך מהמחיר הרגיל', 'error');
            return;
        }
        
        // Prepare product data
        const productData = {
            title,
            category,
            description: title, // Use title as description for now
            images: [images], // Store as array with single image
            price: price,
            salePrice: salePrice,
            inStock: inStock,
            active: active,
            featured: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            if (mode === 'add') {
                const docRef = await db.collection('products').add(productData);
                console.log('Product added successfully with ID:', docRef.id);
                showToast(`המוצר "${title}" נוסף בהצלחה לחנות!`, 'success');
            } else if (mode === 'edit' && productId) {
                productData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('products').doc(productId).update(productData);
                console.log('Product updated successfully:', productId);
                showToast(`המוצר "${title}" עודכן בהצלחה!`, 'success');
            }
            
            // Close modal
            modal.classList.remove('show');
            
            // Reload products table to show the new/updated product
            await loadProducts();
            
            // Update dashboard stats
            loadDashboardStats();
            
            // Verify product appears in store (optional check)
            if (mode === 'add') {
                setTimeout(() => {
                    verifyProductInStore(docRef.id, title);
                }, 2000); // Wait 2 seconds for Firestore to update
            }
            
        } catch (error) {
            console.error('Error saving product:', error);
            showToast('אירעה שגיאה בשמירת המוצר. נסי שוב.', 'error');
        }
    });
}

/**
 * Fill Product Form with Data
 * @param {Object} product - Product data
 */
function fillProductForm(product) {
    // Basic info
    document.getElementById('product-title').value = product.title || '';
    document.getElementById('product-category').value = product.category || '';
    
    // Images
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        document.getElementById('product-images-urls').value = product.images[0]; // Use first image
        renderImagesPreview([product.images[0]]);
    } else {
        document.getElementById('product-images-urls').value = '';
        renderImagesPreview([]);
    }
    
    // Price fields
    document.getElementById('product-price').value = product.price || 0;
    document.getElementById('product-sale-price').value = product.salePrice || '';
    
    // Stock and status
    document.getElementById('product-stock').value = product.inStock ? 'true' : 'false';
    document.getElementById('product-status').value = product.active ? 'true' : 'false';
}

/**
 * Initialize Image Actions
 */
function initImageActions() {
    const removeButtons = document.querySelectorAll('.image-action-btn.remove');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove the image item
            const imageItem = this.closest('.uploaded-image');
            if (imageItem) {
                imageItem.remove();
            }
        });
    });
}

/**
 * Create Color Item Element
 * @param {string} name - Color name
 * @param {string} code - Color code
 * @returns {HTMLElement} - Color item element
 */
function createColorItem(name = '', code = '') {
    const colorItem = document.createElement('div');
    colorItem.className = 'color-item';
    colorItem.innerHTML = `
        <div class="color-preview" style="background-color: ${code};"></div>
        <input type="text" class="color-name" placeholder="שם הצבע" value="${name}">
        <input type="text" class="color-code" placeholder="קוד הצבע" value="${code}">
        <button type="button" class="btn-icon remove-color"><i class="fas fa-times"></i></button>
    `;
    return colorItem;
}

/**
 * Initialize Color Items Events
 */
function initColorItems() {
    // Remove color buttons
    const removeButtons = document.querySelectorAll('.remove-color');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove the color item
            const colorItem = this.closest('.color-item');
            if (colorItem) {
                colorItem.remove();
            }
        });
    });
    
    // Add color button
    const addColorBtn = document.querySelector('.add-color-btn');
    if (addColorBtn) {
        addColorBtn.addEventListener('click', function() {
            const colorsContainer = document.getElementById('colors-container');
            if (colorsContainer) {
                const colorItem = createColorItem();
                colorsContainer.appendChild(colorItem);
                initColorItems(); // Re-initialize events
            }
        });
    }
}

/**
 * Create Size Item Element
 * @param {string} size - Size value
 * @returns {HTMLElement} - Size item element
 */
function createSizeItem(size = '') {
    const sizeItem = document.createElement('div');
    sizeItem.className = 'size-item';
    sizeItem.innerHTML = `
        <input type="text" class="size-value" placeholder="ערך המידה" value="${size}">
        <button type="button" class="btn-icon remove-size"><i class="fas fa-times"></i></button>
    `;
    return sizeItem;
}

/**
 * Initialize Size Items Events
 */
function initSizeItems() {
    // Remove size buttons
    const removeButtons = document.querySelectorAll('.remove-size');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove the size item
            const sizeItem = this.closest('.size-item');
            if (sizeItem) {
                sizeItem.remove();
            }
        });
    });
    
    // Add size button
    const addSizeBtn = document.querySelector('.add-size-btn');
    if (addSizeBtn) {
        addSizeBtn.addEventListener('click', function() {
            const sizesContainer = document.getElementById('sizes-container');
            if (sizesContainer) {
                const sizeItem = createSizeItem();
                sizesContainer.appendChild(sizeItem);
                initSizeItems(); // Re-initialize events
            }
        });
    }
}

/**
 * Create Detail Item Element
 * @param {string} key - Detail key
 * @param {string} value - Detail value
 * @returns {HTMLElement} - Detail item element
 */
function createDetailItem(key = '', value = '') {
    const detailItem = document.createElement('div');
    detailItem.className = 'detail-item';
    detailItem.innerHTML = `
        <input type="text" class="detail-key" placeholder="מאפיין" value="${key}">
        <input type="text" class="detail-value" placeholder="ערך" value="${value}">
        <button type="button" class="btn-icon remove-detail"><i class="fas fa-times"></i></button>
    `;
    return detailItem;
}

/**
 * Initialize Detail Items Events
 */
function initDetailItems() {
    // Remove detail buttons
    const removeButtons = document.querySelectorAll('.remove-detail');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove the detail item
            const detailItem = this.closest('.detail-item');
            if (detailItem) {
                detailItem.remove();
            }
        });
    });
    
    // Add detail button
    const addDetailBtn = document.querySelector('.add-detail-btn');
    if (addDetailBtn) {
        addDetailBtn.addEventListener('click', function() {
            const detailsContainer = document.getElementById('details-container');
            if (detailsContainer) {
                const detailItem = createDetailItem();
                detailsContainer.appendChild(detailItem);
                initDetailItems(); // Re-initialize events
            }
        });
    }
}

/**
 * Confirm Delete Product
 * @param {string} productId - Product ID to delete
 */
function confirmDeleteProduct(productId) {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes');
    const confirmNoBtn = document.getElementById('confirm-no');
    
    if (!confirmModal || !confirmTitle || !confirmMessage || !confirmYesBtn || !confirmNoBtn) return;
    
    // Set modal content
    confirmTitle.textContent = 'מחיקת מוצר';
    confirmMessage.textContent = 'האם את בטוחה שברצונך למחוק את המוצר? פעולה זו אינה ניתנת לביטול.';
    
    // Show modal
    confirmModal.classList.add('show');
    
    // Set up confirm buttons
    const yesHandler = function() {
        // Delete product
        deleteProduct(productId)
            .then(() => {
                showToast('המוצר נמחק בהצלחה', 'success');
                // Reload products list
                loadProducts();
            })
            .catch(error => {
                console.error('Error deleting product:', error);
                showToast('אירעה שגיאה במחיקת המוצר', 'error');
            })
            .finally(() => {
                // Close modal
                confirmModal.classList.remove('show');
                
                // Remove event listeners
                confirmYesBtn.removeEventListener('click', yesHandler);
                confirmNoBtn.removeEventListener('click', noHandler);
            });
    };
    
    const noHandler = function() {
        // Close modal
        confirmModal.classList.remove('show');
        
        // Remove event listeners
        confirmYesBtn.removeEventListener('click', yesHandler);
        confirmNoBtn.removeEventListener('click', noHandler);
    };
    
    // Add event listeners
    confirmYesBtn.addEventListener('click', yesHandler);
    confirmNoBtn.addEventListener('click', noHandler);
    
    // Close button handler
    const closeBtn = document.getElementById('confirm-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', noHandler);
    }
}

/**
 * Load Orders Data
 */
function loadOrders() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    
    // Show loading
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">טוען הזמנות...</td></tr>';
    
    // Get filters
    const statusFilter = document.getElementById('order-status-filter')?.value || '';
    const dateFrom = document.getElementById('date-from')?.value || '';
    const dateTo = document.getElementById('date-to')?.value || '';
    const searchQuery = document.getElementById('orders-search')?.value || '';
    
    // Create query
    let query = db.collection('orders');
    
    // Apply filters
    if (statusFilter) {
        query = query.where('status', '==', statusFilter);
    }
    
    // Date filters (to be implemented in a more complete version)
    
    // Order by created date
    query = query.orderBy('createdAt', 'desc');
    
    // Execute query
    query.get()
        .then(snapshot => {
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">לא נמצאו הזמנות</td></tr>';
                return;
            }
            
            // Get all orders
            let orders = [];
            snapshot.forEach(doc => {
                const order = doc.data();
                order.id = doc.id;
                orders.push(order);
            });
            
            // Filter by search query if needed
            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                orders = orders.filter(order => {
                    return (
                        (order.customer?.name && order.customer.name.toLowerCase().includes(lowerQuery)) ||
                        (order.customer?.email && order.customer.email.toLowerCase().includes(lowerQuery)) ||
                        order.id.toLowerCase().includes(lowerQuery)
                    );
                });
            }
            
            // Check if we have orders after filtering
            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">לא נמצאו הזמנות התואמות את החיפוש</td></tr>';
                return;
            }
            
            // Render orders
            let html = '';
            orders.forEach(order => {
                // Format date
                const orderDate = order.createdAt ? order.createdAt.toDate() : new Date();
                const formattedDate = orderDate.toLocaleDateString('he-IL');
                
                // Get status badge class
                const statusClass = `status-${order.status || 'pending'}`;
                
                // Get items count
                const itemsCount = order.items ? order.items.length : 0;
                
                html += `
                    <tr>
                        <td>#${order.id.substring(0, 6)}</td>
                        <td>${order.customer?.name || 'לקוח לא רשום'}</td>
                        <td>${formattedDate}</td>
                        <td>${itemsCount} פריטים</td>
                        <td>₪${order.total?.toLocaleString() || '0'}</td>
                        <td><span class="status-badge ${statusClass}">${getStatusLabel(order.status)}</span></td>
                        <td>${order.paymentMethod || 'לא צוין'}</td>
                        <td>
                            <div class="row-actions">
                                <button class="btn-icon view-order" data-id="${order.id}" title="צפה בהזמנה">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon update-status" data-id="${order.id}" title="עדכן סטטוס">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
            
            // Add event listeners for actions
            initOrderActions();
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">אירעה שגיאה בטעינת ההזמנות</td></tr>';
        });
}

/**
 * Initialize Order Actions
 */
function initOrderActions() {
    // View order buttons
    const viewButtons = document.querySelectorAll('.view-order');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.dataset.id;
            openOrderModal(orderId);
        });
    });
    
    // Update status buttons
    const updateButtons = document.querySelectorAll('.update-status');
    updateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.dataset.id;
            openOrderStatusMenu(this, orderId);
        });
    });
}

/**
 * Open Order Modal
 * @param {string} orderId - Order ID
 */
function openOrderModal(orderId) {
    const modal = document.getElementById('order-modal');
    const orderIdDisplay = document.getElementById('order-id-display');
    const orderDetails = document.getElementById('order-details');
    
    if (!modal || !orderIdDisplay || !orderDetails) return;
    
    // Set order ID
    orderIdDisplay.textContent = orderId.substring(0, 6);
    
    // Show loading
    orderDetails.innerHTML = '<div class="loading-placeholder"><div class="spinner-small"></div> טוען פרטי הזמנה...</div>';
    
    // Show modal
    modal.classList.add('show');
    
    // Get order data
    db.collection('orders').doc(orderId).get()
        .then(doc => {
            if (!doc.exists) {
                orderDetails.innerHTML = '<div class="loading-placeholder">לא נמצאה הזמנה עם המזהה הזה</div>';
                return;
            }
            
            const order = doc.data();
            order.id = doc.id;
            
            // Format date
            const orderDate = order.createdAt ? order.createdAt.toDate() : new Date();
            const formattedDate = orderDate.toLocaleDateString('he-IL');
            const formattedTime = orderDate.toLocaleTimeString('he-IL');
            
            // Get status badge
            const statusClass = `status-${order.status || 'pending'}`;
            
            // Render order details
            let html = `
                <div class="order-details">
                    <div class="order-section">
                        <h4>פרטי הזמנה</h4>
                        <div class="order-meta">
                            <div class="meta-item">
                                <span class="meta-label">מזהה הזמנה:</span>
                                <span class="meta-value">#${order.id}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">תאריך:</span>
                                <span class="meta-value">${formattedDate} ${formattedTime}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">סטטוס:</span>
                                <span class="meta-value"><span class="status-badge ${statusClass}">${getStatusLabel(order.status)}</span></span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">שיטת תשלום:</span>
                                <span class="meta-value">${order.paymentMethod || 'לא צוין'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-section">
                        <h4>פרטי לקוח</h4>
                        <div class="customer-details">
                            <div class="meta-item">
                                <span class="meta-label">שם:</span>
                                <span class="meta-value">${order.customer?.name || 'לא צוין'}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">אימייל:</span>
                                <span class="meta-value">${order.customer?.email || 'לא צוין'}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">טלפון:</span>
                                <span class="meta-value">${order.customer?.phone || 'לא צוין'}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">כתובת:</span>
                                <span class="meta-value">${formatAddress(order.customer?.address) || 'לא צוין'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-section">
                        <h4>פריטים</h4>
                        <div class="order-items">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>פריט</th>
                                        <th>פרטים</th>
                                        <th>מחיר</th>
                                        <th>כמות</th>
                                        <th>סה"כ</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    
                    html += `
                        <tr>
                            <td>
                                <div class="d-flex align-center gap-sm">
                                    <img src="${item.image || '/img/placeholder.jpg'}" alt="${item.title}" width="40" height="40" style="object-fit: cover; border-radius: 4px;">
                                    <div>${item.title}</div>
                                </div>
                            </td>
                            <td>
                                ${item.color ? `צבע: ${item.color}` : ''}
                                ${item.color && item.size ? ' | ' : ''}
                                ${item.size ? `מידה: ${item.size}` : ''}
                            </td>
                            <td>₪${item.price}</td>
                            <td>${item.quantity}</td>
                            <td>₪${itemTotal}</td>
                        </tr>
                    `;
                });
            } else {
                html += `<tr><td colspan="5" class="text-center">אין פריטים בהזמנה זו</td></tr>`;
            }
            
            html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="order-section">
                        <h4>סיכום</h4>
                        <div class="order-summary">
                            <div class="summary-item">
                                <span class="summary-label">סכום ביניים:</span>
                                <span class="summary-value">₪${order.subtotal?.toLocaleString() || '0'}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">משלוח:</span>
                                <span class="summary-value">₪${order.shipping?.toLocaleString() || '0'}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">מע"מ (17%):</span>
                                <span class="summary-value">₪${order.tax?.toLocaleString() || '0'}</span>
                            </div>
                            <div class="summary-item total">
                                <span class="summary-label">סה"כ לתשלום:</span>
                                <span class="summary-value">₪${order.total?.toLocaleString() || '0'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="order-actions">
                        <div class="status-update">
                            <label for="order-status-update">עדכון סטטוס:</label>
                            <select id="order-status-update">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>ממתין לאישור</option>
                                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>בטיפול</option>
                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>נשלח</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>נמסר</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>בוטל</option>
                            </select>
                            <button class="btn btn-primary update-order-status" data-id="${order.id}">עדכן סטטוס</button>
                        </div>
                        <div class="other-actions">
                            <button class="btn btn-outline print-order" data-id="${order.id}">
                                <i class="fas fa-print"></i> הדפס הזמנה
                            </button>
                            <button class="btn btn-outline send-invoice" data-id="${order.id}">
                                <i class="fas fa-envelope"></i> שלח חשבונית
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            orderDetails.innerHTML = html;
            
            // Initialize order actions
            initOrderModalActions();
        })
        .catch(error => {
            console.error('Error loading order details:', error);
            orderDetails.innerHTML = '<div class="loading-placeholder">אירעה שגיאה בטעינת פרטי ההזמנה</div>';
        });
}

/**
 * Initialize Order Modal Actions
 */
function initOrderModalActions() {
    // Update status button
    const updateStatusBtn = document.querySelector('.update-order-status');
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', function() {
            const orderId = this.dataset.id;
            const statusSelect = document.getElementById('order-status-update');
            
            if (statusSelect) {
                const newStatus = statusSelect.value;
                
                // Update order status
                db.collection('orders').doc(orderId).update({
                    status: newStatus,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    showToast('סטטוס ההזמנה עודכן בהצלחה', 'success');
                    
                    // Update status badge in modal
                    const statusBadge = document.querySelector('.order-details .status-badge');
                    if (statusBadge) {
                        statusBadge.className = `status-badge status-${newStatus}`;
                        statusBadge.textContent = getStatusLabel(newStatus);
                    }
                    
                    // Reload orders list
                    loadOrders();
                })
                .catch(error => {
                    console.error('Error updating order status:', error);
                    showToast('אירעה שגיאה בעדכון סטטוס ההזמנה', 'error');
                });
            }
        });
    }
    
    // Print order button
    const printOrderBtn = document.querySelector('.print-order');
    if (printOrderBtn) {
        printOrderBtn.addEventListener('click', function() {
            // Open print dialog
            window.print();
        });
    }
    
    // Send invoice button
    const sendInvoiceBtn = document.querySelector('.send-invoice');
    if (sendInvoiceBtn) {
        sendInvoiceBtn.addEventListener('click', function() {
            showToast('פונקציית שליחת חשבונית אינה זמינה במערכת הדגמה זו', 'info');
        });
    }
}

/**
 * Open Order Status Menu
 * @param {HTMLElement} button - Button element
 * @param {string} orderId - Order ID
 */
function openOrderStatusMenu(button, orderId) {
    // Create status menu
    const statusMenu = document.createElement('div');
    statusMenu.className = 'status-menu';
    statusMenu.innerHTML = `
        <div class="status-menu-item" data-status="pending">ממתין לאישור</div>
        <div class="status-menu-item" data-status="processing">בטיפול</div>
        <div class="status-menu-item" data-status="shipped">נשלח</div>
        <div class="status-menu-item" data-status="delivered">נמסר</div>
        <div class="status-menu-item" data-status="cancelled">בוטל</div>
    `;
    
    // Position menu near the button
    const buttonRect = button.getBoundingClientRect();
    statusMenu.style.position = 'absolute';
    statusMenu.style.top = `${buttonRect.bottom + window.scrollY + 5}px`;
    statusMenu.style.right = `${buttonRect.right + window.scrollX - 150}px`;
    statusMenu.style.width = '150px';
    statusMenu.style.zIndex = '1000';
    
    // Add to document
    document.body.appendChild(statusMenu);
    
    // Add event listeners to menu items
    const menuItems = statusMenu.querySelectorAll('.status-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const newStatus = this.dataset.status;
            
            // Update order status
            db.collection('orders').doc(orderId).update({
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                showToast('סטטוס ההזמנה עודכן בהצלחה', 'success');
                
                // Reload orders list
                loadOrders();
            })
            .catch(error => {
                console.error('Error updating order status:', error);
                showToast('אירעה שגיאה בעדכון סטטוס ההזמנה', 'error');
            });
            
            // Remove menu
            statusMenu.remove();
        });
    });
    
    // Close menu when clicking outside
    const closeMenu = function(e) {
        if (!statusMenu.contains(e.target) && e.target !== button) {
            statusMenu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    
    // Add click event with a small delay to prevent immediate closing
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
}

/**
 * Load Messages Data
 */
function loadMessages() {
    const messagesList = document.getElementById('messages-list');
    if (!messagesList) return;
    
    // Show loading
    messagesList.innerHTML = '<div class="loading-placeholder">טוען הודעות...</div>';
    
    // Get filters
    const statusFilter = document.getElementById('message-status-filter')?.value || '';
    const subjectFilter = document.getElementById('message-subject-filter')?.value || '';
    const dateFrom = document.getElementById('message-date-from')?.value || '';
    const searchQuery = document.getElementById('messages-search')?.value || '';
    
    // Create query
    let query = db.collection('contact_messages');
    
    // Apply filters
    if (statusFilter) {
        query = query.where('status', '==', statusFilter);
    }
    
    if (subjectFilter) {
        query = query.where('subject', '==', subjectFilter);
    }
    
    // Order by timestamp
    query = query.orderBy('timestamp', 'desc');
    
    // Execute query
    query.get()
        .then(snapshot => {
            if (snapshot.empty) {
                messagesList.innerHTML = '<div class="loading-placeholder">אין הודעות</div>';
                return;
            }
            
            // Get all messages
            let messages = [];
            snapshot.forEach(doc => {
                const message = doc.data();
                message.id = doc.id;
                messages.push(message);
            });
            
            // Filter by search query if needed
            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                messages = messages.filter(message => {
                    return (
                        (message.name && message.name.toLowerCase().includes(lowerQuery)) ||
                        (message.email && message.email.toLowerCase().includes(lowerQuery)) ||
                        (message.subject && message.subject.toLowerCase().includes(lowerQuery)) ||
                        (message.message && message.message.toLowerCase().includes(lowerQuery))
                    );
                });
            }
            
            // Check if we have messages after filtering
            if (messages.length === 0) {
                messagesList.innerHTML = '<div class="loading-placeholder">לא נמצאו הודעות התואמות את החיפוש</div>';
                return;
            }
            
            // Render messages
            let html = '';
            messages.forEach(message => {
                // Format date
                const messageDate = message.timestamp ? message.timestamp.toDate() : new Date();
                const formattedDate = messageDate.toLocaleDateString('he-IL');
                
                // Truncate message preview
                const messagePreview = message.message ? (message.message.length > 100 ? 
                                       message.message.substring(0, 100) + '...' : message.message) : '';
                
                // Get status badge
                const statusBadge = message.status === 'replied' ? 
                                    '<span class="message-tag reply">נענה</span>' : 
                                    (message.status === 'read' ? 
                                     '<span class="message-tag reply">נקרא</span>' : 
                                     '<span class="message-tag new">חדש</span>');
                
                html += `
                    <div class="message-item ${message.status !== 'read' && message.status !== 'replied' ? 'unread' : ''}" data-id="${message.id}">
                        <div class="message-sender">
                            <div>${message.name} ${statusBadge}</div>
                            <div class="message-date">${formattedDate}</div>
                        </div>
                        <div class="message-subject">${message.subject || 'ללא נושא'}</div>
                        <div class="message-preview">${messagePreview}</div>
                    </div>
                `;
            });
            
            messagesList.innerHTML = html;
            
            // Add click events to message items
            const messageItems = messagesList.querySelectorAll('.message-item');
            messageItems.forEach(item => {
                item.addEventListener('click', function() {
                    // Deselect all messages
                    messageItems.forEach(i => i.classList.remove('active'));
                    
                    // Select this message
                    this.classList.add('active');
                    
                    // Load message details
                    const messageId = this.dataset.id;
                    loadMessageDetails(messageId);
                    
                    // Mark as read if unread
                    if (this.classList.contains('unread')) {
                        this.classList.remove('unread');
                        
                        // Update in Firebase
                        db.collection('contact_messages').doc(messageId).update({
                            status: 'read',
                            readAt: firebase.firestore.FieldValue.serverTimestamp()
                        }).catch(error => {
                            console.error('Error marking message as read:', error);
                        });
                        
                        // Update unread counts
                        updateUnreadCounts();
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
            messagesList.innerHTML = '<div class="loading-placeholder">אירעה שגיאה בטעינת ההודעות</div>';
        });
}

/**
 * Load Message Details
 * @param {string} messageId - Message ID
 */
function loadMessageDetails(messageId) {
    const messageDetails = document.getElementById('message-details');
    if (!messageDetails) return;
    
    // Show loading
    messageDetails.innerHTML = '<div class="loading-placeholder"><div class="spinner-small"></div> טוען פרטי הודעה...</div>';
    
    // Get message data
    db.collection('contact_messages').doc(messageId).get()
        .then(doc => {
            if (!doc.exists) {
                messageDetails.innerHTML = '<div class="loading-placeholder">לא נמצאה הודעה עם המזהה הזה</div>';
                return;
            }
            
            const message = doc.data();
            message.id = doc.id;
            
            // Format date
            const messageDate = message.timestamp ? message.timestamp.toDate() : new Date();
            const formattedDate = messageDate.toLocaleDateString('he-IL');
            const formattedTime = messageDate.toLocaleTimeString('he-IL');
            
            // Format message content with line breaks
            const formattedMessage = message.message ? message.message.replace(/\n/g, '<br>') : '';
            
            // Render message details
            let html = `
                <div class="message-detail-header">
                    <h3>${message.subject || 'ללא נושא'}</h3>
                    <div class="message-meta">
                        <div class="meta-item">
                            <span class="meta-label">מאת:</span>
                            <span class="meta-value">${message.name} (${message.email})</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">תאריך:</span>
                            <span class="meta-value">${formattedDate} ${formattedTime}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">טלפון:</span>
                            <span class="meta-value">${message.phone || 'לא צוין'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="message-content">
                    ${formattedMessage}
                </div>
                
                <div class="message-actions">
                    <button class="btn btn-primary reply-message" data-id="${message.id}" data-email="${message.email}" data-name="${message.name}">
                        <i class="fas fa-reply"></i> השב להודעה
                    </button>
                    <button class="btn btn-outline archive-message" data-id="${message.id}">
                        <i class="fas fa-archive"></i> העבר לארכיון
                    </button>
                    <button class="btn btn-danger delete-message" data-id="${message.id}">
                        <i class="fas fa-trash"></i> מחק הודעה
                    </button>
                </div>
            `;
            
            // Check if there are replies
            if (message.replies && message.replies.length > 0) {
                html += `
                    <div class="message-replies">
                        <h4>תגובות קודמות</h4>
                        <div class="replies-list">
                `;
                
                message.replies.forEach(reply => {
                    const replyDate = reply.timestamp ? reply.timestamp.toDate() : new Date();
                    const formattedReplyDate = replyDate.toLocaleDateString('he-IL');
                    const formattedReplyTime = replyDate.toLocaleTimeString('he-IL');
                    
                    html += `
                        <div class="reply-item">
                            <div class="reply-header">
                                <div class="reply-sender">נשלח ע"י: ${reply.sentBy || 'צוות האתר'}</div>
                                <div class="reply-date">${formattedReplyDate} ${formattedReplyTime}</div>
                            </div>
                            <div class="reply-content">
                                ${reply.content ? reply.content.replace(/\n/g, '<br>') : ''}
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
            
            messageDetails.innerHTML = html;
            
            // Initialize message actions
            initMessageActions();
        })
        .catch(error => {
            console.error('Error loading message details:', error);
            messageDetails.innerHTML = '<div class="loading-placeholder">אירעה שגיאה בטעינת פרטי ההודעה</div>';
        });
}

/**
 * Initialize Message Actions
 */
function initMessageActions() {
    // Reply to message button
    const replyBtn = document.querySelector('.reply-message');
    if (replyBtn) {
        replyBtn.addEventListener('click', function() {
            const messageId = this.dataset.id;
            const customerEmail = this.dataset.email;
            const customerName = this.dataset.name;
            
            openReplyMessageModal(messageId, customerEmail, customerName);
        });
    }
    
    // Archive message button
    const archiveBtn = document.querySelector('.archive-message');
    if (archiveBtn) {
        archiveBtn.addEventListener('click', function() {
            const messageId = this.dataset.id;
            
            // Update message status to archived
            db.collection('contact_messages').doc(messageId).update({
                status: 'archived',
                archivedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                showToast('ההודעה הועברה לארכיון בהצלחה', 'success');
                
                // Reload messages list
                loadMessages();
                
                // Clear message details view
                const messageDetails = document.getElementById('message-details');
                if (messageDetails) {
                    messageDetails.innerHTML = `
                        <div class="no-message-selected">
                            <i class="far fa-envelope"></i>
                            <p>בחרי הודעה מהרשימה לצפייה בפרטים</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error archiving message:', error);
                showToast('אירעה שגיאה בהעברת ההודעה לארכיון', 'error');
            });
        });
    }
    
    // Delete message button
    const deleteBtn = document.querySelector('.delete-message');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const messageId = this.dataset.id;
            confirmDeleteMessage(messageId);
        });
    }
}

/**
 * Open Reply Message Modal
 * @param {string} messageId - Message ID
 * @param {string} customerEmail - Customer email
 * @param {string} customerName - Customer name
 */
function openReplyMessageModal(messageId, customerEmail, customerName) {
    // Create modal dynamically if not exists
    let replyModal = document.getElementById('reply-modal');
    
    if (!replyModal) {
        replyModal = document.createElement('div');
        replyModal.id = 'reply-modal';
        replyModal.className = 'modal';
        replyModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>מענה להודעה</h3>
                        <button class="modal-close" id="reply-modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="reply-form" class="admin-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="reply-to">נמען:</label>
                                    <input type="text" id="reply-to" disabled>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="reply-subject">נושא:</label>
                                    <input type="text" id="reply-subject">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="reply-content">תוכן:</label>
                                    <textarea id="reply-content" rows="8"></textarea>
                                </div>
                            </div>
                            <input type="hidden" id="reply-message-id">
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">שלח תשובה</button>
                                <button type="button" class="btn btn-outline" id="cancel-reply">ביטול</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(replyModal);
    }
    
    // Set form values
    document.getElementById('reply-to').value = `${customerName} <${customerEmail}>`;
    document.getElementById('reply-subject').value = `Re: ${getMessageSubject(messageId)}`;
    document.getElementById('reply-message-id').value = messageId;
    
    // Add standard response template
    document.getElementById('reply-content').value = `שלום ${customerName},\n\nתודה על פנייתך אלינו.\n\n\n\nבברכה,\nצוות דמקה סווימוור`;
    
    // Show modal
    replyModal.classList.add('show');
    
    // Modal close button
    const closeBtn = document.getElementById('reply-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            replyModal.classList.remove('show');
        });
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-reply');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            replyModal.classList.remove('show');
        });
    }
    
    // Form submission
    const replyForm = document.getElementById('reply-form');
    if (replyForm) {
        replyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const subject = document.getElementById('reply-subject').value;
            const content = document.getElementById('reply-content').value;
            const messageId = document.getElementById('reply-message-id').value;
            
            // Make sure content is not empty
            if (!content.trim()) {
                showToast('נא להזין תוכן לתשובה', 'error');
                return;
            }
            
            // Get current user for the "sent by" field
            getCurrentUser()
                .then(user => {
                    const sentBy = user.displayName || user.email || 'צוות האתר';
                    
                    // Create reply object
                    const reply = {
                        subject: subject,
                        content: content,
                        sentBy: sentBy,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        toEmail: customerEmail,
                        toName: customerName
                    };
                    
                    // Update message in Firebase
                    db.collection('contact_messages').doc(messageId).update({
                        status: 'replied',
                        repliedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        replies: firebase.firestore.FieldValue.arrayUnion(reply)
                    })
                    .then(() => {
                        showToast('התשובה נשלחה בהצלחה', 'success');
                        
                        // Close modal
                        replyModal.classList.remove('show');
                        
                        // Reload message details to show the reply
                        loadMessageDetails(messageId);
                        
                        // Reload messages list to update status
                        loadMessages();
                    })
                    .catch(error => {
                        console.error('Error sending reply:', error);
                        showToast('אירעה שגיאה בשליחת התשובה', 'error');
                    });
                })
                .catch(error => {
                    console.error('Error getting current user:', error);
                    showToast('אירעה שגיאה באימות המשתמש', 'error');
                });
        });
    }
}

/**
 * Get Message Subject by ID
 * @param {string} messageId - Message ID
 * @returns {string} - Message subject
 */
function getMessageSubject(messageId) {
    // This is a synchronous function for simplicity
    // In a real application, you might want to store the subject in a data attribute
    // or use async/await pattern
    
    const messageItems = document.querySelectorAll('.message-item');
    let subject = '';
    
    messageItems.forEach(item => {
        if (item.dataset.id === messageId) {
            const subjectElement = item.querySelector('.message-subject');
            if (subjectElement) {
                subject = subjectElement.textContent;
            }
        }
    });
    
    return subject || 'פנייה מהאתר';
}

/**
 * Confirm Delete Message
 * @param {string} messageId - Message ID to delete
 */
function confirmDeleteMessage(messageId) {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes');
    const confirmNoBtn = document.getElementById('confirm-no');
    
    if (!confirmModal || !confirmTitle || !confirmMessage || !confirmYesBtn || !confirmNoBtn) return;
    
    // Set modal content
    confirmTitle.textContent = 'מחיקת הודעה';
    confirmMessage.textContent = 'האם את בטוחה שברצונך למחוק את ההודעה? פעולה זו אינה ניתנת לביטול.';
    
    // Show modal
    confirmModal.classList.add('show');
    
    // Set up confirm buttons
    const yesHandler = function() {
        // Delete message
        db.collection('contact_messages').doc(messageId).delete()
            .then(() => {
                showToast('ההודעה נמחקה בהצלחה', 'success');
                
                // Reload messages list
                loadMessages();
                
                // Clear message details view
                const messageDetails = document.getElementById('message-details');
                if (messageDetails) {
                    messageDetails.innerHTML = `
                        <div class="no-message-selected">
                            <i class="far fa-envelope"></i>
                            <p>בחרי הודעה מהרשימה לצפייה בפרטים</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error deleting message:', error);
                showToast('אירעה שגיאה במחיקת ההודעה', 'error');
            })
            .finally(() => {
                // Close modal
                confirmModal.classList.remove('show');
                
                // Remove event listeners
                confirmYesBtn.removeEventListener('click', yesHandler);
                confirmNoBtn.removeEventListener('click', noHandler);
            });
    };
    
    const noHandler = function() {
        // Close modal
        confirmModal.classList.remove('show');
        
        // Remove event listeners
        confirmYesBtn.removeEventListener('click', yesHandler);
        confirmNoBtn.removeEventListener('click', noHandler);
    };
    
    // Add event listeners
    confirmYesBtn.addEventListener('click', yesHandler);
    confirmNoBtn.addEventListener('click', noHandler);
    
    // Close button handler
    const closeBtn = document.getElementById('confirm-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', noHandler);
    }
}

/**
 * Load Customers Data
 */
function loadCustomers() {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;
    
    // Show loading
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">טוען לקוחות...</td></tr>';
    
    // Get search query
    const searchQuery = document.getElementById('customers-search')?.value || '';
    
    // Create query
    let query = db.collection('users')
        .orderBy('createdAt', 'desc');
    
    // Execute query
    query.get()
        .then(snapshot => {
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">לא נמצאו לקוחות</td></tr>';
                return;
            }
            
            // Get all customers
            let customers = [];
            snapshot.forEach(doc => {
                const customer = doc.data();
                customer.id = doc.id;
                customers.push(customer);
            });
            
            // Filter by search query if needed
            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                customers = customers.filter(customer => {
                    return (
                        (customer.name && customer.name.toLowerCase().includes(lowerQuery)) ||
                        (customer.email && customer.email.toLowerCase().includes(lowerQuery)) ||
                        (customer.phone && customer.phone.includes(lowerQuery))
                    );
                });
            }
            
            // Check if we have customers after filtering
            if (customers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">לא נמצאו לקוחות התואמים את החיפוש</td></tr>';
                return;
            }
            
            // Render customers
            let html = '';
            customers.forEach(customer => {
                // Format date
                const createdDate = customer.createdAt ? customer.createdAt.toDate() : new Date();
                const formattedDate = createdDate.toLocaleDateString('he-IL');
                
                html += `
                    <tr>
                        <td>${customer.name || 'לא צוין'}</td>
                        <td>${customer.email || 'לא צוין'}</td>
                        <td>${customer.phone || 'לא צוין'}</td>
                        <td>${formattedDate}</td>
                        <td>${customer.ordersCount || 0}</td>
                        <td>₪${customer.totalSpent?.toLocaleString() || '0'}</td>
                        <td>
                            <div class="row-actions">
                                <button class="btn-icon view-customer" data-id="${customer.id}" title="צפה בלקוח">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-icon edit-customer" data-id="${customer.id}" title="ערוך לקוח">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon customer-orders" data-id="${customer.id}" title="הזמנות הלקוח">
                                    <i class="fas fa-shopping-bag"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
            
            // Add event listeners for actions
            initCustomerActions();
        })
        .catch(error => {
            console.error('Error fetching customers:', error);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">אירעה שגיאה בטעינת הלקוחות</td></tr>';
        });
}

/**
 * Initialize Customer Actions
 */
function initCustomerActions() {
    // View customer buttons
    const viewButtons = document.querySelectorAll('.view-customer');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const customerId = this.dataset.id;
            openCustomerModal('view', customerId);
        });
    });
    
    // Edit customer buttons
    const editButtons = document.querySelectorAll('.edit-customer');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const customerId = this.dataset.id;
            openCustomerModal('edit', customerId);
        });
    });
    
    // Customer orders buttons
    const ordersButtons = document.querySelectorAll('.customer-orders');
    ordersButtons.forEach(button => {
        button.addEventListener('click', function() {
            const customerId = this.dataset.id;
            viewCustomerOrders(customerId);
        });
    });
}

/**
 * Open Customer Modal
 * @param {string} mode - 'view' or 'edit'
 * @param {string} customerId - Customer ID
 */
function openCustomerModal(mode, customerId) {
    // Create modal dynamically if not exists
    let customerModal = document.getElementById('customer-modal');
    
    if (!customerModal) {
        customerModal = document.createElement('div');
        customerModal.id = 'customer-modal';
        customerModal.className = 'modal';
        customerModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="customer-modal-title">פרטי לקוח</h3>
                        <button class="modal-close" id="customer-modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="customer-form" class="admin-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customer-name">שם מלא</label>
                                    <input type="text" id="customer-name" name="name">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customer-email">אימייל</label>
                                    <input type="email" id="customer-email" name="email">
                                </div>
                                <div class="form-group">
                                    <label for="customer-phone">טלפון</label>
                                    <input type="tel" id="customer-phone" name="phone">
                                </div>
                            </div>
                            <div class="form-section">
                                <h4>כתובת</h4>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="customer-street">רחוב ומספר</label>
                                        <input type="text" id="customer-street" name="street">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="customer-city">עיר</label>
                                        <input type="text" id="customer-city" name="city">
                                    </div>
                                    <div class="form-group">
                                        <label for="customer-zip">מיקוד</label>
                                        <input type="text" id="customer-zip" name="zip">
                                    </div>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customer-notes">הערות</label>
                                    <textarea id="customer-notes" name="notes" rows="3"></textarea>
                                </div>
                            </div>
                            <input type="hidden" id="customer-id" name="id">
                            <div class="form-actions" id="customer-form-actions">
                                <!-- Will be populated based on mode -->
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(customerModal);
    }
    
    // Set modal title and mode
    const modalTitle = document.getElementById('customer-modal-title');
    if (modalTitle) {
        modalTitle.textContent = mode === 'view' ? 'פרטי לקוח' : 'עריכת לקוח';
    }
    
    // Set form actions based on mode
    const formActions = document.getElementById('customer-form-actions');
    if (formActions) {
        if (mode === 'view') {
            formActions.innerHTML = `
                <button type="button" class="btn btn-outline" id="close-customer-modal">סגור</button>
                <button type="button" class="btn btn-primary" id="edit-this-customer" data-id="${customerId}">ערוך לקוח</button>
            `;
        } else {
            formActions.innerHTML = `
                <button type="submit" class="btn btn-primary">שמור שינויים</button>
                <button type="button" class="btn btn-outline" id="cancel-customer-edit">ביטול</button>
            `;
        }
    }
    
    // Set form fields readonly based on mode
    const formInputs = document.querySelectorAll('#customer-form input, #customer-form textarea');
    formInputs.forEach(input => {
        input.readOnly = mode === 'view';
    });
    
    // Get customer data
    document.getElementById('customer-id').value = customerId;
    
    // Show modal
    customerModal.classList.add('show');
    
    // Load customer data
    db.collection('users').doc(customerId).get()
        .then(doc => {
            if (!doc.exists) {
                showToast('לא נמצא לקוח עם המזהה הזה', 'error');
                customerModal.classList.remove('show');
                return;
            }
            
            const customer = doc.data();
            
            // Fill form with customer data
            document.getElementById('customer-name').value = customer.name || '';
            document.getElementById('customer-email').value = customer.email || '';
            document.getElementById('customer-phone').value = customer.phone || '';
            
            // Address
            if (customer.address) {
                document.getElementById('customer-street').value = customer.address.street || '';
                document.getElementById('customer-city').value = customer.address.city || '';
                document.getElementById('customer-zip').value = customer.address.zip || '';
            }
            
            document.getElementById('customer-notes').value = customer.notes || '';
        })
        .catch(error => {
            console.error('Error loading customer:', error);
            showToast('אירעה שגיאה בטעינת פרטי הלקוח', 'error');
            customerModal.classList.remove('show');
        });
    
    // Modal close button
    const closeBtn = document.getElementById('customer-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            customerModal.classList.remove('show');
        });
    }
    
    // Close button (view mode)
    const closeModalBtn = document.getElementById('close-customer-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            customerModal.classList.remove('show');
        });
    }
    
    // Edit this customer button (view mode)
    const editThisBtn = document.getElementById('edit-this-customer');
    if (editThisBtn) {
        editThisBtn.addEventListener('click', function() {
            const customerId = this.dataset.id;
            // Close current modal
            customerModal.classList.remove('show');
            // Reopen in edit mode
            setTimeout(() => {
                openCustomerModal('edit', customerId);
            }, 300);
        });
    }
    
    // Cancel button (edit mode)
    const cancelBtn = document.getElementById('cancel-customer-edit');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            customerModal.classList.remove('show');
        });
    }
    
    // Form submission (edit mode)
    const customerForm = document.getElementById('customer-form');
    if (customerForm && mode === 'edit') {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const customerId = document.getElementById('customer-id').value;
            
            // Get form data
            const customerData = {
                name: document.getElementById('customer-name').value,
                email: document.getElementById('customer-email').value,
                phone: document.getElementById('customer-phone').value,
                address: {
                    street: document.getElementById('customer-street').value,
                    city: document.getElementById('customer-city').value,
                    zip: document.getElementById('customer-zip').value
                },
                notes: document.getElementById('customer-notes').value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Update customer in Firebase
            db.collection('users').doc(customerId).update(customerData)
                .then(() => {
                    showToast('פרטי הלקוח עודכנו בהצלחה', 'success');
                    
                    // Close modal
                    customerModal.classList.remove('show');
                    
                    // Reload customers list
                    loadCustomers();
                })
                .catch(error => {
                    console.error('Error updating customer:', error);
                    showToast('אירעה שגיאה בעדכון פרטי הלקוח', 'error');
                });
        });
    }
}

/**
 * View Customer Orders
 * @param {string} customerId - Customer ID
 */
function viewCustomerOrders(customerId) {
    // Navigate to orders section
    navigateToSection('orders');
    
    // Get customer info for filtering
    db.collection('users').doc(customerId).get()
        .then(doc => {
            if (!doc.exists) {
                showToast('לא נמצא לקוח עם המזהה הזה', 'error');
                return;
            }
            
            const customer = doc.data();
            
            // Set search field to customer email to filter orders
            const ordersSearchInput = document.getElementById('orders-search');
            if (ordersSearchInput) {
                ordersSearchInput.value = customer.email;
                
                // Trigger search
                const searchBtn = document.getElementById('search-orders-btn');
                if (searchBtn) {
                    searchBtn.click();
                } else {
                    // If button not found, reload orders manually
                    loadOrders();
                }
            }
        })
        .catch(error => {
            console.error('Error getting customer for orders:', error);
            showToast('אירעה שגיאה בטעינת הזמנות הלקוח', 'error');
        });
}

/**
 * Update Unread Counts
 */
function updateUnreadCounts() {
    // Unread messages count
    db.collection('contact_messages')
        .where('status', '==', 'new')
        .get()
        .then(snapshot => {
            const countElement = document.getElementById('unread-messages');
            if (countElement) {
                countElement.textContent = snapshot.size;
                countElement.style.display = snapshot.size > 0 ? 'inline-block' : 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching unread messages count:', error);
        });
    
    // New orders count for notifications
    db.collection('orders')
        .where('status', '==', 'pending')
        .get()
        .then(snapshot => {
            const countElement = document.getElementById('notifications-count');
            if (countElement) {
                countElement.textContent = snapshot.size;
                countElement.style.display = snapshot.size > 0 ? 'inline-block' : 'none';
            }
            
            // Update notifications list if open
            updateNotificationsList(snapshot.size);
        })
        .catch(error => {
            console.error('Error fetching new orders count for notifications:', error);
        });
}

/**
 * Update Notifications List
 * @param {number} newOrdersCount - Count of new orders
 */
function updateNotificationsList(newOrdersCount) {
    const notificationList = document.getElementById('notification-list');
    if (!notificationList) return;
    
    if (newOrdersCount > 0) {
        notificationList.innerHTML = `
            <div class="notification-item unread">
                <div class="notification-icon orders">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">הזמנות חדשות</div>
                    <div class="notification-text">יש ${newOrdersCount} הזמנות חדשות ממתינות לאישור</div>
                    <div class="notification-time">כעת</div>
                </div>
            </div>
        `;
    } else {
        notificationList.innerHTML = '<div class="notification-empty">אין התראות חדשות</div>';
    }
}

/**
 * Initialize Sidebar Toggle
 */
function initSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const adminDashboard = document.getElementById('admin-dashboard');
    
    if (sidebarToggle && adminDashboard) {
        sidebarToggle.addEventListener('click', function() {
            adminDashboard.classList.toggle('sidebar-collapsed');
        });
    }
}

/**
 * Initialize Navigation Tabs
 */
function initNavigationTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            navigateToSection(section);
        });
    });
}

/**
 * Navigate to Section
 * @param {string} sectionId - Section ID to navigate to
 */
function navigateToSection(sectionId) {
    // Update active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Update active section
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `${sectionId}-section`) {
            section.classList.add('active');
        }
    });
    
    // Update page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        switch (sectionId) {
            case 'dashboard':
                pageTitle.textContent = 'לוח בקרה';
                break;
            case 'products':
                pageTitle.textContent = 'ניהול מוצרים';
                break;
            case 'orders':
                pageTitle.textContent = 'ניהול הזמנות';
                break;
            case 'messages':
                pageTitle.textContent = 'הודעות מלקוחות';
                break;
            case 'customers':
                pageTitle.textContent = 'ניהול לקוחות';
                break;
            case 'settings':
                pageTitle.textContent = 'הגדרות מערכת';
                break;
            default:
                pageTitle.textContent = 'לוח בקרה';
        }
    }
}

/**
 * Initialize Form Tabs
 */
function initFormTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabGroup = this.closest('.tabs-nav');
            const tabsContent = this.closest('.form-tabs')?.querySelector('.tabs-content') || 
                               this.closest('.settings-tabs')?.querySelector('.tabs-content');
            
            if (!tabGroup || !tabsContent) return;
            
            // Deactivate all tabs
            tabGroup.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            tabsContent.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Activate selected tab
            this.classList.add('active');
            
            const tabId = this.dataset.tab;
            const tabPane = tabsContent.querySelector(`#${tabId}-tab`);
            if (tabPane) {
                tabPane.classList.add('active');
            }
        });
    });
}

/**
 * Initialize Modals
 */
function initModals() {
    console.log('Initializing modals...');
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            if (modal.classList.contains('show') && e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // Event delegation for cancel buttons
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'cancel-product') {
            console.log('✅ Cancel button clicked via event delegation');
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
                console.log('✅ Modal closed via event delegation');
            }
        }
    });
    
    // Close modals with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal.show');
            openModals.forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });
    
    // Product modal specific closers
    const productModalClose = document.getElementById('product-modal-close');
    
    if (productModalClose) {
        productModalClose.addEventListener('click', function() {
            const modal = document.getElementById('product-modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    }
    
    // Product modal cancel button
    const cancelProductBtn = document.getElementById('cancel-product');
    if (cancelProductBtn) {
        console.log('✅ Cancel product button found in initModals, adding event listener');
        cancelProductBtn.addEventListener('click', function() {
            console.log('✅ Cancel product button clicked from initModals');
            const modal = document.getElementById('product-modal');
            if (modal) {
                modal.classList.remove('show');
                console.log('✅ Modal closed from initModals');
            }
        });
    } else {
        console.error('❌ Cancel product button not found in initModals!');
    }
    
    // Order modal specific closer
    const orderModalClose = document.getElementById('order-modal-close');
    
    if (orderModalClose) {
        orderModalClose.addEventListener('click', function() {
            const modal = document.getElementById('order-modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    }
    
    console.log('Modals initialization complete');
}

/**
 * Select Message by ID
 * @param {string} messageId - Message ID to select
 */
function selectMessage(messageId) {
    const messageItems = document.querySelectorAll('.message-item');
    messageItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === messageId) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Load message details
            loadMessageDetails(messageId);
            
            // Mark as read if unread
            if (item.classList.contains('unread')) {
                item.classList.remove('unread');
                
                // Update in Firebase
                db.collection('contact_messages').doc(messageId).update({
                    status: 'read',
                    readAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(error => {
                    console.error('Error marking message as read:', error);
                });
                
                // Update unread counts
                updateUnreadCounts();
            }
        }
    });
}

/**
 * Show Toast Notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, info)
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        </div>
        <div class="toast-content">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    const removeTimeout = setTimeout(() => {
        removeToast(toast);
    }, 5000);
    
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            clearTimeout(removeTimeout);
            removeToast(toast);
        });
    }
}

/**
 * Remove Toast Element
 * @param {HTMLElement} toast - Toast element to remove
 */
function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        toast.remove();
    }, 300); // Match transition duration
}

/**
 * Get Category Label by Category Code
 * @param {string} categoryCode - Category code
 * @returns {string} - Formatted category label
 */
function getCategoryLabel(categoryCode) {
    switch (categoryCode) {
        case 'one-piece':
            return 'בגדי ים שלמים';
        case 'bikini':
            return 'ביקיני';
        case 'beachwear':
            return 'בגדי חוף';
        case 'accessories':
            return 'אקססוריז';
        default:
            return categoryCode || 'לא מסווג';
    }
}

/**
 * Get Status Label by Status Code
 * @param {string} statusCode - Status code
 * @returns {string} - Formatted status label
 */
function getStatusLabel(statusCode) {
    switch (statusCode) {
        case 'pending':
            return 'ממתין לאישור';
        case 'processing':
            return 'בטיפול';
        case 'shipped':
            return 'נשלח';
        case 'delivered':
            return 'נמסר';
        case 'cancelled':
            return 'בוטל';
        default:
            return statusCode || 'לא ידוע';
    }
}

/**
 * Format Address for Display
 * @param {Object} address - Address object
 * @returns {string} - Formatted address string
 */
function formatAddress(address) {
    if (!address) return '';
    
    let formattedAddress = '';
    
    if (address.street) {
        formattedAddress += address.street;
    }
    
    if (address.city) {
        if (formattedAddress) formattedAddress += ', ';
        formattedAddress += address.city;
    }
    
    if (address.zip) {
        if (formattedAddress) formattedAddress += ' ';
        formattedAddress += address.zip;
    }
    
    return formattedAddress || 'לא צוין';
}

/**
 * Get Product Details by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} - Promise resolving to product data
 */
function getProductDetails(productId) {
    return db.collection('products').doc(productId).get()
        .then(doc => {
            if (!doc.exists) return null;
            
            const product = doc.data();
            product.id = doc.id;
            return product;
        });
}

/**
 * Delete Product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<void>} - Promise resolving when deletion is complete
 */
function deleteProduct(productId) {
    return db.collection('products').doc(productId).delete();
}

/**
 * Get User Data from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Promise resolving to user data
 */
function getUserData(userId) {
    return db.collection('users').doc(userId).get()
        .then(doc => {
            if (!doc.exists) return null;
            
            const userData = doc.data();
            return userData;
        });
}

/**
 * Firebase Authentication Functions
 */

/**
 * Sign In with Email/Password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - Promise resolving to user object
 */
function signIn(email, password) {
    return auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            return userCredential.user;
        });
}

/**
 * Sign Out Current User
 * @returns {Promise<void>} - Promise resolving when sign out is complete
 */
function signOut() {
    return auth.signOut();
}

/**
 * Get Current User
 * @returns {Promise<Object>} - Promise resolving to current user object
 */
function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
}

// Initialize app when Firebase is ready
initFirebase();

// Debug: Check if cancel button exists on page load
document.addEventListener('DOMContentLoaded', function() {
    const cancelBtn = document.getElementById('cancel-product');
    if (cancelBtn) {
        console.log('✅ Cancel product button found on page load');
    } else {
        console.error('❌ Cancel product button NOT found on page load');
    }
});

/**
 * Initialize Firebase
 */
function initFirebase() {
    // Firebase is initialized in firebase-config.js
    // This is just a wrapper for better organization
    
    // Set auth state listener
    auth.onAuthStateChanged(user => {
        authStateChanged();
    });
}

// Add a function to render image previews
function renderImagesPreview(images) {
    const preview = document.getElementById('images-preview');
    if (!preview) return;
    
    if (!images || images.length === 0) {
        preview.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">אין תמונות להצגה</p>';
        return;
    }
    
    preview.innerHTML = images.map(url => {
        const trimmedUrl = url.trim();
        if (!trimmedUrl) return '';
        
        return `<div class="image-preview-item" style="display: inline-block; margin: 4px; position: relative;">
            <img src="${trimmedUrl}" 
                 alt="Product Image" 
                 style="max-width:80px;max-height:80px;border-radius:6px;border:1px solid #eee;"
                 onerror="this.src='img/placeholder.svg'; this.style.opacity='0.6';"
                 onload="this.style.opacity='1';">
        </div>`;
    }).join('');
}

// Add event listener to update preview on input change
document.addEventListener('DOMContentLoaded', function() {
    const imagesInput = document.getElementById('product-images-urls');
    if (imagesInput) {
        imagesInput.addEventListener('input', function() {
            const imageUrl = this.value.trim();
            if (imageUrl) {
                renderImagesPreview([imageUrl]);
            } else {
                renderImagesPreview([]);
            }
        });
    }
    
    // Price validation
    const priceInput = document.getElementById('product-price');
    const salePriceInput = document.getElementById('product-sale-price');
    
    if (priceInput && salePriceInput) {
        // Validate sale price when regular price changes
        priceInput.addEventListener('input', function() {
            validateSalePrice();
        });
        
        // Validate sale price when it changes
        salePriceInput.addEventListener('input', function() {
            validateSalePrice();
        });
    }
    
    // Global error handler for images
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            console.warn('Image failed to load:', e.target.src);
            // Don't show error to user for missing images, just log it
        }
    }, true);
});

/**
 * Validate sale price against regular price
 */
function validateSalePrice() {
    const priceInput = document.getElementById('product-price');
    const salePriceInput = document.getElementById('product-sale-price');
    
    if (!priceInput || !salePriceInput) return;
    
    const price = parseFloat(priceInput.value) || 0;
    const salePrice = parseFloat(salePriceInput.value) || 0;
    
    if (salePrice > 0 && salePrice >= price) {
        salePriceInput.style.borderColor = '#f44336';
        salePriceInput.style.boxShadow = '0 0 0 3px rgba(244, 67, 54, 0.1)';
        
        // Show warning
        let warning = salePriceInput.parentNode.querySelector('.price-warning');
        if (!warning) {
            warning = document.createElement('small');
            warning.className = 'price-warning';
            warning.style.color = '#f44336';
            warning.style.fontSize = '0.8rem';
            warning.style.marginTop = '4px';
            warning.style.display = 'block';
            salePriceInput.parentNode.appendChild(warning);
        }
        warning.textContent = 'מחיר המבצע חייב להיות נמוך מהמחיר הרגיל';
    } else {
        salePriceInput.style.borderColor = '#e5e7eb';
        salePriceInput.style.boxShadow = '';
        
        // Remove warning
        const warning = salePriceInput.parentNode.querySelector('.price-warning');
        if (warning) {
            warning.remove();
        }
    }
}

// Add image upload logic:
let uploadedImagesState = [];
function renderUploadedImages(images) {
    uploadedImagesState = images.slice();
    const uploadedImages = document.getElementById('uploaded-images');
    if (!uploadedImages) return;
    
    if (!images || images.length === 0) {
        uploadedImages.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">אין תמונות שהועלו</p>';
        return;
    }
    
    uploadedImages.innerHTML = images.map((url, idx) => `
        <div class="uploaded-image" data-url="${url}">
            <img src="${url}" 
                 alt="מוצר ${idx + 1}"
                 onerror="this.src='img/placeholder.svg'; this.style.opacity='0.6';"
                 onload="this.style.opacity='1';">
            <div class="image-actions">
                <button type="button" class="image-action-btn remove" data-index="${idx}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Remove image handler
    uploadedImages.querySelectorAll('.image-action-btn.remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            uploadedImagesState.splice(index, 1);
            renderUploadedImages(uploadedImagesState);
        });
    });
}
// Image upload handlers
function initImageUploadActions(productId) {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('product-images');
    if (!uploadArea || !fileInput) return;
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', e => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleImageFiles(e.dataTransfer.files, productId);
    });
    fileInput.addEventListener('change', e => {
        handleImageFiles(e.target.files, productId);
    });
}
async function handleImageFiles(files, productId) {
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    let filesArr = Array.from(files);
    if (uploadedImagesState.length + filesArr.length > maxFiles) {
        showToast('ניתן להעלות עד 5 תמונות בלבד', 'error');
        return;
    }
    for (const file of filesArr) {
        if (!allowedTypes.includes(file.type)) {
            showToast('פורמט קובץ לא נתמך', 'error');
            continue;
        }
        if (file.size > maxSize) {
            showToast('גודל קובץ גדול מדי (מקסימום 5MB)', 'error');
            continue;
        }
        try {
            const url = await uploadProductImage(file, productId || 'temp');
            uploadedImagesState.push(url);
            renderUploadedImages(uploadedImagesState);
        } catch (err) {
            showToast('שגיאה בהעלאת תמונה', 'error');
        }
    }
}

/**
 * Verify that a product appears in the store
 * @param {string} productId - The product ID
 * @param {string} productTitle - The product title
 */
async function verifyProductInStore(productId, productTitle) {
    try {
        // Check if product exists in Firestore
        const productDoc = await db.collection('products').doc(productId).get();
        
        if (productDoc.exists) {
            const productData = productDoc.data();
            console.log('Product verified in Firestore:', {
                id: productId,
                title: productData.title,
                active: productData.active,
                inStock: productData.inStock
            });
            
            // Show success message
            showToast(`המוצר "${productTitle}" זמין כעת בחנות!`, 'success');
        } else {
            console.error('Product not found in Firestore after creation');
            showToast('שגיאה: המוצר לא נמצא במסד הנתונים', 'error');
        }
    } catch (error) {
        console.error('Error verifying product in store:', error);
    }
}

// In openProductModal, after rendering the modal, call initImageUploadActions(productId)