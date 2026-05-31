import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Card, Table, Badge, Spinner, Button, Modal, Alert, InputGroup, Form, Row, Col } from 'react-bootstrap';
import NotesheetPreview from './NotesheetPreview';

const NotesheetList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notesheets, setNotesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewNotesheet, setViewNotesheet] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [printNotesheet, setPrintNotesheet] = useState(null);

    // Search & Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [workFilter, setWorkFilter] = useState('all');

    const handleEdit = (id) => {
        navigate(`/build?edit=${id}`);
    };

    const handleDelete = async (id) => {
        if (!confirm('क्या आप इस नोटशीट ड्राफ्ट को हटाना चाहते हैं? (Are you sure you want to delete this notesheet?)')) return;
        try {
            await api.delete(`/notesheets/${id}`);
            setSuccess('नोटशीट सफलतापूर्वक हटा दी गई।');
            fetchNotesheets();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete notesheet');
            setTimeout(() => setError(''), 3000);
        }
    };

    useEffect(() => { fetchNotesheets(); }, []);

    useEffect(() => {
        if (printNotesheet) {
            const timer = setTimeout(() => {
                window.print();
            }, 300);
            
            const handleAfterPrint = () => {
                setPrintNotesheet(null);
            };
            window.addEventListener('afterprint', handleAfterPrint);
            
            return () => {
                clearTimeout(timer);
                window.removeEventListener('afterprint', handleAfterPrint);
            };
        }
    }, [printNotesheet]);

    const fetchNotesheets = async () => {
        try {
            const res = await api.get('/notesheets');
            setNotesheets(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openView = async (id) => {
        try {
            const res = await api.get(`/notesheets/${id}`);
            setViewNotesheet(res.data);
            setShowModal(true);
        } catch (err) { console.error(err); }
    };

    const handlePrintDirect = async (id) => {
        try {
            const res = await api.get(`/notesheets/${id}`);
            setPrintNotesheet(res.data);
        } catch (err) {
            console.error('Fetch print error:', err);
        }
    };

    const handleApprove = async (id) => {
        setActionLoading(true);
        try {
            await api.post(`/notesheets/${id}/approve`);
            setSuccess('Notesheet approved!');
            setShowModal(false);
            fetchNotesheets();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Approval failed');
        } finally { setActionLoading(false); }
    };

    const handleReject = async (id) => {
        if (!confirm('Are you sure you want to reject this notesheet?')) return;
        setActionLoading(true);
        try {
            await api.post(`/notesheets/${id}/reject`);
            setSuccess('Notesheet rejected.');
            setShowModal(false);
            fetchNotesheets();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Rejection failed');
        } finally { setActionLoading(false); }
    };

    const statusBadge = (status) => {
        const map = {
            draft: { bg: 'warning', text: 'dark', label: 'Draft' },
            submitted: { bg: 'primary', label: 'Submitted' },
            approved: { bg: 'success', label: 'Approved' },
            rejected: { bg: 'danger', label: 'Rejected' },
        };
        const s = map[status] || { bg: 'secondary', label: status };
        return <Badge bg={s.bg} text={s.text}>{s.label}</Badge>;
    };

    // Extract unique work codes dynamically for the dropdown filter
    const uniqueWorks = Array.from(
        new Set(
            notesheets.flatMap(ns => (ns.combined_works || []).map(w => w.work_code))
        )
    ).filter(Boolean);

    // Apply filters
    const filteredNotesheets = notesheets.filter(ns => {
        const regNo = ns.vehicle?.registration_number || '';
        const nsNum = ns.notesheet_number || '';
        const creatorName = ns.creator?.name || '';
        
        const matchesSearch = regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              nsNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              creatorName.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || ns.status === statusFilter;
        
        const matchesWork = workFilter === 'all' || 
                            (ns.combined_works || []).some(w => w.work_code === workFilter);
        
        return matchesSearch && matchesStatus && matchesWork;
    });

    if (loading) return <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="info" /></div>;

    return (
        <>
            <div className={`animate-fade-in ${printNotesheet ? 'no-print' : ''}`}>
                <h3 className="text-white fw-bold mb-4">
                    <i className="bi bi-clock-history text-info me-2"></i>
                    {user?.role === 'admin' ? 'All Notesheets' : 'My Notesheets'}
                </h3>

                {success && <Alert variant="success" className="py-2 border-0 bg-success bg-opacity-25 text-success">{success}</Alert>}
                {error && <Alert variant="danger" className="py-2 border-0 bg-danger bg-opacity-25 text-danger">{error}</Alert>}

                {/* Search & Filter Controls */}
                {notesheets.length > 0 && (
                    <Card className="glass-card border-0 mb-4 p-3">
                        <Row className="g-3">
                            <Col xs={12} md={6}>
                                <InputGroup className="input-group-dark">
                                    <InputGroup.Text className="bg-transparent border-secondary border-opacity-25 text-secondary">
                                        <i className="bi bi-search"></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search by NS Number, Vehicle Reg, or Creator..."
                                        className="form-control-dark border-start-0"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </Col>
                            <Col xs={6} md={3}>
                                <Form.Select 
                                    className="form-select-dark border-secondary border-opacity-25 text-secondary text-capitalize"
                                    value={workFilter}
                                    onChange={e => setWorkFilter(e.target.value)}
                                >
                                    <option value="all">All Work Types</option>
                                    {uniqueWorks.map(w => (
                                        <option key={w} value={w}>
                                            {w.replace('_', ' ').toLowerCase()}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col xs={6} md={3}>
                                <Form.Select 
                                    className="form-select-dark border-secondary border-opacity-25 text-secondary"
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </Form.Select>
                            </Col>
                        </Row>
                    </Card>
                )}

                <Card className="glass-card border-0">
                    <Card.Body className="p-0">
                        {notesheets.length === 0 ? (
                            <div className="text-center py-5 text-secondary">
                                <i className="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                                No notesheets found. Create one using the <strong>Build Notesheet</strong> page.
                            </div>
                        ) : filteredNotesheets.length === 0 ? (
                            <div className="text-center py-5 text-secondary">
                                <i className="bi bi-funnel fs-2 d-block mb-2 opacity-50"></i>
                                No notesheets found matching your search filters.
                            </div>
                        ) : (
                            <Table responsive borderless hover className="mb-0 text-secondary align-middle">
                                <thead>
                                    <tr className="text-white border-bottom border-secondary border-opacity-25">
                                        <th className="py-3 px-4">NS Number</th>
                                        <th className="py-3">Vehicle</th>
                                        <th className="py-3">Works</th>
                                        <th className="py-3">Status</th>
                                        <th className="py-3">Created</th>
                                        {user?.role === 'admin' && <th className="py-3">Created By</th>}
                                        <th className="py-3 text-end px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredNotesheets.map(ns => (
                                        <tr key={ns.id} className="border-bottom border-secondary border-opacity-10">
                                            <td className="py-3 px-4">
                                                <a 
                                                    href="#" 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        navigate(`/build?edit=${ns.id}&step=4`);
                                                    }}
                                                    className="text-info hover-underline fw-bold"
                                                    style={{ cursor: 'pointer', textDecoration: 'none' }}
                                                >
                                                    <code>{ns.notesheet_number}</code>
                                                </a>
                                            </td>
                                            <td className="py-3 text-white fw-medium">{ns.vehicle?.registration_number || 'N/A'}</td>
                                            <td className="py-3">
                                                {(ns.combined_works || []).map((w, i) => (
                                                    <Badge key={i} bg="secondary" className="me-1 mb-1 text-capitalize" style={{ fontSize: '10px' }}>
                                                        {w.work_code?.replace('_', ' ').toLowerCase()}
                                                    </Badge>
                                                ))}
                                            </td>
                                            <td className="py-3">{statusBadge(ns.status)}</td>
                                            <td className="py-3">{new Date(ns.created_at).toLocaleDateString('en-IN')}</td>
                                            {user?.role === 'admin' && <td className="py-3">{ns.creator?.name || 'N/A'}</td>}
                                            <td className="py-3 text-end px-4">
                                                {ns.status === 'draft' && (
                                                    <>
                                                        <Button variant="outline-warning" size="sm" className="rounded-2 me-2" onClick={() => handleEdit(ns.id)}>
                                                            <i className="bi bi-pencil me-1"></i> Edit
                                                        </Button>
                                                        <Button variant="outline-danger" size="sm" className="rounded-2 me-2" onClick={() => handleDelete(ns.id)}>
                                                            <i className="bi bi-trash me-1"></i> Delete
                                                        </Button>
                                                    </>
                                                )}
                                                <Button variant="outline-success" size="sm" className="rounded-2 me-2" onClick={() => handlePrintDirect(ns.id)}>
                                                    <i className="bi bi-printer me-1"></i> Print
                                                </Button>
                                                <Button variant="outline-info" size="sm" className="rounded-2" onClick={() => navigate(`/build?edit=${ns.id}&step=4`)}>
                                                    <i className="bi bi-eye me-1"></i> View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>

                {/* View Modal */}
                <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered contentClassName="glass-card border-0" style={{ color: '#f3f4f6' }}>
                    <Modal.Header closeButton className="border-secondary border-opacity-25" closeVariant="white">
                        <Modal.Title className="text-white fw-semibold">
                            Notesheet: {viewNotesheet?.notesheet_number}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {viewNotesheet && (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="text-secondary">
                                        Vehicle: <strong className="text-white">{viewNotesheet.vehicle?.registration_number}</strong>
                                    </span>
                                    {statusBadge(viewNotesheet.status)}
                                </div>
                                <div className="notesheet-text-area" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '50vh', overflowY: 'auto' }}>
                                    {viewNotesheet.final_text || 'Notesheet not yet generated.'}
                                </div>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-secondary border-opacity-25">
                        {user?.role === 'admin' && viewNotesheet?.status === 'submitted' && (
                            <>
                                <Button className="btn-success-gradient rounded-3" onClick={() => handleApprove(viewNotesheet.id)} disabled={actionLoading}>
                                    <i className="bi bi-check-circle me-2"></i>Approve
                                </Button>
                                <Button variant="outline-danger" className="rounded-3" onClick={() => handleReject(viewNotesheet.id)} disabled={actionLoading}>
                                    <i className="bi bi-x-circle me-2"></i>Reject
                                </Button>
                            </>
                        )}
                        <Button variant="outline-info" className="rounded-3" onClick={() => {
                            setShowModal(false);
                            handlePrintDirect(viewNotesheet.id);
                        }}>
                            <i className="bi bi-printer me-2"></i>Print
                        </Button>
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </div>
            {printNotesheet && (
                <div className="print-only">
                    <NotesheetPreview notesheet={printNotesheet} />
                </div>
            )}
        </>
    );
};

export default NotesheetList;
