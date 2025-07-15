# Damka Swimwear - Admin Panel Setup Guide

## Overview
This guide will help you set up the admin panel for your Damka Swimwear website with Firebase backend.

## Prerequisites
- A Firebase project (create one at https://console.firebase.google.com)
- Basic knowledge of web development
- Your website files uploaded to Vercel

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `damka-swimwear`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firebase Services

### Authentication
1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Enable "Email/Password" authentication
3. Click "Save"

### Firestore Database
1. Go to "Firestore Database" → "Create database"
2. Choose "Start in test mode" (for development)
3. Select a location close to your users
4. Click "Done"

### Storage
1. Go to "Storage" → "Get started"
2. Choose "Start in test mode" (for development)
3. Select the same location as Firestore
4. Click "Done"

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" → "Web" (</>)
4. Register app with name: "Damka Website"
5. Copy the configuration object

## Step 4: Update Firebase Configuration

1. Open `js/firebase-config.js`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "damka-swimwear.firebaseapp.com",
    projectId: "damka-swimwear",
    storageBucket: "damka-swimwear.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};
```

## Step 5: Set Up Firestore Security Rules

1. Go to "Firestore Database" → "Rules"
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - anyone can read, only admins can write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Orders - users can read their own, admins can read/write all
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Messages - admins can read/write all
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users - users can read/write their own data, admins can read/write all
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Newsletter - anyone can write, admins can read
    match /newsletter/{docId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if true;
    }
  }
}
```

## Step 6: Uploading Product Images (Vercel Storage)

Since you use Vercel for storage, you cannot upload images from the admin panel. Instead:

1. Upload your product images to the `/img/` folder in your project.
2. Deploy your site to Vercel (images will be available at `https://yourdomain.com/img/your-image.jpg`).
3. In the admin panel, when adding/editing a product, enter the image URLs as `img/your-image.jpg` (comma-separated for multiple images).
4. The admin panel will show a preview of the images you enter.

**Note:** You must redeploy your site every time you add new images to `/img/`.

## Step 7: Create Admin Users

### Method 1: Using Firebase Console
1. Go to "Authentication" → "Users"
2. Click "Add user"
3. Enter admin email and password
4. Go to "Firestore Database" → "Start collection"
5. Collection ID: `users`
6. Document ID: (copy the UID from Authentication)
7. Add fields:
   - `email`: admin email
   - `role`: "admin"
   - `name`: "Admin Name"
   - `createdAt`: (timestamp)

### Method 2: Using Admin Panel (First Admin)
1. Deploy your website to Vercel
2. Access `yourdomain.com/admin.html`
3. Use the registration form (if available)
4. Or manually add the first admin user to Firestore

## Step 8: Test Admin Panel

1. Go to `yourdomain.com/admin.html`
2. Login with admin credentials
3. Test the following features:
   - Dashboard statistics
   - Product management
   - Order management
   - Message management
   - Settings

## Step 9: Add Sample Data

### Sample Product Structure
```javascript
{
  title: "בגד ים שלם מעוצב",
  description: "בגד ים שלם בעיצוב ייחודי",
  longDescription: "תיאור מפורט של המוצר...",
  price: 299,
  salePrice: null,
  category: "one-piece",
  collections: ["summer-2025"],
  images: ["url1", "url2"],
  colors: [
    { name: "שחור", code: "black" },
    { name: "כחול", code: "navy" }
  ],
  sizes: ["S", "M", "L"],
  inStock: true,
  active: true,
  featured: false,
  stockQuantity: 10,
  lowStockThreshold: 3,
  tags: ["קיץ", "ים", "חוף"],
  sku: "DAMKA-001",
  weight: 200,
  dimensions: "30x20x5",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Sample Order Structure
```javascript
{
  orderId: "ORD-2025-001",
  userId: "user-uid",
  customerInfo: {
    name: "שם הלקוח",
    email: "customer@email.com",
    phone: "050-1234567",
    address: {
      street: "רחוב תמוז 11",
      city: "מודיעין",
      zipCode: "71700"
    }
  },
  items: [
    {
      productId: "product-id",
      title: "בגד ים",
      price: 299,
      quantity: 1,
      color: "שחור",
      size: "M"
    }
  ],
  subtotal: 299,
  shipping: 30,
  tax: 51,
  total: 380,
  status: "pending",
  paymentMethod: "credit-card",
  shippingMethod: "standard",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Step 10: Production Security

### Update Security Rules
Before going live, update your security rules to be more restrictive:

1. **Firestore Rules**: Remove "test mode" and use proper authentication
2. **Storage Rules**: Restrict uploads to specific file types and sizes
3. **Authentication**: Enable additional security features like email verification

### Environment Variables
For production, consider using environment variables for sensitive data:

```javascript
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    // ... other config
};
```

## Troubleshooting

### Common Issues

1. **"Firebase not initialized" error**
   - Check your Firebase configuration
   - Ensure all required services are enabled

2. **"Permission denied" error**
   - Check Firestore security rules
   - Verify user authentication status

3. **Images not uploading**
   - Check Storage security rules
   - Verify file size limits

4. **Admin login not working**
   - Verify user exists in Authentication
   - Check user role in Firestore

### Debug Mode
Add this to your admin.js for debugging:

```javascript
// Enable debug mode
localStorage.setItem('admin-debug', 'true');

// Check debug mode
if (localStorage.getItem('admin-debug') === 'true') {
    console.log('Admin debug mode enabled');
}
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase configuration
3. Test with sample data first
4. Check security rules

## Next Steps

After setup:
1. Add your products to the database
2. Configure shipping and payment methods
3. Set up email notifications
4. Customize the admin panel styling
5. Add additional features as needed

---

**Note**: This admin panel is designed for the Damka Swimwear website. Make sure to customize it according to your specific business needs and requirements. 