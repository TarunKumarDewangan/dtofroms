import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { Card, Button, Spinner, Alert, Form, Row, Col } from 'react-bootstrap';
import TransliteratedInput from '../Common/TransliteratedInput';

const getInputWidth = (val, placeholder, minWidth = 60) => {
    if (val) {
        const charCount = String(val).length;
        // 9.5px per character + 10px padding for safety (stops word wrapping inside input)
        // Set a small min-width of 30px so single characters don't get truncated
        return `${Math.max(charCount * 9.5 + 10, 30)}px`;
    }
    const text = placeholder || '';
    const charCount = text.length;
    return `${Math.max(charCount * 9.5 + 10, minWidth)}px`;
};

const FormFiller = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const typeParam = searchParams.get('type') || 'Form 29';
    const idParam = searchParams.get('id');

    const [formType, setFormType] = useState(typeParam);
    const [regNumber, setRegNumber] = useState('');
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [rowVisibility, setRowVisibility] = useState({
        1: true, 2: true, 3: true, 4: true, 5: true,
        6: true, 7: true, 8: true, 9: true, 10: true,
        11: true, 12: true, 13: true, 14: true, 15: true
    });

    useEffect(() => {
        if (formType === 'Note Sheet (Hindi)') {
            const hasTransfer = !!formData.include_transfer;
            setRowVisibility(prev => ({
                ...prev,
                2: hasTransfer,
                13: hasTransfer
            }));
        }
    }, [formData.include_transfer, formType]);

    const toggleRow = (num) => {
        setRowVisibility(prev => ({
            ...prev,
            [num]: !prev[num]
        }));
    };

    let currentSNo = 1;
    const getSNo = (num) => {
        if (!rowVisibility[num]) return '--.';
        const sno = currentSNo++;
        return String(sno).padStart(2, '0') + '.';
    };

    useEffect(() => {
        if (idParam) {
            fetchFormForEdit(idParam);
        } else {
            initializeNewForm(typeParam);
        }
    }, [idParam, typeParam]);

    const initializeNewForm = (type) => {
        setFormType(type);
        setRegNumber('');
        
        const defaults = {
            'Note Sheet (Hindi)': {
                include_transfer: true,
                include_hp_reg: false,
                include_hp_cancel: false,
                include_address: false,
                include_duplicate: false,
                include_death: false,
                
                registration_number: '',
                vehicle_type: 'Motor Car',
                vehicle_class_select: 'Motor Car',
                custom_vehicle_type: '',
                owner_name: '',
                owner_father: '',
                owner_address: '',
                buyer_name: '',
                buyer_father: '',
                buyer_address: '',
                transfer_fee: '',
                application_date: new Date().toISOString().split('T')[0],
                
                hp_fee: '',
                hp_date: '',
                hp_bank_name: '',
                
                hp_cancel_fee: '',
                cancel_date: '',
                cancel_bank_name: '',
                
                address_fee: '',
                address_date: '',
                
                duplicate_rc_fee: '',
                duplicate_date: '',
                
                death_transfer_fee: '',
                death_date: '',
                applicant_name: '',
                applicant_father: '',
                applicant_address: '',
                
                model_year: '',
                registration_date: '',
                chassis_number: '',
                engine_number: '',
                tax_paid_date: '',
                tax_amount: '',
                permit_validity: '',
                fitness_validity: '',
                pollution_validity: '',
                current_hpa: '',
                ncrb_report: 'yes',
                fir_attached: 'no',
                affidavit_attached: 'yes',
                physical_verification_date: '',
                original_file_attached: 'yes'
            },
            'Form 29': {
                registering_authority: '',
                seller_name: '',
                seller_father: '',
                seller_address: '',
                sale_day: '',
                sale_month: '',
                sale_year: '',
                registration_number: '',
                buyer_name: '',
                buyer_father: '',
                buyer_address: '',
                handover_date: '',
                transferor_sign_name: ''
            },
            'Form 30': {
                registering_authority: '',
                seller_name: '',
                buyer_name: '',
                buyer_father: '',
                buyer_address: '',
                sale_date: '',
                registration_number: '',
                seller_sign_date: '',
                buyer_sign_date: '',
                financier_noc: 'no',
                financier_name: ''
            },
            'Form 33': {
                registering_authority: '',
                owner_name: '',
                owner_father: '',
                old_address: '',
                new_address: '',
                registration_number: '',
                change_date: '',
                owner_signature_date: ''
            },
            'Form 34': {
                registering_authority: '',
                registration_number: '',
                owner_name: '',
                owner_address: '',
                financier_name: '',
                financier_address: '',
                agreement_date: '',
                owner_sign_date: '',
                financier_sign_date: ''
            },
            'Form 35': {
                registering_authority: '',
                registration_number: '',
                owner_name: '',
                owner_address: '',
                financier_name: '',
                financier_address: '',
                termination_date: '',
                owner_sign_date: '',
                financier_sign_date: ''
            }
        };

        setFormData(defaults[type] || {});
    };

    const fetchFormForEdit = async (id) => {
        setLoading(true);
        try {
            const res = await api.get(`/filled-forms/${id}`);
            const form = res.data;
            setFormType(form.form_type);
            setRegNumber(form.registration_number || '');
            
            const fd = form.form_data || {};
            if (form.form_type === 'Note Sheet (Hindi)') {
                const val = fd.vehicle_type || '';
                const standardClasses = ['Motor Car', 'Motor Cab', 'Maxi Cab', 'Omni Bus Private use'];
                if (val) {
                    if (standardClasses.includes(val)) {
                        fd.vehicle_class_select = val;
                        fd.custom_vehicle_type = '';
                    } else {
                        fd.vehicle_class_select = 'Other';
                        fd.custom_vehicle_type = val;
                    }
                } else {
                    fd.vehicle_class_select = 'Motor Car';
                    fd.custom_vehicle_type = '';
                    fd.vehicle_type = 'Motor Car';
                }
            }
            setFormData(fd);
        } catch (err) {
            console.error('Fetch edit form error:', err);
            setError('Failed to load filled form.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (name === 'registration_number') {
            setRegNumber(value.toUpperCase());
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                form_type: formType,
                registration_number: regNumber,
                form_data: formData
            };

            if (idParam) {
                await api.put(`/filled-forms/${idParam}`, payload);
                setSuccess('फॉर्म सफलतापूर्वक अपडेट किया गया! 🎉');
            } else {
                const res = await api.post('/filled-forms', payload);
                setSuccess('फॉर्म सफलतापूर्वक सहेजा गया! 🎉');
                navigate(`/forms/fill?id=${res.data.form.id}`, { replace: true });
            }
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to save form. Check your fields.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData.registering_authority) {
        return <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="info" /></div>;
    }

    currentSNo = 1;
    return (
        <div className="animate-fade-in pb-5">
            <style>{`
                .pdf-form-page {
                    background-color: #ffffff;
                    color: #000000;
                    padding: 40px 35px;
                    border: 1px solid #000000; /* Black border box like notesheet */
                    font-family: 'Nirmala UI', 'Mangal', 'Arial', sans-serif;
                    font-size: 15px;
                    line-height: 2.2;
                    max-width: 800px;
                    margin: 0 auto;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    border-radius: 4px;
                }
                .pdf-form-title {
                    text-align: center;
                    font-weight: bold;
                    font-size: 18px;
                    margin-bottom: 2px;
                    text-transform: uppercase;
                }
                .pdf-form-subtitle {
                    text-align: center;
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 25px;
                }
                .pdf-form-divider {
                    border-top: 1px solid #000000;
                    margin: 15px -35px;
                }
                .rto-input {
                    border: none !important;
                    border-bottom: 1px dotted #000000 !important;
                    background: transparent !important;
                    color: #000000 !important;
                    font-weight: bold !important;
                    padding: 0 5px !important;
                    text-align: left !important; /* Left aligned for natural flowing sentence structure */
                    font-size: 15px !important;
                    outline: none !important;
                    display: inline-block !important;
                }
                .rto-input:focus {
                    border-bottom: 1px solid #4f46e5 !important;
                }
                .rto-input::placeholder {
                    color: #999999 !important;
                    font-weight: normal !important;
                    font-size: 12px !important;
                }
                .form-section-title {
                    font-weight: bold;
                    margin-top: 25px;
                    text-decoration: underline;
                }
                .signature-block {
                    margin-top: 40px;
                    margin-bottom: 15px;
                }
                .signature-box {
                    border-top: 1px dotted #000000;
                    width: 220px;
                    text-align: center;
                    font-size: 13px;
                    padding-top: 5px;
                    margin-top: 20px;
                }
                .notesheet-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                    margin-bottom: 15px;
                    font-size: 14px;
                }
                .notesheet-table th, .notesheet-table td {
                    border: 1px solid #000000;
                    padding: 5px 8px;
                    vertical-align: top;
                    color: #000000;
                    line-height: 1.5;
                }
                .notesheet-table td.sno {
                    text-align: center;
                    font-weight: bold;
                    width: 40px;
                }
                .notesheet-table td.label-cell {
                    width: 45%;
                    font-weight: 500;
                }
                .notesheet-table td.value-cell {
                    width: 50%;
                }
                .notesheet-paragraph {
                    text-indent: 45px;
                    text-align: justify;
                    margin-bottom: 12px;
                    word-wrap: break-word;
                }
                .print-only {
                    display: none !important;
                }
                .row-disabled td:not(.toggle-cell) {
                    opacity: 0.35;
                    background-color: #f8f9fa !important;
                }
                .toggle-cell {
                    background-color: #ffffff !important;
                }
                
                @media print {
                    /* Reset flex and layout heights to prevent premature page breaks in Chrome print engine */
                    html, body, #root, .d-flex, .flex-grow-1, .main-content, .animate-fade-in {
                        display: block !important;
                        height: auto !important;
                        min-height: 0 !important;
                        overflow: visible !important;
                        position: static !important;
                    }
                    body {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                    }
                    .animate-fade-in {
                        animation: none !important;
                        opacity: 1 !important;
                        transform: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .row-disabled {
                        display: none !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    body .print-container {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .pdf-form-page {
                        border: 1px solid #000000 !important;
                        border-bottom: none !important;
                        min-height: 265mm !important;
                        padding: 25px 25px !important; /* Normal padding to fill the page nicely */
                        width: 100% !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        box-sizing: border-box !important;
                        font-size: 14.5px !important; /* Larger text to occupy full page */
                        line-height: 1.65 !important;
                    }
                    .pdf-form-title {
                        font-size: 17px !important;
                        margin-bottom: 3px !important;
                    }
                    .pdf-form-subtitle {
                        font-size: 13.5px !important;
                        margin-bottom: 12px !important;
                    }
                    .pdf-form-divider {
                        margin: 8px -25px !important;
                    }
                    .notesheet-paragraph {
                        margin-bottom: 8px !important;
                        line-height: 1.65 !important;
                        text-indent: 35px !important;
                    }
                    .notesheet-table {
                        margin-top: 8px !important;
                        margin-bottom: 8px !important;
                    }
                    .notesheet-table th, .notesheet-table td {
                        padding: 3px 5px !important; /* Professional spacing for table rows */
                        font-size: 12.5px !important; /* Clear, legible table font size */
                        line-height: 1.3 !important;
                    }
                    .notesheet-table td.sno {
                        width: 30px !important;
                    }
                    .signature-block {
                        margin-top: 25px !important;
                        margin-bottom: 5px !important;
                    }
                    .signature-box {
                        margin-top: 10px !important;
                        padding-top: 5px !important;
                    }
                    .notesheet-signature {
                        margin-top: 20px !important;
                        margin-bottom: 80px !important;
                    }
                    .rto-input {
                        text-align: left !important;
                        font-size: 14.5px !important;
                        padding: 0 !important;
                        -webkit-appearance: none !important;
                        -moz-appearance: none !important;
                        appearance: none !important;
                        background: transparent !important;
                        border: none !important;
                    }
                    /* Only keep dotted bottom border if the input is empty (for manual filling option) */
                    .rto-input:not(:placeholder-shown) {
                        border-bottom: none !important;
                    }
                    .rto-input:placeholder-shown {
                        border-bottom: 1px dotted #000000 !important;
                    }
                    @page {
                        size: A4;
                        margin: 10mm 10mm 10mm 15mm; /* Standard office printing margins */
                    }
                }
            `}</style>

            <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                <Button variant="outline-secondary" className="rounded-3" onClick={() => navigate('/forms')}>
                    <i className="bi bi-arrow-left me-1"></i> Back to List
                </Button>
                <div className="d-flex gap-2">
                    {idParam && (
                        <Button variant="outline-success" className="rounded-3" onClick={() => navigate(`/build?fromForm=${idParam}`)}>
                            <i className="bi bi-file-earmark-plus me-2"></i> जनरेट नोटशीट (Generate Notesheet)
                        </Button>
                    )}
                    <Button variant="outline-info" className="rounded-3" onClick={() => window.print()}>
                        <i className="bi bi-printer me-2"></i> Print Form
                    </Button>
                    <Button className="btn-primary-gradient px-4 rounded-3" onClick={handleSave} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : <><i className="bi bi-save me-2"></i>Save Details</>}
                    </Button>
                </div>
            </div>

            {success && <Alert variant="success" className="mb-4 no-print">{success}</Alert>}
            {error && <Alert variant="danger" className="mb-4 no-print">{error}</Alert>}

            {/* Note Sheet Form Body */}
            <div className="print-container">
                <div className="pdf-form-page">
                    
                    {/* Note Sheet (Hindi) */}
                    {formType === 'Note Sheet (Hindi)' && (
                        <div>
                            {/* Checkboxes to toggle sections - no-print */}
                            <div className="no-print mb-4 p-3 rounded select-works-card">
                                <h6 className="fw-semibold mb-3 text-info"><i className="bi bi-list-check me-2"></i>नोटशीट में शामिल करने हेतु कार्य चुनें (Select Works):</h6>
                                <div className="d-flex flex-wrap gap-3">
                                    <Form.Check 
                                        type="checkbox" 
                                        id="work-transfer" 
                                        label="स्वामित्व अंतरण (Transfer)" 
                                        checked={!!formData.include_transfer} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, include_transfer: e.target.checked }))} 
                                    />
                                    <Form.Check 
                                        type="checkbox" 
                                        id="work-hp-reg" 
                                        label="HPA दर्ज (HP Reg)" 
                                        checked={!!formData.include_hp_reg} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, include_hp_reg: e.target.checked }))} 
                                    />
                                    <Form.Check 
                                        type="checkbox" 
                                        id="work-hp-cancel" 
                                        label="HPA निरस्त (HP Cancel)" 
                                        checked={!!formData.include_hp_cancel} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, include_hp_cancel: e.target.checked }))} 
                                    />
                                    <Form.Check 
                                        type="checkbox" 
                                        id="work-addr" 
                                        label="पता परिवर्तन (Address Change)" 
                                        checked={!!formData.include_address} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, include_address: e.target.checked }))} 
                                    />
                                    <Form.Check 
                                        type="checkbox" 
                                        id="work-dup" 
                                        label="द्वितीय प्रति (Duplicate RC)" 
                                        checked={!!formData.include_duplicate} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, include_duplicate: e.target.checked }))} 
                                    />
                                    <Form.Check 
                                        type="checkbox" 
                                        id="work-death" 
                                        label="मृत्यु उपरांत अंतरण (Death Transfer)" 
                                        checked={!!formData.include_death} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, include_death: e.target.checked }))} 
                                    />
                                </div>
                            </div>

                            {/* Note Sheet Header */}
                            <div className="pdf-form-title" style={{ fontSize: '19px' }}>जिला परिवहन कार्यालय, धमतरी, छ०ग०</div>
                            <div className="pdf-form-title" style={{ fontSize: '18px', textDecoration: 'underline', marginTop: '5px', textTransform: 'none' }}>नोट शीट</div>
                            
                            <div className="pdf-form-divider"></div>

                            {/* Subject Line */}
                            <div style={{ fontWeight: 'bold', textAlign: 'justify', lineHeight: '1.8' }}>
                                विषय:-वाहन क्रमांक <div className="d-inline-block" style={{ width: getInputWidth(formData.registration_number, "वाहन क्रमांक", 90) }}><TransliteratedInput name="registration_number" className="rto-input" placeholder="वाहन क्रमांक" value={formData.registration_number || ''} onChange={handleInputChange} /></div> 
                                (वाहन का प्रकार){' '}
                                <span className="no-print d-inline-block" style={{ width: '160px' }}>
                                    <Form.Select 
                                        name="vehicle_class_select" 
                                        className="rto-input py-0"
                                        style={{ height: '30px', verticalAlign: 'middle', display: 'inline-block' }}
                                        value={formData.vehicle_class_select || 'Motor Car'} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => {
                                                const updated = {
                                                    ...prev,
                                                    vehicle_class_select: val,
                                                    vehicle_type: val === 'Other' ? (prev.custom_vehicle_type || '') : val
                                                };
                                                return updated;
                                            });
                                        }}
                                    >
                                        <option value="Motor Car">Motor Car</option>
                                        <option value="Motor Cab">Motor Cab</option>
                                        <option value="Maxi Cab">Maxi Cab</option>
                                        <option value="Omni Bus Private use">Omni Bus Private use</option>
                                        <option value="Other">Other</option>
                                    </Form.Select>
                                </span>
                                {formData.vehicle_class_select === 'Other' && (
                                    <span className="no-print d-inline-block ms-1" style={{ width: '130px' }}>
                                        <TransliteratedInput 
                                            name="custom_vehicle_type" 
                                            className="rto-input" 
                                            style={{ verticalAlign: 'middle' }}
                                            placeholder="Type custom class" 
                                            value={formData.custom_vehicle_type || ''} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    custom_vehicle_type: val,
                                                    vehicle_type: val
                                                }));
                                            }} 
                                        />
                                    </span>
                                )}
                                <span className="print-only">
                                    <strong>{formData.vehicle_type || '.....................'}</strong>
                                </span> का <strong>{
                                    [
                                        formData.include_transfer && "स्वामित्व अंतरण",
                                        formData.include_death && "स्वामित्व अंतरण (मृत्यु उपरांत)",
                                        formData.include_hp_reg && "एच.पी. दर्ज",
                                        formData.include_hp_cancel && "एच.पी. निरस्त",
                                        formData.include_address && "पता परिवर्तन दर्ज",
                                        formData.include_duplicate && "पंजीयन प्रमाण पत्र की द्वितीय प्रति जारी"
                                    ].filter(Boolean).join(" / ") || ".........."
                                }</strong> बाबत्।
                            </div>

                            <div className="pdf-form-divider"></div>

                            {/* Paragraphs */}
                            {formData.include_transfer && (
                                <div className="notesheet-paragraph">
                                    उक्त वाहन को वाहन स्वामी श्री <div className="d-inline-block" style={{ width: getInputWidth(formData.buyer_name, "क्रेता का नाम", 110) }}><TransliteratedInput name="buyer_name" className="rto-input" placeholder="क्रेता का नाम" value={formData.buyer_name || ''} onChange={handleInputChange} /></div> आ. श्री <div className="d-inline-block" style={{ width: getInputWidth(formData.buyer_father, "पिता का नाम", 100) }}><TransliteratedInput name="buyer_father" className="rto-input" placeholder="पिता का नाम" value={formData.buyer_father || ''} onChange={handleInputChange} /></div> निवासी <div className="d-inline-block" style={{ width: getInputWidth(formData.buyer_address, "पता", 140) }}><TransliteratedInput name="buyer_address" className="rto-input" placeholder="पता" value={formData.buyer_address || ''} onChange={handleInputChange} /></div> ने वाहन स्वामी श्री <div className="d-inline-block" style={{ width: getInputWidth(formData.owner_name, "विक्रेता का नाम", 110) }}><TransliteratedInput name="owner_name" className="rto-input" placeholder="विक्रेता का नाम" value={formData.owner_name || ''} onChange={handleInputChange} /></div> आ. श्री <div className="d-inline-block" style={{ width: getInputWidth(formData.owner_father, "पिता का नाम", 100) }}><TransliteratedInput name="owner_father" className="rto-input" placeholder="पिता का नाम" value={formData.owner_father || ''} onChange={handleInputChange} /></div> से क्रय कर स्वामित्व अंतरण हेतु निर्धारित प्रारूप फार्म नं. 29(2 प्रति में) एवं फार्म नं. 30 में विहित् ऑनलाईन शुल्क राशि रू. <input name="transfer_fee" className="rto-input" style={{ width: getInputWidth(formData.transfer_fee, "शुल्क", 50) }} placeholder="शुल्क" value={formData.transfer_fee || ''} onChange={handleInputChange} /> को जमा कर आवेदन दिनांक <input name="application_date" className="rto-input" style={{ width: getInputWidth(formData.application_date, "आवेदन दिनांक", 80) }} placeholder="आवेदन दिनांक" value={formData.application_date || ''} onChange={handleInputChange} /> को कार्यालय में प्रस्तुत किया गया है।
                                </div>
                            )}

                            {formData.include_hp_reg && (
                                <div className="notesheet-paragraph">
                                    एच.पी. दर्ज किये जाने हेतु निर्धारित प्रारूप फार्म नं. 34 में विहित् ऑनलाईन शुल्क राशि रू. <input name="hp_fee" className="rto-input" style={{ width: getInputWidth(formData.hp_fee, "शुल्क", 50) }} placeholder="शुल्क" value={formData.hp_fee || ''} onChange={handleInputChange} /> दिनांक <input name="hp_date" className="rto-input" style={{ width: getInputWidth(formData.hp_date, "दिनांक", 80) }} placeholder="दिनांक" value={formData.hp_date || ''} onChange={handleInputChange} /> को जमा कर आवेदन दिनांक <input name="application_date" className="rto-input" style={{ width: getInputWidth(formData.application_date, "आवेदन दिनांक", 80) }} placeholder="आवेदन दिनांक" value={formData.application_date || ''} onChange={handleInputChange} /> को कार्यालय में प्रस्तुत किया गया है।
                                </div>
                            )}

                            {formData.include_hp_cancel && (
                                <div className="notesheet-paragraph">
                                    एच.पी. निरस्त किये जाने हेतु निर्धारित प्रारूप फार्म नं. 35 में विहित् ऑनलाईन शुल्क राशि रू. <input name="hp_cancel_fee" className="rto-input" style={{ width: getInputWidth(formData.hp_cancel_fee, "शुल्क", 50) }} placeholder="शुल्क" value={formData.hp_cancel_fee || ''} onChange={handleInputChange} /> दिनांक <input name="cancel_date" className="rto-input" style={{ width: getInputWidth(formData.cancel_date, "दिनांक", 80) }} placeholder="दिनांक" value={formData.cancel_date || ''} onChange={handleInputChange} /> को जमा कर आवेदन दिनांक <input name="application_date" className="rto-input" style={{ width: getInputWidth(formData.application_date, "आवेदन दिनांक", 80) }} placeholder="आवेदन दिनांक" value={formData.application_date || ''} onChange={handleInputChange} /> को कार्यालय में प्रस्तुत किया गया है।
                                </div>
                            )}

                            {formData.include_address && (
                                <div className="notesheet-paragraph">
                                    पता परिवर्तन दर्ज किये जाने हेतु निर्धारित प्रारूप फार्म नं. 33 में विहित् ऑनलाईन शुल्क राशि रू. <input name="address_fee" className="rto-input" style={{ width: getInputWidth(formData.address_fee, "शुल्क", 50) }} placeholder="शुल्क" value={formData.address_fee || ''} onChange={handleInputChange} /> दिनांक <input name="application_date" className="rto-input" style={{ width: getInputWidth(formData.application_date, "आवेदन दिनांक", 80) }} placeholder="आवेदन दिनांक" value={formData.application_date || ''} onChange={handleInputChange} /> को जमा कर आवेदन दिनांक <input name="application_date" className="rto-input" style={{ width: getInputWidth(formData.application_date, "आवेदन दिनांक", 80) }} placeholder="आवेदन दिनांक" value={formData.application_date || ''} onChange={handleInputChange} /> को कार्यालय में प्रस्तुत किया गया है।
                                </div>
                            )}

                            {formData.include_duplicate && (
                                <div className="notesheet-paragraph">
                                    पंजीयन प्रमाण पत्र की द्वितीय प्रति जारी किये जाने हेतु निर्धारित प्रारूप फार्म नं. 26 में विहित् ऑनलाईन शुल्क राशि रू. <input name="duplicate_rc_fee" className="rto-input" style={{ width: getInputWidth(formData.duplicate_rc_fee, "शुल्क", 50) }} placeholder="शुल्क" value={formData.duplicate_rc_fee || ''} onChange={handleInputChange} /> दिनांक <input name="application_date" className="rto-input" style={{ width: getInputWidth(formData.application_date, "दिनांक", 80) }} placeholder="दिनांक" value={formData.application_date || ''} onChange={handleInputChange} /> को जमा कर आवेदन दिनांक <input name="application_date" className="rto-input" style={{ width: getInputWidth(formData.application_date, "आवेदन दिनांक", 80) }} placeholder="आवेदन दिनांक" value={formData.application_date || ''} onChange={handleInputChange} /> को कार्यालय में प्रस्तुत किया गया है।
                                </div>
                            )}

                            {formData.include_death && (
                                <div className="notesheet-paragraph">
                                    मूल वाहन स्वामी श्री <div className="d-inline-block" style={{ width: getInputWidth(formData.owner_name, "मृतक का नाम", 110) }}><TransliteratedInput name="owner_name" className="rto-input" placeholder="मृतक का नाम" value={formData.owner_name || ''} onChange={handleInputChange} /></div> की मृत्यु हो जाने के कारण उनके विधिक वारिस श्री <div className="d-inline-block" style={{ width: getInputWidth(formData.applicant_name, "वारिस का नाम", 110) }}><TransliteratedInput name="applicant_name" className="rto-input" placeholder="वारिस का नाम" value={formData.applicant_name || ''} onChange={handleInputChange} /></div> आ. श्री <div className="d-inline-block" style={{ width: getInputWidth(formData.applicant_father, "पिता का नाम", 100) }}><TransliteratedInput name="applicant_father" className="rto-input" placeholder="पिता का नाम" value={formData.applicant_father || ''} onChange={handleInputChange} /></div> निवासी <div className="d-inline-block" style={{ width: getInputWidth(formData.applicant_address, "पता", 140) }}><TransliteratedInput name="applicant_address" className="rto-input" placeholder="पता" value={formData.applicant_address || ''} onChange={handleInputChange} /></div> द्वारा स्वामित्व अंतरण हेतु निर्धारित प्रारूप फार्म नं. 31 में विहित् ऑनलाईन शुल्क राशि रू. <input name="death_transfer_fee" className="rto-input" style={{ width: getInputWidth(formData.death_transfer_fee, "शुल्क", 50) }} placeholder="शुल्क" value={formData.death_transfer_fee || ''} onChange={handleInputChange} /> को जमा कर आवेदन दिनांक <input name="application_date" className="rto-input" style={{ width: getInputWidth(formData.application_date, "आवेदन दिनांक", 80) }} placeholder="आवेदन दिनांक" value={formData.application_date || ''} onChange={handleInputChange} /> को कार्यालय में प्रस्तुत किया गया है।
                                </div>
                            )}

                            {/* Table Title */}
                            <div style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '6px' }}>
                                वाहन क्रमांक <div className="d-inline-block" style={{ width: getInputWidth(formData.registration_number, "वाहन क्रमांक", 90) }}><TransliteratedInput name="registration_number" className="rto-input" placeholder="वाहन क्रमांक" value={formData.registration_number || ''} onChange={handleInputChange} disabled /></div> (वाहन का मॉडल <input name="model_year" className="rto-input" style={{ width: getInputWidth(formData.model_year, "मॉडल वर्ष", 50) }} placeholder="मॉडल वर्ष" value={formData.model_year || ''} onChange={handleInputChange} />) संबंधित जानकारी निम्नानुसार है:-
                            </div>

                            {/* Table */}
                            <table className="notesheet-table">
                                <tbody>
                                    <tr className={!rowVisibility[1] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-1"
                                                checked={rowVisibility[1]} 
                                                onChange={() => toggleRow(1)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(1)}</td>
                                        <td className="label-cell">वर्तमान वाहन स्वामी/विक्रेता का नाम पिता व वर्तमान पता</td>
                                        <td className="value-cell" style={{ lineHeight: '1.8' }}>
                                            <div className="d-flex gap-2 mb-1">
                                                <div style={{ flex: 1 }}><TransliteratedInput name="owner_name" className="rto-input w-100" placeholder="स्वामी का नाम" value={formData.owner_name || ''} onChange={handleInputChange} /></div>
                                                <div style={{ flex: 1 }}><TransliteratedInput name="owner_father" className="rto-input w-100" placeholder="पिता का नाम" value={formData.owner_father || ''} onChange={handleInputChange} /></div>
                                            </div>
                                            <div><TransliteratedInput name="owner_address" className="rto-input w-100" placeholder="पता" value={formData.owner_address || ''} onChange={handleInputChange} /></div>
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[2] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-2"
                                                checked={rowVisibility[2]} 
                                                onChange={() => toggleRow(2)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(2)}</td>
                                        <td className="label-cell">प्रस्तावित वाहन स्वामी/क्रेता का नाम पिता व वर्तमान पता</td>
                                        <td className="value-cell" style={{ lineHeight: '1.8' }}>
                                            {formData.include_death ? (
                                                <>
                                                    <div className="d-flex gap-2 mb-1">
                                                        <div style={{ flex: 1 }}><TransliteratedInput name="applicant_name" className="rto-input w-100" placeholder="वारिस का नाम" value={formData.applicant_name || ''} onChange={handleInputChange} /></div>
                                                        <div style={{ flex: 1 }}><TransliteratedInput name="applicant_father" className="rto-input w-100" placeholder="पिता का नाम" value={formData.applicant_father || ''} onChange={handleInputChange} /></div>
                                                    </div>
                                                    <div><TransliteratedInput name="applicant_address" className="rto-input w-100" placeholder="पता" value={formData.applicant_address || ''} onChange={handleInputChange} /></div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="d-flex gap-2 mb-1">
                                                        <div style={{ flex: 1 }}><TransliteratedInput name="buyer_name" className="rto-input w-100" placeholder="क्रेता का नाम" value={formData.buyer_name || ''} onChange={handleInputChange} /></div>
                                                        <div style={{ flex: 1 }}><TransliteratedInput name="buyer_father" className="rto-input w-100" placeholder="पिता का नाम" value={formData.buyer_father || ''} onChange={handleInputChange} /></div>
                                                    </div>
                                                    <div><TransliteratedInput name="buyer_address" className="rto-input w-100" placeholder="पता" value={formData.buyer_address || ''} onChange={handleInputChange} /></div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[3] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-3"
                                                checked={rowVisibility[3]} 
                                                onChange={() => toggleRow(3)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(3)}</td>
                                        <td className="label-cell">वाहन का पंजीयन दिनांक</td>
                                        <td className="value-cell">
                                            <input name="registration_date" className="rto-input" style={{ width: getInputWidth(formData.registration_date, "पंजीयन दिनांक", 100) }} placeholder="e.g. 24-05-2018" value={formData.registration_date || ''} onChange={handleInputChange} />
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[4] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-4"
                                                checked={rowVisibility[4]} 
                                                onChange={() => toggleRow(4)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(4)}</td>
                                        <td className="label-cell">चेसिस क्रमांक</td>
                                        <td className="value-cell">
                                            <input name="chassis_number" className="rto-input" style={{ width: getInputWidth(formData.chassis_number, "चेसिस क्रमांक", 160) }} placeholder="चेसिस क्रमांक" value={formData.chassis_number || ''} onChange={handleInputChange} />
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[5] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-5"
                                                checked={rowVisibility[5]} 
                                                onChange={() => toggleRow(5)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(5)}</td>
                                        <td className="label-cell">इंजन क्रमांक</td>
                                        <td className="value-cell">
                                            <input name="engine_number" className="rto-input" style={{ width: getInputWidth(formData.engine_number, "इंजन क्रमांक", 130) }} placeholder="इंजन क्रमांक" value={formData.engine_number || ''} onChange={handleInputChange} />
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[6] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-6"
                                                checked={rowVisibility[6]} 
                                                onChange={() => toggleRow(6)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(6)}</td>
                                        <td className="label-cell">वाहन का मोटरयान कर की जमा दिनांक</td>
                                        <td className="value-cell">
                                            दिनांक <input name="tax_paid_date" className="rto-input" style={{ width: getInputWidth(formData.tax_paid_date, "टैक्स जमा दिनांक", 100) }} placeholder="e.g. 15-02-2025" value={formData.tax_paid_date || ''} onChange={handleInputChange} /> (शुल्क ₹<input name="tax_amount" className="rto-input" style={{ width: getInputWidth(formData.tax_amount, "कर राशि", 70) }} placeholder="कर राशि" value={formData.tax_amount || ''} onChange={handleInputChange} />/-)
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[7] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-7"
                                                checked={rowVisibility[7]} 
                                                onChange={() => toggleRow(7)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(7)}</td>
                                        <td className="label-cell">वाहन का परमिट (यदि लागू हो तो)</td>
                                        <td className="value-cell">
                                            <input name="permit_validity" className="rto-input" style={{ width: getInputWidth(formData.permit_validity, "वैधता दिनांक", 160) }} placeholder="e.g. 10-12-2027" value={formData.permit_validity || ''} onChange={handleInputChange} />
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[8] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-8"
                                                checked={rowVisibility[8]} 
                                                onChange={() => toggleRow(8)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(8)}</td>
                                        <td className="label-cell">वाहन का फिटनेस/पंजीयन प्रमाण पत्र की वैधता</td>
                                        <td className="value-cell">
                                            वैधता दिनांक <input name="fitness_validity" className="rto-input" style={{ width: getInputWidth(formData.fitness_validity, "वैधता दिनांक", 100) }} placeholder="e.g. 23-05-2033" value={formData.fitness_validity || ''} onChange={handleInputChange} />
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[9] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-9"
                                                checked={rowVisibility[9]} 
                                                onChange={() => toggleRow(9)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(9)}</td>
                                        <td className="label-cell">वाहन का प्रदूषण जांच प्रमाण पत्र की वैधता</td>
                                        <td className="value-cell">
                                            वैता दिनांक <input name="pollution_validity" className="rto-input" style={{ width: getInputWidth(formData.pollution_validity, "वैधता दिनांक", 100) }} placeholder="e.g. 14-11-2026" value={formData.pollution_validity || ''} onChange={handleInputChange} />
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[10] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-10"
                                                checked={rowVisibility[10]} 
                                                onChange={() => toggleRow(10)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(10)}</td>
                                        <td className="label-cell">वित्त-पोषक का नाम</td>
                                        <td className="value-cell">
                                            <div className="d-inline-block" style={{ width: getInputWidth(formData.current_hpa, "फाइनेंसर का नाम", 160) }}><TransliteratedInput name="current_hpa" className="rto-input" placeholder="e.g. NA / SBI" value={formData.current_hpa || ''} onChange={handleInputChange} /></div>
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[11] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-11"
                                                checked={rowVisibility[11]} 
                                                onChange={() => toggleRow(11)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(11)}</td>
                                        <td className="label-cell">पुलिस जांच/चोरी संबंधी स्थिति एन.सी.आर.बी. रिपोर्ट</td>
                                        <td className="value-cell">
                                            <Form.Select name="ncrb_report" className="rto-input" style={{ width: getInputWidth(formData.ncrb_report, "", 160), display: 'inline-block' }} value={formData.ncrb_report || 'yes'} onChange={handleInputChange}>
                                                <option value="yes">चोरी/अपराध में संलिप्त नहीं</option>
                                                <option value="no">संलग्न नहीं</option>
                                            </Form.Select>
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[12] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-12"
                                                checked={rowVisibility[12]} 
                                                onChange={() => toggleRow(12)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(12)}</td>
                                        <td className="label-cell">एफ.आई.आर. की प्रति</td>
                                        <td className="value-cell">
                                            <Form.Select name="fir_attached" className="rto-input" style={{ width: getInputWidth(formData.fir_attached, "", 160), display: 'inline-block' }} value={formData.fir_attached || 'no'} onChange={handleInputChange}>
                                                <option value="no">लागू नहीं (NA)</option>
                                                <option value="yes">हाँ, गुमशुदगी रिपोर्ट/सनहा की प्रति संलग्न</option>
                                            </Form.Select>
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[13] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-13"
                                                checked={rowVisibility[13]} 
                                                onChange={() => toggleRow(13)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(13)}</td>
                                        <td className="label-cell">वाहन स्वामी एवं क्रेता द्वारा वाहन संबंधी समस्त जवाबदारी लेते हुए शपथपत्र प्रस्तुत किया गया है।</td>
                                        <td className="value-cell">
                                            <Form.Select name="affidavit_attached" className="rto-input" style={{ width: getInputWidth(formData.affidavit_attached, "", 160), display: 'inline-block' }} value={formData.affidavit_attached || 'yes'} onChange={handleInputChange}>
                                                <option value="yes">हाँ, शपथपत्र संलग्न है</option>
                                                <option value="no">संलग्न नहीं</option>
                                            </Form.Select>
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[14] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-14"
                                                checked={rowVisibility[14]} 
                                                onChange={() => toggleRow(14)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(14)}</td>
                                        <td className="label-cell">वाहन का भौतिक सत्यापन दिनांक</td>
                                        <td className="value-cell">
                                            दिनांक <input name="physical_verification_date" className="rto-input" style={{ width: getInputWidth(formData.physical_verification_date, "सत्यापन दिनांक", 100) }} placeholder="e.g. 26-05-2026" value={formData.physical_verification_date || ''} onChange={handleInputChange} />
                                        </td>
                                    </tr>
                                    <tr className={!rowVisibility[15] ? 'row-disabled' : ''}>
                                        <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                            <Form.Check 
                                                type="switch" 
                                                id="toggle-row-15"
                                                checked={rowVisibility[15]} 
                                                onChange={() => toggleRow(15)} 
                                            />
                                        </td>
                                        <td className="sno">{getSNo(15)}</td>
                                        <td className="label-cell">हस्ताक्षर मिलान हेतु मूल नस्ती संलग्न है।</td>
                                        <td className="value-cell">
                                            <Form.Select name="original_file_attached" className="rto-input" style={{ width: getInputWidth(formData.original_file_attached, "", 160), display: 'inline-block' }} value={formData.original_file_attached || 'yes'} onChange={handleInputChange}>
                                                <option value="yes">हाँ, मूल नस्ती संलग्न है</option>
                                                <option value="no">नहीं, मूल नस्ती संलग्न नहीं है</option>
                                            </Form.Select>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Closing Paragraph */}
                            <div className="notesheet-paragraph" style={{ textIndent: '0px' }}>
                                अतः वाहन क्रमांक <strong>{formData.registration_number || '.......'}</strong> का <strong>{
                                    [
                                        formData.include_transfer && "स्वामित्व अंतरण",
                                        formData.include_death && "स्वामित्व अंतरण (मृत्यु उपरांत)",
                                        formData.include_hp_reg && "एच.पी. दर्ज",
                                        formData.include_hp_cancel && "एच.पी. निरस्त",
                                        formData.include_address && "पता परिवर्तन दर्ज",
                                        formData.include_duplicate && "पंजीयन प्रमाण पत्र की द्वितीय प्रति जारी"
                                    ].filter(Boolean).join(" / ") || ".........."
                                }</strong>
                                {(formData.original_file_attached === 'no' || formData.original_file_attached === false) ? (
                                    <span> किये जाने हेतु <strong>मूल नस्ती प्राप्त नहीं होने की स्थिति में फार्म-20 में नोटरी द्वारा सत्यापित कर</strong></span>
                                ) : (
                                    <span> करने हेतु <strong>मूल नस्ती सहित</strong></span>
                                )} नियमानुसार अवलोकनार्थ एवं उचित आदेशार्थ सादर प्रस्तुत है।
                            </div>

                            {/* Signature */}
                            <div className="notesheet-signature" style={{ textAlign: 'right', fontWeight: 'bold', marginTop: '15px', marginBottom: '100px' }}>
                                शाखा प्रभारी
                            </div>
                        </div>
                    )}

                    {/* FORM 29 */}
                    {formType === 'Form 29' && (
                        <div>
                            <div className="pdf-form-title">FORM 29</div>
                            <div className="pdf-form-subtitle">[See Rule 55 (1)]<br />FORM OF NOTICE OF TRANSFER OF OWNERSHIP OF A MOTOR VEHICLE</div>
                            
                            <div className="pdf-form-divider"></div>
                            
                            <div>To,</div>
                            <div>The Registering Authority,</div>
                            <div className="mb-4 d-inline-block" style={{ width: '220px' }}>
                                <TransliteratedInput 
                                    name="registering_authority" 
                                    className="rto-input" 
                                    style={{ textAlign: 'left' }} 
                                    placeholder="Authority Name (e.g. Dhamtari)" 
                                    value={formData.registering_authority || ''} 
                                    onChange={handleInputChange} 
                                />
                            </div>

                            <div className="notesheet-paragraph" style={{ display: 'inline' }}>
                                I/We <div className="d-inline-block" style={{ width: '260px' }}><TransliteratedInput name="seller_name" className="rto-input" placeholder="Seller/Transferor Name" value={formData.seller_name || ''} onChange={handleInputChange} /></div> residing at <div className="d-inline-block" style={{ width: '380px' }}><TransliteratedInput name="seller_address" className="rto-input" placeholder="Seller Address" value={formData.seller_address || ''} onChange={handleInputChange} /></div> have on the <input name="sale_day" className="rto-input" style={{ width: '50px' }} placeholder="Day" value={formData.sale_day || ''} onChange={handleInputChange} /> day of <div className="d-inline-block" style={{ width: '100px' }}><TransliteratedInput name="sale_month" className="rto-input" placeholder="Month" value={formData.sale_month || ''} onChange={handleInputChange} /></div> of the year <input name="sale_year" className="rto-input" style={{ width: '70px' }} placeholder="Year" value={formData.sale_year || ''} onChange={handleInputChange} /> transferred my/our Motor Vehicle No. <div className="d-inline-block" style={{ width: '180px' }}><TransliteratedInput name="registration_number" className="rto-input" placeholder="Vehicle Number" value={formData.registration_number || ''} onChange={handleInputChange} /></div> to Shri/Smt <div className="d-inline-block" style={{ width: '260px' }}><TransliteratedInput name="buyer_name" className="rto-input" placeholder="Buyer/Transferee Name" value={formData.buyer_name || ''} onChange={handleInputChange} /></div> son/wife/daughter of <div className="d-inline-block" style={{ width: '220px' }}><TransliteratedInput name="buyer_father" className="rto-input" placeholder="Buyer Father Name" value={formData.buyer_father || ''} onChange={handleInputChange} /></div> residing at <div className="d-inline-block" style={{ width: '380px' }}><TransliteratedInput name="buyer_address" className="rto-input" placeholder="Buyer Address" value={formData.buyer_address || ''} onChange={handleInputChange} /></div>.
                            </div>

                            <div className="notesheet-paragraph mt-4">
                                The Registration Certificate and Insurance Certificate have been handed over to the transferee. The vehicle is not superdari and is free from all encumbrances.
                            </div>

                            <div className="d-flex justify-content-between signature-block">
                                <div>
                                    Date: <input name="handover_date" className="rto-input" style={{ width: '140px' }} placeholder="Date" value={formData.handover_date || ''} onChange={handleInputChange} />
                                </div>
                                <div className="d-flex flex-column align-items-center">
                                    <div className="signature-box">Signature of Transferor (Seller)</div>
                                    <div className="d-inline-block mt-2" style={{ width: '200px' }}><TransliteratedInput name="transferor_sign_name" className="rto-input" placeholder="Name of Transferor" value={formData.transferor_sign_name || ''} onChange={handleInputChange} /></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FORM 30 */}
                    {formType === 'Form 30' && (
                        <div>
                            <div className="pdf-form-title">FORM 30</div>
                            <div className="pdf-form-subtitle">[See Rule 55 (2) and (3)]<br />REPORT OF TRANSFER OF OWNERSHIP OF A MOTOR VEHICLE</div>
                            
                            <div className="pdf-form-divider"></div>

                            <div className="form-section-title">PART I - FOR THE USE OF THE TRANSFEROR (SELLER)</div>
                            <div>To,</div>
                            <div>The Registering Authority,</div>
                            <div className="mb-3 d-inline-block" style={{ width: '220px' }}>
                                <TransliteratedInput name="registering_authority" className="rto-input" style={{ textAlign: 'left' }} placeholder="Authority Name" value={formData.registering_authority || ''} onChange={handleInputChange} />
                            </div>

                            <div>
                                I, <div className="d-inline-block" style={{ width: '260px' }}><TransliteratedInput name="seller_name" className="rto-input" placeholder="Seller Name" value={formData.seller_name || ''} onChange={handleInputChange} /></div> have on this day of <input name="sale_date" className="rto-input" style={{ width: '150px' }} placeholder="Sale Date" value={formData.sale_date || ''} onChange={handleInputChange} /> sold my motor vehicle number <div className="d-inline-block" style={{ width: '180px' }}><TransliteratedInput name="registration_number" className="rto-input" placeholder="Vehicle Number" value={formData.registration_number || ''} onChange={handleInputChange} /></div> to Shri/Smt <div className="d-inline-block" style={{ width: '260px' }}><TransliteratedInput name="buyer_name" className="rto-input" placeholder="Buyer Name" value={formData.buyer_name || ''} onChange={handleInputChange} /></div> residing at <div className="d-inline-block" style={{ width: '400px' }}><TransliteratedInput name="buyer_address" className="rto-input" placeholder="Buyer Address" value={formData.buyer_address || ''} onChange={handleInputChange} /></div> and hand over the RC and Insurance to him/her.
                            </div>

                            <div className="d-flex justify-content-end signature-block">
                                <div className="d-flex flex-column align-items-center">
                                    <div className="signature-box">Signature of Transferor (Seller)</div>
                                    <span>Date: <input name="seller_sign_date" className="rto-input" style={{ width: '120px' }} placeholder="Date" value={formData.seller_sign_date || ''} onChange={handleInputChange} /></span>
                                </div>
                            </div>

                            <div className="form-section-title mt-4">PART II - FOR THE USE OF THE TRANSFEREE (BUYER)</div>
                            <div className="mt-2">
                                I, <div className="d-inline-block" style={{ width: '260px' }}><TransliteratedInput name="buyer_name" className="rto-input" placeholder="Buyer Name" value={formData.buyer_name || ''} onChange={handleInputChange} disabled /></div> residing at <div className="d-inline-block" style={{ width: '400px' }}><TransliteratedInput name="buyer_address" className="rto-input" placeholder="Buyer Address" value={formData.buyer_address || ''} onChange={handleInputChange} disabled /></div> hereby report that ownership of vehicle number <div className="d-inline-block" style={{ width: '180px' }}><TransliteratedInput name="registration_number" className="rto-input" placeholder="Vehicle Number" value={formData.registration_number || ''} onChange={handleInputChange} disabled /></div> has been transferred to me with effect from <input name="sale_date" className="rto-input" style={{ width: '150px' }} placeholder="Date" value={formData.sale_date || ''} disabled />. I enclose the required forms, fees, and certificates.
                            </div>

                            <div className="d-flex justify-content-end signature-block">
                                <div className="d-flex flex-column align-items-center">
                                    <div className="signature-box">Signature of Transferee (Buyer)</div>
                                    <span>Date: <input name="buyer_sign_date" className="rto-input" style={{ width: '120px' }} placeholder="Date" value={formData.buyer_sign_date || ''} onChange={handleInputChange} /></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FORM 33 */}
                    {formType === 'Form 33' && (
                        <div>
                            <div className="pdf-form-title">FORM 33</div>
                            <div className="pdf-form-subtitle">[See Rule 59]<br />INTIMATION OF CHANGE OF ADDRESS TO BE RECORDED IN THE REGISTRATION CERTIFICATE</div>
                            
                            <div className="pdf-form-divider"></div>
                            
                            <div>To,</div>
                            <div>The Registering Authority,</div>
                            <div className="mb-4 d-inline-block" style={{ width: '220px' }}>
                                <TransliteratedInput name="registering_authority" className="rto-input" style={{ textAlign: 'left' }} placeholder="Authority Name" value={formData.registering_authority || ''} onChange={handleInputChange} />
                            </div>

                            <div className="notesheet-paragraph">
                                I/We <div className="d-inline-block" style={{ width: '280px' }}><TransliteratedInput name="owner_name" className="rto-input" placeholder="Owner Name" value={formData.owner_name || ''} onChange={handleInputChange} /></div> son/wife/daughter of <div className="d-inline-block" style={{ width: '220px' }}><TransliteratedInput name="owner_father" className="rto-input" placeholder="Father Name" value={formData.owner_father || ''} onChange={handleInputChange} /></div> residing at old address <div className="d-inline-block" style={{ width: '380px' }}><TransliteratedInput name="old_address" className="rto-input" placeholder="Old Registered Address" value={formData.old_address || ''} onChange={handleInputChange} /></div> hereby intimate that I/we have changed my/our address and moved to new address <div className="d-inline-block" style={{ width: '380px' }}><TransliteratedInput name="new_address" className="rto-input" placeholder="New Address" value={formData.new_address || ''} onChange={handleInputChange} /></div> with effect from date <input name="change_date" className="rto-input" style={{ width: '150px' }} placeholder="Date of Address Change" value={formData.change_date || ''} onChange={handleInputChange} />.
                            </div>

                            <div className="notesheet-paragraph mt-3">
                                The Registration Certificate of the Motor Vehicle No. <div className="d-inline-block" style={{ width: '180px' }}><TransliteratedInput name="registration_number" className="rto-input" placeholder="Vehicle Number" value={formData.registration_number || ''} onChange={handleInputChange} /></div> is enclosed for recording the change of address.
                            </div>

                            <div className="d-flex justify-content-between signature-block">
                                <div>
                                    Date: <input name="owner_signature_date" className="rto-input" style={{ width: '140px' }} placeholder="Date" value={formData.owner_signature_date || ''} onChange={handleInputChange} />
                                </div>
                                <div className="d-flex flex-column align-items-center">
                                    <div className="signature-box">Signature of Owner</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FORM 34 */}
                    {formType === 'Form 34' && (
                        <div>
                            <div className="pdf-form-title">FORM 34</div>
                            <div className="pdf-form-subtitle">[See Rule 60]<br />APPLICATION FOR MAKING AN ENTRY OF AN AGREEMENT OF HIRE-PURCHASE / LEASE / HYPOTHECATION SUBSEQUENT TO REGISTRATION</div>
                            
                            <div className="pdf-form-divider"></div>
                            
                            <div>To,</div>
                            <div>The Registering Authority,</div>
                            <div className="mb-4 d-inline-block" style={{ width: '220px' }}>
                                <TransliteratedInput name="registering_authority" className="rto-input" style={{ textAlign: 'left' }} placeholder="Authority Name" value={formData.registering_authority || ''} onChange={handleInputChange} />
                            </div>

                            <div className="notesheet-paragraph">
                                The motor vehicle No. <div className="d-inline-block" style={{ width: '180px' }}><TransliteratedInput name="registration_number" className="rto-input" placeholder="Vehicle Number" value={formData.registration_number || ''} onChange={handleInputChange} /></div> is registered in the name of <div className="d-inline-block" style={{ width: '280px' }}><TransliteratedInput name="owner_name" className="rto-input" placeholder="Owner Name" value={formData.owner_name || ''} onChange={handleInputChange} /></div> residing at <div className="d-inline-block" style={{ width: '380px' }}><TransliteratedInput name="owner_address" className="rto-input" placeholder="Owner Address" value={formData.owner_address || ''} onChange={handleInputChange} /></div> and is subject to an agreement of Hire-Purchase / Lease / Hypothecation entered into between the owner and financier <div className="d-inline-block" style={{ width: '280px' }}><TransliteratedInput name="financier_name" className="rto-input" placeholder="Bank/Financier Name" value={formData.financier_name || ''} onChange={handleInputChange} /></div> residing at/having branch at <div className="d-inline-block" style={{ width: '380px' }}><TransliteratedInput name="financier_address" className="rto-input" placeholder="Financier Address" value={formData.financier_address || ''} onChange={handleInputChange} /></div>.
                            </div>

                            <div className="notesheet-paragraph mt-2">
                                It is requested that an entry of the said agreement be made in the Registration Certificate on date <input name="agreement_date" className="rto-input" style={{ width: '150px' }} placeholder="Agreement Date" value={formData.agreement_date || ''} onChange={handleInputChange} />.
                            </div>

                            <div className="d-flex justify-content-between signature-block">
                                <div className="d-flex flex-column align-items-center">
                                    <div className="signature-box">Signature of Owner</div>
                                    <span>Date: <input name="owner_sign_date" className="rto-input" style={{ width: '120px' }} placeholder="Date" value={formData.owner_sign_date || ''} onChange={handleInputChange} /></span>
                                </div>
                                <div className="d-flex flex-column align-items-center">
                                    <div className="signature-box">Signature of Financier</div>
                                    <span>Date: <input name="financier_sign_date" className="rto-input" style={{ width: '120px' }} placeholder="Date" value={formData.financier_sign_date || ''} onChange={handleInputChange} /></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FORM 35 */}
                    {formType === 'Form 35' && (
                        <div>
                            <div className="pdf-form-title">FORM 35</div>
                            <div className="pdf-form-subtitle">[See Rule 61 (1)]<br />NOTICE OF TERMINATION OF AGREEMENT OF HIRE-PURCHASE / LEASE / HYPOTHECATION</div>
                            
                            <div className="pdf-form-divider"></div>
                            
                            <div>To,</div>
                            <div>The Registering Authority,</div>
                            <div className="mb-4 d-inline-block" style={{ width: '220px' }}>
                                <TransliteratedInput name="registering_authority" className="rto-input" style={{ textAlign: 'left' }} placeholder="Authority Name" value={formData.registering_authority || ''} onChange={handleInputChange} />
                            </div>

                            <div className="notesheet-paragraph">
                                We hereby declare that the agreement of Hire-Purchase / Lease / Hypothecation entered into between owner <div className="d-inline-block" style={{ width: '280px' }}><TransliteratedInput name="owner_name" className="rto-input" placeholder="Owner Name" value={formData.owner_name || ''} onChange={handleInputChange} /></div> residing at <div className="d-inline-block" style={{ width: '380px' }}><TransliteratedInput name="owner_address" className="rto-input" placeholder="Owner Address" value={formData.owner_address || ''} onChange={handleInputChange} /></div> and financier <div className="d-inline-block" style={{ width: '280px' }}><TransliteratedInput name="financier_name" className="rto-input" placeholder="Bank/Financier Name" value={formData.financier_name || ''} onChange={handleInputChange} /></div> residing at <div className="d-inline-block" style={{ width: '380px' }}><TransliteratedInput name="financier_address" className="rto-input" placeholder="Financier Address" value={formData.financier_address || ''} onChange={handleInputChange} /></div> in respect of vehicle No. <div className="d-inline-block" style={{ width: '180px' }}><TransliteratedInput name="registration_number" className="rto-input" placeholder="Vehicle Number" value={formData.registration_number || ''} onChange={handleInputChange} /></div> has been terminated on date <input name="termination_date" className="rto-input" style={{ width: '150px' }} placeholder="Termination Date" value={formData.termination_date || ''} onChange={handleInputChange} />.
                            </div>

                            <div className="notesheet-paragraph mt-2">
                                It is requested that the entry in respect of the said agreement in the Registration Certificate be cancelled.
                            </div>

                            <div className="d-flex justify-content-between signature-block">
                                <div className="d-flex flex-column align-items-center">
                                    <div className="signature-box">Signature of Owner</div>
                                    <span>Date: <input name="owner_sign_date" className="rto-input" style={{ width: '120px' }} placeholder="Date" value={formData.owner_sign_date || ''} onChange={handleInputChange} /></span>
                                </div>
                                <div className="d-flex flex-column align-items-center">
                                    <div className="signature-box">Signature of Financier (with Seal)</div>
                                    <span>Date: <input name="financier_sign_date" className="rto-input" style={{ width: '120px' }} placeholder="Date" value={formData.financier_sign_date || ''} onChange={handleInputChange} /></span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <div className="d-flex justify-content-center gap-3 mt-4 no-print">
                <Button variant="outline-secondary" className="px-4 py-2" onClick={() => navigate('/forms')}>
                    Cancel
                </Button>
                <Button className="btn-primary-gradient px-5 py-2 rounded-3" onClick={handleSave} disabled={loading}>
                    {loading ? <Spinner size="sm" /> : <><i className="bi bi-save me-2"></i>Save Details</>}
                </Button>
            </div>
        </div>
    );
};

export default FormFiller;
