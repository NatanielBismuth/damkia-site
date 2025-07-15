/**
 * Damka Admin Panel Setup Script
 * 
 * This script helps you set up the first admin user and initialize the database.
 * Run this in the browser console after setting up Firebase.
 */

// Setup function to create first admin user
async function setupFirstAdmin() {
    try {
        // Check if Firebase is initialized
        if (!firebase || !firebase.apps.length) {
            console.error('Firebase not initialized. Please check your configuration.');
            return;
        }

        const email = prompt('Enter admin email:');
        const password = prompt('Enter admin password (min 6 characters):');
        const name = prompt('Enter admin name:');

        if (!email || !password || !name) {
            console.error('All fields are required.');
            return;
        }

        if (password.length < 6) {
            console.error('Password must be at least 6 characters.');
            return;
        }

        console.log('Creating admin user...');

        // Create user in Firebase Auth
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Add user data to Firestore
        await firebase.firestore().collection('users').doc(user.uid).set({
            email: email,
            name: name,
            role: 'admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true
        });

        console.log('✅ Admin user created successfully!');
        console.log('User ID:', user.uid);
        console.log('Email:', email);
        console.log('Role: admin');

        // Sign out the user
        await firebase.auth().signOut();
        console.log('User signed out. You can now login with the admin credentials.');

    } catch (error) {
        console.error('Error creating admin user:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            console.error('This email is already registered. Please use a different email.');
        } else if (error.code === 'auth/weak-password') {
            console.error('Password is too weak. Please use a stronger password.');
        } else {
            console.error('Unknown error occurred.');
        }
    }
}

// Function to initialize sample data
async function initializeSampleData() {
    try {
        console.log('Initializing sample data...');

        const db = firebase.firestore();

        // Sample categories
        const categories = [
            { id: 'one-piece', name: 'בגדי ים שלמים', description: 'בגדי ים שלמים מעוצבים' },
            { id: 'bikini', name: 'ביקיני', description: 'ביקיני מעוצב' },
            { id: 'beachwear', name: 'בגדי חוף', description: 'בגדי חוף נוחים' },
            { id: 'accessories', name: 'אקססוריז', description: 'אקססוריז לחוף' }
        ];

        // Add categories
        for (const category of categories) {
            await db.collection('categories').doc(category.id).set({
                ...category,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // Sample product
        const sampleProduct = {
            title: 'בגד ים שלם מעוצב - דוגמה',
            description: 'בגד ים שלם בעיצוב ייחודי ומודרני',
            longDescription: 'בגד ים שלם מעוצב בעבודת יד, מבד איכותי ונוח. מתאים לכל גיל ומידה.',
            price: 299,
            salePrice: null,
            category: 'one-piece',
            collections: ['summer-2025'],
            images: ['img/placeholder.jpg'],
            colors: [
                { name: 'שחור', code: 'black' },
                { name: 'כחול נייבי', code: 'navy' }
            ],
            sizes: ['S', 'M', 'L'],
            inStock: true,
            active: true,
            featured: true,
            stockQuantity: 15,
            lowStockThreshold: 3,
            tags: ['קיץ', 'ים', 'חוף', 'מעוצב'],
            sku: 'DAMKA-SAMPLE-001',
            weight: 200,
            dimensions: '30x20x5',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('products').add(sampleProduct);

        // Sample shipping methods
        const shippingMethods = [
            {
                name: 'משלוח סטנדרטי',
                price: 30,
                description: '2-5 ימי עסקים',
                active: true
            },
            {
                name: 'משלוח מהיר',
                price: 50,
                description: '1-2 ימי עסקים',
                active: true
            },
            {
                name: 'איסוף עצמי',
                price: 0,
                description: 'איסוף מהסטודיו במודיעין - בתיאום מראש',
                active: true
            }
        ];

        for (const method of shippingMethods) {
            await db.collection('shipping-methods').add({
                ...method,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        console.log('✅ Sample data initialized successfully!');
        console.log('Created:');
        console.log('- 4 categories');
        console.log('- 1 sample product');
        console.log('- 3 shipping methods');

    } catch (error) {
        console.error('Error initializing sample data:', error);
    }
}

// Function to check database status
async function checkDatabaseStatus() {
    try {
        console.log('Checking database status...');

        const db = firebase.firestore();
        
        // Check collections
        const collections = ['users', 'products', 'orders', 'messages', 'categories', 'shipping-methods'];
        
        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName).limit(1).get();
            console.log(`${collectionName}: ${snapshot.size} documents`);
        }

        // Check admin users
        const adminUsers = await db.collection('users').where('role', '==', 'admin').get();
        console.log(`Admin users: ${adminUsers.size}`);

        if (adminUsers.size === 0) {
            console.log('⚠️ No admin users found. Run setupFirstAdmin() to create one.');
        }

    } catch (error) {
        console.error('Error checking database status:', error);
    }
}

// Function to clear all data (use with caution!)
async function clearAllData() {
    const confirm = prompt('Are you sure you want to delete ALL data? Type "DELETE" to confirm:');
    
    if (confirm !== 'DELETE') {
        console.log('Operation cancelled.');
        return;
    }

    try {
        console.log('Clearing all data...');

        const db = firebase.firestore();
        const collections = ['users', 'products', 'orders', 'messages', 'categories', 'shipping-methods', 'newsletter'];
        
        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName).get();
            const batch = db.batch();
            
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log(`Deleted ${snapshot.size} documents from ${collectionName}`);
        }

        console.log('✅ All data cleared successfully!');

    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

// Export functions to global scope
window.setupFirstAdmin = setupFirstAdmin;
window.initializeSampleData = initializeSampleData;
window.checkDatabaseStatus = checkDatabaseStatus;
window.clearAllData = clearAllData;

// Auto-run status check
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🔧 Damka Admin Setup Script Loaded');
        console.log('Available functions:');
        console.log('- setupFirstAdmin() - Create first admin user');
        console.log('- initializeSampleData() - Add sample data');
        console.log('- checkDatabaseStatus() - Check database status');
        console.log('- clearAllData() - Clear all data (use with caution)');
        
        // Auto-check status
        if (firebase && firebase.apps.length) {
            checkDatabaseStatus();
        }
    }, 1000);
}); 