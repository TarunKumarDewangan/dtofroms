import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import WorkSelector from './WorkSelector';
import DynamicForm from './DynamicForm';
import NotesheetPreview from './NotesheetPreview';
import AdBanner from '../Common/AdBanner';
import { Card, Button, Alert, Spinner, Row, Col, Badge, Table, Form } from 'react-bootstrap';

const NotesheetBuilder = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const stepParam = searchParams.get('step');

    const [step, setStep] = useState(1);
    const [vehicle, setVehicle] = useState(null);
    const [regNumber, setRegNumber] = useState('');
    const [selectedWorks, setSelectedWorks] = useState([]);
    const [isBlankNotesheet, setIsBlankNotesheet] = useState(false);
    const [generatedNotesheet, setGeneratedNotesheet] = useState(null);
    const [workOptions, setWorkOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [vehicleClassSelect, setVehicleClassSelect] = useState('Motor Car');
    const [customVehicleType, setCustomVehicleType] = useState('');
    const [newVehicleData, setNewVehicleData] = useState({
        registration_number: '',
        owner_name: '',
        owner_father_name: '',
        owner_address: '',
        vehicle_type: 'Motor Car',
        model_year: '',
        chassis_number: '',
        engine_number: '',
        fitness_validity: '',
        insurance_validity: '',
        tax_amount: '',
        tax_paid_date: '',
        permit_validity: '',
        pollution_validity: '',
        current_hpa: 'NA',
        ncrb_report_status: 'no',
    });

    const fromFormId = searchParams.get('fromForm');

    useEffect(() => {
        fetchWorkOptions();
        if (editId) {
            loadNotesheetForEdit(editId);
        } else if (fromFormId) {
            loadNotesheetFromForm(fromFormId);
        }
    }, [editId, fromFormId, stepParam]);

    const loadNotesheetForEdit = async (id) => {
        setLoading(true);
        try {
            const res = await api.get(`/notesheets/${id}`);
            const ns = res.data;
            setVehicle(ns.vehicle);
            setRegNumber(ns.vehicle.registration_number);
            setSelectedWorks(ns.combined_works);
            setGeneratedNotesheet(ns);
            if (ns.content && ns.content.is_blank) {
                setIsBlankNotesheet(true);
            }
            const initialStep = stepParam ? parseInt(stepParam) : 3;
            setStep(initialStep);
        } catch (err) {
            console.error('Edit load error:', err);
            setError('Failed to load notesheet draft for editing.');
        } finally {
            setLoading(false);
        }
    };

    const loadNotesheetFromForm = async (formId) => {
        setLoading(true);
        setError('');
        try {
            const formRes = await api.get(`/filled-forms/${formId}`);
            const form = formRes.data;
            const regNo = (form.registration_number || '').trim().toUpperCase();
            setRegNumber(regNo);

            const typeMapping = {
                'Form 29': 'OWN_TRANSFER',
                'Form 30': 'OWN_TRANSFER',
                'Form 33': 'ADDRESS_CHANGE',
                'Form 34': 'HP_REGISTER',
                'Form 35': 'HP_CANCEL'
            };
            const targetCode = typeMapping[form.form_type];

            let activeWorks = [];
            if (targetCode) {
                const resOpts = await api.get('/works');
                const matchedWork = resOpts.data.find(w => w.work_code === targetCode);
                if (matchedWork) {
                    activeWorks = [matchedWork];
                    setSelectedWorks(activeWorks);
                }
            }

            const fd = form.form_data || {};
            const initialContent = {
                application_date: new Date().toISOString().split('T')[0],
                buyer_name: fd.buyer_name || '',
                buyer_father: fd.buyer_father || '',
                buyer_address: fd.buyer_address || '',
                sale_date: fd.sale_date || (fd.sale_year && fd.sale_month && fd.sale_day ? `${fd.sale_year}-${String(fd.sale_month).padStart(2, '0')}-${String(fd.sale_day).padStart(2, '0')}` : ''),
                transfer_fee: fd.transfer_fee || '',
                new_address: fd.new_address || '',
                address_fee: fd.address_fee || '',
                hp_bank_name: fd.financier_name || '',
                hp_fee: fd.hp_fee || '',
                hp_date: fd.agreement_date || '',
                cancel_bank_name: fd.financier_name || '',
                hp_cancel_fee: fd.hp_cancel_fee || '',
                cancel_date: fd.termination_date || '',
                affidavit_attached: 'yes',
                ncrb_report: 'no'
            };

            setGeneratedNotesheet({
                content: initialContent
            });

            if (regNo) {
                try {
                    const vehRes = await api.get(`/vehicles/search/${regNo}`);
                    setVehicle(vehRes.data);
                    setStep(3);
                } catch (vehErr) {
                    setError('वाहन डेटाबेस में नहीं मिला। कृपया नोटशीट बनाने से पहले नीचे दिए गए फॉर्म का उपयोग करके इसे डेटाबेस में जोड़ें।');
                    setShowAddForm(true);
                    const initialClass = ['Motor Car', 'Motor Cab', 'Maxi Cab', 'Omni Bus Private use'].includes(fd.vehicle_type) 
                        ? fd.vehicle_type 
                        : (fd.vehicle_type ? 'Other' : 'Motor Car');
                    setVehicleClassSelect(initialClass);
                    setCustomVehicleType(initialClass === 'Other' ? fd.vehicle_type : '');
                    setNewVehicleData({
                        registration_number: regNo,
                        owner_name: fd.seller_name || fd.owner_name || '',
                        owner_father_name: fd.seller_father || fd.owner_father || '',
                        owner_address: fd.seller_address || fd.owner_address || '',
                        vehicle_type: fd.vehicle_type || 'Motor Car',
                        model_year: fd.sale_year || '',
                        chassis_number: '',
                        engine_number: '',
                        fitness_validity: '',
                        insurance_validity: '',
                        tax_amount: '',
                        tax_paid_date: '',
                        permit_validity: '',
                        pollution_validity: '',
                        current_hpa: fd.financier_name || 'NA',
                        ncrb_report_status: 'no',
                    });
                    setStep(1);
                }
            }
        } catch (err) {
            console.error('Error loading notesheet from form:', err);
            setError('भरे हुए फॉर्म से डेटा लोड करने में त्रुटि हुई।');
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkOptions = async () => {
        try {
            const res = await api.get('/works');
            setWorkOptions(res.data);
        } catch (err) { console.error(err); }
    };

    const searchVehicle = async () => {
        if (!regNumber.trim()) return;
        setLoading(true);
        setError('');
        setShowAddForm(false);
        try {
            const res = await api.get(`/vehicles/search/${regNumber.trim()}`);
            const veh = res.data;
            if (isBlankNotesheet) {
                veh.is_blank_notesheet = true;
            }
            setVehicle(veh);
            setStep(2);
        } catch (err) {
            if (isBlankNotesheet) {
                try {
                    const placeholderVehicle = {
                        registration_number: regNumber.trim().toUpperCase(),
                        owner_name: '.....................',
                        owner_father_name: '.....................',
                        owner_address: '.....................',
                        vehicle_type: '.....................',
                        model_year: '.....................',
                        chassis_number: '.....................',
                        engine_number: '.....................',
                        fitness_validity: '1970-01-01',
                        insurance_validity: '1970-01-01',
                        tax_amount: 0,
                        tax_paid_date: '1970-01-01',
                        ncrb_report_status: 'no'
                    };
                    const createRes = await api.post('/vehicles', placeholderVehicle);
                    const newVeh = createRes.data.vehicle;
                    newVeh.is_blank_notesheet = true;
                    setVehicle(newVeh);
                    setStep(2);
                } catch (createErr) {
                    console.error('Placeholder creation error:', createErr);
                    setError('Error creating blank notesheet vehicle.');
                }
            } else {
                setError('वाहन डेटाबेस में नहीं मिला। आप नीचे दिए गए फॉर्म का उपयोग करके इसे जोड़ सकते हैं। (Vehicle not found in database. You can add it using the form below.)');
                setShowAddForm(true);
                setVehicleClassSelect('Motor Car');
                setCustomVehicleType('');
                setNewVehicleData({
                    registration_number: regNumber.trim().toUpperCase(),
                    owner_name: '',
                    owner_father_name: '',
                    owner_address: '',
                    vehicle_type: 'Motor Car',
                    model_year: '',
                    chassis_number: '',
                    engine_number: '',
                    fitness_validity: '',
                    insurance_validity: '',
                    tax_amount: '',
                    tax_paid_date: '',
                    permit_validity: '',
                    pollution_validity: '',
                    current_hpa: 'NA',
                    ncrb_report_status: 'no',
                });
            }
        } finally { setLoading(false); }
    };

    const handleNewVehicleChange = (e) => {
        setNewVehicleData({
            ...newVehicleData,
            [e.target.name]: e.target.value
        });
    };

    const handleVehicleClassChange = (e) => {
        const val = e.target.value;
        setVehicleClassSelect(val);
        if (val !== 'Other') {
            setNewVehicleData(prev => ({ ...prev, vehicle_type: val }));
        } else {
            setNewVehicleData(prev => ({ ...prev, vehicle_type: customVehicleType || '' }));
        }
    };

    const handleCustomVehicleTypeChange = (e) => {
        const val = e.target.value;
        setCustomVehicleType(val);
        setNewVehicleData(prev => ({ ...prev, vehicle_type: val }));
    };

    const handleAddVehicleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/vehicles', newVehicleData);
            setVehicle(res.data.vehicle);
            setShowAddForm(false);
            if (fromFormId) {
                setStep(3);
            } else {
                setStep(2);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add vehicle. Please verify all inputs.');
        } finally { setLoading(false); }
    };

    const handleWorkSelection = (works) => {
        setSelectedWorks(works);
        setStep(3);
    };

    const handleFormSubmit = async (formData) => {
        setLoading(true);
        setError('');
        try {
            let nsId = editId;
            if (!nsId) {
                // Step 1: Create notesheet draft
                const createRes = await api.post('/notesheets', {
                    vehicle_id: vehicle.id,
                    combined_works: selectedWorks.map(w => ({
                        work_code: w.work_code,
                        work_name: w.work_name,
                        fee_amount: w.fee_amount,
                        form_required: w.form_required
                    })),
                });
                nsId = createRes.data.notesheet.id;
            } else {
                // Step 1: Update existing notesheet draft combined works
                await api.put(`/notesheets/${nsId}`, {
                    combined_works: selectedWorks.map(w => ({
                        work_code: w.work_code,
                        work_name: w.work_name,
                        fee_amount: w.fee_amount,
                        form_required: w.form_required
                    })),
                });
            }

            // Step 2: Generate the notesheet text
            const genRes = await api.post(`/notesheets/${nsId}/generate`, {
                content: {
                    ...formData,
                    is_blank: isBlankNotesheet
                }
            });

            setGeneratedNotesheet(genRes.data);
            setStep(4);
        } catch (err) {
            console.error('Generate error:', err);
            setError(err.response?.data?.message || 'Failed to generate notesheet.');
        } finally { setLoading(false); }
    };

    const handleSubmitForApproval = async () => {
        const nsId = generatedNotesheet?.notesheet?.id || generatedNotesheet?.data?.id || generatedNotesheet?.id;
        if (!nsId) return;
        setLoading(true);
        try {
            await api.post(`/notesheets/${nsId}/submit`);
            setSuccess('Notesheet submitted for approval successfully! 🎉');
            setGeneratedNotesheet(prev => {
                if (!prev) return null;
                const updatedStatus = 'submitted';
                return prev.notesheet 
                    ? { ...prev, status: updatedStatus, notesheet: { ...prev.notesheet, status: updatedStatus } }
                    : { ...prev, status: updatedStatus };
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed');
        } finally { setLoading(false); }
    };

    const handleApprove = async () => {
        const nsId = generatedNotesheet?.notesheet?.id || generatedNotesheet?.data?.id || generatedNotesheet?.id;
        if (!nsId) return;
        setLoading(true);
        try {
            await api.post(`/notesheets/${nsId}/approve`);
            setSuccess('Notesheet approved successfully! 🎉');
            setGeneratedNotesheet(prev => {
                if (!prev) return null;
                const updatedStatus = 'approved';
                return prev.notesheet 
                    ? { ...prev, status: updatedStatus, notesheet: { ...prev.notesheet, status: updatedStatus } }
                    : { ...prev, status: updatedStatus };
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Approval failed');
        } finally { setLoading(false); }
    };

    const handleReject = async () => {
        const nsId = generatedNotesheet?.notesheet?.id || generatedNotesheet?.data?.id || generatedNotesheet?.id;
        if (!nsId) return;
        if (!confirm('Are you sure you want to reject this notesheet?')) return;
        setLoading(true);
        try {
            await api.post(`/notesheets/${nsId}/reject`);
            setSuccess('Notesheet rejected successfully.');
            setGeneratedNotesheet(prev => {
                if (!prev) return null;
                const updatedStatus = 'rejected';
                return prev.notesheet 
                    ? { ...prev, status: updatedStatus, notesheet: { ...prev.notesheet, status: updatedStatus } }
                    : { ...prev, status: updatedStatus };
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Rejection failed');
        } finally { setLoading(false); }
    };

    const resetBuilder = () => {
        setStep(1);
        setVehicle(null);
        setRegNumber('');
        setSelectedWorks([]);
        setGeneratedNotesheet(null);
        setError('');
        setSuccess('');
        setIsBlankNotesheet(false);
    };

    const stepLabels = [
        { num: 1, label: 'Search Vehicle', icon: 'bi-search' },
        { num: 2, label: 'Select Works', icon: 'bi-list-check' },
        { num: 3, label: 'Fill Details', icon: 'bi-pencil-square' },
        { num: 4, label: 'Preview & Print', icon: 'bi-printer' },
    ];

    return (
        <div className="animate-fade-in">
            <h3 className="text-white fw-bold mb-4 no-print">
                <i className="bi bi-file-earmark-plus text-info me-2"></i>
                नोटशीट बिल्डर (Notesheet Builder)
            </h3>

            {/* Step Progress Bar */}
            <Card className="glass-card border-0 mb-4 no-print">
                <Card.Body className="py-3 px-4">
                    <div className="d-flex justify-content-between align-items-center">
                        {stepLabels.map((s, idx) => (
                            <React.Fragment key={s.num}>
                                <div className="text-center" style={{ flex: 1 }}>
                                    <div
                                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-1"
                                        style={{
                                            width: 40, height: 40,
                                            background: step >= s.num ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                                            border: step >= s.num ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        <i className={`bi ${s.icon} ${step >= s.num ? 'text-white' : 'text-secondary'}`}></i>
                                    </div>
                                    <div className={`${step >= s.num ? 'text-white' : 'text-secondary'} font-monospace`} style={{ fontSize: '11px' }}>
                                        {s.label}
                                    </div>
                                </div>
                                {idx < stepLabels.length - 1 && (
                                    <div style={{ flex: 1, height: 2, background: step > s.num ? '#6366f1' : 'rgba(255,255,255,0.08)', transition: 'all 0.3s ease' }}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" className="py-2 no-print">{error}</Alert>}
            {success && <Alert variant="success" className="py-2 no-print">{success}</Alert>}

            {/* STEP 1: Search Vehicle */}
            {step === 1 && (
                <div>
                    <Card className="glass-card border-0 mb-4">
                        <Card.Body className="p-4">
                            <h5 className="text-white fw-semibold mb-3">
                                चरण 1: वाहन खोजें (Search Vehicle)
                            </h5>
                            
                            <Form.Group className="mb-4">
                                <Form.Check 
                                    type="switch"
                                    id="blank-notesheet-switch"
                                    label={<span className="text-white fw-medium">खाली नोटशीट (Blank Notesheet) - केवल वाहन क्रमांक प्रिंट करें, बाकी जानकारी रिक्त रखें</span>}
                                    checked={isBlankNotesheet}
                                    onChange={(e) => {
                                        setIsBlankNotesheet(e.target.checked);
                                        if (e.target.checked) {
                                            setShowAddForm(false);
                                            setError('');
                                        }
                                    }}
                                    className="custom-switch"
                                />
                            </Form.Group>

                            <div className="input-group" style={{ maxWidth: 500 }}>
                                <input
                                    type="text"
                                    className="form-control form-control-dark py-3 fs-5"
                                    placeholder="e.g. CG05AC5898"
                                    value={regNumber}
                                    onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && searchVehicle()}
                                />
                                <Button className="btn-primary-gradient px-4" onClick={searchVehicle} disabled={loading}>
                                    {loading ? (
                                        <Spinner size="sm" />
                                    ) : isBlankNotesheet ? (
                                        <><i className="bi bi-arrow-right me-2"></i>Proceed</>
                                    ) : (
                                        <><i className="bi bi-search me-2"></i>Search</>
                                    )}
                                </Button>
                            </div>
                            <p className="text-secondary mt-3 mb-0" style={{ fontSize: '13px' }}>
                                {isBlankNotesheet 
                                    ? "वाहन क्रमांक दर्ज करें और आगे बढ़ने के लिए Proceed बटन पर क्लिक करें" 
                                    : "वाहन क्रमांक दर्ज करें और खोजें बटन पर क्लिक करें"}
                            </p>
                        </Card.Body>
                    </Card>

                    {/* Ad Banner placement inside vehicle search step */}
                    <AdBanner 
                        slot="8227693587"
                        fallbackTitle="RC Verification Sponsor"
                        fallbackDesc="Get verified vehicle details instantly. Support official notesheet generation."
                    />

                    {showAddForm && (
                        <Card className="glass-card border-0 animate-fade-in">
                            <Card.Body className="p-4">
                                <h5 className="text-white fw-semibold mb-4">
                                    <i className="bi bi-plus-circle-fill text-info me-2"></i>
                                    नया वाहन जोड़ें (Add New Vehicle - {newVehicleData.registration_number})
                                </h5>
                                <Form onSubmit={handleAddVehicleSubmit}>
                                    <Row>
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Registration Number</Form.Label>
                                                <Form.Control name="registration_number" className="form-control-dark" value={newVehicleData.registration_number} disabled />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Owner Name</Form.Label>
                                                <Form.Control name="owner_name" className="form-control-dark" placeholder="e.g. BISAN BAI SAHU" value={newVehicleData.owner_name} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Father/Husband Name</Form.Label>
                                                <Form.Control name="owner_father_name" className="form-control-dark" placeholder="e.g. SUKHLAL SAHU" value={newVehicleData.owner_father_name} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={8} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Owner Address</Form.Label>
                                                <Form.Control name="owner_address" className="form-control-dark" placeholder="e.g. VILLAGE POTIYADIH, DISTRICT DHAMTARI (C.G.)" value={newVehicleData.owner_address} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Vehicle Class</Form.Label>
                                                <Form.Select 
                                                    name="vehicle_class_select" 
                                                    className="form-select-dark" 
                                                    value={vehicleClassSelect} 
                                                    onChange={handleVehicleClassChange}
                                                >
                                                    <option value="Motor Car">Motor Car</option>
                                                    <option value="Motor Cab">Motor Cab</option>
                                                    <option value="Maxi Cab">Maxi Cab</option>
                                                    <option value="Omni Bus Private use">Omni Bus Private use</option>
                                                    <option value="Other">Other (Type custom)</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        {vehicleClassSelect === 'Other' && (
                                            <Col md={4} className="mb-3">
                                                <Form.Group>
                                                    <Form.Label className="text-secondary">Custom Vehicle Class</Form.Label>
                                                    <Form.Control 
                                                        name="vehicle_type" 
                                                        className="form-control-dark" 
                                                        placeholder="e.g. LMV/CAR (BOLERO)" 
                                                        value={customVehicleType} 
                                                        onChange={handleCustomVehicleTypeChange} 
                                                    />
                                                </Form.Group>
                                            </Col>
                                        )}
                                    </Row>

                                    <Row>
                                        <Col md={3} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Model / Year</Form.Label>
                                                <Form.Control name="model_year" className="form-control-dark" placeholder="e.g. 2017" value={newVehicleData.model_year} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Chassis Number</Form.Label>
                                                <Form.Control name="chassis_number" className="form-control-dark" placeholder="e.g. MA1XX2XXJG8K27517" value={newVehicleData.chassis_number} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={5} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Engine Number</Form.Label>
                                                <Form.Control name="engine_number" className="form-control-dark" placeholder="e.g. MDI3200T89512" value={newVehicleData.engine_number} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={3} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Fitness Validity</Form.Label>
                                                <Form.Control type="date" name="fitness_validity" className="form-control-dark" value={newVehicleData.fitness_validity} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Insurance Validity</Form.Label>
                                                <Form.Control type="date" name="insurance_validity" className="form-control-dark" value={newVehicleData.insurance_validity} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Tax Amount (₹)</Form.Label>
                                                <Form.Control type="number" name="tax_amount" className="form-control-dark" placeholder="e.g. 11612" value={newVehicleData.tax_amount} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Tax Paid Date</Form.Label>
                                                <Form.Control type="date" name="tax_paid_date" className="form-control-dark" value={newVehicleData.tax_paid_date} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={3} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Permit Validity (Optional)</Form.Label>
                                                <Form.Control type="date" name="permit_validity" className="form-control-dark" value={newVehicleData.permit_validity} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Pollution Validity (Optional)</Form.Label>
                                                <Form.Control type="date" name="pollution_validity" className="form-control-dark" value={newVehicleData.pollution_validity} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">Current HPA Status</Form.Label>
                                                <Form.Control name="current_hpa" className="form-control-dark" placeholder="e.g. NA or bank name" value={newVehicleData.current_hpa} onChange={handleNewVehicleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3} className="mb-3">
                                            <Form.Group>
                                                <Form.Label className="text-secondary">NCRB Report Status</Form.Label>
                                                <Form.Select name="ncrb_report_status" className="form-select-dark" value={newVehicleData.ncrb_report_status} onChange={handleNewVehicleChange}>
                                                    <option value="no">No (Clear)</option>
                                                    <option value="yes">Yes (Flagged)</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <div className="d-flex justify-content-end gap-3 mt-4">
                                        <Button variant="outline-secondary" onClick={() => setShowAddForm(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="btn-primary-gradient px-4" disabled={loading}>
                                            {loading ? <Spinner size="sm" /> : 'Save & Continue'}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}
                </div>
            )}

            {/* STEP 2: Select Works */}
            {step === 2 && vehicle && (
                <div>
                    {/* Vehicle Details Summary */}
                    <Card className="glass-card border-0 mb-4">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="text-info fw-semibold mb-0"><i className="bi bi-car-front me-2"></i>Vehicle Details</h6>
                                <Badge bg="success" className="px-3 py-2 fs-14">{vehicle.registration_number}</Badge>
                            </div>
                            <Table borderless size="sm" className="text-secondary mb-0">
                                <tbody>
                                    <tr><td width="200">Owner</td><td className="text-white fw-medium">{vehicle.owner_name || 'N/A'}</td></tr>
                                    <tr><td>Father's Name</td><td className="text-white">{vehicle.owner_father_name || 'N/A'}</td></tr>
                                    <tr><td>Address</td><td className="text-white">{vehicle.owner_address || 'N/A'}</td></tr>
                                    <tr><td>Vehicle Type</td><td className="text-white">{vehicle.vehicle_type || 'N/A'}</td></tr>
                                    <tr><td>Model Year</td><td className="text-white">{vehicle.model_year || 'N/A'}</td></tr>
                                    <tr><td>Current HP</td><td><Badge bg={(!vehicle.current_hpa || vehicle.current_hpa === 'NA') ? 'secondary' : 'warning'} text={vehicle.current_hpa && vehicle.current_hpa !== 'NA' ? 'dark' : undefined}>{vehicle.current_hpa || 'N/A'}</Badge></td></tr>
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="text-white fw-semibold mb-0">चरण 2: कार्य चुनें (Select Works)</h5>
                        <Button variant="outline-secondary" size="sm" className="rounded-3" onClick={() => setStep(1)}>
                            <i className="bi bi-arrow-left me-1"></i> Back
                        </Button>
                    </div>
                    <WorkSelector works={workOptions} onSelect={handleWorkSelection} />
                </div>
            )}

            {/* STEP 3: Dynamic Form */}
            {step === 3 && (
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-3 no-print">
                        <h5 className="text-white fw-semibold mb-0">चरण 3: विवरण भरें (Fill Details)</h5>
                        <Button variant="outline-secondary" size="sm" className="rounded-3" onClick={() => setStep(2)}>
                            <i className="bi bi-arrow-left me-1"></i> Back
                        </Button>
                    </div>
                    <DynamicForm selectedWorks={selectedWorks} vehicle={vehicle} onSubmit={handleFormSubmit} initialData={generatedNotesheet?.content || generatedNotesheet?.notesheet?.content} />
                    {loading && (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="info" />
                            <p className="text-secondary mt-2">Generating notesheet...</p>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 4: Preview */}
            {step === 4 && generatedNotesheet && (
                <div>
                    <NotesheetPreview notesheet={generatedNotesheet.notesheet || generatedNotesheet} />
                    <div className="d-flex justify-content-center gap-3 mt-4 no-print">
                        <Button variant="outline-secondary" className="px-4 py-2 rounded-3" onClick={() => setStep(3)}>
                            <i className="bi bi-arrow-left me-2"></i> Back to Edit
                        </Button>
                        {user?.role === 'admin' && (generatedNotesheet?.status === 'submitted' || generatedNotesheet?.notesheet?.status === 'submitted') && (
                            <>
                                <Button className="btn-success-gradient px-4 py-2 rounded-3" onClick={handleApprove} disabled={loading}>
                                    <i className="bi bi-check-circle me-2"></i> Approve (स्वीकार करें)
                                </Button>
                                <Button variant="outline-danger" className="px-4 py-2 rounded-3" onClick={handleReject} disabled={loading}>
                                    <i className="bi bi-x-circle me-2"></i> Reject (अस्वीकार करें)
                                </Button>
                            </>
                        )}
                        {!success && (generatedNotesheet?.status === 'draft' || generatedNotesheet?.notesheet?.status === 'draft' || (!generatedNotesheet?.status && !generatedNotesheet?.notesheet?.status)) && (
                            <Button className="btn-primary-gradient px-4 py-2 rounded-3" onClick={handleSubmitForApproval} disabled={loading}>
                                {loading ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-send me-2"></i>}
                                Submit for Approval
                            </Button>
                        )}
                        <Button variant="outline-info" className="px-4 py-2 rounded-3" onClick={resetBuilder}>
                            <i className="bi bi-arrow-clockwise me-2"></i> New Notesheet
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesheetBuilder;
