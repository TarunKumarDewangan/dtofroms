import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Row, Col, Card, Badge, Spinner } from 'react-bootstrap';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ total: 0, draft: 0, submitted: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/notesheets');
            const data = res.data;
            setStats({
                total: data.length,
                draft: data.filter(n => n.status === 'draft').length,
                submitted: data.filter(n => n.status === 'submitted').length,
                approved: data.filter(n => n.status === 'approved').length,
                rejected: data.filter(n => n.status === 'rejected').length,
            });
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Notesheets', value: stats.total, icon: 'bi-file-earmark-text', color: '#6366f1' },
        { label: 'Drafts', value: stats.draft, icon: 'bi-pencil-square', color: '#f59e0b' },
        { label: 'Submitted', value: stats.submitted, icon: 'bi-send-check', color: '#3b82f6' },
        { label: 'Approved', value: stats.approved, icon: 'bi-check-circle', color: '#10b981' },
        { label: 'Rejected', value: stats.rejected, icon: 'bi-x-circle', color: '#ef4444' },
    ];

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="info" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="text-white fw-bold mb-1">
                        Welcome, {user?.name} 👋
                    </h3>
                    <p className="text-secondary mb-0">
                        {user?.role === 'admin' ? 'Administrator Dashboard' : 'Your Notesheet Dashboard'}
                    </p>
                </div>
                <Link to="/build" className="btn btn-primary-gradient px-4 py-2 rounded-3">
                    <i className="bi bi-plus-lg me-2"></i> New Notesheet
                </Link>
            </div>

            <Row className="g-4 mb-4">
                {statCards.map((stat, idx) => (
                    <Col key={idx} xs={12} sm={6} lg>
                        <Card className="glass-card border-0 h-100">
                            <Card.Body className="p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="text-secondary mb-1 fs-14">{stat.label}</p>
                                        <h2 className="text-white fw-bold mb-0">{stat.value}</h2>
                                    </div>
                                    <div className="rounded-circle d-flex align-items-center justify-content-center"
                                        style={{
                                            width: 50, height: 50,
                                            background: `${stat.color}22`,
                                            border: `1px solid ${stat.color}55`,
                                        }}>
                                        <i className={`bi ${stat.icon} fs-4`} style={{ color: stat.color }}></i>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-4">
                <Col md={6}>
                    <Card className="glass-card border-0 h-100">
                        <Card.Body className="p-4">
                            <h5 className="text-white fw-semibold mb-3">
                                <i className="bi bi-lightning-charge text-warning me-2"></i>Quick Actions
                            </h5>
                            <div className="d-grid gap-2">
                                <Link to="/build" className="btn btn-outline-info text-start rounded-3 py-3 px-4">
                                    <i className="bi bi-file-earmark-plus me-2"></i> Build New Notesheet
                                </Link>
                                <Link to="/history" className="btn btn-outline-light text-start rounded-3 py-3 px-4">
                                    <i className="bi bi-clock-history me-2"></i> View Notesheet History
                                </Link>
                                {user?.role === 'admin' && (
                                    <>
                                        <Link to="/admin/users" className="btn btn-outline-warning text-start rounded-3 py-3 px-4">
                                            <i className="bi bi-people me-2"></i> Manage Users
                                        </Link>
                                        <Link to="/admin/work-options" className="btn btn-outline-success text-start rounded-3 py-3 px-4">
                                            <i className="bi bi-gear me-2"></i> Manage Work Options
                                        </Link>
                                    </>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="glass-card border-0 h-100">
                        <Card.Body className="p-4">
                            <h5 className="text-white fw-semibold mb-3">
                                <i className="bi bi-info-circle text-info me-2"></i>Form Reference
                            </h5>
                            <div className="table-responsive">
                                <table className="table table-borderless text-secondary mb-0">
                                    <thead>
                                        <tr className="text-white border-bottom border-secondary border-opacity-25">
                                            <th>Form</th>
                                            <th>Work Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td><Badge bg="primary">Form 29 & 30</Badge></td><td>Ownership Transfer</td></tr>
                                        <tr><td><Badge bg="info">Form 34</Badge></td><td>HP Registration</td></tr>
                                        <tr><td><Badge bg="warning" text="dark">Form 35</Badge></td><td>HP Cancellation</td></tr>
                                        <tr><td><Badge bg="success">Form 33</Badge></td><td>Address Change</td></tr>
                                        <tr><td><Badge bg="danger">Form 26</Badge></td><td>Duplicate RC</td></tr>
                                        <tr><td><Badge bg="secondary">Form 31</Badge></td><td>Transfer after Death</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
