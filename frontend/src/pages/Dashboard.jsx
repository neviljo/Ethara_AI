import { useState, useEffect } from 'react';
import { getProducts } from '../api/products';
import { getCustomers } from '../api/customers';
import { getOrders } from '../api/orders';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, customers: 0, orders: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getCustomers(), getOrders()])
      .then(([prodRes, custRes, ordRes]) => {
        const products = prodRes.data;
        setStats({
          products: products.length,
          customers: custRes.data.length,
          orders: ordRes.data.length,
          lowStock: products.filter((p) => p.quantity_in_stock < 10).length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const cards = [
    { label: 'Total Products', value: stats.products, color: '#4f46e5' },
    { label: 'Total Customers', value: stats.customers, color: '#0891b2' },
    { label: 'Total Orders', value: stats.orders, color: '#059669' },
    { label: 'Low Stock Items', value: stats.lowStock, color: '#dc2626' },
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card" style={{ borderTopColor: c.color }}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
