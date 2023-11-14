import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import { fs, auth, storage } from '../Config/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { deleteDoc } from 'firebase/firestore';
import { Navbar } from "./Navbar";

export const AddProducts = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [imageError, setImageError] = useState('');
  const [percent, setPercent] = useState(0);

  const [editingProductId, setEditingProductId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedPrice, setEditedPrice] = useState("");


  const isImageType = (file) => {
    const acceptedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    return acceptedImageTypes.includes(file.type);
  };

  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(fs, "Products"));
        const productList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };

    fetchProducts();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, set user to state
        setCurrentUser(user);
      } else {
        // User is signed out, set user to null
        setCurrentUser(null);
      }
    });
  
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(fs, 'Products', id));
      setProducts(products.filter((product) => product.id !== id));
    } catch (error) {
      console.error("Error removing product: ", error);
    }
  };
  
  const handleEditClick = (product) => {
    setEditingProductId(product.id);
    setEditedTitle(product.data.title);
    setEditedDescription(product.data.description);
    setEditedPrice(product.data.price);
  };
  
  // Call this when the "Save" button is clicked
  const handleInlineSave = async (id) => {
    // Update the document in Firestore with the new values
    const existingProduct = products.find((product) => product.id === id);
    const productDocRef = doc(fs, 'Products', id);
    const updatedProduct = {
      title: editedTitle,
      description: editedDescription,
      price: Number(editedPrice),
      imageUrl: existingProduct.data.imageUrl
      // imageUrl is not changed here, so it's not included
    };
  
    await setDoc(productDocRef, updatedProduct, { merge: true });
    
    // Update the local products state as well
    setProducts(products.map((product) => {
      return product.id === id ? { id, data: updatedProduct } : product;
    }));
  
    setEditingProductId(null); // Exit edit mode
  };
  
  const renderProductEditFields = (product) => {
  return (
    <div className="product-edit-fields">
      <label htmlFor="edit-title">Product Title</label>
      <input
        id="edit-title"
        className="form-control"
        value={editedTitle}
        onChange={(e) => setEditedTitle(e.target.value)}
        placeholder="Enter title"
      />

      <label htmlFor="edit-description">Product Description</label>
      <textarea
        id="edit-description"
        className="form-control"
        value={editedDescription}
        onChange={(e) => setEditedDescription(e.target.value)}
        placeholder="Enter description"
      />

      <label htmlFor="edit-price">Product Price</label>
      <input
        id="edit-price"
        type="number"
        className="form-control"
        value={editedPrice}
        onChange={(e) => setEditedPrice(e.target.value)}
        placeholder="Enter price"
      />

      <button onClick={() => handleInlineSave(product.id)} className="save-btn">Save</button>
      <button onClick={() => setEditingProductId(null)} className="cancel-btn">Cancel</button>
    </div>
  );
};

  
  const renderProducts = () => {
    return (
      <div className="products-container">
        {products.map((product) => (
          <div className="product-row" key={product.id}>
            <div className="product-image">
              <img src={product.data.imageUrl} alt={product.data.title} style={{ width: "100px" }} />
            </div>
            {editingProductId === product.id ? (
              renderProductEditFields(product)
            ) : (
              <div className="product-details">
                <h3>{product.data.title}</h3>
                <p>{product.data.description}</p>
                <p>{product.data.price.toFixed(2)} RON</p>
                <button onClick={() => handleDelete(product.id)} className="save-btn">Delete</button>
                <button onClick={() => handleEditClick(product)} className="save-btn">Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  

  
  const handleUpload = async (event) => {
    event.preventDefault();

    if (!image) {
      setUploadError('Please upload an image first!');
      return;
    }

    try {
      const docRef = await addDoc(collection(fs, 'Products'), {
        title,
        description,
        price: Number(price),
      });

      console.log('Document written with ID: ', docRef.id);

      const storageRef = ref(storage, `/product-images/${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setPercent(progress);
        },
        (error) => setUploadError(error.message),
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            const productDocRef = doc(fs, 'Products', docRef.id);
            const newProductData = {
              imageUrl: url,
              title: title,
              description: description,
              price: Number(price),
            };
            await setDoc(productDocRef, newProductData, { merge: true });
            setSuccessMsg('Product added successfully');
            setTimeout(() => {
              setSuccessMsg('');
          }, 3000);
            setPercent(0); // Reset the progress
            setTitle('');
            setDescription('');
            setPrice('');
            setImage(null);
            setImageError('');
            document.getElementById('file').value = '';

            // Update the products state with the new product
            setProducts(prevProducts => [...prevProducts, { id: docRef.id, data: newProductData }]);
          } catch (error) {
            setUploadError(error.message);
          }
        }
      );
    } catch (error) {
      setUploadError(error.message);
    }
  };

  const handleChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile && isImageType(selectedFile)) {
        setImage(selectedFile);
        setImageError('');
      } else {
        setImage(null);
        setImageError('Please select a valid image file extension (png or jpg)');
      }
    } else {
      console.log('Please select your file');
    }
  };

  return (
    <>
    <Navbar user={currentUser}/>
    <div className="container-form">
      <br />
      <h2>ADD PRODUCTS</h2>
      <hr />
      {successMsg && (
        <div className="success-msg">{successMsg}</div>
      )}
      <form autoComplete="off" className="form-group" onSubmit={handleUpload}>
        <label>Product Title</label>
        <input
          type="text"
          className="form-control"
          required
          onChange={(e) => setTitle(e.target.value)}
          value={title}
        />
        <br />
        <label>Product Description</label>
        <input
          type="text"
          className="form-control"
          required
          onChange={(e) => setDescription(e.target.value)}
          value={description}
        />
        <br />
        <label>Product Price</label>
        <input
          type="number"
          className="form-control"
          required
          onChange={(e) => setPrice(e.target.value)}
          value={price}
        />
        <br />
        <label>Upload the product Image</label>
        <input type="file" className="form-control" id="file" required onChange={handleChange} />
        {imageError && (
          <div className="error-msg">{imageError}</div>
        )}
        <br />
        <button type="submit" className="RightsideNavlink" onSubmit={handleUpload}>
          ADD
        </button>
      </form>
      {uploadError && (
        <div className="error-msg">{uploadError}</div>
      )}
      {percent > 0 && (
        <p>{percent} % done</p>
        )}
        <br />
        <h2>All the products</h2>
      </div>
      <div className="products-list">
        {products.length > 0 ? renderProducts() : <p>No products found!</p>}
      </div>
      </>
  );
};
