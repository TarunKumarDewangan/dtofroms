import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, Table, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user', status: true });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditUser(null);
        setFormData({ name: '', email: '', password: '', role: 'user', status: true });
        setError('');
        setShowModal(true);
    };

    const openEdit = (user) => {
        setEditUser(user);
        setFormData({ name: user.name, email: user.email, password: '', role: user.role, status: user.status });
        setError('');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            if (editUser) {
                await api.put(`/users/${editUser.id}`, formData);
                setSuccess('User updated successfully');
            } else {
                await api.post('/users', formData);
                setSuccess('User created successfully');
            }
            setShowModal(false);
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            if (err.response?.data?.errors) {
                const msgs = Object.values(err.response.data.errors).flat();
                setError(msgs.join(', '));
            } else {
                setError(err.response?.data?.message || 'Save failed');
            }
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/users/${id}`);
            setSuccess('User deleted successfully');
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    if (loading) {
        return <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="info" /></div>;
    }

    return (
        <div className="animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-white fw-bold mb-0"><i className="bi bi-people me-2 text-info"></i>Manage Users</h3>
                <Button className="btn-primary-gradient rounded-3" onClick={openCreate}>
                    <i className="bi bi-person-plus me-2"></i>Add User
                </Button>
            </div>

            {success && <Alert variant="success" className="py-2">{success}</Alert>}
            {error && !showModal && <Alert variant="danger" className="py-2">{error}</Alert>}

            <Card className="glass-card border-0">
                <Card.Body className="p-0">
                    <Table responsive borderless hover className="mb-0 text-secondary">
                        <thead>
                            <tr className="text-white border-bottom border-secondary border-opacity-25">
                                <th className="py-3 px-4">#</th>
                                <th className="py-3">Name</th>
                                <th className="py-3">Email</th>
                                <th className="py-3">Role</th>
                                <th className="py-3">Status</th>
                                <th className="py-3 text-end px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, idx) => (
                                <tr key={u.id} className="border-bottom border-secondary border-opacity-10">
                                    <td className="py-3 px-4">{idx + 1}</td>
                                    <td className="py-3 text-white fw-medium">{u.name}</td>
                                    <td className="py-3">{u.email}</td>
                                    <td className="py-3">
                                        <Badge bg={u.role === 'admin' ? 'danger' : 'primary'} className="text-capitalize">{u.role}</Badge>
                                    </td>
                                    <td className="py-3">
                                        <Badge bg={u.status ? 'success' : 'secondary'}>{u.status ? 'Active' : 'Inactive'}</Badge>
                                    </td>
                                    <td className="py-3 text-end px-4">
                                        <Button variant="outline-info" size="sm" className="me-2 rounded-2" onClick={() => openEdit(u)}>
                                            <i className="bi bi-pencil"></i>
                                        </Button>
                                        <Button variant="outline-danger" size="sm" className="rounded-2" onClick={() => handleDelete(u.id)}>
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="glass-card border-0" style={{ color: '#f3f4f6' }}>
                <Modal.Header closeButton className="border-secondary border-opacity-25" closeVariant="white">
                    <Modal.Title className="text-white fw-semibold">{editUser ? 'Edit User' : 'Create New User'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        {error && <Alert variant="danger" className="py-2">{error}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary">Name</Form.Label>
                            <Form.Control className="form-control-dark" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary">Email</Form.Label>
                            <Form.Control type="email" className="form-control-dark" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary">Password {editUser && '(leave blank to keep current)'}</Form.Label>
                            <Form.Control type="password" className="form-control-dark" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editUser} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary">Role</Form.Label>
                            <Form.Select className="form-select-dark" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check type="switch" id="statusSwitch" label={formData.status ? 'Active' : 'Inactive'} checked={formData.status} onChange={e => setFormData({ ...formData, status: e.target.checked })} className="text-secondary" />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-secondary border-opacity-25">
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="btn-primary-gradient" disabled={saving}>
                            {saving ? <Spinner size="sm" className="me-2" /> : null}
                            {editUser ? 'Update' : 'Create'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default UserList;
