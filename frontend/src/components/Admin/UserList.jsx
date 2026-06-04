import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, Table, Button, Modal, Form, Alert, Spinner, Badge, InputGroup, Row, Col } from 'react-bootstrap';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', mobile_no: '', code: '', password: '', role: 'user', status: true });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // View Details modal state
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Custom Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Password visibility toggle
    const [showPassword, setShowPassword] = useState(false);

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
        setFormData({ name: '', email: '', mobile_no: '', code: '', password: '', role: 'user', status: true });
        setShowPassword(false);
        setError('');
        setShowModal(true);
    };

    const openEdit = (user) => {
        setEditUser(user);
        // Normalize status to boolean
        const initialStatus = user.status === true || user.status === 1 || user.status === '1';
        setFormData({ name: user.name, email: user.email || '', mobile_no: user.mobile_no || '', code: user.code || '', password: '', role: user.role, status: initialStatus });
        setShowPassword(false);
        setError('');
        setShowModal(true);
    };

    const openView = (user) => {
        setSelectedUser(user);
        setShowViewModal(true);
    };

    const openDelete = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editUser && !payload.password) {
                delete payload.password;
            }
            if (editUser) {
                await api.put(`/users/${editUser.id}`, payload);
                setSuccess('User updated successfully');
            } else {
                await api.post('/users', payload);
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

    const confirmDelete = async () => {
        if (!userToDelete) return;
        setError('');
        setDeleting(true);
        try {
            await api.delete(`/users/${userToDelete.id}`);
            setSuccess('User deleted successfully');
            setShowDeleteModal(false);
            setUserToDelete(null);
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
            setShowDeleteModal(false);
        } finally {
            setDeleting(false);
        }
    };

    // Filtered users calculation
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (u.mobile_no && u.mobile_no.includes(searchTerm));
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        
        const isUserActive = u.status === true || u.status === 1 || u.status === '1';
        const matchesStatus = statusFilter === 'all' || 
                              (statusFilter === 'active' ? isUserActive : !isUserActive);
        
        return matchesSearch && matchesRole && matchesStatus;
    });

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
        } catch (e) {
            return dateStr;
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

            {success && <Alert variant="success" className="py-2 border-0 bg-success bg-opacity-25 text-success">{success}</Alert>}
            {error && !showModal && <Alert variant="danger" className="py-2 border-0 bg-danger bg-opacity-25 text-danger">{error}</Alert>}

            {/* Search and Filters */}
            <Card className="glass-card border-0 mb-4 p-3">
                <Row className="g-3">
                    <Col xs={12} md={6}>
                        <InputGroup className="input-group-dark">
                            <InputGroup.Text className="bg-transparent border-secondary border-opacity-25 text-secondary">
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search by name or email..."
                                className="form-control-dark border-start-0"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                    <Col xs={6} md={3}>
                        <Form.Select 
                            className="form-select-dark border-secondary border-opacity-25"
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </Form.Select>
                    </Col>
                    <Col xs={6} md={3}>
                        <Form.Select 
                            className="form-select-dark border-secondary border-opacity-25"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </Form.Select>
                    </Col>
                </Row>
            </Card>

            <Card className="glass-card border-0">
                <Card.Body className="p-0">
                    <Table responsive borderless hover className="mb-0 text-secondary">
                        <thead>
                            <tr className="text-white border-bottom border-secondary border-opacity-25">
                                <th className="py-3 px-4" style={{ width: '60px' }}>#</th>
                                <th className="py-3">Name</th>
                                <th className="py-3">Mobile No</th>
                                <th className="py-3">RTO Code</th>
                                <th className="py-3">Role</th>
                                <th className="py-3">Status</th>
                                <th className="py-3">Created By</th>
                                <th className="py-3 text-end px-4" style={{ width: '180px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-5 text-secondary">
                                        <i className="bi bi-people fs-2 d-block mb-2 opacity-50"></i>
                                        No users found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u, idx) => {
                                    const isActive = u.status === true || u.status === 1 || u.status === '1';
                                    return (
                                        <tr key={u.id} className="border-bottom border-secondary border-opacity-10 align-middle">
                                            <td className="py-3 px-4">{idx + 1}</td>
                                            <td className="py-3 text-white fw-medium">{u.name}</td>
                                            <td className="py-3 font-monospace">{u.mobile_no}</td>
                                            <td className="py-3"><Badge bg="dark" className="border border-secondary border-opacity-25">{u.code}</Badge></td>
                                            <td className="py-3">
                                                <Badge bg={u.role === 'admin' ? 'danger' : 'primary'} className="text-capitalize px-2 py-1">{u.role}</Badge>
                                            </td>
                                            <td className="py-3">
                                                <Badge bg={isActive ? 'success' : 'secondary'} className="px-2 py-1">{isActive ? 'Active' : 'Inactive'}</Badge>
                                            </td>
                                            <td className="py-3">
                                                {u.creator ? (
                                                    <span className="text-secondary">{u.creator.name}</span>
                                                ) : (
                                                    <span className="text-muted italic">System</span>
                                                )}
                                            </td>
                                            <td className="py-3 text-end px-4">
                                                <Button variant="outline-success" size="sm" className="me-2 rounded-2" onClick={() => openView(u)} title="View Details">
                                                    <i className="bi bi-eye"></i>
                                                </Button>
                                                <Button variant="outline-info" size="sm" className="me-2 rounded-2" onClick={() => openEdit(u)} title="Edit User">
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="rounded-2" onClick={() => openDelete(u)} title="Delete User">
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
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
                        {error && <Alert variant="danger" className="py-2 border-0 bg-danger bg-opacity-25 text-danger">{error}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary fw-medium">Name</Form.Label>
                            <Form.Control 
                                className="form-control-dark" 
                                value={formData.name} 
                                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                required 
                                placeholder="Enter full name"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary fw-medium">Mobile Number (Login ID)</Form.Label>
                            <Form.Control 
                                type="text" 
                                className="form-control-dark font-monospace" 
                                value={formData.mobile_no} 
                                onChange={e => setFormData({ ...formData, mobile_no: e.target.value })} 
                                required 
                                pattern="[0-9]{10}"
                                title="10-digit mobile number"
                                placeholder="Enter mobile number"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary fw-medium">RTO Code</Form.Label>
                            <Form.Control 
                                type="text" 
                                className="form-control-dark" 
                                value={formData.code} 
                                onChange={e => setFormData({ ...formData, code: e.target.value })} 
                                required 
                                placeholder="e.g. CG05"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary fw-medium">Email (Optional)</Form.Label>
                            <Form.Control 
                                type="email" 
                                className="form-control-dark" 
                                value={formData.email} 
                                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                                placeholder="Enter email address"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary fw-medium">Password {editUser && '(leave blank to keep current)'}</Form.Label>
                            <InputGroup className="input-group-dark">
                                <Form.Control 
                                    type={showPassword ? "text" : "password"} 
                                    className="form-control-dark border-end-0" 
                                    value={formData.password} 
                                    onChange={e => setFormData({ ...formData, password: e.target.value })} 
                                    required={!editUser} 
                                    placeholder={editUser ? "••••••••" : "Enter password"}
                                    minLength={6}
                                />
                                <Button 
                                    variant="outline-secondary" 
                                    className="border-secondary border-opacity-25 border-start-0 text-white" 
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`bi bi-eye${showPassword ? '-slash' : ''} text-white`}></i>
                                </Button>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary fw-medium">Role</Form.Label>
                            <Form.Select className="form-select-dark" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="user">User (Standard Access)</option>
                                <option value="admin">Admin (Full Access)</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check 
                                type="switch" 
                                id="statusSwitch" 
                                label={formData.status ? 'Account Status: Active' : 'Account Status: Inactive'} 
                                checked={formData.status} 
                                onChange={e => setFormData({ ...formData, status: e.target.checked })} 
                                className="text-secondary fw-medium" 
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-secondary border-opacity-25">
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="btn-primary-gradient" disabled={saving}>
                            {saving ? <Spinner size="sm" className="me-2" /> : null}
                            {editUser ? 'Save Changes' : 'Create User'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* View Details Modal */}
            <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered contentClassName="glass-card border-0" style={{ color: '#f3f4f6' }}>
                <Modal.Header closeButton className="border-secondary border-opacity-25" closeVariant="white">
                    <Modal.Title className="text-white fw-semibold">User Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    {selectedUser && (
                        <div className="d-flex flex-column gap-3">
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <div className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                                    <i className="bi bi-person-fill text-info fs-1"></i>
                                </div>
                                <div>
                                    <h4 className="text-white mb-1 fw-bold">{selectedUser.name}</h4>
                                    <span className="text-secondary font-monospace">{selectedUser.mobile_no}</span>
                                    {selectedUser.email && <div className="text-muted small">{selectedUser.email}</div>}
                                </div>
                            </div>
                            
                            <hr className="border-secondary border-opacity-25 my-2" />

                            <Row className="g-3">
                                <Col xs={4}>
                                    <div className="small text-secondary">Role</div>
                                    <div className="mt-1">
                                        <Badge bg={selectedUser.role === 'admin' ? 'danger' : 'primary'} className="text-capitalize px-2 py-1.5 fs-7">{selectedUser.role}</Badge>
                                    </div>
                                </Col>
                                <Col xs={4}>
                                    <div className="small text-secondary">Status</div>
                                    <div className="mt-1">
                                        <Badge bg={selectedUser.status ? 'success' : 'secondary'} className="px-2 py-1.5 fs-7">{selectedUser.status ? 'Active' : 'Inactive'}</Badge>
                                    </div>
                                </Col>
                                <Col xs={4}>
                                    <div className="small text-secondary">RTO Code</div>
                                    <div className="mt-1">
                                        <Badge bg="dark" className="border border-secondary border-opacity-25 px-2 py-1.5 fs-7 text-info">{selectedUser.code}</Badge>
                                    </div>
                                </Col>
                                <Col xs={12}>
                                    <div className="small text-secondary">Created By</div>
                                    <div className="text-white fw-medium mt-1">
                                        {selectedUser.creator ? (
                                            <div>
                                                <i className="bi bi-person-check me-2 text-info"></i>
                                                {selectedUser.creator.name} <span className="text-secondary font-monospace">({selectedUser.creator.email})</span>
                                            </div>
                                        ) : (
                                            <span>System / Default Seed</span>
                                        )}
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="small text-secondary">Created At</div>
                                    <div className="text-white fw-medium mt-1">
                                        <i className="bi bi-calendar-event me-2 text-info"></i>
                                        {formatDateTime(selectedUser.created_at)}
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="small text-secondary">Last Updated At</div>
                                    <div className="text-white fw-medium mt-1">
                                        <i className="bi bi-calendar-check me-2 text-info"></i>
                                        {formatDateTime(selectedUser.updated_at)}
                                    </div>
                                </Col>
                            </Row>

                            {/* Code Change logs */}
                            <div className="mt-3">
                                <h6 className="text-white fw-bold mb-2"><i className="bi bi-clock-history text-info me-2"></i>RTO Code Audit Log</h6>
                                <div className="table-responsive rounded border border-secondary border-opacity-10">
                                    <Table size="sm" borderless hover className="mb-0 text-secondary" style={{ fontSize: '12px' }}>
                                        <thead>
                                            <tr className="text-white bg-dark bg-opacity-20 border-bottom border-secondary border-opacity-10">
                                                <th className="py-2 px-2">From</th>
                                                <th className="py-2 px-2">To</th>
                                                <th className="py-2 px-2">Active Duration</th>
                                                <th className="py-2 px-2">Changed By</th>
                                                <th className="py-2 px-2">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {!selectedUser.code_logs || selectedUser.code_logs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-3 text-muted">No history found.</td>
                                                </tr>
                                            ) : (
                                                selectedUser.code_logs.map(log => (
                                                    <tr key={log.id} className="border-bottom border-secondary border-opacity-5 align-middle">
                                                        <td className="py-2 px-2 font-monospace">{log.old_code || '-'}</td>
                                                        <td className="py-2 px-2 font-monospace text-info">{log.new_code}</td>
                                                        <td className="py-2 px-2">{log.active_duration}</td>
                                                        <td className="py-2 px-2">{log.admin ? log.admin.name : (log.changed_by ? `User ID ${log.changed_by}` : 'User (Signup)')}</td>
                                                        <td className="py-2 px-2 text-nowrap">{formatDateTime(log.created_at)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-secondary border-opacity-25">
                    <Button variant="outline-light" onClick={() => setShowViewModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Custom Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered contentClassName="glass-card border-0" style={{ color: '#f3f4f6' }}>
                <Modal.Header closeButton className="border-secondary border-opacity-25" closeVariant="white">
                    <Modal.Title className="text-white fw-semibold">Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    {userToDelete && (
                        <div className="text-center">
                            <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3 d-block"></i>
                            <h5 className="text-white mb-2">Are you sure you want to delete this user?</h5>
                            <p className="text-secondary mb-0">
                                This action will delete <strong>{userToDelete.name}</strong> ({userToDelete.mobile_no}) permanently.
                            </p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-secondary border-opacity-25">
                    <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
                        {deleting ? <Spinner size="sm" className="me-2" /> : null}
                        Delete User
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UserList;
