import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function UserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`/api/users/${id}`);
        setUser(res.data);
        setUsername(res.data.username);
        setEmail(res.data.email);
      } catch (err) {
        setError('Failed to fetch user');
      }
    };
    fetchUser();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/users/${id}`, { username, email });
      setUser(res.data);
      alert('User updated successfully');
    } catch (err) {
      setError('Update failed');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${id}`);
        alert('User deleted');
        navigate('/'); // Redirect after delete
      } catch (err) {
        setError('Delete failed');
      }
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <>
      <h2>User Details</h2>
      <form onSubmit={handleUpdate}>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">Update</button>
      </form>
      <button onClick={handleDelete} style={{ backgroundColor: '#f44336', marginTop: '10px' }}>Delete User</button>
      {error && <p className="error">{error}</p>}
    </>
  );
}

export default UserDetails;