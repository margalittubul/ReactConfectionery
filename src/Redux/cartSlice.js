// מייבא כלים מ-Redux Toolkit ליצירת slice ו-thunks אסינכרוניים
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// מייבא פונקציה מה-API שלנו שמוסיפה מוצר לסל דרך השרת
import { addProductToBuying as apiAddProductToBuying } from '../API/BuyingController.js';

// הגדרת ה-state ההתחלתי של הסל
const initialState = {
  items: [],           // רשימת פריטים בסל, כל פריט מכיל productId וכמות
  productsDetails: [], // פרטים מלאים של המוצרים (מחיר, שם, תמונה) שמוצגים בממשק
  totalPrice: 0,       // מחיר כולל של כל הפריטים בסל
  delivery: null,      // סוג משלוח שנבחר (למשל 'pickup' או 'delivery')
  orderCreated: null,  // מידע על הזמנה שנוצרה לאחר תשלום
  loading: false,      // מצב טעינה (כדי להציג Loader בזמן קריאות API)
  error: null,         // שדה להחזיק הודעות שגיאה במידה ויש
};

// יצירת thunk אסינכרוני להוספת מוצר לסל דרך השרת
export const addProductToBuying = createAsyncThunk(
  'cart/addProductToBuying',               // שם הפעולה (action type prefix)
  async ({ productId, quantity }, thunkAPI) => {
    // קריאה אסינכרונית ל-API שמוסיף מוצר וכמות לסל
    const response = await apiAddProductToBuying(productId, quantity);
    // מחזיר את התגובה (לרוב רשימת פריטים מעודכנת)
    return response;
  }
);

// יצירת ה-slice של סל הקניות
const cartSlice = createSlice({
  name: 'cart',          // שם ה-slice, ישמש להפקת action types
  initialState,          // מגדיר את המצב ההתחלתי של הסל

  // reducers: פונקציות לסינכרוני שמשנות את ה-state
  reducers: {
    // עדכון רשימת הפריטים בסל
    setCart(state, action) {
      state.items = action.payload; // הפעולה מקבלת רשימת פריטים ומחליפה את הרשימה הקיימת
    },
    // הוספת מוצר לסל או עדכון הכמות אם הוא כבר קיים
    addToCart(state, action) {
      const item = action.payload; // המוצר עם הכמות שברצוננו להוסיף
      // מחפש אם המוצר כבר קיים בסל
      const existing = state.items.find(i => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity; // אם קיים - מעדכן את הכמות
      } else {
        state.items.push(item);              // אם לא קיים - מוסיף מוצר חדש
      }
    },
    // הסרת מוצר מהסל לפי productId
    removeFromCart(state, action) {
      // מחזיר מערך חדש בלי הפריט שמזוהים עם ה-productId שמגיע ב-action.payload
      state.items = state.items.filter(i => i.productId !== action.payload);
    },
    // עדכון הכמות של מוצר ספציפי
    updateQty(state, action) {
      const { productId, quantity } = action.payload;          // מוציא פרטי מוצר וכמות חדשה
      const item = state.items.find(i => i.productId === productId);
      if (item) item.quantity = quantity;                      // מעדכן כמות אם המוצר קיים
    },
    // ניקוי מלא של הסל - מחזיר את כל השדות למצב התחלתי
    clearCart(state) {
      state.items = [];
      state.productsDetails = [];
      state.totalPrice = 0;
      state.delivery = null;
      state.orderCreated = null;
    },
    // עדכון פרטי המוצרים בסל (כמו שם, מחיר, תמונה) מה-API
    setProductsDetails(state, action) {
      state.productsDetails = action.payload;
    },
    // עדכון סכום המחיר הכולל
    setTotalPrice(state, action) {
      state.totalPrice = action.payload;
    },
    // עדכון סוג המשלוח
    setDelivery(state, action) {
      state.delivery = action.payload;
    },
    // עדכון פרטי הזמנה שנוצרה לאחר תשלום
    setOrderCreated(state, action) {
      state.orderCreated = action.payload;
    },
    // עדכון מצב הטעינה (Loader)
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },

  // extraReducers - לטיפול באירועים אסינכרוניים שנוצרו ב-createAsyncThunk
  extraReducers: builder => {
    builder
      // כאשר הקריאה ל־addProductToBuying התחילה (pending)
      .addCase(addProductToBuying.pending, (state) => {
        state.loading = true;   // מציג Loader
        state.error = null;     // מאפס שגיאות
      })
      // כאשר הקריאה הסתיימה בהצלחה (fulfilled)
      .addCase(addProductToBuying.fulfilled, (state, action) => {
        state.loading = false;  // מסתיר Loader
        // אם התקבלו פריטים חדשים ועדכון מחיר, מעדכן אותם ב-state
        if (action.payload && action.payload.items) {
          state.items = action.payload.items;
          state.totalPrice = action.payload.totalPrice || state.totalPrice;
        }
      })
      // כאשר הקריאה נכשלה (rejected)
      .addCase(addProductToBuying.rejected, (state, action) => {
        state.loading = false;                // מסתיר Loader
        // מעדכן את שדה השגיאה עם הודעת השגיאה שהתקבלה או הודעה כללית
        state.error = action.error.message || "שגיאה בהוספת מוצר לסל";
      });
  }
});

// יצוא הפעולות (actions) שמאפשרות לקרוא אליהן מהקומפוננטות ולשנות את ה-state
export const {
  setCart,
  addToCart,
  removeFromCart,
  updateQty,
  clearCart,
  setProductsDetails,
  setTotalPrice,
  setDelivery,
  setOrderCreated,
  setLoading,
} = cartSlice.actions;

// יצוא ה-reducer כדי להשתמש ב-store
export default cartSlice.reducer;
