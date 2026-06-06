import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import TransliteratedInput from '../Common/TransliteratedInput';

const cleanDateVal = (val) => {
    if (!val || val.startsWith('1970-01-01')) return '';
    return val;
};

const DynamicForm = ({ selectedWorks, vehicle, onSubmit, onChange, initialData }) => {
    const isBlankNotesheet = vehicle?.is_blank_notesheet || vehicle?.owner_name === '.....................' || initialData?.is_blank === true;

    const [formData, setFormData] = useState({
        application_date: initialData?.application_date || new Date().toISOString().split('T')[0],
        sale_date: initialData?.sale_date || '', 
        transfer_fee: initialData?.transfer_fee || '',
        buyer_name: initialData?.buyer_name || '', 
        buyer_father: initialData?.buyer_father || '', 
        buyer_address: initialData?.buyer_address || '',
        hp_bank_name: initialData?.hp_bank_name || '', 
        hp_fee: initialData?.hp_fee || '', 
        hp_date: initialData?.hp_date || '',
        cancel_bank_name: initialData?.cancel_bank_name || '', 
        hp_cancel_fee: initialData?.hp_cancel_fee || '', 
        cancel_date: initialData?.cancel_date || '',
        new_address: initialData?.new_address || '', 
        address_fee: initialData?.address_fee || '', 
        address_proof_type: initialData?.address_proof_type ?? '',
        duplicate_reason: initialData?.duplicate_reason ?? '', 
        duplicate_rc_fee: initialData?.duplicate_rc_fee || '',
        applicant_name: initialData?.applicant_name || '', 
        applicant_father: initialData?.applicant_father || '', 
        applicant_address: initialData?.applicant_address || '',
        relation_to_deceased: initialData?.relation_to_deceased || '', 
        death_date: initialData?.death_date || '', 
        death_transfer_fee: initialData?.death_transfer_fee || '',
        physical_verification_date: initialData?.physical_verification_date || '',
        affidavit_attached: initialData?.affidavit_attached ?? '', 
        ncrb_report: initialData?.ncrb_report ?? '',
        original_file_attached: initialData?.original_file_attached || 'yes',
        renewal_fee: initialData?.renewal_fee || '',
        alteration_details: initialData?.alteration_details || '',
        alteration_fee: initialData?.alteration_fee || '',
        conversion_from: initialData?.conversion_from || '',
        conversion_to: initialData?.conversion_to || '',
        conversion_fee: initialData?.conversion_fee || '',
        new_vehicle_class: initialData?.new_vehicle_class || '',
    });

    const [alterationItems, setAlterationItems] = useState(() => {
        if (initialData?.alteration_items) return initialData.alteration_items;
        if (initialData?.alteration_details) {
            return initialData.alteration_details.split(', ');
        }
        return [''];
    });

    useEffect(() => {
        if (onChange) {
            const finalDetails = alterationItems.filter(Boolean).join(', ');
            onChange({
                ...formData,
                alteration_details: finalDetails,
                alteration_items: alterationItems
            });
        }
    }, [formData, alterationItems, onChange]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalDetails = alterationItems.filter(Boolean).join(', ');
        onSubmit({
            ...formData,
            alteration_details: finalDetails,
            alteration_items: alterationItems
        });
    };

    const hasWork = (code) => selectedWorks.some(w => w.work_code === code);
    const hasTransfer = hasWork('OWN_TRANSFER');
    const hasHP = hasWork('HP_REGISTER');
    const hasHPCancel = hasWork('HP_CANCEL');
    const hasAddress = hasWork('ADDRESS_CHANGE');
    const hasDuplicate = hasWork('DUPLICATE_RC');
    const hasDeath = hasWork('TRANSFER_DEATH');
    const hasRenewal = hasWork('REG_RENEWAL');
    const hasAlteration = hasWork('VEHICLE_ALTERATION');
    const hasConversion = hasWork('VEHICLE_CONVERSION');

    return (
        <Form onSubmit={handleSubmit} className="animate-fade-in">
            {isBlankNotesheet && (
                <Alert variant="info" className="mb-4 py-3 border-info border-opacity-25 bg-info bg-opacity-10 text-info rounded-3 no-print">
                    <i className="bi bi-info-circle-fill me-2 fs-5 align-middle"></i>
                    <strong>खाली नोटशीट (Blank Notesheet) सक्रिय है:</strong> सभी फ़ील्ड वैकल्पिक हैं। आप जानकारी को खाली छोड़ सकते हैं। प्रिंट करने पर सभी विवरण रिक्त डॉटेड लाइन्स (`.....................`) के रूप में दिखाई देंगे।
                </Alert>
            )}
            {/* Common Fields */}
            <Card className="glass-card border-0 mb-4">
                <Card.Body className="p-4">
                    <h6 className="text-info fw-semibold mb-3"><i className="bi bi-calendar3 me-2"></i>सामान्य जानकारी (General Info)</h6>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-secondary">आवेदन दिनांक (Application Date)</Form.Label>
                                <Form.Control type="date" name="application_date" className="form-control-dark" value={cleanDateVal(formData.application_date)} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Ownership Transfer */}
            {hasTransfer && (
                <Card className="glass-card border-0 mb-4" style={{ borderLeft: '4px solid #10b981 !important' }}>
                    <Card.Body className="p-4">
                        <h6 className="text-success fw-semibold mb-3"><i className="bi bi-arrow-left-right me-2"></i>स्वामित्व अंतरण (Ownership Transfer) — Form 29 & 30</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">खरीदार का नाम (Buyer Name)</Form.Label>
                                    <TransliteratedInput name="buyer_name" className="form-control form-control-dark" placeholder="e.g. DILESHWAR" value={formData.buyer_name} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">पिता/पति का नाम (Father's Name)</Form.Label>
                                    <TransliteratedInput name="buyer_father" className="form-control form-control-dark" placeholder="e.g. PUNURAM" value={formData.buyer_father} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">खरीदार का पता (Buyer Address)</Form.Label>
                                    <TransliteratedInput as="textarea" rows={2} name="buyer_address" className="form-control form-control-dark" placeholder="e.g. TENDUKONA, DHAMTARI" value={formData.buyer_address} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">विक्रय दिनांक (Sale Date)</Form.Label>
                                    <Form.Control type="date" name="sale_date" className="form-control-dark" value={cleanDateVal(formData.sale_date)} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">शुल्क राशि ₹ (Transfer Fee)</Form.Label>
                                    <Form.Control type="number" name="transfer_fee" className="form-control-dark" placeholder="11612" value={formData.transfer_fee} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Transfer after Death */}
            {hasDeath && (
                <Card className="glass-card border-0 mb-4">
                    <Card.Body className="p-4">
                        <h6 className="text-warning fw-semibold mb-3"><i className="bi bi-person-x me-2"></i>मृत्यु उपरांत अंतरण (Transfer after Death) — Form 31</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">आवेदक का नाम</Form.Label>
                                    <TransliteratedInput name="applicant_name" className="form-control form-control-dark" value={formData.applicant_name} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">पिता का नाम</Form.Label>
                                    <TransliteratedInput name="applicant_father" className="form-control form-control-dark" value={formData.applicant_father} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">पता</Form.Label>
                                    <TransliteratedInput as="textarea" rows={2} name="applicant_address" className="form-control form-control-dark" value={formData.applicant_address} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">मृतक से संबंध (Relation)</Form.Label>
                                    <Form.Select name="relation_to_deceased" className="form-select-dark" value={formData.relation_to_deceased} onChange={handleChange}>
                                        <option value="">-- Select --</option>
                                        <option value="पुत्र">पुत्र (Son)</option>
                                        <option value="पुत्री">पुत्री (Daughter)</option>
                                        <option value="पत्नी">पत्नी (Wife)</option>
                                        <option value="पति">पति (Husband)</option>
                                        <option value="अन्य वारिस">अन्य वारिस (Other)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">मृत्यु दिनांक (Death Date)</Form.Label>
                                    <Form.Control type="date" name="death_date" className="form-control-dark" value={cleanDateVal(formData.death_date)} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">शुल्क राशि ₹</Form.Label>
                                    <Form.Control type="number" name="death_transfer_fee" className="form-control-dark" placeholder="5000" value={formData.death_transfer_fee} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* HP Registration */}
            {hasHP && (
                <Card className="glass-card border-0 mb-4">
                    <Card.Body className="p-4">
                        <h6 className="text-info fw-semibold mb-3"><i className="bi bi-bank me-2"></i>एच.पी.ए. दर्ज (HP Registration) — Form 34</h6>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">बैंक/फाइनेंस कंपनी</Form.Label>
                                    <TransliteratedInput name="hp_bank_name" className="form-control form-control-dark" placeholder="e.g. EQUITAS SMALL FINANCE BANK" value={formData.hp_bank_name} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">शुल्क राशि ₹</Form.Label>
                                    <Form.Control type="number" name="hp_fee" className="form-control-dark" placeholder="11612" value={formData.hp_fee} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">दिनांक</Form.Label>
                                    <Form.Control type="date" name="hp_date" className="form-control-dark" value={cleanDateVal(formData.hp_date)} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* HP Cancellation */}
            {hasHPCancel && (
                <Card className="glass-card border-0 mb-4">
                    <Card.Body className="p-4">
                        <h6 className="text-danger fw-semibold mb-3"><i className="bi bi-x-circle me-2"></i>एच.पी.ए. निरस्त (HP Cancellation) — Form 35</h6>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">बैंक/फाइनेंसर का नाम</Form.Label>
                                    <TransliteratedInput name="cancel_bank_name" className="form-control form-control-dark" value={formData.cancel_bank_name} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">शुल्क राशि ₹</Form.Label>
                                    <Form.Control type="number" name="hp_cancel_fee" className="form-control-dark" placeholder="500" value={formData.hp_cancel_fee} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">दिनांक</Form.Label>
                                    <Form.Control type="date" name="cancel_date" className="form-control-dark" value={cleanDateVal(formData.cancel_date)} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Address Change */}
            {hasAddress && (
                <Card className="glass-card border-0 mb-4">
                    <Card.Body className="p-4">
                        <h6 className="fw-semibold mb-3" style={{ color: '#a78bfa' }}><i className="bi bi-geo-alt me-2"></i>पता परिवर्तन (Address Change) — Form 33</h6>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">नया पता (New Address)</Form.Label>
                                    <TransliteratedInput as="textarea" rows={2} name="new_address" className="form-control form-control-dark" value={formData.new_address} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">शुल्क राशि ₹</Form.Label>
                                    <Form.Control type="number" name="address_fee" className="form-control-dark" placeholder="200" value={formData.address_fee} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">पता प्रमाण पत्र</Form.Label>
                                    <Form.Select name="address_proof_type" className="form-select-dark" value={formData.address_proof_type} onChange={handleChange}>
                                        <option value="">-- चुनें (Select) --</option>
                                        <option value="आधार कार्ड">आधार कार्ड</option>
                                        <option value="निवास प्रमाण पत्र">निवास प्रमाण पत्र</option>
                                        <option value="बिजली बिल">बिजली बिल</option>
                                        <option value="राशन कार्ड">राशन कार्ड</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Duplicate RC */}
            {hasDuplicate && (
                <Card className="glass-card border-0 mb-4">
                    <Card.Body className="p-4">
                        <h6 className="text-danger fw-semibold mb-3"><i className="bi bi-files me-2"></i>द्वितीय प्रति (Duplicate RC) — Form 26</h6>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">कारण (Reason)</Form.Label>
                                    <Form.Select name="duplicate_reason" className="form-select-dark" value={formData.duplicate_reason} onChange={handleChange}>
                                        <option value="">-- चुनें (Select) --</option>
                                        <option value="गुम हो जाने">गुम हो जाने (Lost)</option>
                                        <option value="फट जाने">फट जाने (Damaged)</option>
                                        <option value="चोरी हो जाने">चोरी हो जाने (Stolen)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">शुल्क राशि ₹</Form.Label>
                                    <Form.Control type="number" name="duplicate_rc_fee" className="form-control-dark" placeholder="1000" value={formData.duplicate_rc_fee} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Renewal of Registration */}
            {hasRenewal && (
                <Card className="glass-card border-0 mb-4">
                    <Card.Body className="p-4">
                        <h6 className="text-info fw-semibold mb-3"><i className="bi bi-arrow-repeat me-2"></i>पंजीयन नवीनीकरण (Renewal of Registration) — Form 25</h6>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">शुल्क राशि ₹ (Renewal Fee)</Form.Label>
                                    <Form.Control type="number" name="renewal_fee" className="form-control-dark" placeholder="e.g. 1000" value={formData.renewal_fee} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Alteration of Vehicle */}
            {hasAlteration && (
                <Card className="glass-card border-0 mb-4">
                    <Card.Body className="p-4">
                        <h6 className="text-success fw-semibold mb-3"><i className="bi bi-tools me-2"></i>वाहन वेधन / परिवर्तन (Alteration of Vehicle) — Form 22C & 22D</h6>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <Form.Label className="text-secondary mb-0">परिवर्तन का विवरण (Alteration Details)</Form.Label>
                                        <Button 
                                            variant="success" 
                                            size="sm" 
                                            className="py-1 px-2 rounded-3 btn-success-gradient" 
                                            onClick={() => setAlterationItems([...alterationItems, ''])}
                                            style={{ fontSize: '13px', fontWeight: 'bold' }}
                                        >
                                            <i className="bi bi-plus-lg me-1"></i>विवरण जोड़ें (Add Details)
                                        </Button>
                                    </div>
                                    {alterationItems.map((item, idx) => (
                                        <div key={idx} className="d-flex align-items-center mb-2">
                                            <TransliteratedInput 
                                                name={`alteration_item_${idx}`} 
                                                className="form-control form-control-dark" 
                                                placeholder="e.g. Retrofitment of LPG/CNG Kit" 
                                                value={item} 
                                                onChange={(e) => {
                                                    const newItems = [...alterationItems];
                                                    newItems[idx] = e.target.value;
                                                    setAlterationItems(newItems);
                                                }} 
                                            />
                                            {alterationItems.length > 1 && (
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    className="ms-2 py-2 px-3 rounded-3" 
                                                    onClick={() => {
                                                        const newItems = alterationItems.filter((_, i) => i !== idx);
                                                        setAlterationItems(newItems);
                                                    }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">शुल्क राशि ₹ (Alteration Fee)</Form.Label>
                                    <Form.Control type="number" name="alteration_fee" className="form-control-dark" placeholder="e.g. 500" value={formData.alteration_fee} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Conversion of Vehicle */}
            {hasConversion && (
                <Card className="glass-card border-0 mb-4">
                    <Card.Body className="p-4">
                        <h6 className="text-warning fw-semibold mb-3"><i className="bi bi-shuffle me-2"></i>वाहन वर्ग रूपांतरण (Conversion of Vehicle)</h6>
                        <Row>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">कहाँ से (Conversion From)</Form.Label>
                                    <Form.Select 
                                        name="conversion_from" 
                                        className="form-select-dark" 
                                        value={formData.conversion_from} 
                                        onChange={handleChange} 
                                    >
                                        <option value="">-- चुनें (Select) --</option>
                                        <option value="परिवहन">परिवहन (Transport)</option>
                                        <option value="गैर-परिवहन">गैर-परिवहन (Non-Transport)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">कहाँ तक (Conversion To)</Form.Label>
                                    <Form.Select 
                                        name="conversion_to" 
                                        className="form-select-dark" 
                                        value={formData.conversion_to} 
                                        onChange={handleChange} 
                                    >
                                        <option value="">-- चुनें (Select) --</option>
                                        <option value="परिवहन">परिवहन (Transport)</option>
                                        <option value="गैर-परिवहन">गैर-परिवहन (Non-Transport)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">नया वाहन वर्ग (New Vehicle Class)</Form.Label>
                                    <TransliteratedInput 
                                        name="new_vehicle_class" 
                                        className="form-control form-control-dark" 
                                        placeholder="e.g. Motor Car" 
                                        value={formData.new_vehicle_class} 
                                        onChange={handleChange} 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-secondary">शुल्क राशि ₹ (Conversion Fee)</Form.Label>
                                    <Form.Control type="number" name="conversion_fee" className="form-control-dark" placeholder="e.g. 1000" value={formData.conversion_fee} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Supporting Documents */}
            <Card className="glass-card border-0 mb-4">
                <Card.Body className="p-4">
                    <h6 className="text-warning fw-semibold mb-3"><i className="bi bi-paperclip me-2"></i>संलग्न दस्तावेज (Attached Documents)</h6>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-secondary">शपथपत्र (Affidavit)</Form.Label>
                                <Form.Select name="affidavit_attached" className="form-select-dark" value={formData.affidavit_attached} onChange={handleChange}>
                                    <option value="">-- चुनें (Select) --</option>
                                    <option value="yes">हाँ - संलग्न है</option>
                                    <option value="no">नहीं</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-secondary">NCRB रिपोर्ट</Form.Label>
                                <Form.Select name="ncrb_report" className="form-select-dark" value={formData.ncrb_report} onChange={handleChange}>
                                    <option value="">-- चुनें (Select) --</option>
                                    <option value="yes">संलग्न है</option>
                                    <option value="no">नहीं है</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label className="text-secondary">भौतिक सत्यापन दिनांक (Optional)</Form.Label>
                                <Form.Control type="date" name="physical_verification_date" className="form-control-dark" value={cleanDateVal(formData.physical_verification_date)} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-center">
                            <Form.Group className="mb-3 mt-4">
                                <Form.Check 
                                    type="switch"
                                    id="original-file-switch"
                                    name="original_file_attached"
                                    label="मूल नस्ती (Original File) संलग्न है"
                                    className="text-white"
                                    checked={formData.original_file_attached === 'yes' || formData.original_file_attached === true}
                                    onChange={(e) => setFormData(prev => ({ ...prev, original_file_attached: e.target.checked ? 'yes' : 'no' }))}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <div className="text-center">
                <Button type="submit" className="btn-primary-gradient px-5 py-3 rounded-3 fs-5">
                    ✅ नोटशीट जनरेट करें (Generate Notesheet)
                </Button>
            </div>
        </Form>
    );
};

export default DynamicForm;
