import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Style Imports
import "../style/CreateProfile.css";
import '../App.css'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CreateProfile = () => {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // handles the final onboarding step to save the user's nickname
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setLoading(true);
    setError('');

    try {
      const headers = {};
      const token = localStorage.getItem('authToken');
      console.log('[CreateProfile] Token available:', token ? 'yes' : 'no');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('[CreateProfile] Sending Authorization header');
      }

      const response = await axios.post(
        `${API_BASE_URL}/auth/create-profile`,
        { nickname: nickname },
        { headers, withCredentials: true }
      );

      console.log('[CreateProfile] Response status:', response.status);
      // if successful (including existing user reuse), move the user into their dashboard
      if (response.data && response.data.success) {
        navigate('/dashboard');
        return;
      }

      // fallback if success flag missing
      setError(response?.data?.error || "Could not create profile. Please try again.");
    } catch (err) {
      console.log('[CreateProfile] Error:', err.response?.status, err.response?.data?.error || err.message);
      const serverMessage = err?.response?.data?.error || err?.message;
      setError(serverMessage || "Could not create profile. The server might be busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-container">
      {/* Onboarding */}
      <div className="create-card">
        <h1 className="create-heading">Welcome to Bookmarked</h1>
        
        {/* error display for failed registration attempts */}
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="create-inputs">
            <label className="create-label">Please choose a name:</label>
            <input 
              className="create-input"
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Jane Doe"
              required
            />
          </div>

          {/* Create Profile */}
          <button 
            className="button"
            type="submit" 
            disabled={loading}
          >
            {loading ? "Creating Profile..." : "Create Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProfile;