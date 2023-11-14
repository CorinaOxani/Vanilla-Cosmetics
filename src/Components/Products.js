import React, { useState, useEffect } from "react";
import '../style.css';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore/lite';
import { auth, firebaseConfig } from "../Config/config";
import { IndividualProduct } from "./IndividualProduct";
import { onAuthStateChanged } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function GetCurrentUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'SignedUpUsersData', currentUser.uid);
        getDoc(userDocRef).then((snapshot) => {
          if (snapshot.exists()) {
            setUser({ email: currentUser.email, fullName: snapshot.data().FullName, uid: currentUser.uid });
          } else {
            setUser({ email: currentUser.email, fullName: '', uid: currentUser.uid });
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

export const Products = ({ products }) => {
  const user = GetCurrentUser();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  const addToCart = async (product) => {
    if (user && user.uid) {
      const userCartCollectionRef = collection(db, `Cart-${user.uid}`);
  
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

      setAlertMessage('You must be logged in to add items to your cart.');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } else {
      navigate('/login');
    }
  }

  return products.map((individualProduct) => (
    <IndividualProduct
      key={individualProduct.ID}
      individualProduct={individualProduct}
      addToCart={addToCart} />
  ));
}