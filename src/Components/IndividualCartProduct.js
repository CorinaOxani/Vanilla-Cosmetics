import React from 'react';
import { Icon } from 'react-icons-kit';
import { plus } from 'react-icons-kit/feather/plus';
import { minus } from 'react-icons-kit/feather/minus';
import { iosTrashOutline } from 'react-icons-kit/ionicons/iosTrashOutline';
import { doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { fs, auth } from '../Config/config';

export const IndividualCartProduct = ({ cartProduct, cartProductIncrease, cartProductDecrease }) => {
  const handleCartProductIncrease = () => {
    cartProductIncrease(cartProduct);
  }

  const handleCartProductDecrease = () => {
    cartProductDecrease(cartProduct);
  }

  const handleCartProductDelete = () => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const cartProductRef = doc(fs, `Cart-${user.uid}`, cartProduct.ID)

        deleteDoc(cartProductRef)
          .then(() => {
            console.log('Successfully deleted product');
          })
          .catch((error) => {
            console.error('Error deleting product:', error);
          });
      }
    });
  }

  return (
    <div className="cart-container">
      <div className="cart-card">
        <div className="cart-img">
          <img src={cartProduct.imageUrl} alt="not found" />
        </div>
        <div className="cart-name">{cartProduct.title}</div>
        <div className="cart-price-original">{cartProduct.price}RON</div>
        <div className="dec" onClick={handleCartProductDecrease}>
          <Icon icon={minus} size={20} />
        </div>
        <span className="quantity-text">Quantity:</span>
        <div className="quantity">{cartProduct.qty}</div>
        <div className="inc" onClick={handleCartProductIncrease}>
          <Icon icon={plus} size={20} />
        </div>
        <div className="cart-price">
          {cartProduct.TotalProductPrice}RON
        </div>
        <button className="delete-btn" onClick={handleCartProductDelete}>
          <Icon icon={iosTrashOutline} size={24} />
        </button>
      </div>
    </div>
  );
};

export default IndividualCartProduct;
