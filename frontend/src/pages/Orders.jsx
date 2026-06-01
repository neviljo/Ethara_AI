import { useState, useEffect } from 'react';
import { getOrders, createOrder, deleteOrder, getOrder } from '../api/orders';
import { getCustomers } from '../api/customers';
import { getProducts } from '../api/products';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form, setForm] = useState({ customer_id: '', items: [{ product_id: '', quantity: '' }] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadOrders();
    getCustomers().then((r) => setCustomers(r.data)).catch(() => {});
    getProducts().then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  const loadOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res.data);
    } catch { setError('Failed to load orders'); }
  };

  const handleItemChange = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity: '' }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        customer_id: parseInt(form.customer_id),
        items: form.items.map((i) => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) })),
      };
      await createOrder(payload);
      setSuccess('Order created');
      setForm({ customer_id: '', items: [{ product_id: '', quantity: '' }] });
      loadOrders();
    } catch (err) {
      setError(err.response?.data?.detail || 'Order creation failed');
    }
  };

  const handleView = async (id) => {
    try {
      const res = await getOrder(id);
      setSelectedOrder(res.data);
    } catch { setError('Failed to load order details'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await deleteOrder(id);
      setSuccess('Order cancelled');
      loadOrders();
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed');
    }
  };

  return (
    <div>
      <h1>Orders</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h2>Create Order</h2>
        <form onSubmit={handleCreate} className="form">
          <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required>
            <option value="">Select Customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>

          <h3>Items</h3>
          {form.items.map((item, idx) => (
            <div key={idx} className="form-row">
              <select value={item.product_id} onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)} required>
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (${parseFloat(p.price).toFixed(2)} / stock: {p.quantity_in_stock})</option>
                ))}
              </select>
              <input
                type="number" min="1" placeholder="Qty"
                value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} required
              />
              {form.items.length > 1 && (
                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(idx)}>X</button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addItem}>+ Add Item</button>
          <button type="submit" className="btn btn-primary">Create Order</button>
        </form>
      </div>

      <div className="card">
        <h2>Order List</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.items?.length || 0}</td>
                  <td>${parseFloat(o.total_amount).toFixed(2)}</td>
                  <td><span className="status-badge">{o.status}</span></td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => handleView(o.id)}>View</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o.id)}>Cancel</button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="6" className="empty">No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Order Details</h2>
            <p><strong>Order ID:</strong> {selectedOrder.id}</p>
            <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
            <p><strong>Total:</strong> ${parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>
            <h3>Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td>${(item.quantity * parseFloat(item.unit_price)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn-primary" onClick={() => setSelectedOrder(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
