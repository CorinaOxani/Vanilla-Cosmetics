import React, { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot, setDoc, collection, deleteDoc, addDoc, getDocs } from 'firebase/firestore';
import { Navbar } from "./Navbar";
import { fs, auth } from '../Config/config';
import { onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged from Firebase Authentication
import { CartProducts } from "./CartProducts";
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import Footer from "./Footer";


export const Cart = () => {
  function GetCurrentUser() {
    const [user, setUser] = useState(null);
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => { // Use onAuthStateChanged from Firebase Authentication
        if (user) {
          console.log(fs);
          const userDocRef = doc(fs, 'SignedUpUsersData', user.uid);
          getDoc(userDocRef).then((snapshot) => {
            if (snapshot.exists()) {
              setUser({ email: user.email, fullName: snapshot.data().FullName });
            } else {
              setUser({ email: user.email, fullName: '' });
            }
          });
        } else {
          setUser(null);
        }
      });

      return () => unsubscribe();
    }, []);
    return user;
  }

  const user = GetCurrentUser();

  const [cartProducts, setCartProducts] = useState([]);
  useEffect(() => {
    onAuthStateChanged(auth, user => { // Use onAuthStateChanged from Firebase Authentication
      if (user) {
        const cartCollectionRef = collection(fs, `Cart-${user.uid}`);
        const unsubscribe = onSnapshot(cartCollectionRef, (snapshot) => {
          const newCartProduct = snapshot.docs.map((doc) => ({
            ID: doc.id,
            ...doc.data(),
          }));
          setCartProducts(newCartProduct);
        });

        return () => unsubscribe();
      } else {
        // Handle the case where the user is not signed in to retrieve the cart.
      }
    }, []);
  }, []);

  //getting the qty from cartProducts in an array
  const qty = cartProducts.map(cartProduct => {
    return cartProduct.qty;
  })
  //calculate the sum o qty of each product
  const reducerOfQty = (accumulator, currentValue) => accumulator + currentValue;
  const totalQty = qty.reduce(reducerOfQty, 0);

  //getting the total price form cartProducts in an array
  const price = cartProducts.map((cartProduct) => {
    return cartProduct.TotalProductPrice;
  })

  //calculate the sum of total prices
  const reducerOfPrice = (accumulator, currentValue) => accumulator + currentValue;
  const totalPrice = price.reduce(reducerOfPrice, 0);

  // Cart product increase function
  const cartProductIncrease = (cartProduct) => {
    const updatedProduct = {
      ...cartProduct,
      qty: cartProduct.qty + 1,
      TotalProductPrice: (cartProduct.qty + 1) * cartProduct.price,
    };

    // Update the document in the 'Cart' collection
    onAuthStateChanged(auth, user => { // Use onAuthStateChanged from Firebase Authentication
      if (user) {
        const cartDocRef = doc(fs, `Cart-${user.uid}`, cartProduct.ID); // Specify the correct cartProduct.ID
        setDoc(cartDocRef, updatedProduct) // Use setDoc to update the existing document
          .then(() => {
            console.log('Increment added');
          })
          .catch((error) => {
            console.error('Error incrementing cart product:', error);
          });
      } else {
        console.log('User is not logged in to increment');
      }
    });
  };
  
  const cartProductDecrease = (cartProduct) => {
    const updatedProduct = {
      ...cartProduct,
      qty: cartProduct.qty - 1,
      TotalProductPrice: (cartProduct.qty - 1) * cartProduct.price,
    };
  
    // Update the document in the 'Cart' collection
    onAuthStateChanged(auth, user => { // Use onAuthStateChanged from Firebase Authentication
      if (user && cartProduct.qty > 1) {
        const cartDocRef = doc(fs, `Cart-${user.uid}`, cartProduct.ID); // Specify the correct cartProduct.ID
        setDoc(cartDocRef, updatedProduct) // Use setDoc to update the existing document
          .then(() => {
            console.log(`Decrement added `);
          })
          .catch((error) => {
            console.error('Error decrementing cart product:', error);
          });
      } else {
        console.log('User is not logged in to decrement');
      }
    });
  };

  const [showOrderForm, setShowOrderForm] = useState(false);

  const history = useNavigate();

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    console.log("Submit order button clicked.");

  // Check if the user is authenticated
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.error("User is not authenticated or user ID is undefined.");
      return;
    }
    const currentDate = new Date();
    const day = currentDate.getDate(); // Get the day of the month (1-31)
    const month = currentDate.getMonth() + 1; // Get the month (0-11), so add 1
    const year = currentDate.getFullYear(); // Get the year (4 digits)

    const fullName = event.target.fullName.value;
    const phone = event.target.phone.value;
    const cardNumber = event.target.cardNumber.value;
    const ccv = event.target.ccv.value;
    const cardMonth = event.target.cardMonth.value;
    const cardYear = event.target.cardYear.value;
    const shippingAddress = event.target.shippingAddress.value;

    const ordersCollectionRef = collection(fs, 'orders');
    const orderData = {
      userEmail: user.email, // Ensure that user.uid is defined
      products: cartProducts,
      totalPrice: totalPrice,
      fullName: fullName,
      phone: phone,
      cardNumber: cardNumber,
      ccv: ccv,
      cardExpiration: `${cardMonth}/${cardYear}`,
      shippingAddress: shippingAddress,
      status: "Pending",
      orderDate: `${day}/${month}/${year}`,
      // Capture the form input values here (e.g., payment and destination data)
    };

    try {
      await addDoc(ordersCollectionRef, orderData);

      const cartCollectionRef = collection(fs, `Cart-${user.uid}`);
      const cartSnapshot = await getDocs(cartCollectionRef);

      cartSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
        console.log(`Document ${doc.id} deleted from the cart.`);
      });

      // Redirect to the home page after order placement (adjust the delay as needed)
      setTimeout(() => {
        history("/");
      }, 3000);
    } catch (error) {
      console.error("Error processing order:", error);
    }

    unsubscribe(); // Unsubscribe from onAuthStateChanged
  });
};

const handleOrderPlacement = () => {
  setShowOrderForm(true);
};

return (
  <>
    <Navbar user={user} />
    <br></br>
    {cartProducts.length > 0 && (
      <div className="shopping-cart">
        <h1>Your Shopping Cart :</h1>
      <div className="main-container">
        <div className="cart-card">
          <div className="products-box">
            <CartProducts
              cartProducts={cartProducts}
              cartProductIncrease={cartProductIncrease}
              cartProductDecrease={cartProductDecrease}
            />
          </div>
          <div className="cart-summary-container">
          <div className="cart-summary">
            <div className="cart-summary-heading">Cart Summary</div>
            <br></br>
            <div className="cart-summary-price">Total Number of Products: <span>{totalQty}</span></div>
            <div className="cart-summary-price">Total Price to Pay: <span>{totalPrice}</span></div>
            <br></br>
            {showOrderForm ? (
              <form className="form-container" onSubmit={handleSubmitOrder}>
                <h2 className="form-header">Order Form : </h2>
                <div className="form-group">
                  <input type="text" name="fullName" className="input-field" placeholder="Full Name" required />
                </div>
                <div className="form-group">
                  <input type="text" name="phone" className="input-field" placeholder="Phone Number" required />
                </div>
                <div className="form-group">
                  <input type="text" name="shippingAddress" className="input-field" placeholder="Shipping Address" required />
                </div>
                <div className="form-group">
                <label>Card Details :</label>
                  <input
                    type="text"
                    name="cardNumber"
                    className="input-field"
                    placeholder="Card Number"
                    required
                    maxLength="19"
                    onChange={(e) => {
                      const cardNumber = e.target.value.replace(/\D/g, '');
                      const formattedCardNumber = cardNumber.replace(/(\d{4})/g, '$1 ');
                      e.target.value = formattedCardNumber;
                    }}
                  />
                </div>
                <div className="form-group">
                  <input type="text" name="ccv" className="input-field" placeholder="CCV" required maxLength="3" />
                </div>
                <div className="form-group">
                  <label>Card Expiration Date:</label>
                  <select name="cardMonth" className="select-field" required>
                    <option value="" disabled>Select Month</option>
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option> 
                    
                  </select>
                </div>
                <div className="form-group">
                  <select name="cardYear" className="select-field" required>
                    <option value="" disabled>Select Year</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="2029">2029</option>
                    <option value="2030">2030</option>
                    
                  </select>
                </div>
                <button type="submit" className="RightsideNavlink">Submit Order</button>
              </form>
            ) : (
              <button className="RightsideNavlink" onClick={handleOrderPlacement}>Place Order</button>
            )}
            </div>
            </div>
          </div>
        </div>
      </div>
    )}
    {cartProducts.length < 1 && (
      <div className="cart-container">No Products to show</div>
    )}
  </>
);

  
};
