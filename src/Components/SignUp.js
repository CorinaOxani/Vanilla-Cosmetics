import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { auth, fs } from '../Config/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Navbar } from "./Navbar";

export const Signup = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [fullName, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMSG, setErrorMsg] = useState('');
  const [successMSG, setSuccessMsg] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      const userData = {
        Name: fullName,
        Email: email,
        Password: password,
      };
  
      // Check if the "admin" checkbox is selected
      if (isAdmin) {
        // Save user data in the "admin" database
        const adminUserDocRef = doc(fs, 'AdminUserData', user.uid);
        await setDoc(adminUserDocRef, userData);
        const userDocRef = doc(fs, 'SignedUpUsersData', user.uid);
        await setDoc(userDocRef, userData);
      } else {
        // Save user data in the "users" database
        const userDocRef = doc(fs, 'SignedUpUsersData', user.uid);
        await setDoc(userDocRef, userData);
      }
  
      setFullname('');
      setEmail('');
      setPassword('');
      setErrorMsg('');
      setSuccessMsg(
        'Account created successfully. You will be redirected automatically to Log In form.'
      );
  
      // Automatically redirect to the login page after a delay
      setTimeout(() => {
        setSuccessMsg('');
        navigate('/login');
      }, 3000);
    } catch (error) {
      setErrorMsg(error.message);
    }
  };
  

  return (
    <>
      <Navbar />
    <div className="container-form">
      <br />
      <h2>Sign up</h2>
      <hr />
      {successMSG && (
        <div className="success-msg">{successMSG}</div>
      )}
      <form autoComplete="off" className="form-group" onSubmit={handleSignup}>
        <label>Full Name</label>
        <input
          type="text"
          className="form-control"
          required
          onChange={(e) => setFullname(e.target.value)}
          value={fullName}
        />
        <br />
        <label>Email</label>
        <input
          type="email"
          className="form-control"
          required
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <br />
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          required
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
        <br />
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', color: '#333', cursor: 'pointer' }}>
          Admin Role
          <input
            type="checkbox"
            onChange={(e) => setIsAdmin(e.target.checked)}
            style={{ margin: '0', width: '20px', height: '20px' }}
          />
        </label>
        <div className="btn-box">
          <button type="submit" className="RightsideNavlink">
            Sign Up
          </button>
          <br />
          <br />
          <span>
            You already have an account? <Link to="/login">Log In</Link>
          </span>
        </div>
      </form>
      {errorMSG && (
        <div className="error-msg">{errorMSG}</div>
      )}
      </div>
      </>
  );
};
