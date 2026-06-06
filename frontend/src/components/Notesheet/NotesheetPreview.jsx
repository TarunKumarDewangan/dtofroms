import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const NotesheetPreview = ({ 
    notesheet, 
    onBack, 
    isEditable = false, 
    onContentChange, 
    onVehicleChange, 
    onSave, 
    loading = false 
}) => {
    const { user } = useAuth();
    if (!notesheet) return null;

    const data = notesheet.data || notesheet;
    const vehicle = data.vehicle;
    const content = data.content || {};
    const works = data.combined_works || [];

    // Get creator's code or fallback to current user's code
    const creatorCode = data.creator?.code || notesheet.creator?.code || user?.code || '';

    const hasWork = (code) => works.some(w => w.work_code === code);
    const hasTransfer = hasWork('OWN_TRANSFER');
    const hasHPRegister = hasWork('HP_REGISTER');
    const hasHPCancel = hasWork('HP_CANCEL');
    const hasAddressChange = hasWork('ADDRESS_CHANGE');
    const hasDuplicateRC = hasWork('DUPLICATE_RC');
    const hasTransferDeath = hasWork('TRANSFER_DEATH');
    const hasRenewal = hasWork('REG_RENEWAL');
    const hasAlteration = hasWork('VEHICLE_ALTERATION');
    const hasConversion = hasWork('VEHICLE_CONVERSION');

    // Transfer of Ownership service taken (either regular or death transfer)
    const isTransferTaken = hasTransfer || hasTransferDeath;

    const handleVehicleChange = (field, value) => {
        if (onVehicleChange) {
            onVehicleChange({
                ...vehicle,
                [field]: value
            });
        }
    };

    const handleContentChange = (field, value) => {
        if (onContentChange) {
            onContentChange({
                ...content,
                [field]: value
            });
        }
    };

    const isRowVisible = (num) => {
        const defaultValue = (num === 2 || num === 13 || num === 14) ? isTransferTaken : true;
        const isVisible = rowVisibility[num] ?? defaultValue;
        if (num === 2 || num === 13 || num === 14) {
            return !!(isVisible && isTransferTaken);
        }
        return !!isVisible;
    };

    const [rowVisibility, setRowVisibility] = useState(() => {
        const defaults = {
            1: true, 2: isTransferTaken, 3: true, 4: true, 5: true,
            6: true, 7: true, 8: true, 9: true, 10: true,
            11: true, 12: true, 13: isTransferTaken, 14: isTransferTaken, 15: true, 16: true
        };
        return {
            ...defaults,
            ...(content?.row_visibility || {})
        };
    });

    useEffect(() => {
        const defaults = {
            1: true, 2: isTransferTaken, 3: true, 4: true, 5: true,
            6: true, 7: true, 8: true, 9: true, 10: true,
            11: true, 12: true, 13: isTransferTaken, 14: isTransferTaken, 15: true, 16: true
        };
        if (content?.row_visibility) {
            setRowVisibility(prev => {
                const nextVis = {
                    ...defaults,
                    ...content.row_visibility
                };
                if (!isTransferTaken) {
                    nextVis[2] = false;
                    nextVis[13] = false;
                    nextVis[14] = false;
                }
                return nextVis;
            });
        } else {
            setRowVisibility(defaults);
        }
    }, [notesheet?.id, notesheet?.notesheet_number, isTransferTaken, content?.row_visibility]);

    const toggleRow = (num) => {
        const defaultValue = (num === 2 || num === 13 || num === 14) ? isTransferTaken : true;
        const currentValue = rowVisibility[num] ?? defaultValue;
        const nextVisibility = {
            ...rowVisibility,
            [num]: !currentValue
        };
        setRowVisibility(nextVisibility);
        if (onContentChange) {
            onContentChange({
                ...content,
                row_visibility: nextVisibility
            });
        }
    };

    let currentSNo = 1;
    const getSNo = (num) => {
        if (!isRowVisible(num)) return '--.';
        const sno = currentSNo++;
        return String(sno).padStart(2, '0') + '.';
    };

    const isBlankNotesheet = content.is_blank === true || data.is_blank === true || notesheet.is_blank === true || vehicle?.is_blank_notesheet || !vehicle?.owner_name || vehicle?.owner_name === '.....................' || /^\.+$/.test(vehicle?.owner_name || '');

    const cleanInputVal = (val) => {
        if (!val) return '';
        const trimmed = String(val).trim();
        if (/^[.\s]+$/.test(trimmed)) return '';
        return val;
    };

    const getVal = (val, fallback = '.....................') => {
        const cleaned = cleanInputVal(val);
        if (cleaned) {
            return cleaned;
        }
        return fallback.replace(/\./g, '\u00A0');
    };

    if (!vehicle) {
        return (
            <Card className="glass-card border-0 mb-4">
                <Card.Body className="p-4 text-center">
                    <p className="text-secondary mb-0">No vehicle details found for preview.</p>
                </Card.Body>
            </Card>
        );
    }



    const formatDate = (dateStr) => {
        if (!dateStr || dateStr.startsWith('1970-01-01')) return '.....................';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Registration date calculation (15 years before fitness validity)
    const getRegistrationDate = (v) => {
        if (v.registration_date) return formatDate(v.registration_date);
        if (!v.fitness_validity || v.fitness_validity.startsWith('1970-01-01')) return '.....................';
        const date = new Date(v.fitness_validity);
        date.setFullYear(date.getFullYear() - 15);
        return formatDate(date.toISOString().split('T')[0]);
    };

    const renderInlineTextAndInput = (name, placeholder, type = 'text', style = {}) => {
        const rawVal = type === 'date' ? formatDate(content[name]) : content[name];
        const val = getVal(rawVal, '.....................');
        return (
            <>
                {isEditable && (
                    <input
                        type={type}
                        name={name}
                        value={cleanInputVal(content[name])}
                        onChange={(e) => {
                            if (onContentChange) {
                                onContentChange({ ...content, [name]: e.target.value });
                            }
                        }}
                        placeholder={placeholder}
                        className="no-print inline-notesheet-input"
                        style={{
                            border: 'none',
                            borderBottom: '1px dashed #4f46e5',
                            background: 'rgba(79, 70, 229, 0.05)',
                            color: '#4f46e5',
                            padding: '0 4px',
                            fontWeight: 'bold',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            width: type === 'date' ? '135px' : '90px',
                            textAlign: 'center',
                            borderRadius: '3px',
                            margin: '0 4px',
                            outline: 'none',
                            ...style
                        }}
                    />
                )}
                <span className={isEditable ? 'print-only' : ''}>{val}</span>
            </>
        );
    };

    const renderVehicleInlineInput = (name, placeholder, style = {}) => {
        const val = getVal(vehicle[name], '.....................');
        return (
            <>
                {isEditable && (
                    <input
                        type="text"
                        name={name}
                        value={cleanInputVal(vehicle[name])}
                        onChange={(e) => {
                            if (onVehicleChange) {
                                const updated = {
                                    ...vehicle,
                                    [name]: e.target.value
                                };
                                if (name === 'vehicle_type') {
                                    updated.model_year = e.target.value;
                                }
                                onVehicleChange(updated);
                            }
                        }}
                        placeholder={placeholder}
                        className="no-print inline-notesheet-input"
                        style={{
                            border: 'none',
                            borderBottom: '1px dashed #4f46e5',
                            background: 'rgba(79, 70, 229, 0.05)',
                            color: '#4f46e5',
                            padding: '0 4px',
                            fontWeight: 'bold',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            width: '100px',
                            textAlign: 'center',
                            borderRadius: '3px',
                            margin: '0 4px',
                            outline: 'none',
                            ...style
                        }}
                    />
                )}
                <span className={isEditable ? 'print-only' : ''}>{val}</span>
            </>
        );
    };

    // Build selected works array for subject and closing paragraph
    const workLabels = [];
    if (hasTransfer) workLabels.push("स्वामित्व अंतरण");
    if (hasTransferDeath) workLabels.push("स्वामित्व अंतरण (मृत्यु उपरांत)");
    if (hasHPRegister) workLabels.push("एच.पी. दर्ज");
    if (hasHPCancel) workLabels.push("एच.पी. निरस्त");
    if (hasAddressChange) workLabels.push("पता परिवर्तन दर्ज");
    if (hasDuplicateRC) workLabels.push("पंजीयन प्रमाण पत्र की द्वितीय प्रति जारी");
    if (hasRenewal) workLabels.push("पंजीयन नवीनीकरण");
    if (hasAlteration) workLabels.push("वाहन परिवर्तन (Alteration)");
    if (hasConversion) workLabels.push("वाहन वर्ग रूपांतरण (Conversion)");

    const selectedWorksText = workLabels.join(" / ");
    currentSNo = 1;
    return (
        <div className="animate-fade-in">
            {/* Inline CSS styling to guarantee print output matches the image layout */}
            <style>{`
                .notesheet-outer-border {
                    position: relative;
                    border: 1px solid #000000;
                    padding: 30px 25px;
                    background-color: #ffffff;
                    color: #000000;
                    font-family: 'Nirmala UI', 'Mangal', 'Arial', sans-serif;
                    font-size: 15px;
                    line-height: 1.8;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    border-radius: 4px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .notesheet-outer-border::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: url('/notesheet/watermark.png');
                    background-repeat: no-repeat;
                    background-position: center 30%;
                    background-size: 75% auto;
                    opacity: 0.09;
                    pointer-events: none;
                    z-index: 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .notesheet-outer-border > * {
                    position: relative;
                    z-index: 1;
                }
                .notesheet-header {
                    text-align: center;
                    font-weight: bold;
                    font-size: 18px;
                    margin-bottom: 2px;
                    text-decoration: underline;
                    color: #000000;
                }
                .notesheet-subheader {
                    text-align: center;
                    font-weight: bold;
                    font-size: 17px;
                    margin-bottom: 12px;
                    text-decoration: underline;
                    color: #000000;
                }
                .notesheet-divider {
                    border-top: 1px solid #000000;
                    margin: 10px -25px;
                }
                .notesheet-subject {
                    font-weight: bold;
                    padding: 4px 0;
                    text-align: justify;
                }
                .notesheet-paragraph {
                    text-indent: 45px;
                    text-align: justify;
                    margin-bottom: 12px;
                    word-wrap: break-word;
                }
                .notesheet-table-title {
                    font-weight: bold;
                    margin-top: 15px;
                    margin-bottom: 8px;
                }
                .notesheet-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                    font-size: 14px;
                }
                .notesheet-table th, .notesheet-table td {
                    border: 1px solid #000000;
                    padding: 5px 8px;
                    vertical-align: top;
                    color: #000000;
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
                .notesheet-table td.edit-cell, .notesheet-table th.edit-cell {
                    width: 250px;
                    background-color: rgba(79, 70, 229, 0.03) !important;
                    vertical-align: middle;
                }
                span.print-only {
                    display: none !important;
                }
                .notesheet-closing {
                    text-align: justify;
                    margin-top: 15px;
                    margin-bottom: 35px;
                }
                .notesheet-signature {
                    text-align: right;
                    font-weight: bold;
                    margin-top: 25px;
                    padding-right: 15px;
                    margin-bottom: 100px;
                }
                .notesheet-user-code {
                    position: absolute;
                    bottom: 15px;
                    left: 25px;
                    font-size: 11px;
                    font-weight: bold;
                    font-family: monospace, sans-serif;
                    color: rgba(0, 0, 0, 0.08);
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
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
                    .main-layout-wrapper {
                        margin-left: 0 !important;
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
                    span.print-only {
                        display: inline !important;
                    }
                    .row-disabled {
                        display: none !important;
                    }
                    body .print-container {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .notesheet-outer-border {
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
                    .notesheet-header {
                        font-size: 17px !important;
                        margin-bottom: 3px !important;
                    }
                    .notesheet-subheader {
                        font-size: 15px !important;
                        margin-bottom: 10px !important;
                    }
                    .notesheet-divider {
                        margin: 8px -25px !important;
                    }
                    .notesheet-paragraph, .notesheet-closing {
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
                    .notesheet-signature {
                        margin-top: 20px !important;
                        margin-bottom: 80px !important;
                    }
                    .notesheet-user-code {
                        bottom: 12px !important;
                        left: 20px !important;
                        font-size: 11px !important;
                        color: rgba(0, 0, 0, 0.08) !important;
                    }
                    @page {
                        size: A4;
                        margin: 10mm 10mm 10mm 15mm; /* Standard office printing margins */
                    }
                }
            `}</style>

            <Card className="glass-card border-0 mb-4 no-print">
                <Card.Body className="p-4 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        {onBack && (
                            <Button variant="outline-secondary" size="sm" className="rounded-3" onClick={onBack}>
                                <i className="bi bi-arrow-left me-1"></i> Back
                            </Button>
                        )}
                        <h5 className="text-white fw-semibold mb-0">
                            <i className="bi bi-file-earmark-check text-success me-2"></i>
                            नोटशीट पूर्वावलोकन (Official NoteSheet Template)
                        </h5>
                    </div>
                    <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25 px-3 py-2 rounded-pill font-monospace">
                        {data.notesheet_number}
                    </span>
                </Card.Body>
            </Card>

            {/* NoteSheet Border Container */}
            <div className="print-container" style={{ overflowX: 'auto' }}>
                <div className="notesheet-outer-border">
                    {/* Header */}
                    <div className="notesheet-header">जिला परिवहन कार्यालय, धमतरी, छ०ग०</div>
                    <div className="notesheet-subheader">नोट शीट</div>
                    
                    <div className="notesheet-divider"></div>

                    {/* Subject Line */}
                    <div className="notesheet-subject">
                        विषय:-वाहन क्रमांक {vehicle.registration_number} ({renderVehicleInlineInput('vehicle_type', 'वाहन प्रकार')}) का {selectedWorksText} बाबत्।
                    </div>

                    <div className="notesheet-divider"></div>

                    {/* Paragraph 1: Ownership Transfer */}
                    {hasTransfer && (
                        <div className="notesheet-paragraph">
                            उक्त वाहन को वाहन स्वामी श्री <strong>{getVal(content.buyer_name, '..................................................')}</strong> आ. श्री <strong>{getVal(content.buyer_father, '..................................................')}</strong> निवासी <strong>{getVal(content.buyer_address, '................................................................................')}</strong> ने वाहन स्वामी श्री <strong>{getVal(vehicle.owner_name, '..................................................')}</strong> आ. श्री <strong>{getVal(vehicle.owner_father_name, '..................................................')}</strong> से क्रय कर स्वामित्व अंतरण हेतु निर्धारित प्रारूप फार्म नं. 29(2 प्रति में) एवं फार्म नं. 30 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{renderInlineTextAndInput('transfer_fee', 'शुल्क राशि')}</strong> को जमा कर आवेदन दिनांक <strong>{renderInlineTextAndInput('application_date', 'आवेदन दिनांक', 'date')}</strong> को कार्यालय में प्रस्तुत किया गया है।
                            {isEditable && (
                                <div className="no-print mt-2 p-2 border border-info border-opacity-25 rounded bg-light" style={{ maxWidth: '400px' }}>
                                    <Form.Group>
                                        <Form.Label className="text-secondary small fw-bold">विक्रय दिनांक (Sale Date)</Form.Label>
                                        <Form.Control size="sm" type="date" value={content.sale_date || ''} onChange={(e) => onContentChange({ ...content, sale_date: e.target.value })} />
                                    </Form.Group>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Paragraph 2a: HP Register */}
                    {hasHPRegister && (
                        <div className="notesheet-paragraph">
                            एच.पी. दर्ज किये जाने हेतु निर्धारित प्रारूप फार्म नं. 34 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{renderInlineTextAndInput('hp_fee', 'शुल्क राशि')}</strong> दिनांक <strong>{renderInlineTextAndInput('hp_date', 'एच.पी. दिनांक', 'date')}</strong> को जमा कर आवेदन दिनांक <strong>{renderInlineTextAndInput('application_date', 'आवेदन दिनांक', 'date')}</strong> को कार्यालय में प्रस्तुत किया गया है।
                        </div>
                    )}

                    {/* Paragraph 2b: HP Cancel */}
                    {hasHPCancel && (
                        <div className="notesheet-paragraph">
                            एच.पी. निरस्त किये जाने हेतु निर्धारित प्रारूप फार्म नं. 35 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{renderInlineTextAndInput('hp_cancel_fee', 'शुल्क राशि')}</strong> दिनांक <strong>{renderInlineTextAndInput('cancel_date', 'निरस्त दिनांक', 'date')}</strong> को जमा कर आवेदन दिनांक <strong>{renderInlineTextAndInput('application_date', 'आवेदन दिनांक', 'date')}</strong> को कार्यालय में प्रस्तुत किया गया है।
                        </div>
                    )}

                    {/* Paragraph 2c: Address Change */}
                    {hasAddressChange && (
                        <div className="notesheet-paragraph">
                            पता परिवर्तन दर्ज किये जाने हेतु निर्धारित प्रारूप फार्म नं. 33 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{renderInlineTextAndInput('address_fee', 'शुल्क राशि')}</strong> दिनांक <strong>{renderInlineTextAndInput('application_date', 'आवेदन दिनांक', 'date')}</strong> को जमा कर आवेदन दिनांक <strong>{renderInlineTextAndInput('application_date', 'आवेदन दिनांक', 'date')}</strong> को कार्यालय में प्रस्तुत किया गया है।
                            {isEditable && (
                                <div className="no-print mt-2 p-2 border border-info border-opacity-25 rounded bg-light" style={{ maxWidth: '400px' }}>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="text-secondary small fw-bold">नया पता (New Address)</Form.Label>
                                        <Form.Control size="sm" as="textarea" rows={2} value={content.new_address || ''} onChange={(e) => onContentChange({ ...content, new_address: e.target.value })} />
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Label className="text-secondary small fw-bold">पता प्रमाण पत्र (Address Proof Type)</Form.Label>
                                        <Form.Select size="sm" value={content.address_proof_type || ''} onChange={(e) => onContentChange({ ...content, address_proof_type: e.target.value })}>
                                            <option value="">-- चुनें --</option>
                                            <option value="आधार कार्ड">आधार कार्ड</option>
                                            <option value="निवास प्रमाण पत्र">निवास प्रमाण पत्र</option>
                                            <option value="बिजली बिल">बिजली बिल</option>
                                            <option value="राशन कार्ड">राशन कार्ड</option>
                                        </Form.Select>
                                    </Form.Group>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Paragraph 3: Duplicate RC */}
                    {hasDuplicateRC && (
                        <div className="notesheet-paragraph">
                            पंजीयन प्रमाण पत्र की द्वितीय प्रति जारी किये जाने हेतु निर्धारित प्रारूप फार्म नं. 26 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{renderInlineTextAndInput('duplicate_rc_fee', 'शुल्क राशि')}</strong> दिनांक <strong>{renderInlineTextAndInput('application_date', 'आवेदन दिनांक', 'date')}</strong> को जमा कर आवेदन दिनांक <strong>{renderInlineTextAndInput('application_date', 'आवेदन दिनांक', 'date')}</strong> को कार्यालय में प्रस्तुत किया गया है।
                            {isEditable && (
                                <div className="no-print mt-2 p-2 border border-info border-opacity-25 rounded bg-light" style={{ maxWidth: '400px' }}>
                                    <Form.Group>
                                        <Form.Label className="text-secondary small fw-bold">कारण (Reason)</Form.Label>
                                        <Form.Select size="sm" value={content.duplicate_reason || ''} onChange={(e) => onContentChange({ ...content, duplicate_reason: e.target.value })}>
                                            <option value="">-- चुनें --</option>
                                            <option value="गुम हो जाने">गुम हो जाने (Lost)</option>
                                            <option value="फट जाने">फट जाने (Damaged)</option>
                                            <option value="चोरी हो जाने">चोरी हो जाने (Stolen)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Paragraph 4: Transfer after Death */}
                    {hasTransferDeath && (
                        <div className="notesheet-paragraph">
                            मूल वाहन स्वामी श्री <strong>{getVal(vehicle.owner_name, '..................................................')}</strong> की मृत्यु हो जाने के कारण उनके विधिक वारिस श्री <strong>{getVal(content.applicant_name, '..................................................')}</strong> आ. श्री <strong>{getVal(content.applicant_father, '..................................................')}</strong> निवासी <strong>{getVal(content.applicant_address, '................................................................................')}</strong> द्वारा स्वामित्व अंतरण हेतु निर्धारित प्रारूप फार्म नं. 31 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{renderInlineTextAndInput('death_transfer_fee', 'शुल्क राशि')}</strong> को जमा कर आवेदन दिनांक <strong>{renderInlineTextAndInput('application_date', 'आवेदन दिनांक', 'date')}</strong> को कार्यालय में प्रस्तुत किया गया है।
                            {isEditable && (
                                <div className="no-print mt-2 p-2 border border-info border-opacity-25 rounded bg-light" style={{ maxWidth: '400px' }}>
                                    <Row className="g-2">
                                        <Col xs={6}>
                                            <Form.Group>
                                                <Form.Label className="text-secondary small fw-bold">मृतक से संबंध (Relation)</Form.Label>
                                                <Form.Select size="sm" value={content.relation_to_deceased || ''} onChange={(e) => onContentChange({ ...content, relation_to_deceased: e.target.value })}>
                                                    <option value="">-- चुनें --</option>
                                                    <option value="पुत्र">पुत्र (Son)</option>
                                                    <option value="पुत्री">पुत्री (Daughter)</option>
                                                    <option value="पत्नी">पत्नी (Wife)</option>
                                                    <option value="पति">पति (Husband)</option>
                                                    <option value="अन्य वारिस">अन्य वारिस (Other)</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col xs={6}>
                                            <Form.Group>
                                                <Form.Label className="text-secondary small fw-bold">मृत्यु दिनांक (Death Date)</Form.Label>
                                                <Form.Control size="sm" type="date" value={content.death_date || ''} onChange={(e) => onContentChange({ ...content, death_date: e.target.value })} />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Paragraph 5: Renewal of Registration */}
                    {hasRenewal && (
                        <div className="notesheet-paragraph">
                            वाहन का पंजीयन अवधि समाप्त होने के कारण पंजीयन नवीनीकरण (Renewal of Registration) हेतु निर्धारित प्रारूप फार्म नं. 25 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{renderInlineTextAndInput('renewal_fee', 'शुल्क राशि')}</strong> को जमा कर आवेदन दिनांक <strong>{renderInlineTextAndInput('application_date', 'आवेदन दिनांक', 'date')}</strong> को कार्यालय में प्रस्तुत किया गया है।
                        </div>
                    )}

                    {/* Paragraph 6: Alteration of Vehicle */}
                    {hasAlteration && (
                        <div className="notesheet-paragraph">
                            वाहन की मूल बनावट में परिवर्तन (Alteration of Vehicle: <strong>{renderInlineTextAndInput('alteration_details', 'विवरण')}</strong>) दर्ज करने हेतु निर्धारित प्रारूप फार्म नं. 22C एवं 22D में विहित् ऑनलाईन शुल्क राशि रू. <strong>{renderInlineTextAndInput('alteration_fee', 'शुल्क राशि')}</strong> को जमा कर आवेदन दिनांक <strong>{renderInlineTextAndInput('application_date', 'आवेदन दिनांक', 'date')}</strong> को कार्यालय में प्रस्तुत किया गया है।
                        </div>
                    )}

                    {/* Paragraph 7: Conversion of Vehicle */}
                    {hasConversion && (
                        <div className="notesheet-paragraph">
                            वाहन का वर्ग रूपांतरण (Conversion of Vehicle: <strong>{renderInlineTextAndInput('conversion_from', 'कहाँ से')}</strong> से <strong>{renderInlineTextAndInput('conversion_to', 'कहाँ तक')}</strong>
                            {isEditable ? (
                                <span>, नया वर्ग: <strong>{renderInlineTextAndInput('new_vehicle_class', 'नया वर्ग')}</strong></span>
                            ) : (
                                content.new_vehicle_class ? <span>, नया वर्ग: <strong>{content.new_vehicle_class}</strong></span> : ''
                            )}) दर्ज करने हेतु निर्धारित प्रारूप में विहित् ऑनलाईन शुल्क राशि रू. <strong>{renderInlineTextAndInput('conversion_fee', 'शुल्क राशि')}</strong> को जमा कर आवेदन दिनांक <strong>{renderInlineTextAndInput('application_date', 'आवेदन दिनांक', 'date')}</strong> को कार्यालय में प्रस्तुत किया गया है।
                        </div>
                    )}

                    {/* Table Title */}
                    <div className="notesheet-table-title">
                        वाहन क्रमांक <strong>{vehicle.registration_number}</strong> (वाहन का मॉडल {renderVehicleInlineInput('model_year', 'मॉडल')}) संबंधित जानकारी निम्नानुसार है:-
                    </div>

                    {/* 14-Row Table */}
                    <table className="notesheet-table">
                        <tbody>
                            {isEditable && (
                                <tr className="no-print bg-light text-dark fw-bold" style={{ fontSize: '12px', borderBottom: '2px solid #000' }}>
                                    <td className="text-center" style={{ width: '50px' }}>Show</td>
                                    <td className="text-center" style={{ width: '40px' }}>S.No</td>
                                    <td>विवरण (Field Label)</td>
                                    <td>नोटशीट वैल्यू (Preview Value)</td>
                                    <td style={{ width: '250px' }}>बदलाव करें (Edit / Input Box)</td>
                                </tr>
                            )}
                            <tr className={!isRowVisible(1) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-1"
                                            checked={isRowVisible(1)} 
                                            onChange={() => toggleRow(1)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(1)}</td>
                                <td className="label-cell">वर्तमान वाहन स्वामी/विक्रेता का नाम पिता व वर्तमान पता</td>
                                <td className="value-cell" style={{ lineHeight: '1.8' }}>
                                    {(() => {
                                        const name = cleanInputVal(vehicle.owner_name);
                                        const father = cleanInputVal(vehicle.owner_father_name);
                                        const addr = cleanInputVal(vehicle.owner_address);
                                        if (!name && !father && !addr) {
                                            return '................................................................................';
                                        }
                                        let parts = [];
                                        if (name) parts.push(name);
                                        if (father) parts.push(`S/o ${father}`);
                                        if (addr) parts.push(`Address ${addr}`);
                                        return parts.join(', ');
                                    })()}
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <div className="d-flex flex-column gap-1">
                                            <input type="text" className="form-control form-control-sm" placeholder="नाम" value={cleanInputVal(vehicle.owner_name)} onChange={(e) => handleVehicleChange('owner_name', e.target.value)} />
                                            <input type="text" className="form-control form-control-sm" placeholder="पिता का नाम" value={cleanInputVal(vehicle.owner_father_name)} onChange={(e) => handleVehicleChange('owner_father_name', e.target.value)} />
                                            <textarea className="form-control form-control-sm" rows={2} placeholder="पता" value={cleanInputVal(vehicle.owner_address)} onChange={(e) => handleVehicleChange('owner_address', e.target.value)} />
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(2) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-2"
                                            checked={isRowVisible(2)} 
                                            onChange={() => toggleRow(2)} 
                                            disabled={!isTransferTaken}
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(2)}</td>
                                <td className="label-cell">प्रस्तावित वाहन स्वामी/क्रेता का नाम पिता व वर्तमान पता</td>
                                <td className="value-cell" style={{ lineHeight: '1.8' }}>
                                    {hasTransfer ? (
                                        (() => {
                                            const name = cleanInputVal(content.buyer_name);
                                            const father = cleanInputVal(content.buyer_father);
                                            const addr = cleanInputVal(content.buyer_address);
                                            if (!name && !father && !addr) {
                                                return '................................................................................';
                                            }
                                            let parts = [];
                                            if (name) parts.push(name);
                                            if (father) parts.push(`S/o ${father}`);
                                            if (addr) parts.push(`Address ${addr}`);
                                            return parts.join(', ');
                                        })()
                                    ) : hasTransferDeath ? (
                                        (() => {
                                            const name = cleanInputVal(content.applicant_name);
                                            const father = cleanInputVal(content.applicant_father);
                                            const addr = cleanInputVal(content.applicant_address);
                                            if (!name && !father && !addr) {
                                                return '................................................................................';
                                            }
                                            let parts = [];
                                            if (name) parts.push(name);
                                            if (father) parts.push(`S/o ${father}`);
                                            if (addr) parts.push(`Address ${addr}`);
                                            return parts.join(', ');
                                        })()
                                    ) : hasAddressChange ? (
                                        <div>{getVal(content.new_address, '................................................................................')}</div>
                                    ) : (
                                        <span>लागू नहीं (NA)</span>
                                    )}
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        {hasTransfer ? (
                                            <div className="d-flex flex-column gap-1">
                                                <label className="text-secondary small fw-bold">क्रेता का नाम (Buyer Name)</label>
                                                <input type="text" className="form-control form-control-sm" placeholder="नाम" value={cleanInputVal(content.buyer_name)} onChange={(e) => handleContentChange('buyer_name', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">पिता का नाम (Father's Name)</label>
                                                <input type="text" className="form-control form-control-sm" placeholder="पिता का नाम" value={cleanInputVal(content.buyer_father)} onChange={(e) => handleContentChange('buyer_father', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">पता (Address)</label>
                                                <textarea className="form-control form-control-sm" rows={2} placeholder="पता" value={cleanInputVal(content.buyer_address)} onChange={(e) => handleContentChange('buyer_address', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">विक्रय दिनांक (Sale Date)</label>
                                                <input type="date" className="form-control form-control-sm" value={content.sale_date || ''} onChange={(e) => handleContentChange('sale_date', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">शुल्क राशि (Fee)</label>
                                                <input type="number" className="form-control form-control-sm" placeholder="शुल्क राशि ₹" value={content.transfer_fee || ''} onChange={(e) => handleContentChange('transfer_fee', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">आवेदन दिनांक (Application Date)</label>
                                                <input type="date" className="form-control form-control-sm" value={content.application_date || ''} onChange={(e) => handleContentChange('application_date', e.target.value)} />
                                            </div>
                                        ) : hasTransferDeath ? (
                                            <div className="d-flex flex-column gap-1">
                                                <label className="text-secondary small fw-bold">आवेदक का नाम (Applicant Name)</label>
                                                <input type="text" className="form-control form-control-sm" placeholder="नाम" value={cleanInputVal(content.applicant_name)} onChange={(e) => handleContentChange('applicant_name', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">पिता का नाम (Father's Name)</label>
                                                <input type="text" className="form-control form-control-sm" placeholder="पिता का नाम" value={cleanInputVal(content.applicant_father)} onChange={(e) => handleContentChange('applicant_father', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">पता (Address)</label>
                                                <textarea className="form-control form-control-sm" rows={2} placeholder="पता" value={cleanInputVal(content.applicant_address)} onChange={(e) => handleContentChange('applicant_address', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">मृतक से संबंध (Relation)</label>
                                                <Form.Select size="sm" value={content.relation_to_deceased || ''} onChange={(e) => handleContentChange('relation_to_deceased', e.target.value)}>
                                                    <option value="">Select Option</option>
                                                    <option value="पुत्र">पुत्र (Son)</option>
                                                    <option value="पुत्री">पुत्री (Daughter)</option>
                                                    <option value="पत्नी">पत्नी (Wife)</option>
                                                    <option value="पति">पति (Husband)</option>
                                                    <option value="अन्य वारिस">अन्य वारिस (Other)</option>
                                                </Form.Select>
                                                <label className="text-secondary small fw-bold mt-1">मृत्यु दिनांक (Death Date)</label>
                                                <input type="date" className="form-control form-control-sm" value={content.death_date || ''} onChange={(e) => handleContentChange('death_date', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">शुल्क राशि (Fee)</label>
                                                <input type="number" className="form-control form-control-sm" placeholder="शुल्क राशि ₹" value={content.death_transfer_fee || ''} onChange={(e) => handleContentChange('death_transfer_fee', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">आवेदन दिनांक (Application Date)</label>
                                                <input type="date" className="form-control form-control-sm" value={content.application_date || ''} onChange={(e) => handleContentChange('application_date', e.target.value)} />
                                            </div>
                                        ) : hasAddressChange ? (
                                            <div className="d-flex flex-column gap-1">
                                                <label className="text-secondary small fw-bold">नया पता (New Address)</label>
                                                <textarea className="form-control form-control-sm" rows={2} placeholder="नया पता" value={cleanInputVal(content.new_address)} onChange={(e) => handleContentChange('new_address', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">पता प्रमाण पत्र (Proof Type)</label>
                                                <Form.Select size="sm" value={content.address_proof_type || ''} onChange={(e) => handleContentChange('address_proof_type', e.target.value)}>
                                                    <option value="">Select Option</option>
                                                    <option value="आधार कार्ड">आधार कार्ड</option>
                                                    <option value="निवास प्रमाण पत्र">निवास प्रमाण पत्र</option>
                                                    <option value="बिजली बिल">बिजली बिल</option>
                                                    <option value="राशन कार्ड">राशन कार्ड</option>
                                                </Form.Select>
                                                <label className="text-secondary small fw-bold mt-1">शुल्क राशि (Fee)</label>
                                                <input type="number" className="form-control form-control-sm" placeholder="शुल्क राशि ₹" value={content.address_fee || ''} onChange={(e) => handleContentChange('address_fee', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">आवेदन दिनांक (Application Date)</label>
                                                <input type="date" className="form-control form-control-sm" value={content.application_date || ''} onChange={(e) => handleContentChange('application_date', e.target.value)} />
                                            </div>
                                        ) : (
                                            <span className="text-secondary small">लागू नहीं</span>
                                        )}
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(3) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-3"
                                            checked={isRowVisible(3)} 
                                            onChange={() => toggleRow(3)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(3)}</td>
                                <td className="label-cell">वाहन का पंजीयन दिनांक</td>
                                <td className="value-cell">{getVal(getRegistrationDate(vehicle), '.....................')}</td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <input type="date" className="form-control form-control-sm" value={vehicle.registration_date || ''} onChange={(e) => handleVehicleChange('registration_date', e.target.value)} />
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(4) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-4"
                                            checked={isRowVisible(4)} 
                                            onChange={() => toggleRow(4)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(4)}</td>
                                <td className="label-cell">चेसिस क्रमांक</td>
                                <td className="value-cell">{getVal(vehicle.chassis_number)}</td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <input type="text" className="form-control form-control-sm" value={cleanInputVal(vehicle.chassis_number)} onChange={(e) => handleVehicleChange('chassis_number', e.target.value)} />
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(5) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-5"
                                            checked={isRowVisible(5)} 
                                            onChange={() => toggleRow(5)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(5)}</td>
                                <td className="label-cell">इंजन क्रमांक</td>
                                <td className="value-cell">{getVal(vehicle.engine_number)}</td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <input type="text" className="form-control form-control-sm" value={cleanInputVal(vehicle.engine_number)} onChange={(e) => handleVehicleChange('engine_number', e.target.value)} />
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(6) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-6"
                                            checked={isRowVisible(6)} 
                                            onChange={() => toggleRow(6)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(6)}</td>
                                <td className="label-cell">वाहन का मोटरयान कर की जमा दिनांक</td>
                                <td className="value-cell">
                                    {((vehicle.tax_paid_date && !vehicle.tax_paid_date.startsWith('1970-01-01')) || (vehicle.tax_amount && Number(vehicle.tax_amount) > 0)) ? (
                                        <span>दिनांक {formatDate(vehicle.tax_paid_date)} (शुल्क {vehicle.tax_amount ? `₹${Number(vehicle.tax_amount).toLocaleString('en-IN')}` : '.....................'}/-)</span>
                                    ) : isBlankNotesheet ? (
                                        <span>दिनांक ..................... (कर राशि रु. ...................../-)</span>
                                    ) : (
                                        <span>दिनांक {formatDate(vehicle.tax_paid_date)} (शुल्क {vehicle.tax_amount ? `₹${Number(vehicle.tax_amount).toLocaleString('en-IN')}` : '.....................'}/-)</span>
                                    )}
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <div className="d-flex flex-column gap-1">
                                            <input type="date" className="form-control form-control-sm" value={vehicle.tax_paid_date || ''} onChange={(e) => handleVehicleChange('tax_paid_date', e.target.value)} />
                                            <input type="number" className="form-control form-control-sm" placeholder="कर राशि ₹" value={vehicle.tax_amount || ''} onChange={(e) => handleVehicleChange('tax_amount', e.target.value)} />
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(7) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-7"
                                            checked={isRowVisible(7)} 
                                            onChange={() => toggleRow(7)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(7)}</td>
                                <td className="label-cell">वाहन का परमिट (यदि लागू हो तो)</td>
                                <td className="value-cell">
                                    {vehicle.permit_validity && !vehicle.permit_validity.startsWith('1970-01-01') ? (
                                        <span>वैधता दिनांक {formatDate(vehicle.permit_validity)}</span>
                                    ) : isBlankNotesheet ? (
                                        <span>वैधता दिनांक .....................</span>
                                    ) : (
                                        <span>{vehicle.permit_validity ? `वैधता दिनांक ${formatDate(vehicle.permit_validity)}` : 'लागू नहीं (NA)'}</span>
                                    )}
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <div className="d-flex flex-column gap-1">
                                            <input type="date" className="form-control form-control-sm" value={vehicle.permit_validity || ''} onChange={(e) => handleVehicleChange('permit_validity', e.target.value)} />
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(8) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-8"
                                            checked={isRowVisible(8)} 
                                            onChange={() => toggleRow(8)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(8)}</td>
                                <td className="label-cell">वाहन का फिटनेस/पंजीयन प्रमाण पत्र की वैधता</td>
                                <td className="value-cell">
                                    <span>वैधता दिनांक {formatDate(vehicle.fitness_validity)}</span>
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <div className="d-flex flex-column gap-1">
                                            <label className="text-secondary small fw-bold">फिटनेस वैधता दिनांक</label>
                                            <input type="date" className="form-control form-control-sm" value={vehicle.fitness_validity || ''} onChange={(e) => handleVehicleChange('fitness_validity', e.target.value)} />
                                            {hasRenewal && (
                                                <div className="mt-2 border-top pt-2">
                                                    <label className="text-secondary small fw-bold">नवीनीकरण शुल्क (Renewal Fee)</label>
                                                    <input type="number" className="form-control form-control-sm mt-1" placeholder="शुल्क राशि ₹" value={content.renewal_fee || ''} onChange={(e) => handleContentChange('renewal_fee', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">आवेदन दिनांक (Application Date)</label>
                                                    <input type="date" className="form-control form-control-sm" value={content.application_date || ''} onChange={(e) => handleContentChange('application_date', e.target.value)} />
                                                </div>
                                            )}
                                            {hasAlteration && (
                                                <div className="mt-2 border-top pt-2">
                                                    <label className="text-secondary small fw-bold">परिवर्तन विवरण (Alteration Details)</label>
                                                    <input type="text" className="form-control form-control-sm mt-1" placeholder="विवरण" value={cleanInputVal(content.alteration_details)} onChange={(e) => handleContentChange('alteration_details', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">परिवर्तन शुल्क (Alteration Fee)</label>
                                                    <input type="number" className="form-control form-control-sm mt-1" placeholder="शुल्क राशि ₹" value={content.alteration_fee || ''} onChange={(e) => handleContentChange('alteration_fee', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">आवेदन दिनांक (Application Date)</label>
                                                    <input type="date" className="form-control form-control-sm" value={content.application_date || ''} onChange={(e) => handleContentChange('application_date', e.target.value)} />
                                                </div>
                                            )}
                                            {hasConversion && (
                                                <div className="mt-2 border-top pt-2">
                                                    <label className="text-secondary small fw-bold">कहाँ से (Conversion From)</label>
                                                    <input type="text" className="form-control form-control-sm mt-1" placeholder="कहाँ से" value={cleanInputVal(content.conversion_from)} onChange={(e) => handleContentChange('conversion_from', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">कहाँ तक (Conversion To)</label>
                                                    <input type="text" className="form-control form-control-sm mt-1" placeholder="कहाँ तक" value={cleanInputVal(content.conversion_to)} onChange={(e) => handleContentChange('conversion_to', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">नया वर्ग (New Class)</label>
                                                    <input type="text" className="form-control form-control-sm mt-1" placeholder="नया वर्ग" value={cleanInputVal(content.new_vehicle_class)} onChange={(e) => handleContentChange('new_vehicle_class', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">रूपांतरण शुल्क (Conversion Fee)</label>
                                                    <input type="number" className="form-control form-control-sm mt-1" placeholder="शुल्क राशि ₹" value={content.conversion_fee || ''} onChange={(e) => handleContentChange('conversion_fee', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">आवेदन दिनांक (Application Date)</label>
                                                    <input type="date" className="form-control form-control-sm" value={content.application_date || ''} onChange={(e) => handleContentChange('application_date', e.target.value)} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(9) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-9"
                                            checked={isRowVisible(9)} 
                                            onChange={() => toggleRow(9)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(9)}</td>
                                <td className="label-cell">वाहन का बीमा प्रमाण पत्र की वैधता</td>
                                <td className="value-cell">
                                    {vehicle.insurance_validity && !vehicle.insurance_validity.startsWith('1970-01-01') ? (
                                        <span>वैधता दिनांक {formatDate(vehicle.insurance_validity)}</span>
                                    ) : isBlankNotesheet ? (
                                        <span>वैधता दिनांक .....................</span>
                                    ) : (
                                        <span>{vehicle.insurance_validity ? `वैधता दिनांक ${formatDate(vehicle.insurance_validity)}` : 'लागू नहीं (NA)'}</span>
                                    )}
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <div className="d-flex flex-column gap-1">
                                            <input type="date" className="form-control form-control-sm" value={vehicle.insurance_validity || ''} onChange={(e) => handleVehicleChange('insurance_validity', e.target.value)} />
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(10) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-10"
                                            checked={isRowVisible(10)} 
                                            onChange={() => toggleRow(10)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(10)}</td>
                                <td className="label-cell">वाहन का प्रदूषण जांच प्रमाण पत्र की वैधता</td>
                                <td className="value-cell">
                                    <span>वैधता दिनांक {getVal(formatDate(vehicle.pollution_validity), '.....................')}</span>
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <div className="d-flex flex-column gap-1">
                                            <input type="date" className="form-control form-control-sm" value={vehicle.pollution_validity || ''} onChange={(e) => handleVehicleChange('pollution_validity', e.target.value)} />
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(11) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-11"
                                            checked={isRowVisible(11)} 
                                            onChange={() => toggleRow(11)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(11)}</td>
                                <td className="label-cell">वित्त-पोषक का नाम</td>
                                <td className="value-cell">
                                    {hasHPRegister ? (
                                        <span>श्री {getVal(content.hp_bank_name, '.....................')} (दर्ज हेतु)</span>
                                    ) : hasHPCancel ? (
                                        <span>श्री {getVal(content.cancel_bank_name, '.....................')} (निरस्त हेतु)</span>
                                    ) : (
                                        <span>{getVal(vehicle.current_hpa, isBlankNotesheet ? '.....................' : 'लागू नहीं (NA)')}</span>
                                    )}
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <div className="d-flex flex-column gap-1">
                                            {hasHPRegister ? (
                                                <div>
                                                    <label className="text-secondary small fw-bold">फाइनेंशियर (दर्ज हेतु)</label>
                                                    <input type="text" className="form-control form-control-sm mt-1" placeholder="बैंक नाम" value={cleanInputVal(content.hp_bank_name)} onChange={(e) => handleContentChange('hp_bank_name', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">दर्ज शुल्क (HP Fee)</label>
                                                    <input type="number" className="form-control form-control-sm mt-1" placeholder="शुल्क राशि ₹" value={content.hp_fee || ''} onChange={(e) => handleContentChange('hp_fee', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">एच.पी. दिनांक (HP Date)</label>
                                                    <input type="date" className="form-control form-control-sm" value={content.hp_date || ''} onChange={(e) => handleContentChange('hp_date', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">आवेदन दिनांक (Application Date)</label>
                                                    <input type="date" className="form-control form-control-sm" value={content.application_date || ''} onChange={(e) => handleContentChange('application_date', e.target.value)} />
                                                </div>
                                            ) : hasHPCancel ? (
                                                <div>
                                                    <label className="text-secondary small fw-bold">फाइनेंशियर (निरस्त हेतु)</label>
                                                    <input type="text" className="form-control form-control-sm mt-1" placeholder="बैंक नाम" value={cleanInputVal(content.cancel_bank_name)} onChange={(e) => handleContentChange('cancel_bank_name', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">निरस्त शुल्क (HP Cancel Fee)</label>
                                                    <input type="number" className="form-control form-control-sm mt-1" placeholder="शुल्क राशि ₹" value={content.hp_cancel_fee || ''} onChange={(e) => handleContentChange('hp_cancel_fee', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">निरस्त दिनांक (Cancel Date)</label>
                                                    <input type="date" className="form-control form-control-sm" value={content.cancel_date || ''} onChange={(e) => handleContentChange('cancel_date', e.target.value)} />
                                                    <label className="text-secondary small fw-bold mt-1">आवेदन दिनांक (Application Date)</label>
                                                    <input type="date" className="form-control form-control-sm" value={content.application_date || ''} onChange={(e) => handleContentChange('application_date', e.target.value)} />
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="text-secondary small fw-bold">वर्तमान फाइनेंशियर</label>
                                                    <input type="text" className="form-control form-control-sm" placeholder="उदा. CHOLAMANDALAM" value={cleanInputVal(vehicle.current_hpa)} onChange={(e) => handleVehicleChange('current_hpa', e.target.value)} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(12) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-12"
                                            checked={isRowVisible(12)} 
                                            onChange={() => toggleRow(12)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(12)}</td>
                                <td className="label-cell">पुलिस जांच/चोरी संबंधी स्थिति एन.सी.आर.बी. रिपोर्ट</td>
                                <td className="value-cell">
                                    {getVal(content.ncrb_report === 'yes' ? 'चोरी/अपराध में संलिप्त नहीं (एन.सी.आर.बी. रिपोर्ट संलग्न)' : (content.ncrb_report === 'no' ? 'संलग्न नहीं' : ''), '.....................')}
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <div className="d-flex flex-column gap-1">
                                            <Form.Select 
                                                size="sm" 
                                                value={content.ncrb_report || ''} 
                                                onChange={(e) => handleContentChange('ncrb_report', e.target.value)}
                                            >
                                                <option value="">Select Option</option>
                                                <option value="yes">हाँ - संलग्न है</option>
                                                <option value="no">नहीं</option>
                                            </Form.Select>
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(13) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-13"
                                            checked={isRowVisible(13)} 
                                            onChange={() => toggleRow(13)} 
                                            disabled={!isTransferTaken}
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(13)}</td>
                                <td className="label-cell">एफ.आई.आर. की प्रति</td>
                                <td className="value-cell">
                                    {getVal(hasDuplicateRC ? 'गुमशुदगी रिपोर्ट/सनहा की प्रति संलग्न' : '', isBlankNotesheet ? '.....................' : 'लागू नहीं (NA)')}
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        {hasDuplicateRC ? (
                                            <div className="d-flex flex-column gap-1">
                                                <label className="text-secondary small fw-bold">गुम होने का कारण (Reason)</label>
                                                <Form.Select 
                                                    size="sm" 
                                                    value={content.duplicate_reason || ''} 
                                                    onChange={(e) => handleContentChange('duplicate_reason', e.target.value)}
                                                >
                                                    <option value="">Select Option</option>
                                                    <option value="गुम हो जाने">गुम हो जाने (Lost)</option>
                                                    <option value="फट जाने">फट जाने (Damaged)</option>
                                                    <option value="चोरी हो जाने">चोरी हो जाने (Stolen)</option>
                                                </Form.Select>
                                                <label className="text-secondary small fw-bold mt-1">द्वितीय प्रति शुल्क (Duplicate Fee)</label>
                                                <input type="number" className="form-control form-control-sm mt-1" placeholder="शुल्क राशि ₹" value={content.duplicate_rc_fee || ''} onChange={(e) => handleContentChange('duplicate_rc_fee', e.target.value)} />
                                                <label className="text-secondary small fw-bold mt-1">आवेदन दिनांक (Application Date)</label>
                                                <input type="date" className="form-control form-control-sm" value={content.application_date || ''} onChange={(e) => handleContentChange('application_date', e.target.value)} />
                                            </div>
                                        ) : (
                                            <span className="text-secondary small">लागू नहीं</span>
                                        )}
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(14) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-14"
                                            checked={isRowVisible(14)} 
                                            onChange={() => toggleRow(14)} 
                                            disabled={!isTransferTaken}
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(14)}</td>
                                <td className="label-cell">वाहन स्वामी एवं क्रेता द्वारा वाहन संबंधी समस्त जवाबदारी लेते हुए शपथपत्र प्रस्तुत किया गया है।</td>
                                <td className="value-cell">
                                    {getVal(content.affidavit_attached === 'yes' ? 'हाँ, शपथपत्र संलग्न है' : (content.affidavit_attached === 'no' ? 'संलग्न नहीं' : ''), '.....................')}
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <div className="d-flex flex-column gap-1">
                                            <Form.Select 
                                                size="sm" 
                                                value={content.affidavit_attached || ''} 
                                                onChange={(e) => handleContentChange('affidavit_attached', e.target.value)}
                                            >
                                                <option value="">Select Option</option>
                                                <option value="yes">हाँ - संलग्न है</option>
                                                <option value="no">नहीं</option>
                                            </Form.Select>
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(15) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-15"
                                            checked={isRowVisible(15)} 
                                            onChange={() => toggleRow(15)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(15)}</td>
                                <td className="label-cell">वाहन का भौतिक सत्यापन दिनांक</td>
                                <td className="value-cell">
                                    {getVal(content.physical_verification_date ? `दिनांक ${formatDate(content.physical_verification_date)} को भौतिक सत्यापन किया गया` : '', isBlankNotesheet ? 'दिनांक ..................... को भौतिक सत्यापन किया गया' : 'लागू नहीं (NA)')}
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <div className="d-flex flex-column gap-1">
                                            <input type="date" className="form-control form-control-sm" value={content.physical_verification_date || ''} onChange={(e) => handleContentChange('physical_verification_date', e.target.value)} />
                                        </div>
                                    </td>
                                )}
                            </tr>
                            <tr className={!isRowVisible(16) ? (isEditable ? 'row-disabled' : 'd-none') : ''}>
                                {isEditable && (
                                    <td className="no-print text-center toggle-cell" style={{ verticalAlign: 'middle', width: '50px' }}>
                                        <Form.Check 
                                            type="switch" 
                                            id="toggle-row-16"
                                            checked={isRowVisible(16)} 
                                            onChange={() => toggleRow(16)} 
                                        />
                                    </td>
                                )}
                                <td className="sno">{getSNo(16)}</td>
                                <td className="label-cell">हस्ताक्षर मिलान हेतु मूल नस्ती संलग्न है।</td>
                                <td className="value-cell">
                                    {getVal((content.original_file_attached === 'no' || content.original_file_attached === false) ? 'नहीं, मूल नस्ती संलग्न नहीं है' : (content.original_file_attached === 'yes' ? 'हाँ, मूल नस्ती संलग्न है' : ''), '.....................')}
                                </td>
                                {isEditable && (
                                    <td className="no-print edit-cell">
                                        <div className="d-flex flex-column gap-1">
                                            <Form.Select 
                                                size="sm" 
                                                value={content.original_file_attached || ''} 
                                                onChange={(e) => handleContentChange('original_file_attached', e.target.value)}
                                            >
                                                <option value="">Select Option</option>
                                                <option value="yes">हाँ - संलग्न है</option>
                                                <option value="no">नहीं</option>
                                            </Form.Select>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        </tbody>
                    </table>

                    {/* Closing Paragraph */}
                    <div className="notesheet-closing">
                        अतः वाहन क्रमांक <strong>{vehicle.registration_number}</strong> का <strong>{selectedWorksText}</strong>
                        {(content.original_file_attached === 'no' || content.original_file_attached === false) ? (
                            <span> किये जाने हेतु <strong>मूल नस्ती प्राप्त नहीं होने की स्थिति में फार्म-20 में नोटरी द्वारा सत्यापित कर</strong></span>
                        ) : (
                            <span> करने हेतु <strong>मूल नस्ती सहित</strong></span>
                        )} नियमानुसार अवलोकनार्थ एवं उचित आदेशार्थ सादर प्रस्तुत है।
                    </div>

                    {/* Signature */}
                    <div className="notesheet-signature">
                        शाखा प्रभारी
                    </div>

                    {/* Bottom-left User Code Stamp */}
                    {creatorCode && (
                        <div className="notesheet-user-code">
                            {creatorCode}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-center gap-3 mt-4 no-print">
                {isEditable ? (
                    <>
                        {onBack && (
                            <Button variant="outline-secondary" className="px-5 py-2 rounded-3 fs-6" onClick={onBack}>
                                <i className="bi bi-arrow-left me-2"></i> वापस जाएँ (Back)
                            </Button>
                        )}
                        <Button
                            className="btn-success-gradient px-5 py-2 rounded-3 d-flex align-items-center fs-6"
                            onClick={() => {
                                if (onSave) {
                                     const finalVisibility = { ...rowVisibility };
                                     finalVisibility[2] = isRowVisible(2);
                                     finalVisibility[13] = isRowVisible(13);
                                     finalVisibility[14] = isRowVisible(14);
                                     onSave({
                                         ...content,
                                         row_visibility: finalVisibility
                                     });
                                }
                            }}
                            disabled={loading}
                        >
                            {loading ? (
                                <Spinner size="sm" className="me-2" />
                            ) : (
                                <i className="bi bi-file-earmark-check me-2"></i>
                            )}
                            नोटशीट जनरेट करें (Generate Notesheet)
                        </Button>
                    </>
                ) : (
                    <Button
                        className="btn-success-gradient px-5 py-2 rounded-3 d-flex align-items-center fs-6"
                        onClick={() => window.print()}
                    >
                        <i className="bi bi-printer me-2"></i> प्रिंट करें (Print)
                    </Button>
                )}
            </div>
        </div>
    );
};

export default NotesheetPreview;
