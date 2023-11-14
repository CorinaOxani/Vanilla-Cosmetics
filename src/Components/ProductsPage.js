import React, { useEffect, useState } from 'react';
import '../style.css';
import { Navbar } from './Navbar';
import Footer from './Footer';
import { Products } from './Products'; 
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore/lite';
import { auth, firebaseConfig } from '../Config/config';
import { onAuthStateChanged } from 'firebase/auth';

const db = getFirestore();

function GetCurrentUser() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'SignedUpUsersData', currentUser.uid);
        getDoc(userDocRef).then((snapshot) => {
          if (snapshot.exists()) {
            setUser({ email: currentUser.email, fullName: snapshot.data().FullName });
          } else {
            setUser({ email: currentUser.email, fullName: '' });
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


const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const user = GetCurrentUser();

  const getProducts = async () => {
    try {
      const productsCollection = collection(db, 'Products');
      const snapshot = await getDocs(productsCollection);
      const productsArray = snapshot.docs.map((doc) => ({
        ...doc.data(),
        ID: doc.id,
      }));
      setProducts(productsArray);
      setFilteredProducts(productsArray);
    } catch (error) {
      console.error('Error getting products:', error);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  useEffect(() => {
    const results = products.filter(product =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="products-page">
        <Navbar user={user} />
        <div className="container">
            <div className="header-with-search">
                <h1 className="text-center">Our Products</h1>
                <input
                    type="text"
                    placeholder="Search for a product..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="product-search-input"
                />
            </div>
            <div className="products-grid">
                {filteredProducts.length > 0 && (
                    <Products products={filteredProducts} />
                )}
                {filteredProducts.length < 1 && (
                    <div className="products-container">No products found</div>
                )}
            </div>
        </div>
        <Footer />
    </div>
  );
};
export default ProductsPage;