import React, { useState } from 'react';
import { Card, Form, Button, Badge, Row, Col } from 'react-bootstrap';

const WorkSelector = ({ works, onSelect }) => {
    const [selected, setSelected] = useState([]);

    const toggleWork = (work) => {
        if (selected.find(s => s.id === work.id)) {
            setSelected(selected.filter(s => s.id !== work.id));
        } else {
            setSelected([...selected, work]);
        }
    };

    const isSelected = (id) => selected.find(s => s.id === id);

    const totalFee = selected.reduce((sum, w) => sum + parseFloat(w.fee_amount || 0), 0);

    const handleContinue = () => {
        onSelect(selected);
    };

    return (
        <div className="animate-fade-in">
            <p className="text-secondary mb-3">एक या अधिक कार्य चुनें जो आप करना चाहते हैं (Select one or more works)</p>

            <Row className="g-3 mb-4">
                {works.filter(w => w.is_active).map(work => {
                    const sel = isSelected(work.id);
                    const forms = Array.isArray(work.form_required) ? work.form_required : [];
                    return (
                        <Col xs={12} md={6} lg={4} key={work.id}>
                            <Card
                                className={`h-100 cursor-pointer transition-all ${sel ? 'border-info shadow-lg' : 'glass-card'}`}
                                style={{
                                    cursor: 'pointer',
                                    borderColor: sel ? '#06b6d4' : 'transparent',
                                    borderWidth: sel ? '2px' : '1px',
                                    background: sel ? 'rgba(6, 182, 212, 0.08)' : undefined,
                                    transition: 'all 0.25s ease',
                                    transform: sel ? 'translateY(-2px)' : 'none',
                                }}
                                onClick={() => toggleWork(work)}
                            >
                                <Card.Body className="p-3">
                                    <div className="d-flex align-items-start">
                                        <Form.Check
                                            type="checkbox"
                                            checked={!!sel}
                                            onChange={() => toggleWork(work)}
                                            className="me-2 mt-1"
                                            id={`work-${work.id}`}
                                        />
                                        <div className="flex-grow-1">
                                            <h6 className="text-white mb-1 fw-semibold" style={{ fontSize: '14px' }}>{work.work_name}</h6>
                                            <div className="d-flex flex-wrap gap-1 mb-2">
                                                {forms.map((f, i) => (
                                                    <Badge key={i} bg="secondary" className="fw-normal" style={{ fontSize: '11px' }}>{f}</Badge>
                                                ))}
                                            </div>
                                            <span className="text-success fw-bold" style={{ fontSize: '16px' }}>₹{Number(work.fee_amount).toLocaleString()}</span>
                                            <div className="mt-1">
                                                {work.requires_physical_verification && <Badge bg="warning" text="dark" className="me-1" style={{ fontSize: '10px' }}>Physical Verification</Badge>}
                                                {work.requires_original_document && <Badge bg="info" style={{ fontSize: '10px' }}>Original Docs</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {/* Summary Bar */}
            <Card className="glass-card border-0 mt-3">
                <Card.Body className="d-flex justify-content-between align-items-center py-3 px-4">
                    <div>
                        <span className="text-secondary">Selected: </span>
                        <Badge bg="info" className="me-2 fs-14">{selected.length} work(s)</Badge>
                        <span className="text-secondary">| Total Fee: </span>
                        <span className="text-success fw-bold fs-5">₹{totalFee.toLocaleString()}</span>
                    </div>
                    <Button
                        className="btn-primary-gradient px-4 py-2 rounded-3"
                        onClick={handleContinue}
                        disabled={selected.length === 0}
                    >
                        आगे बढ़ें (Continue) <i className="bi bi-arrow-right ms-2"></i>
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );
};

export default WorkSelector;
