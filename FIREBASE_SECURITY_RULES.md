# כללי אבטחה ל-Firebase - סביבת ייצור

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             resource.data.role == 'admin' && 
             request.auth.uid == resource.id;
    }
    
    function isAdminUser() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Admins collection - only existing admins can manage admins
    match /admins/{adminId} {
      allow read, write: if isAdminUser();
    }
    
    // Customers collection
    match /customers/{customerId} {
      // Customers can read and update their own data
      allow read, update: if isSignedIn() && request.auth.uid == customerId;
      // Anyone can create customer account
      allow create: if isSignedIn() && request.auth.uid == customerId;
      // Admins can read and manage all customers
      allow read, write: if isAdminUser();
    }
    
    // Products collection
    match /products/{productId} {
      // Everyone can read active products
      allow read: if resource.data.active == true;
      // Only admins can read all products and manage them
      allow read, write: if isAdminUser();
    }
    
    // Categories collection
    match /categories/{categoryId} {
      allow read: if true; // Public reading
      allow write: if isAdminUser(); // Admin only writing
    }
    
    // Orders collection
    match /orders/{orderId} {
      // Customers can create orders
      allow create: if isSignedIn();
      // Customers can read their own orders
      allow read: if isSignedIn() && 
                     request.auth.uid == resource.data.userId;
      // Admins can read and update all orders
      allow read, update: if isAdminUser();
    }
    
    // Contact messages collection
    match /contact_messages/{messageId} {
      // Anyone can create messages (contact form)
      allow create: if true;
      // Only admins can read and manage messages
      allow read, update, delete: if isAdminUser();
    }
    
    // Newsletter subscriptions
    match /newsletter/{subscriptionId} {
      // Anyone can subscribe
      allow create: if true;
      // Only admins can read subscriptions
      allow read: if isAdminUser();
    }
    
    // Shopping cart (if stored in Firestore)
    match /carts/{cartId} {
      allow read, write: if isSignedIn() && 
                            request.auth.uid == cartId;
    }
    
    // Wishlist (if stored in Firestore)
    match /wishlists/{wishlistId} {
      allow read, write: if isSignedIn() && 
                            request.auth.uid == wishlistId;
    }
  }
}
```

## Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Product images - admins can upload, everyone can read
    match /products/{productId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // User profile images
    match /users/{userId}/profile/{fileName} {
      allow read, write: if request.auth != null && 
                            request.auth.uid == userId;
    }
    
    // General uploads folder - admin only
    match /uploads/{fileName} {
      allow read, write: if request.auth != null &&
                            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## הוראות התקנה

1. **היכנסי ל-Firebase Console**: https://console.firebase.google.com
2. **בחרי את הפרויקט**: damkaswimwear
3. **עברי ל-Firestore Database > Rules**
4. **החליפי את הכללים הקיימים** בכללים שלמעלה
5. **לחצי על "Publish"**

## הגדרות נוספות מומלצות

### Authentication
- **הפעלי Email/Password authentication**
- **הגדרי מגבלות על ניסיונות התחברות**
- **הפעלי 2FA למשתמשי אדמין**

### Database Security
- **הפעלי App Check** למניעת spam
- **הגדרי מגבלות על גודל מסמכים**
- **הפעלי Audit Logging**

### Storage Security
- **הגבלי גודל קבצים** (מקסימום 5MB לתמונות)
- **הגבלי סוגי קבצים** (JPG, PNG, WebP בלבד)
- **הפעלי virus scanning**

## בדיקת אבטחה

לאחר ההתקנה, בדקי:
- ✅ משתמשים לא מחוברים יכולים לראות רק מוצרים פעילים
- ✅ רק אדמינים יכולים להוסיף/לערוך מוצרים
- ✅ משתמשים יכולים ליצור הזמנות
- ✅ רק אדמינים רואים את ממשק הניהול
- ✅ הודעות יצירת קשר נשמרות ונגישות רק לאדמינים

## פתרון בעיות נפוצות

### אם יש שגיאות גישה:
1. ודאי שהמשתמש האדמין מוגדר עם `role: 'admin'` ב-Firestore
2. בדקי שה-uid תואם בין Authentication ו-Firestore
3. ודאי שהכללים פורסמו בהצלחה

### לבדיקת כללים:
```javascript
// בקונסול הדפדפן - בדיקה אם המשתמש הוא אדמין
firebase.auth().currentUser.getIdTokenResult().then(result => {
  console.log('User claims:', result.claims);
});
``` 