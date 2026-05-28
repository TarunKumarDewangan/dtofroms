import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card, Table, Button, Spinner, Alert, Modal, Row, Col } from 'react-bootstrap';

const FormList = () => {
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            const res = await api.get('/filled-forms');
            setForms(res.data);
        } catch (err) {
            console.error('Fetch forms error:', err);
            setError('Failed to fetch filled forms.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('क्या आप इस भरे हुए फॉर्म को हटाना चाहते हैं? (Are you sure you want to delete this filled form?)')) return;
        try {
            await api.delete(`/filled-forms/${id}`);
            setSuccess('फॉर्म सफलतापूर्वक हटा दिया गया।');
            fetchForms();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete form.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleCreateSelect = (type) => {
        setShowCreateModal(false);
        navigate(`/forms/fill?type=${encodeURIComponent(type)}`);
    };

    const handleEdit = (id) => {
        navigate(`/forms/fill?id=${id}`);
    };

    const templates = [
        { type: 'Note Sheet (Hindi)', name: 'Note Sheet - कार्यालयीन नोट शीट (धमतरी)', desc: '14-बिंदु विवरण वाली हिन्दी कार्यालयीन नोट शीट' },
        { type: 'Form 29', name: 'Form 29 - Notice of Transfer of Ownership', desc: 'स्वामित्व अंतरण की सूचना (विक्रेता द्वारा)' },
        { type: 'Form 30', name: 'Form 30 - Report of Transfer of Ownership', desc: 'स्वामित्व अंतरण की रिपोर्ट (क्रेता एवं विक्रेता दोनों हेतु)' },
        { type: 'Form 33', name: 'Form 33 - Change of Address Intimation', desc: 'पता परिवर्तन की सूचना' },
        { type: 'Form 34', name: 'Form 34 - Hypothecation Agreement Entry', desc: 'हाइपोथिकेशन (फाइनेंस) दर्ज करने हेतु' },
        { type: 'Form 35', name: 'Form 35 - Hypothecation Termination Notice', desc: 'हाइपोथिकेशन (NOC) निरस्त करने हेतु' },
    ];

    if (loading) return <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="info" /></div>;

    return (
        <div className="animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-white fw-bold m-0">
                    <i className="bi bi-file-earmark-pdf text-info me-2"></i>
                    भरे हुए RTO फॉर्म्स (RTO Application Forms)
                </h3>
                <Button className="btn-primary-gradient px-4 rounded-3" onClick={() => setShowCreateModal(true)}>
                    <i className="bi bi-plus-circle me-2"></i> नया फॉर्म भरें (Fill New Form)
                </Button>
            </div>

            {success && <Alert variant="success" className="py-2">{success}</Alert>}
            {error && <Alert variant="danger" className="py-2">{error}</Alert>}

            <Card className="glass-card border-0">
                <Card.Body className="p-0">
                    {forms.length === 0 ? (
                        <div className="text-center py-5 text-secondary">
                            <i className="bi bi-file-earmark-plus fs-1 d-block mb-3"></i>
                            कोई भी फॉर्म नहीं मिला। नया फॉर्म भरने के लिए <strong>नया फॉर्म भरें</strong> बटन का उपयोग करें।
                        </div>
                    ) : (
                        <Table responsive borderless hover className="mb-0 text-secondary">
                            <thead>
                                <tr className="text-white border-bottom border-secondary border-opacity-25">
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3">Form Type</th>
                                    <th className="py-3">Vehicle Number</th>
                                    <th className="py-3">Created By</th>
                                    <th className="py-3">Date</th>
                                    <th className="py-3 text-end px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {forms.map(form => (
                                    <tr key={form.id} className="border-bottom border-secondary border-opacity-10">
                                        <td className="py-3 px-4">#{form.id}</td>
                                        <td className="py-3 text-white fw-medium">{form.form_type}</td>
                                        <td className="py-3">
                                            <code className="text-info">{form.registration_number || 'N/A'}</code>
                                        </td>
                                        <td className="py-3">{form.creator?.name || 'N/A'}</td>
                                        <td className="py-3">{new Date(form.created_at).toLocaleDateString('en-IN')}</td>
                                        <td className="py-3 text-end px-4">
                                            <Button variant="outline-success" size="sm" className="rounded-2 me-2" onClick={() => navigate(`/build?fromForm=${form.id}`)}>
                                                <i className="bi bi-file-earmark-plus me-1"></i> जनरेट नोटशीट
                                            </Button>
                                            <Button variant="outline-warning" size="sm" className="rounded-2 me-2" onClick={() => handleEdit(form.id)}>
                                                <i className="bi bi-pencil me-1"></i> Edit / Print
                                            </Button>
                                            <Button variant="outline-danger" size="sm" className="rounded-2" onClick={() => handleDelete(form.id)}>
                                                <i className="bi bi-trash me-1"></i> Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Template Selection Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="md" centered contentClassName="glass-card border-0" style={{ color: '#f3f4f6' }}>
                <Modal.Header closeButton closeVariant="white" className="border-secondary border-opacity-25">
                    <Modal.Title className="text-white fw-semibold">RTO फॉर्म टेम्पलेट चुनें (Select Template)</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <p className="text-secondary mb-3">भरे जाने वाले फॉर्म प्रकार का चयन करें:</p>
                    <Row className="g-2">
                        {templates.map((t, idx) => (
                            <Col md={12} key={idx} className="mb-2">
                                <Button 
                                    variant="dark" 
                                    className="w-100 text-start p-3 border-secondary border-opacity-25 rounded-3 hover-glass-btn"
                                    onClick={() => handleCreateSelect(t.type)}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div className="text-white fw-semibold">{t.name}</div>
                                            <div className="text-secondary small mt-1">{t.desc}</div>
                                        </div>
                                        <i className="bi bi-chevron-right text-info fs-5"></i>
                                    </div>
                                </Button>
                            </Col>
                        ))}
                    </Row>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default FormList;
