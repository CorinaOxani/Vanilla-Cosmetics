import React, { useEffect, useState } from 'react';
import '../style.css';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { auth, fs } from '../Config/config';
import { onAuthStateChanged } from 'firebase/auth';

export const Navbar = ({ user }) => {
  const history = useNavigate();
  const handleLogout = () => {
    auth.signOut().then(() => {
      history('/login');
    });
  };

  const [isAdmin, setIsAdmin] = useState(false);

  // Check if the user is an admin (in the "AdminUserData" collection)
  useEffect(() => {
    if (user) {
      const adminUserDataCollection = collection(fs, 'AdminUserData');
      const adminUserQuery = query(adminUserDataCollection, where('Email', '==', user.email));

      getDocs(adminUserQuery)
        .then((adminUserSnapshot) => {
          setIsAdmin(!adminUserSnapshot.empty);
        })
        .catch((error) => {
          console.error('Error checking admin status:', error);
        });
    }
  }, [user]);

  // Calculating the total number of products
  const [cartProducts, setCartProducts] = useState([]);
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
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
      }
    }, []);
  }, []);

  // Getting the qty from cartProducts in an array
  const qty = cartProducts.map((cartProduct) => {
    return cartProduct.qty;
  });

  // Calculate the sum of qty of each product
  const reducerOfQty = (accumulator, currentValue) => accumulator + currentValue;
  const totalQty = qty.reduce(reducerOfQty, 0);

  return (
    <div className="Navbox">
        <Link to="/" className="logo">
        Vanilla Cosmetics
        </Link> 

      {!user ? (
        <>
        <Link to="/signup" className="nav-button">
            Sign Up
          </Link>
          <Link className="nav-button-shop" to="/products">
            Browse our shop
        </Link>
        <Link to="/login" className="nav-button">
            Log In
        </Link>
    </>
      ) : (
        <>
        {isAdmin && (
            <Link className="nav-button" to="/add-products">
                Add Product
            </Link>
        )}
        <Link className="nav-button-shop" to="/products">
            Browse our shop
        </Link>
        <Link className="nav-button" to="/order-history">
            Orders
        </Link>
        <Link className="nav-button-shop" to="/cart">
            Shopping Cart ({totalQty})
        </Link>
        <div className="nav-button" onClick={handleLogout}>
            Log Out
        </div>
    </>
      )}
    </div>
  );
};
