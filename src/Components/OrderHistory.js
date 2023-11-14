import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, doc, updateDoc } from 'firebase/firestore';
import { fs, auth } from '../Config/config';
import { Navbar } from './Navbar';
import { deleteDoc } from 'firebase/firestore';


const OrderHistory = () => {
  const [userOrders, setUserOrders] = useState([]);
  const user = auth.currentUser;
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [editedStatus, setEditedStatus] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    if (user) {
      // Check if the user has admin privileges
      isAdmin(user.email).then((isAdminResult) => {
        setIsAdminUser(isAdminResult); // Set the admin state
        let ordersQuery;
  
        if (isAdminResult) { // Use the result directly here instead of the state
          // Admins can see all orders
          ordersQuery = collection(fs, 'orders');
        } else {
          // Regular users can see their orders only
          ordersQuery = query(collection(fs, 'orders'), where('userEmail', '==', user.email));
        }
  
        getDocs(ordersQuery)
          .then((querySnapshot) => {
            const orders = [];
            querySnapshot.forEach((doc) => {
              orders.push({ id: doc.id, ...doc.data() });
            });
            setUserOrders(orders);
          })
          .catch((error) => {
            console.error('Error fetching orders:', error);
          });
      });
    }
  }, [user]); // You may want to include setIsAdminUser in dependency array if linter warns
  

  const isAdmin = async (userEmail) => {
    const adminUserDataCollection = collection(fs, 'AdminUserData');
    const adminUserQuery = query(adminUserDataCollection, where('Email', '==', userEmail));

    const adminUserSnapshot = await getDocs(adminUserQuery);
    return !adminUserSnapshot.empty;
  };

  const handleStatusEdit = (orderId) => {
    setSelectedOrderId(orderId);
    const order = userOrders.find((o) => o.id === orderId);
    setEditedStatus(order.status);
  };

  const handleStatusSave = async () => {
    if (selectedOrderId && editedStatus) {
      try {
        const orderDocRef = doc(fs, 'orders', selectedOrderId);
        await updateDoc(orderDocRef, { status: editedStatus });
        setSelectedOrderId(null);
        setEditedStatus('');
        // After updating the status, re-fetch the orders to display the updated data
        reFetchOrders();
      } catch (error) {
        console.error('Error updating order status:', error);
      }
    }
  };

  const handleOrderCancel = async (orderId, userEmail) => {
    if (user) {
      // Allow cancellation if the current user is an admin or the owner of the order
      if (isAdminUser || user.email === userEmail) {
        if (window.confirm("Do you really want to cancel this order? Press CANCEL for abort the operation if the answer in NO")) {
          try {
            const orderDocRef = doc(fs, 'orders', orderId);
            await deleteDoc(orderDocRef);
            // After deleting the order, re-fetch the orders to update the list
            reFetchOrders();
          } catch (error) {
            console.error('Error deleting order:', error);
          }
        }
      }  else {
        // Optionally handle the error if a non-admin user tries to delete an order they don't own
        console.error("You don't have permission to cancel this order.");
      }
    }
  };
  

  const reFetchOrders = () => {
    if (user) {
      let ordersQuery;
  
      if (isAdminUser) { // Use the state variable directly
        // Admins can see all orders
        ordersQuery = collection(fs, 'orders');
      } else {
        // Regular users can see their orders only
        ordersQuery = query(collection(fs, 'orders'), where('userEmail', '==', user.email));
      }
  
      getDocs(ordersQuery)
        .then((querySnapshot) => {
          const orders = [];
          querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
          });
          setUserOrders(orders);
        })
        .catch((error) => {
          console.error('Error re-fetching orders:', error);
        });
    }
  };
  
  return (
    <div className="wrapper">
      <Navbar user={user} />
      <br />
      <h1>Your Order History</h1>
      {userOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul>
          {userOrders.map((order) => (
            <li key={order.id} className="order-item">
              <div className="order-details">
                <div className="order-info">
                  <div className="bold">Order ID: {order.id}</div>
                  {isAdminUser && <div>User's email : {order.userEmail}</div>}
                  <div>Total Price: {order.totalPrice.toFixed(2)} RON</div>
                  <div className="italic">
                    Status: {order.id === selectedOrderId ? (
                      <select
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Sent">Sent</option>
                        <option value="Received">Received</option>
                      </select>
                    ) : (
                      order.status
                    )}
                  </div>
                  <div>Date when the order was submitted: {order.orderDate}</div>
                  {isAdminUser && (
                    <div>
                      {order.id === selectedOrderId ? (
                        <button onClick={handleStatusSave}>Save</button>
                      ) : (
                        <button onClick={() => handleStatusEdit(order.id)}>Edit Status</button>
                      )}
                    </div>
                  )}
                  {isAdminUser || user.email === order.userEmail ? (
                    <button onClick={() => handleOrderCancel(order.id, order.userEmail)}>Cancel Order</button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  
  
};

export default OrderHistory;
