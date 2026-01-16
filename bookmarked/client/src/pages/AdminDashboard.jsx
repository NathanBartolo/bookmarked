import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Component Imports
import HorizontalLine from "../components/HorizontalLine.jsx";

// Style Imports
import '../style/AdminDashboard.css'; 

// This variable tells the app to use your Vercel backend URL if it exists, 
// otherwise it falls back to localhost for when you are working at home.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AdminDashboard = ({ triggerAlert }) => {

  // tracks the aggregate count and the list of individual member records
  const [totalUsers, setTotalUsers] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // trigger data fetch on component mount
  useEffect(() => {
    fetchAdminData();
  }, []);

  // pulls Admin stats and the full member registry from the backend API
  const fetchAdminData = async () => {
    try {
      const statsRes = await axios.get(`${API_BASE_URL}/api/admin/stats`, { withCredentials: true });

      setTotalUsers(statsRes.data.totalUsers);

      const usersRes = await axios.get(`${API_BASE_URL}/api/admin/users`, { withCredentials: true });
      setUsers(usersRes.data);
      
      setLoading(false);
    } catch (err) {
      // redirect unauthorized users back to the regular Dashboard
      triggerAlert("Restricted Area: This section of the library is for authorized staff only.");
      navigate('/dashboard'); 
    }
  };

  // permanently removes a member record from the archives
  const handleDeleteUser = (id) => {
    triggerAlert("Are you sure you want to revoke this library card? This action is permanent.", async () => {
      try {
        await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`, { withCredentials: true });
        
        setUsers(users.filter(u => u._id !== id));
        setTotalUsers(prev => prev - 1);

        triggerAlert("User successfully removed.");
      } catch (err) {
        triggerAlert("The archives resisted. We couldn't delete this user—please try again.");
      }
    });
  };

  // loading state for the staff archives
  if (loading) return (
    <div className="isolated-container">
       <div className="admin-loading">Consulting the Grand Archivist...</div>
    </div>
  );

  return (
    <div className="isolated-container">
      
      <HorizontalLine />

      {/* Admin */}
      <div className="admin-container">
        <header className="admin-header">
          <h1>Bookmarked: Staff Archives</h1>
        </header>

        {/* Navigation Actions */}
        <div className="admin-actions-bar">
           <button className="button exit-admin-button" onClick={() => navigate('/dashboard')}>
             Return to Dashboard
           </button>
        </div>

        {/* Stats */}
        <div className="stats-row single-stat">
          <div className="stat-card">
            <h3>Total Registered Readers</h3>
            <p>{totalUsers}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="user-table-section">
          <h2>Registry of Users</h2>
          <div className="table-responsive-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {/* map through retrieved users to populate registry rows */}
                {users.map(u => (
                  <tr key={u._id}>
                    <td><div className="user-info">{u.displayName}</div></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {/* prevent admin self-deletion through the UI */}
                      {u.role !== 'admin' && (
                        <button 
                          className="delete-user-button" 
                          onClick={() => handleDeleteUser(u._id)}
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <HorizontalLine />
    </div>
  );
};

export default AdminDashboard;