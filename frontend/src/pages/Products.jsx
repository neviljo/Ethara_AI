import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';

const emptyForm = { name: '', sku: '', price: '', quantity_in_stock: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch { setError('Failed to load products'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = { ...form, price: parseFloat(form.price), quantity_in_stock: parseInt(form.quantity_in_stock) };
      if (editing) {
        await updateProduct(editing, payload);
        setSuccess('Product updated');
      } else {
        await createProduct(payload);
        setSuccess('Product created');
      }
      setForm(emptyForm);
      setEditing(null);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, sku: p.sku, price: String(p.price), quantity_in_stock: String(p.quantity_in_stock) });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setSuccess('Product deleted');
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed');
    }
  };

  return (
    <div>
      <h1>Products</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={handleSubmit} className="form">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <input placeholder="Price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <input placeholder="Quantity in Stock" type="number" min="0" value={form.quantity_in_stock} onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })} required />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
            {editing && <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Product List</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td>${parseFloat(p.price).toFixed(2)}</td>
                  <td><span className={`stock-badge ${p.quantity_in_stock < 10 ? 'low' : 'ok'}`}>{p.quantity_in_stock}</span></td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan="5" className="empty">No products yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
