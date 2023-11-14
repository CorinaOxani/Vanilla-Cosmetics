import React, { useEffect, useState } from "react";
import '../style.css';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore/lite';
import { Navbar } from "./Navbar";
import { auth, firebaseConfig } from "../Config/config";
import Footer from "./Footer";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const Home = (props) => {
  function GetUserUid() {
    const [uid, setUid] = useState(null);
    useEffect(() => {
      auth.onAuthStateChanged(user => {
        if (user) {
          setUid(user.uid);
        }
      });
    }, []);
    return uid;
  }

  const uid = GetUserUid();

  // Function to get the current user
  function GetCurrentUser() {
    const [user, setUser] = useState(null);
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log(db);
          const userDocRef = doc(db, 'SignedUpUsersData', user.uid);
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

  // State for products
  const [products, setProducts] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null); // Success message state

  // Function to get products from Firestore
  const getProducts = async () => {
    try {
      const productsCollection = collection(db, 'Products');
      const snapshot = await getDocs(productsCollection);

      if (snapshot.size === 0) {
        console.log("No products found.");
        return;
      }

      const productsArray = [];
      snapshot.forEach((doc) => {
        productsArray.push({
          ...doc.data(),
          ID: doc.id,
        });
      });

      setProducts(productsArray);
    } catch (error) {
      console.error("Error getting products:", error);
    }
  }

  useEffect(() => {
    getProducts();
  }, []);

  const navigate = useNavigate();

  const addToCart = async (product) => {
    if (uid !== null) {
      const userCartCollectionRef = collection(db, `Cart-${uid}`);
  
      // Check if the product is already in the user's cart
      const querySnapshot = await getDocs(userCartCollectionRef);
      let existingCartItem = null;
  
      querySnapshot.forEach((doc) => {
        const cartItem = doc.data();
        if (cartItem.ID === product.ID) {
          existingCartItem = doc;
        }
      });
  
      if (existingCartItem) {
        // If the product already exists in the cart, update quantity and total price
        const cartItemData = existingCartItem.data();
        const newQty = cartItemData.qty + 1;
        const newTotalPrice = newQty * product.price;
  
        try {
          await updateDoc(existingCartItem.ref, {
            qty: newQty,
            TotalProductPrice: newTotalPrice,
          });
  
          setSuccessMessage('Product added to the cart successfully');

          console.log('Successfully updated product in the cart');
        } catch (error) {
          console.error('Error updating product in the cart:', error);
        }
      } else {
        // If the product doesn't exist in the cart, add a new item
        const cartData = {
          ...product,
          qty: 1,
          TotalProductPrice: product.price,
        };
  
        // Set the document ID in the cart collection to be equal to the Product ID
        const cartItemRef = doc(userCartCollectionRef, product.ID);
  
        try {
          await setDoc(cartItemRef, cartData);
          setSuccessMessage('Product added to the cart successfully');

          console.log('Successfully added product to the cart');
        } catch (error) {
          console.error('Error adding product to the cart:', error);
        }
      }

      // Clear the success message after 2 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } else {
      navigate('/login');
    }
  }

  return (
    <div>
      <Navbar user={user} />
      <div className="main-content">
      </div>
      <div className="belief-content">
        <h2>WHAT WE BELIEVE:</h2>
        <p><strong>Beauty in Authenticity:</strong> At Vanilla Cosmetics, we believe that makeup is more than just cosmetics - it's a form of art, an expression of individuality, and a celebration of self-love.</p>
        <p><strong>Empowering Choices:</strong> Every person deserves to feel confident in their choices. We're here to provide a curated selection that caters to every identity, helping you find products that align with your unique beauty journey.</p>
        <p><strong>Sustainability Matters:</strong> Beauty should not come at the cost of our planet. We are committed to sourcing ethically produced, cruelty-free products, with a focus on sustainability and reducing environmental impact.</p>
        <p><strong>Inclusivity is Non-Negotiable:</strong> Beauty knows no bounds. We embrace and celebrate diversity in all its forms. Our range is designed to cater to every skin tone, type, and preference, ensuring that everyone finds their perfect shade.</p>
        <p><strong>Building Community:</strong> We're more than just a store - we're a community of beauty enthusiasts. Whether you're a makeup guru or a beginner, we value your presence and insights. Let's uplift and inspire each other, one palette at a time.</p>
      </div>
      <Footer />
    </div>
  );
};
