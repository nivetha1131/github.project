'use client';

import { useMemo, useState } from 'react';

const stats = [
  { label: 'Gross sales', value: '₹18.4L', trend: '+12.4%' },
  { label: 'Open orders', value: '184', trend: '+8 new' },
  { label: 'Approved dealers', value: '36', trend: '+5 today' },
  { label: 'Pending service', value: '22', trend: '4 urgent' },
];

const initialOrderRows = [
  { id: 'ORD-1802', customer: 'Riya Sharma', value: '₹8,299', status: 'Paid', channel: 'App' },
  { id: 'ORD-1810', customer: 'Anil Nair', value: '₹5,699', status: 'Packed', channel: 'Dealer' },
  { id: 'ORD-1816', customer: 'Meera Joshi', value: '₹1,599', status: 'Shipped', channel: 'App' },
  { id: 'ORD-1821', customer: 'Dealer Team', value: '₹24,300', status: 'Wholesale', channel: 'Dealer' },
];

const initialDealerApprovals = [
  { name: 'Aqua Line Traders', city: 'Hyderabad', status: 'Pending' },
  { name: 'Blue Drop Supply', city: 'Bengaluru', status: 'Verified' },
  { name: 'Riverfresh Retail', city: 'Pune', status: 'Pending' },
];

const initialServiceDesk = [
  { ticket: 'SR-401', issue: 'RO membrane replacement', owner: 'Kiran', priority: 'High' },
  { ticket: 'SR-408', issue: 'Filter replacement request', owner: 'Asha', priority: 'Medium' },
  { ticket: 'SR-412', issue: 'Water taste complaint', owner: 'Sandeep', priority: 'Low' },
];

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'dealers', label: 'Dealers' },
  { id: 'support', label: 'Support' },
] as const;

export default function Home() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('overview');
  const [orders, setOrders] = useState(initialOrderRows);
  const [dealers, setDealers] = useState(initialDealerApprovals);
  const [serviceDesk, setServiceDesk] = useState(initialServiceDesk);
  const [automationStatus, setAutomationStatus] = useState('Ready for Cron / Vercel scheduled job');

  const displayedOrders = useMemo(() => {
    if (activeTab === 'dealers') {
      return orders.filter((order) => order.channel === 'Dealer');
    }
    return orders;
  }, [activeTab, orders]);

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      orders,
      dealers,
      serviceDesk,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pureflow-admin-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateBulkOrder = () => {
    const newOrder = {
      id: `ORD-${Math.floor(10000 + Math.random() * 9000)}`,
      customer: 'Bulk Retail Hub',
      value: '₹42,500',
      status: 'Queued',
      channel: 'Dealer',
    };

    setOrders((current) => [newOrder, ...current]);
    setActiveTab('overview');
  };

  const handleApproveDealer = (dealerName: string) => {
    setDealers((current) =>
      current.map((dealer) =>
        dealer.name === dealerName ? { ...dealer, status: 'Verified' } : dealer
      )
    );
  };

  const handleResolveTicket = (ticket: string) => {
    setServiceDesk((current) => current.filter((item) => item.ticket !== ticket));
  };

  const handleSchedule = () => {
    setAutomationStatus('Queued for next scheduled post');
  };

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">PureFlow Admin</p>
          <h1>Operations dashboard</h1>
        </div>
        <div className="top-actions">
          <button type="button" className="ghost-button" onClick={handleExport}>Export</button>
          <button type="button" className="primary-button" onClick={handleCreateBulkOrder}>Create bulk order</button>
        </div>
      </header>

      <div className="tab-bar" aria-label="Admin dashboard tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === activeTab ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <p>{stat.label}</p>
            <h2>{stat.value}</h2>
            <span>{stat.trend}</span>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-header">
            <h3>Recent orders</h3>
            <button type="button" className="link-button" onClick={() => setActiveTab('overview')}>View all</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Value</th>
                <th>Status</th>
                <th>Channel</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.slice(0, 4).map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.customer}</td>
                  <td>{row.value}</td>
                  <td><span className="status-pill">{row.status}</span></td>
                  <td>{row.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Dealer approvals</h3>
            <button type="button" className="link-button" onClick={() => setActiveTab('dealers')}>Manage</button>
          </div>
          <div className="stack-list">
            {dealers.map((dealer) => (
              <div key={dealer.name} className="list-row">
                <div>
                  <strong>{dealer.name}</strong>
                  <p>{dealer.city}</p>
                </div>
                <button
                  type="button"
                  className={dealer.status === 'Verified' ? 'success-pill' : 'warning-pill'}
                  onClick={() => handleApproveDealer(dealer.name)}
                >
                  {dealer.status}
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid lower-grid">
        <article className="panel">
          <div className="panel-header">
            <h3>Service desk</h3>
            <button type="button" className="link-button" onClick={() => setActiveTab('support')}>Open queue</button>
          </div>
          <div className="stack-list">
            {serviceDesk.map((item) => (
              <div key={item.ticket} className="service-item">
                <div>
                  <strong>{item.ticket}</strong>
                  <p>{item.issue}</p>
                </div>
                <div className="mini-meta">
                  <span>{item.owner}</span>
                  <span className="priority-tag">{item.priority}</span>
                  <button type="button" className="link-button" onClick={() => handleResolveTicket(item.ticket)}>
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>AI social automation</h3>
            <button type="button" className="link-button" onClick={handleSchedule}>Schedule</button>
          </div>
          <div className="automation-box">
            <p><strong>Daily product:</strong> AquaPure 12 RO+UV</p>
            <p><strong>Caption:</strong> “Fresh water, smarter living...”</p>
            <p><strong>Channel:</strong> Instagram + WhatsApp Status</p>
            <p><strong>Status:</strong> {automationStatus}</p>
          </div>
        </article>
      </section>
    </main>
  );
}
