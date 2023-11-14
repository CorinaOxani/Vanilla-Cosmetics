import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Config/config';
import { Navbar } from "./Navbar";

export const Login = ({ setUser }) => {
  const history = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMSG, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUser(user); // Set the user state
      history('/'); // Redirect to the home page
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <>
      <Navbar />
    <div className="container-form">
      <br />
      <h2>Log In</h2>
      <br />
      {errorMSG && (
        <div className="error-msg">
          {errorMSG}
        </div>
      )}
      <form autoComplete="off" className="form-group" onSubmit={handleLogin}>
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
        <div className="btn-box">
          <button type="submit" className="RightsideNavlink">
            Log In
          </button>
          <br />
          <br />
          <span>
            You don't have an account? <Link to="/signup">Sign Up</Link>
          </span>
        </div>
      </form>
      </div>
      </>
      );
      
};
