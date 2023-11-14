import React from "react";
import '../style.css';

export const IndividualProduct = ({ individualProduct, addToCart }) => {

  const handleAddToCart = () => {
    addToCart(individualProduct);
  }
  return (
    <div className='product-card'>
      <div className='product-img'>
        <img src={individualProduct.imageUrl} alt="not found" />
      </div>
      <div className='product-name'>
        {individualProduct.title}
      </div>
      <div className='product-description'>
        {individualProduct.description}
      </div>
      <div className='product-price'>
        {individualProduct.price} RON
      </div>
      <button className='addcart-btn' onClick={handleAddToCart}>ADD TO CART</button>
    </div>
  )
}
