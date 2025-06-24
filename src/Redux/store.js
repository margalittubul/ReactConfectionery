// מייבא את הפונקציה 
// configureStore
//  מ־Redux Toolkit
//  כדי להגדיר את ה-
// store
//  שלנו בקלות
import { configureStore } from "@reduxjs/toolkit";

// מייבא את ה-
// reducers 
// השונים, שכל אחד מהם מנהל 
// slice
// מסוים ב-
// state 
// של האפליקציה
import categoriesReducer from "./categoriesSlice";
import productsReducer from "./productsSlice";
import ordersReducer from "./ordersSlice";
import cartReducer from "./cartSlice";
import userReducer from "./userSlice";

// מגדיר את ה-
// store 
// ומאחד בו את כל ה-
// reducers 
// תחת שמות 
// (keys) 
// לפי תחומי האחריות שלהם
export const store = configureStore({
  reducer: {
    categories: categoriesReducer, // slice של ניהול קטגוריות
    products: productsReducer,     // slice של ניהול מוצרים
    orders: ordersReducer,         // slice של ניהול הזמנות
    cart: cartReducer,             // slice של ניהול סל הקניות
    user: userReducer,             // slice של ניהול המשתמש (פרופיל, התחברות וכו')
  },
});
