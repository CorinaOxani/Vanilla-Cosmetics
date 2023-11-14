import React, { useState } from 'react'; // Import useState
import './style.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Home } from './Components/Home';
import { Signup } from './Components/SignUp';
import { Login } from './Components/Login';
import { NotFound } from './Components/NotFound';
import { AddProducts } from './Components/AddProducts';
import { Cart } from './Components/Cart';
import  ProductsPage  from './Components/ProductsPage';
import OrderHistory from './Components/OrderHistory';

export const App = () => {
  const [user, setUser] = useState(null); // Define the user state

  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<Home user={user} setUser={setUser} />} /> 
        <Route
          path="/signup"
          element={<Signup/>} // Pass setUser to Signup
        />
        <Route
          path="/login"
          element={<Login setUser={setUser} />} // Pass setUser to Login
        />
        <Route
          path="/add-products"
          element={<AddProducts setUser={setUser} />}
        />
        <Route
          path="/products"
          element={<ProductsPage/>}
        />
        <Route path="/NotFound" element={<NotFound />} />
        <Route
          path="/order-history"
          element={<OrderHistory/>}
        />
        <Route
          path="/cart"
          element={<Cart/>} 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
