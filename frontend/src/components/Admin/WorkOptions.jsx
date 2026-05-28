import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, Table, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';

const WorkOptions = () => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editOption, setEditOption] = useState(null);
    const [formData, setFormData] = useState({
        work_code: '', work_name: '', form_required: '', fee_amount: '',
        requires_original_document: false, requires_physical_verification: false,
        sort_order: 0, is_active: true
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchOptions(); }, []);

    const fetchOptions = async () => {
        try {
            const res = await api.get('/work-options');
            setOptions(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditOption(null);
        setFormData({
            work_code: '', work_name: '', form_required: '', fee_amount: '',
            requires_original_document: false, requires_physical_verification: false,
            sort_order: 0, is_active: true
        });
        setError('');
        setShowModal(true);
    };

    const openEdit = (opt) => {
        setEditOption(opt);
        const forms = Array.isArray(opt.form_required) ? opt.form_required.join(', ') : opt.form_required;
        setFormData({
            work_code: opt.work_code, work_name: opt.work_name,
            form_required: forms, fee_amount: opt.fee_amount,
            requires_original_document: opt.requires_original_document,
            requires_physical_verification: opt.requires_physical_verification,
            sort_order: opt.sort_order, is_active: opt.is_active
        });
        setError('');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        const payload = {
            ...formData,
            form_required: formData.form_required.split(',').map(f => f.trim()).filter(Boolean),
            fee_amount: parseFloat(formData.fee_amount),
            sort_order: parseInt(formData.sort_order) || 0,
        };
        try {
            if (editOption) {
                await api.put(`/work-options/${editOption.id}`, payload);
                setSuccess('Work option updated');
            } else {
                await api.post('/work-options', payload);
                setSuccess('Work option created');
            }
            setShowModal(false);
            fetchOptions();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            if (err.response?.data?.errors) {
                setError(Object.values(err.response.data.errors).flat().join(', '));
            } else {
                setError(err.response?.data?.message || 'Save failed');
            }
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this work option?')) return;
        try {
            await api.delete(`/work-options/${id}`);
            setSuccess('Deleted');
            fetchOptions();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) { setError('Delete failed'); }
    };

    if (loading) return <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="info" /></div>;

    return (
        <div className="animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-white fw-bold mb-0"><i className="bi bi-gear-wide-connected me-2 text-success"></i>Work Options</h3>
                <Button className="btn-success-gradient rounded-3" onClick={openCreate}>
                    <i className="bi bi-plus-lg me-2"></i>Add Option
                </Button>
            </div>

            {success && <Alert variant="success" className="py-2">{success}</Alert>}
            {error && !showModal && <Alert variant="danger" className="py-2">{error}</Alert>}

            <Card className="glass-card border-0">
                <Card.Body className="p-0">
                    <Table responsive borderless hover className="mb-0 text-secondary">
                        <thead>
                            <tr className="text-white border-bottom border-secondary border-opacity-25">
                                <th className="py-3 px-4">Code</th>
                                <th className="py-3">Name</th>
                                <th className="py-3">Forms</th>
                                <th className="py-3">Fee (₹)</th>
                                <th className="py-3">Status</th>
                                <th className="py-3 text-end px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {options.map(opt => (
                                <tr key={opt.id} className="border-bottom border-secondary border-opacity-10">
                                    <td className="py-3 px-4"><code className="text-info">{opt.work_code}</code></td>
                                    <td className="py-3 text-white">{opt.work_name}</td>
                                    <td className="py-3">
                                        {(Array.isArray(opt.form_required) ? opt.form_required : []).map((f, i) => (
                                            <Badge bg="secondary" className="me-1" key={i}>{f}</Badge>
                                        ))}
                                    </td>
                                    <td className="py-3 text-success fw-semibold">₹{Number(opt.fee_amount).toLocaleString()}</td>
                                    <td className="py-3"><Badge bg={opt.is_active ? 'success' : 'secondary'}>{opt.is_active ? 'Active' : 'Inactive'}</Badge></td>
                                    <td className="py-3 text-end px-4">
                                        <Button variant="outline-info" size="sm" className="me-2 rounded-2" onClick={() => openEdit(opt)}><i className="bi bi-pencil"></i></Button>
                                        <Button variant="outline-danger" size="sm" className="rounded-2" onClick={() => handleDelete(opt.id)}><i className="bi bi-trash"></i></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="glass-card border-0" style={{ color: '#f3f4f6' }}>
                <Modal.Header closeButton className="border-secondary border-opacity-25" closeVariant="white">
                    <Modal.Title className="text-white fw-semibold">{editOption ? 'Edit Work Option' : 'Create Work Option'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        {error && <Alert variant="danger" className="py-2">{error}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary">Work Code</Form.Label>
                            <Form.Control className="form-control-dark" value={formData.work_code} onChange={e => setFormData({ ...formData, work_code: e.target.value })} required disabled={!!editOption} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary">Work Name (Hindi + English)</Form.Label>
                            <Form.Control className="form-control-dark" value={formData.work_name} onChange={e => setFormData({ ...formData, work_name: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary">Forms Required (comma-separated)</Form.Label>
                            <Form.Control className="form-control-dark" placeholder="Form 29, Form 30" value={formData.form_required} onChange={e => setFormData({ ...formData, form_required: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-secondary">Fee Amount (₹)</Form.Label>
                            <Form.Control type="number" step="0.01" className="form-control-dark" value={formData.fee_amount} onChange={e => setFormData({ ...formData, fee_amount: e.target.value })} required />
                        </Form.Group>
                        <Form.Check type="switch" className="text-secondary mb-2" label="Requires Original Document" checked={formData.requires_original_document} onChange={e => setFormData({ ...formData, requires_original_document: e.target.checked })} />
                        <Form.Check type="switch" className="text-secondary mb-2" label="Requires Physical Verification" checked={formData.requires_physical_verification} onChange={e => setFormData({ ...formData, requires_physical_verification: e.target.checked })} />
                        <Form.Check type="switch" className="text-secondary mb-2" label="Active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                    </Modal.Body>
                    <Modal.Footer className="border-secondary border-opacity-25">
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="btn-primary-gradient" disabled={saving}>
                            {saving ? <Spinner size="sm" className="me-2" /> : null}
                            {editOption ? 'Update' : 'Create'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default WorkOptions;
