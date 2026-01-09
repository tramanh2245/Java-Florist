import React, {useState} from "react";
import { useAuth } from "../context/AuthContext";

// Reusable form component for both Login and Registration
// Props:
// - isRegister: boolean flag to switch between Login and Register modes
// - onSuccess: callback function to run after successful authentication
export default function AuthForm({isRegister=false, onSuccess}) {
  // Get authentication methods from our custom AuthContext
  const {login, register} = useAuth();
  
  // Local state for form fields and UI status
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop page reload
    setLoading(true)
    setError('')
    
    try {
      if (isRegister) {
        // --- REGISTER MODE ---
        // Pass confirmPassword (or fallback to password if not provided in UI logic)
        const ok = await register(email, password, confirmPassword || password);
        if (!ok) {
          setError('Registration failed')
        } else {
          // If successful, call the parent's success handler (e.g., close modal)
          if (onSuccess) onSuccess()
        }
      } else {
        // --- LOGIN MODE ---
        const ok = await login(email, password);
        if (!ok) {
          setError('Email or Password invalid')
        } else {
          if (onSuccess) onSuccess()
        }
      }
    } catch (err) {
      // Display error message from backend or default text
      setError(err.message || (isRegister ? 'Registration failed' : 'Login failed'))
    } finally {
      setLoading(false) // Re-enable buttons
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Email Input */}
      <div>
        <label htmlFor="email">Email</label>
        <input 
          id="email"
          type="email"
          required
          value={email}
          onChange={e=>setEmail(e.target.value)} 
        />
      </div>

      {/* Password Input */}
      <div>
        <label htmlFor="pwd">Password</label>
        <input 
          id='pwd'
          type="password"
          required
          value={password}
          onChange={e=>setPassword(e.target.value)} 
        />
      </div>

      {/* Confirm Password Input (Only shown in Register mode) */}
      {isRegister && (
        <div>
          <label htmlFor="confirmPwd">Confirm Password</label>
          <input 
            id='confirmPwd'
            type="password"
            required
            value={confirmPassword}
            onChange={e=>setConfirmPassword(e.target.value)} 
          />
        </div>
      )}

      {/* Error Message Display */}
      {error && <div style={{color:'red', marginTop:8}}>{error}</div>}

      {/* Submit Button (Label changes based on mode) */}
      <button type="submit" disabled={loading}>{isRegister? "Register": "Login"}</button>
    </form>
  );
}