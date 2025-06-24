import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // hooks לגישה ל-redux

// מייבא את הפעולות שאנחנו נשתמש בהן לשינוי ה-state של הסל
import {
  setCart,
  setProductsDetails,
  setTotalPrice,
  setDelivery,
  setOrderCreated,
  setLoading,
  updateQty,
} from '../Redux/cartSlice';

// מייבא פונקציות API לעבודה עם השרת
import {
  getBuyingById,
  calculateTotalBuyingPrice,
  removeProductFromBuying,
} from '../API/BuyingController';

import { getProductById } from '../API/ProductsController';
import { addOrder } from '../API/OrderController';
import { Link } from 'react-router-dom';
import './css.css';

const Buying = () => {
  const dispatch = useDispatch(); // מאפשר לשלוח פעולות ל-redux
  // קורא מה-state את ערכי הסל הרלוונטיים
  const {
    items: cartItems,
    productsDetails,
    delivery,
    orderCreated,
    loading,
  } = useSelector(state => state.cart);

  // פונקציה לאסוף את הנתונים מהשרת ולעדכן ב-redux
  const fetchCartAndProducts = async () => {
    dispatch(setLoading(true)); // מציג טעינה בזמן שאוסף מידע
    try {
      const cart = await getBuyingById(); // מביא את פרטי הסל מהשרת
      if (!cart) throw new Error('Cart not found');

      dispatch(setCart(cart.products || [])); // מעדכן את פריטי הסל

      // מביא פרטים מלאים של כל מוצר (שם, מחיר, תמונה) מהשרת
      const details = await Promise.all(
        cart.products.map(item => getProductById(item.productId))
      );
      dispatch(setProductsDetails(details)); // מעדכן פרטי מוצרים ב־state

      // מחשב את המחיר הכולל של הסל
      const total = await calculateTotalBuyingPrice();
      dispatch(setTotalPrice(total?.totalPrice ?? 0)); // מעדכן את המחיר הכולל
    } catch (err) {
      console.error('Error loading cart:', err);
    } finally {
      dispatch(setLoading(false)); // מסתיר את מצב הטעינה בסוף
    }
  };

  // useEffect שרץ פעם אחת כשהקומפוננטה נטענת
  useEffect(() => {
    // טוען את הסל והפרטים רק אם הם ריקים (מונע טעינה חוזרת מיותרת)
    if (!cartItems?.length || !productsDetails?.length) {
      fetchCartAndProducts();
    }
  }, []);

  // מחשב סכום ביניים לפני הוספת משלוח
  const baseTotal = productsDetails.reduce((sum, product, idx) => {
    const cartItem = cartItems[idx];
    if (!product || !cartItem) return sum;
    return sum + product.price * cartItem.quantity;
  }, 0);

  // מוסיף 25 שקלים אם נבחר משלוח
  const total = delivery === 'delivery' ? baseTotal + 25 : baseTotal;

  // פונקציה להגדלת כמות מוצר
  const increaseQty = (productId) => {
    const item = cartItems.find(i => i.productId === productId);
    if (item) {
      dispatch(updateQty({ productId, quantity: item.quantity + 1 }));
    }
  };

  // פונקציה להקטנת כמות מוצר (לא מאפשרת פחות מ-1)
  const decreaseQty = (productId) => {
    const item = cartItems.find(i => i.productId === productId);
    if (item && item.quantity > 1) {
      dispatch(updateQty({ productId, quantity: item.quantity - 1 }));
    }
  };

  // פונקציה להסרת מוצר מהסל (קוראת ל-API ומעדכנת)
  const removeItem = async (productId) => {
    try {
      const result = await removeProductFromBuying(productId);
      if (result) {
        fetchCartAndProducts(); // ריענון הסל לאחר הסרה
      } else {
        alert('לא ניתן להסיר את המוצר');
      }
    } catch (err) {
      console.error('שגיאה בהסרת מוצר:', err);
      alert('שגיאה בהסרת מוצר');
    }
  };

  // טיפול בביצוע ההזמנה - בדיקת תקינות ושליחה לשרת
  const handleOrder = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) return alert('משתמש לא מחובר');
    if (!delivery) return alert('יש לבחור שיטת משלוח');
    if (cartItems.length === 0) return alert('הסל ריק');

    const orderData = {
      products: cartItems,
      orderDate: new Date(),
      status: 'ממתין',
      price: total,
    };

    const result = await addOrder(orderData);
    if (result) {
      alert('ההזמנה בוצעה בהצלחה!');
      dispatch(setOrderCreated(result));
    } else {
      alert('אירעה שגיאה בביצוע ההזמנה');
    }
  };

  if (loading) return <div>טוען סל...</div>; // מציג טקסט טעינה אם ב-loader

  return (
    <div className="cart-container">
      <div className="cart-items">
        <h2>הסל שלי</h2>
        {cartItems.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>הסל ריק</p>
        ) : (
          cartItems.map((item, index) => {
            const product = productsDetails[index];
            if (!product) return null;
            return (
              <div className="cart-item" key={item.productId}>
                <img src={product.imageUrl} alt={product.name} />
                <div className="item-details">
                  <p>{product.name}</p>
                  <p>{product.price} ש"ח</p>
                  <div className="quantity-controls">
                    <button onClick={() => decreaseQty(item.productId)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => increaseQty(item.productId)}>+</button>
                  </div>
                </div>
                <button className="remove-btn" onClick={() => removeItem(item.productId)}>×</button>
              </div>
            );
          })
        )}
      </div>

      <div className="order-summary">
        <h2>סיכום הזמנה</h2>
        <div className="summary-line">
          <span>סכום משנה</span>
          <span>{baseTotal} ש"ח</span>
        </div>

        <br />

        <p className="estimate-link">הערכת משלוח</p>

        <div>
          <label>
            <input
              type="radio"
              name="delivery"
              value="pickup"
              onChange={() => dispatch(setDelivery('pickup'))}
              checked={delivery === 'pickup'}
            />
            איסוף עצמי
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="delivery"
              value="delivery"
              onChange={() => dispatch(setDelivery('delivery'))}
              checked={delivery === 'delivery'}
            />
            משלוח (+25 ש"ח)
          </label>
        </div>

        <br />
        <div className="summary-total">
          <strong>סך הכול</strong>
          <strong>{total} ש"ח</strong>
        </div>

        <br />

        {orderCreated ? (
          <Link to={`/tashlum/${orderCreated._id}`}>
            <button className="checkout-btn">מעבר לתשלום</button>
          </Link>
        ) : (
          <button
            className="checkout-btn"
            onClick={handleOrder}
            disabled={!delivery || cartItems.length === 0}
          >
            תשלום
          </button>
        )}
      </div>
    </div>
  );
};

export default Buying;
