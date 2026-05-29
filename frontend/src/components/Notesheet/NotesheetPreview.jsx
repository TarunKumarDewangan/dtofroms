import React from 'react';
import { Card, Button } from 'react-bootstrap';

const NotesheetPreview = ({ notesheet }) => {
    if (!notesheet) return null;

    const data = notesheet.data || notesheet;
    const vehicle = data.vehicle;
    const content = data.content || {};
    const works = data.combined_works || [];

    const isBlankNotesheet = content.is_blank === true || data.is_blank === true || notesheet.is_blank === true || vehicle?.is_blank_notesheet || vehicle?.owner_name === '.....................';

    const getVal = (val, fallback = '.....................') => {
        if (isBlankNotesheet) return fallback;
        return val || fallback;
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

    // Date formatting helper (dd-mm-yyyy)
    const formatDate = (dateStr) => {
        if (isBlankNotesheet || !dateStr || dateStr === '1970-01-01' || dateStr.startsWith('1970')) return '.....................';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Registration date calculation (15 years before fitness validity)
    const getRegistrationDate = (v) => {
        if (isBlankNotesheet || !v.fitness_validity || v.fitness_validity === '1970-01-01' || v.fitness_validity.startsWith('1970')) return '.....................';
        const date = new Date(v.fitness_validity);
        date.setFullYear(date.getFullYear() - 15);
        return formatDate(date.toISOString().split('T')[0]);
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

    return (
        <div className="animate-fade-in">
            {/* Inline CSS styling to guarantee print output matches the image layout */}
            <style>{`
                .notesheet-outer-border {
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
                    body .print-container {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .notesheet-outer-border {
                        border: 1px solid #000000 !important;
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
                    }
                    @page {
                        size: A4;
                        margin: 10mm 10mm 10mm 15mm; /* Standard office printing margins */
                    }
                }
            `}</style>

            <Card className="glass-card border-0 mb-4 no-print">
                <Card.Body className="p-4 d-flex justify-content-between align-items-center">
                    <h5 className="text-white fw-semibold mb-0">
                        <i className="bi bi-file-earmark-check text-success me-2"></i>
                        नोटशीट पूर्वावलोकन (Official NoteSheet Template)
                    </h5>
                    <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25 px-3 py-2 rounded-pill font-monospace">
                        {data.notesheet_number}
                    </span>
                </Card.Body>
            </Card>

            {/* NoteSheet Border Container */}
            <div className="print-container">
                <div className="notesheet-outer-border">
                    {/* Header */}
                    <div className="notesheet-header">जिला परिवहन कार्यालय, धमतरी, छ०ग०</div>
                    <div className="notesheet-subheader">नोट शीट</div>
                    
                    <div className="notesheet-divider"></div>

                    {/* Subject Line */}
                    <div className="notesheet-subject">
                        विषय:-वाहन क्रमांक {vehicle.registration_number} ({vehicle.vehicle_type}) का {selectedWorksText} बाबत्।
                    </div>

                    <div className="notesheet-divider"></div>

                    {/* Paragraph 1: Ownership Transfer */}
                    {hasTransfer && (
                        <div className="notesheet-paragraph">
                            उक्त वाहन को वाहन स्वामी श्री <strong>{content.buyer_name || '.....................'}</strong> आ. श्री <strong>{content.buyer_father || '.....................'}</strong> निवासी <strong>{content.buyer_address || '.....................'}</strong> ने वाहन स्वामी श्री <strong>{getVal(vehicle.owner_name)}</strong> आ. श्री <strong>{getVal(vehicle.owner_father_name)}</strong> से क्रय कर स्वामित्व अंतरण हेतु निर्धारित प्रारूप फार्म नं. 29(2 प्रति में) एवं फार्म नं. 30 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{content.transfer_fee || '.....................'}</strong> को जमा कर आवेदन दिनांक <strong>{formatDate(content.application_date)}</strong> को कार्यालय में प्रस्तुत किया गया है।
                        </div>
                    )}

                    {/* Paragraph 2: HPA Register, HPA Cancel, Address Change */}
                    {(hasHPRegister || hasHPCancel || hasAddressChange) && (
                        <div className="notesheet-paragraph">
                            {hasHPRegister && (
                                <span>एच.पी. दर्ज किये जाने हेतु निर्धारित प्रारूप फार्म नं. 34 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{content.hp_fee || '.....................'}</strong> दिनांक <strong>{formatDate(content.hp_date)}</strong> को जमा कर आवेदन दिनांक <strong>{formatDate(content.application_date)}</strong> को कार्यालय में प्रस्तुत किया गया है। </span>
                            )}
                            {hasHPCancel && (
                                <span>एच.पी. निरस्त किये जाने हेतु निर्धारित प्रारूप फार्म नं. 35 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{content.hp_cancel_fee || '.....................'}</strong> दिनांक <strong>{formatDate(content.cancel_date)}</strong> को जमा कर आवेदन दिनांक <strong>{formatDate(content.application_date)}</strong> को कार्यालय में प्रस्तुत किया गया है। </span>
                            )}
                            {hasAddressChange && (
                                <span>पता परिवर्तन दर्ज किये जाने हेतु निर्धारित प्रारूप फार्म नं. 33 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{content.address_fee || '.....................'}</strong> दिनांक <strong>{formatDate(content.application_date)}</strong> को जमा कर आवेदन दिनांक <strong>{formatDate(content.application_date)}</strong> को कार्यालय में प्रस्तुत किया गया है। </span>
                            )}
                        </div>
                    )}

                    {/* Paragraph 3: Duplicate RC */}
                    {hasDuplicateRC && (
                        <div className="notesheet-paragraph">
                            पंजीयन प्रमाण पत्र की द्वितीय प्रति जारी किये जाने हेतु निर्धारित प्रारूप फार्म नं. 26 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{content.duplicate_rc_fee || '.....................'}</strong> दिनांक <strong>{formatDate(content.application_date)}</strong> को जमा कर आवेदन दिनांक <strong>{formatDate(content.application_date)}</strong> को कार्यालय में प्रस्तुत किया गया है।
                        </div>
                    )}

                    {/* Paragraph 4: Transfer after Death */}
                    {hasTransferDeath && (
                        <div className="notesheet-paragraph">
                            मूल वाहन स्वामी श्री <strong>{vehicle.owner_name}</strong> की मृत्यु हो जाने के कारण उनके विधिक वारिस श्री <strong>{content.applicant_name || '.....................'}</strong> आ. श्री <strong>{content.applicant_father || '.....................'}</strong> निवासी <strong>{content.applicant_address || '.....................'}</strong> द्वारा स्वामित्व अंतरण हेतु निर्धारित प्रारूप फार्म नं. 31 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{content.death_transfer_fee || '.....................'}</strong> को जमा कर आवेदन दिनांक <strong>{formatDate(content.application_date)}</strong> को कार्यालय में प्रस्तुत किया गया है।
                        </div>
                    )}

                    {/* Paragraph 5: Renewal of Registration */}
                    {hasRenewal && (
                        <div className="notesheet-paragraph">
                            वाहन का पंजीयन अवधि समाप्त होने के कारण पंजीयन नवीनीकरण (Renewal of Registration) हेतु निर्धारित प्रारूप फार्म नं. 25 में विहित् ऑनलाईन शुल्क राशि रू. <strong>{content.renewal_fee || '.....................'}</strong> को जमा कर आवेदन दिनांक <strong>{formatDate(content.application_date)}</strong> को कार्यालय में प्रस्तुत किया गया है।
                        </div>
                    )}

                    {/* Paragraph 6: Alteration of Vehicle */}
                    {hasAlteration && (
                        <div className="notesheet-paragraph">
                            वाहन की मूल बनावट में परिवर्तन (Alteration of Vehicle: <strong>{content.alteration_details || '.....................'}</strong>) दर्ज करने हेतु निर्धारित प्रारूप फार्म नं. 22C एवं 22D में विहित् ऑनलाईन शुल्क राशि रू. <strong>{content.alteration_fee || '.....................'}</strong> को जमा कर आवेदन दिनांक <strong>{formatDate(content.application_date)}</strong> को कार्यालय में प्रस्तुत किया गया है।
                        </div>
                    )}

                    {/* Paragraph 7: Conversion of Vehicle */}
                    {hasConversion && (
                        <div className="notesheet-paragraph">
                            वाहन का वर्ग रूपांतरण (Conversion of Vehicle: <strong>{content.conversion_from || '.....................'}</strong> से <strong>{content.conversion_to || '.....................'}</strong>{content.new_vehicle_class ? <span>, नया वर्ग: <strong>{content.new_vehicle_class}</strong></span> : ''}) दर्ज करने हेतु निर्धारित प्रारूप में विहित् ऑनलाईन शुल्क राशि रू. <strong>{content.conversion_fee || '.....................'}</strong> को जमा कर आवेदन दिनांक <strong>{formatDate(content.application_date)}</strong> को कार्यालय में प्रस्तुत किया गया है।
                        </div>
                    )}

                    {/* Table Title */}
                    <div className="notesheet-table-title">
                        वाहन क्रमांक <strong>{vehicle.registration_number}</strong> (वाहन का मॉडल {getVal(vehicle.model_year)}) संबंधित जानकारी निम्नानुसार है:-
                    </div>

                    {/* 14-Row Table */}
                    <table className="notesheet-table">
                        <tbody>
                            <tr>
                                <td className="sno">01.</td>
                                <td className="label-cell">वर्तमान वाहन स्वामी/विक्रेता का नाम पिता व वर्तमान पता</td>
                                <td className="value-cell">
                                    श्री {getVal(vehicle.owner_name)} आ. श्री {getVal(vehicle.owner_father_name)} निवासी {getVal(vehicle.owner_address)}
                                </td>
                            </tr>
                            <tr>
                                <td className="sno">02.</td>
                                <td className="label-cell">प्रस्तावित वाहन स्वामी/क्रेता का नाम पिता व वर्तमान पता</td>
                                <td className="value-cell">
                                    {isBlankNotesheet ? (
                                        (hasTransfer || hasTransferDeath) ? (
                                            <span>श्री ..................... आ. श्री ..................... निवासी .....................</span>
                                        ) : (
                                            <span>लागू नहीं (NA)</span>
                                        )
                                    ) : hasTransfer ? (
                                        <span>श्री {content.buyer_name || '.......'} आ. श्री {content.buyer_father || '.......'} निवासी {content.buyer_address || '.......'}</span>
                                    ) : hasTransferDeath ? (
                                        <span>श्री {content.applicant_name || '.......'} आ. श्री {content.applicant_father || '.......'} निवासी {content.applicant_address || '.......'}</span>
                                    ) : (
                                        <span>लागू नहीं (NA)</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="sno">03.</td>
                                <td className="label-cell">वाहन का पंजीयन दिनांक</td>
                                <td className="value-cell">{getRegistrationDate(vehicle)}</td>
                            </tr>
                            <tr>
                                <td className="sno">04.</td>
                                <td className="label-cell">चेसिस क्रमांक</td>
                                <td className="value-cell">{getVal(vehicle.chassis_number)}</td>
                            </tr>
                            <tr>
                                <td className="sno">05.</td>
                                <td className="label-cell">इंजन क्रमांक</td>
                                <td className="value-cell">{getVal(vehicle.engine_number)}</td>
                            </tr>
                            <tr>
                                <td className="sno">06.</td>
                                <td className="label-cell">वाहन का मोटरयान कर की जमा दिनांक</td>
                                <td className="value-cell">
                                    {isBlankNotesheet ? (
                                        <span>दिनांक ..................... (कर राशि रु. ...................../-)</span>
                                    ) : (
                                        <span>दिनांक {formatDate(vehicle.tax_paid_date)} (शुल्क ₹{Number(vehicle.tax_amount).toLocaleString('en-IN')}/-)</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="sno">07.</td>
                                <td className="label-cell">वाहन का परमिट (यदि लागू हो तो)</td>
                                <td className="value-cell">
                                    {isBlankNotesheet ? (
                                        <span>वैधता दिनांक .....................</span>
                                    ) : (
                                        <span>{vehicle.permit_validity ? `वैधता दिनांक ${formatDate(vehicle.permit_validity)}` : 'लागू नहीं (NA)'}</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="sno">08.</td>
                                <td className="label-cell">वाहन का फिटनेस/पंजीयन प्रमाण पत्र की वैधता</td>
                                <td className="value-cell">
                                    {isBlankNotesheet ? (
                                        <span>वैधता दिनांक .....................</span>
                                    ) : (
                                        <span>वैधता दिनांक {formatDate(vehicle.fitness_validity)}</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="sno">09.</td>
                                <td className="label-cell">वाहन का प्रदूषण जांच प्रमाण पत्र की वैधता</td>
                                <td className="value-cell">
                                    {isBlankNotesheet ? (
                                        <span>वैधता दिनांक .....................</span>
                                    ) : (
                                        <span>{vehicle.pollution_validity ? `वैधता दिनांक ${formatDate(vehicle.pollution_validity)}` : 'लागू नहीं (NA)'}</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="sno">10.</td>
                                <td className="label-cell">वित्त-पोषक का नाम</td>
                                <td className="value-cell">
                                    {isBlankNotesheet ? (
                                        hasHPRegister ? (
                                            <span>श्री ..................... (दर्ज हेतु)</span>
                                        ) : hasHPCancel ? (
                                            <span>श्री ..................... (निरस्त हेतु)</span>
                                        ) : (
                                            <span>.....................</span>
                                        )
                                    ) : hasHPRegister ? (
                                        <span>श्री {content.hp_bank_name || '.......'} (दर्ज हेतु)</span>
                                    ) : hasHPCancel ? (
                                        <span>श्री {content.cancel_bank_name || '.......'} (निरस्त हेतु)</span>
                                    ) : (
                                        <span>{vehicle.current_hpa}</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="sno">11.</td>
                                <td className="label-cell">पुलिस जांच/चोरी संबंधी स्थिति एन.सी.आर.बी. रिपोर्ट</td>
                                <td className="value-cell">
                                    {isBlankNotesheet ? (
                                        <span>.....................</span>
                                    ) : (
                                        content.ncrb_report === 'yes' ? 'चोरी/अपराध में संलिप्त नहीं (एन.सी.आर.बी. रिपोर्ट संलग्न)' : 'संलग्न नहीं'
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="sno">12.</td>
                                <td className="label-cell">एफ.आई.आर. की प्रति</td>
                                <td className="value-cell">
                                    {isBlankNotesheet ? (
                                        <span>.....................</span>
                                    ) : (
                                        hasDuplicateRC ? 'गुमशुदगी रिपोर्ट/सनहा की प्रति संलग्न' : 'लागू नहीं (NA)'
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="sno">13.</td>
                                <td className="label-cell">वाहन स्वामी एवं क्रेता द्वारा वाहन संबंधी समस्त जवाबदारी लेते हुए शपथपत्र प्रस्तुत किया गया है।</td>
                                <td className="value-cell">
                                    {isBlankNotesheet ? (
                                        <span>.....................</span>
                                    ) : (
                                        content.affidavit_attached === 'yes' ? 'हाँ, शपथपत्र संलग्न है' : 'संलग्न नहीं'
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="sno">14.</td>
                                <td className="label-cell">वाहन का भौतिक सत्यापन दिनांक</td>
                                <td className="value-cell">
                                    {isBlankNotesheet ? (
                                        <span>दिनांक ..................... को भौतिक सत्यापन किया गया</span>
                                    ) : (
                                        content.physical_verification_date ? `दिनांक ${formatDate(content.physical_verification_date)} को भौतिक सत्यापन किया गया` : 'लागू नहीं (NA)'
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="sno">15.</td>
                                <td className="label-cell">हस्ताक्षर मिलान हेतु मूल नस्ती संलग्न है।</td>
                                <td className="value-cell">
                                    {isBlankNotesheet ? (
                                        <span>.....................</span>
                                    ) : (
                                        (content.original_file_attached === 'no' || content.original_file_attached === false) ? 'नहीं, मूल नस्ती संलग्न नहीं है' : 'हाँ, मूल नस्ती संलग्न है'
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Closing Paragraph */}
                    <div className="notesheet-closing">
                        वाहन क्रमांक <strong>{vehicle.registration_number}</strong> का <strong>{selectedWorksText}</strong> किये जाने हेतु {isBlankNotesheet ? (
                            <strong>.....................</strong>
                        ) : (
                            (content.original_file_attached === 'no' || content.original_file_attached === false) ? <strong>मूल नस्ती प्राप्त नहीं होने की स्थिति में फार्म-20 में नोटरी द्वारा सत्यापित कर</strong> : <strong>मूल नस्ती सहित</strong>
                        )} प्रकरण अवलोकनार्थ एवं आदेशार्थ प्रस्तुत है।
                    </div>

                    {/* Signature */}
                    <div className="notesheet-signature">
                        शाखा प्रभारी
                    </div>

                    {/* DTO Comment and Signature Section */}
                    <div className="notesheet-dto-section" style={{ marginTop: '30px', borderTop: '1px dotted #000000', paddingTop: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>जिला परिवहन अधिकारी (DTO) आदेश / टिप्पणी:</div>
                        <div style={{ height: '120px' }}></div> {/* Spacious spacer for handwriting comments and signature */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                            <span>दिनांक: ....................</span>
                            <span>हस्ताक्षर जिला परिवहन अधिकारी</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-center gap-3 mt-4 no-print">
                <Button
                    className="btn-success-gradient px-5 py-2 rounded-3 d-flex align-items-center fs-6"
                    onClick={() => window.print()}
                >
                    <i className="bi bi-printer me-2"></i> प्रिंट करें (Print)
                </Button>
            </div>
        </div>
    );
};

export default NotesheetPreview;
