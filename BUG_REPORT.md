# Bug Report & Code Analysis

## 🔴 CRITICAL SECURITY ISSUES

### 1. **Missing Authentication Middleware on Shop Routes**
**Location:** `server/routes/shop/cart-routes.js`, `server/routes/shop/order-routes.js`

**Issue:** Shop routes (cart and order operations) do not use `authMiddleware`, allowing unauthenticated users to access these endpoints.

**Impact:** 
- Unauthenticated users can add items to cart
- Users can manipulate other users' carts by changing `userId` in request body
- Users can create orders for other users
- Users can cancel/archive other users' orders

**Fix Required:**
```javascript
// In cart-routes.js and order-routes.js
const { authMiddleware } = require("../../controllers/auth/auth-controller");

router.post("/add", authMiddleware, addToCart);
router.get("/get/:userId", authMiddleware, fetchCartItems);
// ... apply to all routes
```

### 2. **No Authorization Checks - User ID Manipulation Vulnerability**
**Location:** Multiple controllers in `server/controllers/shop/`

**Issue:** Controllers accept `userId` from request body/params without verifying it matches the authenticated user (`req.user.id`).

**Examples:**
- `cart-controller.js`: `addToCart` accepts `userId` from `req.body` without validation
- `order-controller.js`: `cancelOrder`, `archiveOrder` accept `userId` from `req.body` but only check if it matches order's userId, not the authenticated user
- `order-controller.js`: `getAllOrdersByUser` accepts `userId` from params without checking if it matches authenticated user

**Impact:** Authenticated users can:
- Access other users' carts
- View other users' orders
- Cancel other users' orders
- Archive other users' orders

**Fix Required:**
```javascript
// Example fix for addToCart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id; // Use authenticated user's ID, not from body
    
    // ... rest of code
  }
}
```

### 3. **Insecure Cookie Configuration**
**Location:** `server/controllers/auth/auth-controller.js` (lines 58, 143)

**Issue:** Cookies are set with `secure: false` hardcoded, which means cookies won't be sent over HTTPS even in production.

**Code:**
```javascript
res.cookie("token", token, { httpOnly: true, secure: false })
```

**Fix Required:**
```javascript
res.cookie("token", token, { 
  httpOnly: true, 
  secure: process.env.NODE_ENV === "production",
  sameSite: 'strict' // Add CSRF protection
})
```

## 🟠 HIGH PRIORITY BUGS

### 4. **Race Condition in Stock Management**
**Location:** `server/controllers/shop/order-controller.js` - `createOrder` function

**Issue:** Stock is checked before order creation, but stock is reduced AFTER order is saved. Between these two operations, another order could be created with the same products, leading to negative stock.

**Current Flow:**
1. Check stock availability (lines 22-49)
2. Create and save order (lines 51-64)
3. Reduce stock (lines 67-90)

**Impact:** Multiple simultaneous orders can deplete stock below zero, causing inventory inconsistencies.

**Fix Required:** Use database transactions or implement optimistic locking:
```javascript
// Use MongoDB transactions
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Check and reduce stock atomically
  // Create order
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 5. **Invalid Order Status Check**
**Location:** `server/controllers/shop/order-controller.js` - `cancelOrder` function (line 290)

**Issue:** Code checks for `"preparing"` status in cancellable statuses, but the Order model enum (line 42) only includes: `["pending", "confirmed", "readyForPickup", "pickedUp", "cancelled"]`.

**Code:**
```javascript
const cancellableStatuses = ["pending", "confirmed", "preparing"];
```

**Impact:** The check will never match "preparing" status since it doesn't exist in the schema, making the validation ineffective.

**Fix Required:**
```javascript
const cancellableStatuses = ["pending", "confirmed", "readyForPickup"];
```

### 6. **Missing Stock Check in Cart Operations**
**Location:** `server/controllers/shop/cart-controller.js` - `addToCart` and `updateCartItemQty`

**Issue:** 
- `addToCart` doesn't check if product has sufficient stock before adding
- `updateCartItemQty` doesn't validate against available stock
- No check if product is archived before adding to cart

**Impact:** 
- Users can add more items to cart than available in stock
- Users can add archived products to cart
- Order creation will fail later, causing poor UX

**Fix Required:**
```javascript
// In addToCart
if (product.isArchived) {
  return res.status(400).json({
    success: false,
    message: "Product is archived and cannot be added to cart",
  });
}

if (product.totalStock < quantity) {
  return res.status(400).json({
    success: false,
    message: `Insufficient stock. Available: ${product.totalStock}`,
  });
}
```

### 7. **Product Lock Race Condition**
**Location:** `server/controllers/admin/products-controller.js` - `lockProduct` and `editProduct`

**Issue:** Lock check and acquisition are not atomic operations. Two admins could simultaneously acquire locks on the same product.

**Impact:** Multiple admins could edit the same product simultaneously, causing data loss.

**Fix Required:** Use MongoDB's `findOneAndUpdate` with conditions:
```javascript
const product = await Product.findOneAndUpdate(
  { 
    _id: id,
    $or: [
      { isLocked: false },
      { lockExpiry: { $lt: new Date() } },
      { lockedBy: userId }
    ]
  },
  {
    isLocked: true,
    lockedBy: userId,
    // ... other fields
  },
  { new: true }
);
```

## 🟡 MEDIUM PRIORITY ISSUES

### 8. **Inconsistent Error Messages**
**Location:** Multiple files

**Issue:** 
- Typo: "Error occured" should be "Error occurred" (multiple locations)
- Generic error messages don't help with debugging
- Some errors are logged but not returned to client

**Examples:**
- `server/controllers/admin/products-controller.js` line 48, 119, 147, 288, 346, 405
- `server/controllers/shop/cart-controller.js` line 63, 117, 177, 228

**Fix Required:** Standardize error messages and fix typos.

### 9. **Missing Input Validation**
**Location:** Multiple controllers

**Issues:**
- No validation for negative quantities (some places check `<= 0` but not `< 0` separately)
- No validation for empty strings
- No validation for invalid ObjectIds
- No validation for price/stock being negative

**Example:** `server/controllers/shop/cart-controller.js` line 8:
```javascript
if (!userId || !productId || quantity <= 0) {
```
Should also check for:
- Valid MongoDB ObjectId format
- Quantity is a number
- Product exists and is not archived

### 10. **Console.log in Production Code**
**Location:** `client/src/App.jsx` line 49

**Issue:** Debug console.log left in production code:
```javascript
console.log(isLoading, user);
```

**Fix Required:** Remove or wrap in development check:
```javascript
if (process.env.NODE_ENV === 'development') {
  console.log(isLoading, user);
}
```

### 11. **Potential Null Reference Error**
**Location:** `server/controllers/shop/order-controller.js` - `getOrderDeadlinesByUser` (line 207)

**Issue:** Code accesses `o.cartItems[0].title` without checking if `cartItems` array exists or has items:
```javascript
title: o.cartItems && o.cartItems.length > 0 ? o.cartItems[0].title : `Order ${o._id}`,
```
This is actually safe, but the pattern is inconsistent - should use optional chaining for clarity.

### 12. **Missing Error Handling in Stock Restoration**
**Location:** `server/controllers/shop/order-controller.js` - `cancelOrder` and `restoreCancelledOrder`

**Issue:** If stock restoration fails for one product, the function continues but the order status is already updated. This could lead to inconsistent state.

**Impact:** If an order is cancelled but stock restoration fails, the order is marked cancelled but stock isn't restored.

**Fix Required:** Consider using transactions or at least logging failures more prominently.

### 13. **Inconsistent Archive Validation Logic**
**Location:** 
- `server/controllers/shop/order-controller.js` - `archiveOrder` (line 429)
- `server/controllers/admin/order-controller.js` - `archiveOrder` (line 266)

**Issue:** Two different archive validation rules:
- Shop version: Allows archiving if `pickedUp` OR (`paid` AND not `pending`/`confirmed`)
- Admin version: Only allows archiving `pickedUp` OR `cancelled`

**Impact:** Inconsistent behavior between user and admin interfaces.

**Fix Required:** Standardize the archive rules across both controllers.

### 14. **Missing Validation for Archived Products in Cart**
**Location:** `server/controllers/shop/cart-controller.js`

**Issue:** When fetching cart items, archived products are not filtered out. Users see archived products in their cart.

**Fix Required:** Filter out archived products when populating cart items.

### 15. **Potential Memory Leak in Socket.IO**
**Location:** `server/server.js` - Socket.IO connection handling

**Issue:** No cleanup for user rooms when users disconnect. Rooms like `user-${userId}` may persist even after user disconnects.

**Fix Required:** Add cleanup in disconnect handler:
```javascript
socket.on("disconnect", () => {
  // Leave all rooms
  const rooms = Array.from(socket.rooms);
  rooms.forEach(room => socket.leave(room));
  console.log("Client disconnected:", socket.id);
});
```

## 🟢 LOW PRIORITY / CODE QUALITY ISSUES

### 16. **Inconsistent Response Status Codes**
**Location:** Multiple controllers

**Issue:** Some 404 responses use `res.status(404).json()` while others use `res.json()` with 200 status but `success: false`.

**Example:** `server/controllers/shop/cart-controller.js` line 84-88 returns 200 for empty cart, which is fine, but inconsistent with other "not found" responses.

### 17. **Missing JSDoc/Comments**
**Location:** Most controller functions

**Issue:** Complex business logic lacks documentation, making maintenance difficult.

### 18. **Hardcoded Values**
**Location:** Multiple files

**Issues:**
- Lock expiry time (5 minutes) is hardcoded in `products-controller.js`
- Payment deadline (3 days) is hardcoded in `order-controller.js`
- Should be configurable via environment variables

### 19. **Inefficient Database Queries**
**Location:** `server/controllers/shop/cart-controller.js` - `fetchCartItems`

**Issue:** After populating, code filters out invalid items and saves the cart. This could be optimized by filtering before populate or using aggregation.

### 20. **Missing Indexes**
**Location:** Models

**Issue:** No database indexes defined on frequently queried fields like:
- `Order.userId`
- `Order.paymentDeadline`
- `Cart.userId`
- `Product.category`
- `Product.isArchived`

**Impact:** Slower queries as database grows.

## 📋 SUMMARY

**Critical Issues:** 3 (Security vulnerabilities)
**High Priority:** 4 (Race conditions, logic bugs)
**Medium Priority:** 12 (Validation, error handling, consistency)
**Low Priority:** 5 (Code quality, optimization)

**Total Issues Found:** 24

## 🔧 RECOMMENDED ACTION PLAN

1. **Immediate (Critical):**
   - Add authentication middleware to all shop routes
   - Implement authorization checks (validate userId matches req.user.id)
   - Fix cookie security settings

2. **High Priority:**
   - Implement database transactions for order creation
   - Fix order status validation
   - Add stock checks in cart operations
   - Fix product locking race condition

3. **Medium Priority:**
   - Add comprehensive input validation
   - Standardize error messages
   - Fix archive validation inconsistencies
   - Remove debug console.logs

4. **Low Priority:**
   - Add database indexes
   - Optimize queries
   - Add code documentation
   - Extract hardcoded values to config

