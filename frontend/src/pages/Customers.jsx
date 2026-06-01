import { useState, useEffect } from 'react';
import { getCustomers, createCustomer, deleteCustomer } from '../api/customers';

const emptyForm = { full_name: '', email: '', phone: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data);
    } catch { setError('Failed to load customers'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await createCustomer(form);
      setSuccess('Customer created');
      setForm(emptyForm);
      loadCustomers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      setSuccess('Customer deleted');
      loadCustomers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed');
    }
  };

  return (
    <div>
      <h1>Customers</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h2>Add Customer</h2>
        <form onSubmit={handleSubmit} className="form">
          <input placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </div>

      <div className="card">
        <h2>Customer List</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan="4" className="empty">No customers yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
