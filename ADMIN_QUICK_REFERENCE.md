# Damka Admin Panel - Quick Reference

## Login
- URL: `yourdomain.com/admin.html`
- Use admin email and password created in Firebase

## Dashboard Sections

### 📊 Dashboard (לוח בקרה)
- **Statistics Cards**: New orders, customers, revenue, active products
- **Recent Orders**: Latest 5 orders with status
- **Top Products**: Best-selling products
- **Recent Messages**: Latest customer messages
- **Sales Chart**: Weekly/monthly/yearly sales visualization

### 👕 Products (ניהול מוצרים)
- **View All Products**: Table with images, names, categories, prices
- **Add New Product**: Click "הוסף מוצר חדש" button
- **Edit Product**: Click edit icon on any product row
- **Delete Product**: Click delete icon (with confirmation)
- **Filters**: By category, status, stock availability
- **Search**: By name, ID, or description
- **Images**: Upload your images to the `/img/` folder in your Vercel project. In the product form, enter the image URLs (e.g., `img/my-product.jpg`) separated by commas. The admin panel will show a preview.

#### Product Form Tabs:
1. **Basic Info**: Title, category, description, price, SKU
2. **Images**: Enter image URLs (comma-separated, e.g., `img/pic1.jpg, img/pic2.jpg`)
3. **Attributes**: Colors, sizes, additional details
4. **Inventory**: Stock quantity, status, weight, dimensions

### 📦 Orders (הזמנות)
- **View All Orders**: Order ID, customer, date, amount, status
- **Order Details**: Click on order to view full details
- **Update Status**: Pending → Processing → Shipped → Delivered
- **Filters**: By status, date range
- **Search**: By customer name or order ID

### 💬 Messages (הודעות)
- **Message List**: Customer name, subject, date, status
- **View Message**: Click to read full message
- **Reply**: Send response to customer
- **Mark as Read**: Change message status
- **Filters**: By status, subject, date
- **Search**: By customer name or email

### 👥 Customers (לקוחות)
- **Customer List**: Name, email, phone, registration date
- **Customer Details**: View customer profile and order history
- **Search**: By name, email, or phone

### ⚙️ Settings (הגדרות)
- **General**: Site info, contact details, social media links
- **Shop**: Currency, tax rate, product categories
- **Shipping**: Shipping methods, free shipping threshold
- **Users**: Admin users management

## Common Actions

### Adding a Product
1. Go to Products section
2. Click "הוסף מוצר חדש"
3. Fill in Basic Info tab
4. Upload images in Images tab
5. Add colors/sizes in Attributes tab
6. Set inventory in Inventory tab
7. Click "שמור מוצר"

### Processing an Order
1. Go to Orders section
2. Click on order to view details
3. Update status: Pending → Processing
4. Add tracking number if shipped
5. Update status: Processing → Shipped
6. Mark as Delivered when confirmed

### Responding to Messages
1. Go to Messages section
2. Click on unread message
3. Read customer inquiry
4. Click "Reply" button
5. Write response
6. Send reply
7. Mark as "Replied"

## Keyboard Shortcuts
- `Ctrl/Cmd + S`: Save current form
- `Esc`: Close modal
- `Ctrl/Cmd + F`: Focus search bar

## Status Indicators

### Order Status
- 🟡 **Pending**: New order awaiting processing
- 🔵 **Processing**: Order being prepared
- 🚚 **Shipped**: Order sent to customer
- ✅ **Delivered**: Order received by customer
- ❌ **Cancelled**: Order cancelled

### Message Status
- 🔴 **New**: Unread message
- 🔵 **Read**: Message read but not replied
- ✅ **Replied**: Response sent to customer
- 📁 **Archived**: Message archived

### Product Status
- ✅ **Active**: Product visible on website
- ❌ **Inactive**: Product hidden from website
- 📦 **In Stock**: Available for purchase
- ⚠️ **Low Stock**: Quantity below threshold
- ❌ **Out of Stock**: Not available

## Tips

### Product Management
- Use descriptive titles and detailed descriptions
- Upload high-quality images (recommended: 800x800px)
- Set appropriate stock quantities and thresholds
- Use tags for better searchability

### Order Management
- Process orders promptly
- Update status regularly
- Keep customers informed of order progress
- Use tracking numbers when available

### Customer Service
- Respond to messages within 24 hours
- Be professional and helpful
- Use the reply system to maintain conversation history
- Archive resolved conversations

### Security
- Log out when finished
- Use strong passwords
- Don't share admin credentials
- Regularly review user access

## Troubleshooting

### Can't Login?
- Check email and password
- Verify user has admin role in Firestore
- Check Firebase configuration

### Images Not Uploading?
- Check file size (max 5MB)
- Verify file format (JPG, PNG, WEBP)
- Check Storage security rules

### Data Not Loading?
- Check internet connection
- Verify Firebase configuration
- Check browser console for errors
- Refresh the page

### Performance Issues?
- Clear browser cache
- Check for large image files
- Limit number of products per page
- Use pagination for large datasets

## Support
For technical issues:
1. Check browser console (F12)
2. Verify Firebase configuration
3. Check security rules
4. Contact developer if needed

---

**Remember**: Always backup your data before making major changes! 