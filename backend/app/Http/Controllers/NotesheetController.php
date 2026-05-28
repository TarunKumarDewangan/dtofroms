<?php

namespace App\Http\Controllers;

use App\Models\Notesheet;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Carbon\Carbon;

class NotesheetController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Notesheet::with(['vehicle', 'creator', 'approver']);

        if ($user->role !== 'admin') {
            $query->where('created_by', $user->id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'combined_works' => 'required|array|min:1',
        ]);

        // Auto-generate Notesheet Number
        $year = Carbon::now()->year;
        $count = Notesheet::whereYear('created_at', $year)->count() + 1;
        $notesheetNumber = 'NS/DHAM/' . $year . '/' . str_pad($count, 3, '0', STR_PAD_LEFT);

        $notesheet = Notesheet::create([
            'notesheet_number' => $notesheetNumber,
            'vehicle_id' => $request->vehicle_id,
            'combined_works' => $request->combined_works,
            'status' => 'draft',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Notesheet draft created',
            'notesheet' => $notesheet
        ], 201);
    }

    public function show($id)
    {
        return response()->json(Notesheet::with(['vehicle', 'creator', 'approver'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $notesheet = Notesheet::findOrFail($id);

        if ($notesheet->status !== 'draft' && $request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Cannot update a notesheet that is already submitted or processed.'
            ], 422);
        }

        $request->validate([
            'combined_works' => 'required|array|min:1',
        ]);

        $notesheet->update([
            'combined_works' => $request->combined_works,
        ]);

        return response()->json([
            'message' => 'Notesheet updated successfully',
            'notesheet' => $notesheet
        ]);
    }

    public function destroy($id)
    {
        $notesheet = Notesheet::findOrFail($id);
        $notesheet->delete();
        return response()->json([
            'message' => 'Notesheet deleted successfully'
        ]);
    }

    public function generate(Request $request, $id)
    {
        $notesheet = Notesheet::with('vehicle')->findOrFail($id);
        
        $request->validate([
            'content' => 'required|array',
        ]);

        $content = $request->content;
        $vehicle = $notesheet->vehicle;
        $works = $notesheet->combined_works;

        // Generate Subject
        $workNames = collect($works)->pluck('work_name')->map(function($name) {
            // Strip English parts in parenthesis if any for cleaner Hindi subject
            return preg_replace('/\\s*\\([^)]*\\)/', '', $name);
        })->toArray();
        
        $subject = "वाहन क्रमांक {$vehicle->registration_number} का " . implode(" / ", $workNames) . " बाबत।";

        // Generate Body
        $body = "कार्यालय जिला परिवहन अधिकारी जिला- धमतरी (छ.ग.)\n";
        $body .= "नोट शीट\n\n";
        $body .= "विषय:- " . $subject . "\n\n";

        $hasTransfer = collect($works)->contains('work_code', 'OWN_TRANSFER');
        $hasHPRegister = collect($works)->contains('work_code', 'HP_REGISTER');
        $hasHPCancel = collect($works)->contains('work_code', 'HP_CANCEL');
        $hasAddressChange = collect($works)->contains('work_code', 'ADDRESS_CHANGE');
        $hasDuplicateRC = collect($works)->contains('work_code', 'DUPLICATE_RC');
        $hasTransferDeath = collect($works)->contains('work_code', 'TRANSFER_DEATH');
        $hasRenewal = collect($works)->contains('work_code', 'REG_RENEWAL');
        $hasAlteration = collect($works)->contains('work_code', 'VEHICLE_ALTERATION');
        $hasConversion = collect($works)->contains('work_code', 'VEHICLE_CONVERSION');

        // 1. Ownership Transfer
        if ($hasTransfer) {
            $saleDate = isset($content['sale_date']) ? Carbon::parse($content['sale_date'])->format('d-m-Y') : '_______';
            $buyerName = $content['buyer_name'] ?? '_______';
            $buyerFather = $content['buyer_father'] ?? '_______';
            $buyerAddress = $content['buyer_address'] ?? '_______';
            $transferFee = $content['transfer_fee'] ?? '_______';

            $body .= "उक्त वाहन को श्री {$buyerName} आत्मज श्री {$buyerFather} निवासी {$buyerAddress} ने मूल वाहन स्वामी श्री {$vehicle->owner_name} से क्रय कर स्वामित्व अंतरण हेतु निर्धारित प्रारूप क्रय-विक्रय फार्म नं. 29 एवं 30 में विक्रय दिनांक {$saleDate} को प्रस्तुत कर शुल्क रु. {$transferFee}/- ऑनलाइन माध्यम से जमा कर आवेदन प्रस्तुत किया है।\n\n";
        }

        // 2. Transfer after Death
        if ($hasTransferDeath) {
            $deathDate = isset($content['death_date']) ? Carbon::parse($content['death_date'])->format('d-m-Y') : '_______';
            $applicantName = $content['applicant_name'] ?? '_______';
            $applicantFather = $content['applicant_father'] ?? '_______';
            $applicantAddress = $content['applicant_address'] ?? '_______';
            $relation = $content['relation_to_deceased'] ?? 'वारिस';
            $deathFee = $content['death_transfer_fee'] ?? '_______';

            $body .= "मूल वाहन स्वामी श्री {$vehicle->owner_name} की मृत्यु दिनांक {$deathDate} को हो जाने के कारण उनके विधिक {$relation} श्री {$applicantName} आत्मज श्री {$applicantFather} निवासी {$applicantAddress} द्वारा मृत्यु उपरांत स्वामित्व अंतरण हेतु निर्धारित प्रारूप फार्म नं. 31, मृत्यु प्रमाण पत्र, विधिक वारिस प्रमाण पत्र एवं शपथ पत्र के साथ विहित शुल्क रु. {$deathFee}/- ऑनलाइन माध्यम से जमा कर आवेदन प्रस्तुत किया गया है।\n\n";
        }

        // 3. HP Register
        if ($hasHPRegister) {
            $hpBank = $content['hp_bank_name'] ?? '_______';
            $hpFee = $content['hp_fee'] ?? '_______';
            $hpDate = isset($content['hp_date']) ? Carbon::parse($content['hp_date'])->format('d-m-Y') : '_______';

            $body .= "आवेदक द्वारा वाहन में फाइनेंस/हायर परचेस (HPA) दर्ज करने हेतु बैंक/फाइनेंस कंपनी {$hpBank} के साथ निष्पादित समझौता प्रारूप फार्म नं. 34 में विहित शुल्क रूपये {$hpFee}/- ऑनलाइन माध्यम से दिनांक {$hpDate} को जमा कर प्रकरण प्रस्तुत किया गया है।\n\n";
        }

        // 4. HP Cancel
        if ($hasHPCancel) {
            $cancelBank = $content['cancel_bank_name'] ?? '_______';
            $cancelFee = $content['hp_cancel_fee'] ?? '_______';
            $cancelDate = isset($content['cancel_date']) ? Carbon::parse($content['cancel_date'])->format('d-m-Y') : '_______';

            $body .= "वाहन में पूर्व में दर्ज फाइनेंस अनुबंध को निरस्त करने हेतु फाइनेंसर {$cancelBank} द्वारा जारी अनापत्ति प्रमाण पत्र (NOC) एवं प्रारूप फार्म नं. 35 के साथ विहित शुल्क रूपये {$cancelFee}/- ऑनलाइन माध्यम से दिनांक {$cancelDate} को जमा कर आवेदन प्रस्तुत किया है।\n\n";
        }

        // 5. Address Change
        if ($hasAddressChange) {
            $newAddress = $content['new_address'] ?? '_______';
            $addressFee = $content['address_fee'] ?? '_______';
            $addressProofType = $content['address_proof_type'] ?? 'आधार कार्ड/निवास प्रमाण पत्र';

            $body .= "वाहन स्वामी द्वारा अपना निवास स्थान परिवर्तन करने के कारण पंजीयन प्रमाण पत्र में नया पता दर्ज करने हेतु निर्धारित प्रारूप फार्म नं. 33 में विहित शुल्क रु. {$addressFee}/- जमा कर आवेदन प्रस्तुत किया गया है। आवेदक द्वारा नया पता प्रमाण पत्र के रूप में {$addressProofType} संलग्न किया गया है।\n\n";
        }

        // 6. Duplicate RC
        if ($hasDuplicateRC) {
            $dupReason = $content['duplicate_reason'] ?? 'गुम हो जाने';
            $dupFee = $content['duplicate_rc_fee'] ?? '_______';

            $body .= "वाहन स्वामी द्वारा पंजीयन पुस्तिका (RC) {$dupReason} के कारण द्वितीय प्रति जारी करने हेतु निर्धारित प्रारूप फार्म नं. 26 में विहित शुल्क रु. {$dupFee}/- जमा कर आवेदन प्रस्तुत किया गया है। आवेदक द्वारा पुलिस थाना में दर्ज कराई गई गुमशुदगी रिपोर्ट/सनहा की प्रति एवं शपथ पत्र संलग्न किया गया है।\n\n";
        }

        // 7. Renewal of Registration
        if ($hasRenewal) {
            $renewalFee = $content['renewal_fee'] ?? '_______';
            $body .= "वाहन का पंजीयन अवधि समाप्त होने के कारण पंजीयन नवीनीकरण (Renewal of Registration) हेतु निर्धारित प्रारूप फार्म नं. 25 में विहित ऑनलाइन शुल्क रूपये {$renewalFee}/- जमा कर आवेदन प्रस्तुत किया गया है।\n\n";
        }

        // 8. Alteration of Vehicle
        if ($hasAlteration) {
            $altDetails = $content['alteration_details'] ?? '_______';
            $altFee = $content['alteration_fee'] ?? '_______';
            $body .= "वाहन की मूल बनावट में परिवर्तन (Alteration of Vehicle: {$altDetails}) दर्ज करने हेतु निर्धारित प्रारूप फार्म नं. 22C एवं 22D में विहित ऑनलाइन शुल्क रूपये {$altFee}/- जमा कर आवेदन प्रस्तुत किया गया है।\n\n";
        }

        // 9. Conversion of Vehicle
        if ($hasConversion) {
            $convFrom = $content['conversion_from'] ?? '_______';
            $convTo = $content['conversion_to'] ?? '_______';
            $convFee = $content['conversion_fee'] ?? '_______';
            $newClass = $content['new_vehicle_class'] ?? '';
            $classText = $newClass ? ", नया वर्ग: {$newClass}" : "";
            $body .= "वाहन का वर्ग रूपांतरण (Conversion of Vehicle: {$convFrom} से {$convTo}{$classText}) दर्ज करने हेतु निर्धारित प्रारूप में विहित ऑनलाइन शुल्क रूपये {$convFee}/- जमा कर आवेदन प्रस्तुत किया गया है।\n\n";
        }

        // Supporting Details (NCRB / Physical Verification / Affidavit)
        $supportingDocs = [];
        if (isset($content['affidavit_attached']) && $content['affidavit_attached'] === 'yes') {
            $supportingDocs[] = "आवेदक द्वारा प्रस्तुत नोटरीकृत शपथ पत्र संलग्न है।";
        }
        if (isset($content['ncrb_report']) && $content['ncrb_report'] === 'yes') {
            $supportingDocs[] = "वाहन का एन.सी.आर.बी. (NCRB) क्लीयरेंस रिपोर्ट संलग्न है, जिसमें वाहन चोरी या किसी गंभीर अपराध में संलिप्त नहीं पाया गया है।";
        }
        if (isset($content['physical_verification_date']) && $content['physical_verification_date']) {
            $verifDate = Carbon::parse($content['physical_verification_date'])->format('d-m-Y');
            $supportingDocs[] = "वाहन का भौतिक सत्यापन (Physical Verification) कार्यालयीन उपनिरीक्षक/आरक्षक द्वारा दिनांक {$verifDate} को किया गया है तथा सत्यापन रिपोर्ट संलग्न है।";
        }

        if (count($supportingDocs) > 0) {
            $body .= implode("\n", $supportingDocs) . "\n\n";
        }

        // Vehicle Details Table Block
        $body .= "वाहन का विवरण निम्नानुसार है:-\n";
        $body .= "--------------------------------------------------------\n";
        $body .= "१. वाहन क्रमांक             : {$vehicle->registration_number}\n";
        $body .= "२. वाहन स्वामी का नाम         : {$vehicle->owner_name}\n";
        $body .= "३. पिता/पति का नाम          : {$vehicle->owner_father_name}\n";
        $body .= "४. वर्तमान पता               : {$vehicle->owner_address}\n";
        $body .= "५. वाहन का प्रकार            : {$vehicle->vehicle_type}\n";
        $body .= "६. मॉडल/निर्माण वर्ष          : {$vehicle->model_year}\n";
        $body .= "७. चेसिस नंबर              : {$vehicle->chassis_number}\n";
        $body .= "८. इंजन नंबर               : {$vehicle->engine_number}\n";
        $body .= "९. टैक्स वैधता/भुगतान दिनांक    : " . Carbon::parse($vehicle->tax_paid_date)->format('d-m-Y') . " (कर राशि रु. " . number_format($vehicle->tax_amount, 2) . "/-)\n";
        $body .= "१०. फिटनेस वैधता दिनांक      : " . Carbon::parse($vehicle->fitness_validity)->format('d-m-Y') . "\n";
        $body .= "११. बीमा वैधता दिनांक        : " . Carbon::parse($vehicle->insurance_validity)->format('d-m-Y') . "\n";
        if ($vehicle->permit_validity) {
            $body .= "१२. परमिट वैधता दिनांक       : " . Carbon::parse($vehicle->permit_validity)->format('d-m-Y') . "\n";
        }
        if ($vehicle->pollution_validity) {
            $body .= "१३. प्रदूषण वैधता दिनांक       : " . Carbon::parse($vehicle->pollution_validity)->format('d-m-Y') . "\n";
        }
        $body .= "१४. बंधक / फाइनेंस स्थिति       : {$vehicle->current_hpa}\n";
        $originalFileAttached = $content['original_file_attached'] ?? 'yes';
        $originalFileStatusText = ($originalFileAttached === 'no' || $originalFileAttached === false) 
            ? "नहीं, मूल नस्ती संलग्न नहीं है" 
            : "हाँ, मूल नस्ती संलग्न है";
        $body .= "१५. हस्ताक्षर मिलान हेतु मूल नस्ती : {$originalFileStatusText}\n";
        $body .= "--------------------------------------------------------\n\n";

        // Closing Paragraph
        $workLabels = implode(" / ", $workNames);
        $originalFileAttached = $content['original_file_attached'] ?? 'yes';
        $nastiText = ($originalFileAttached === 'no' || $originalFileAttached === false)
            ? "मूल नस्ती प्राप्त नहीं होने की स्थिति में फार्म-20 में नोटरी द्वारा सत्यापित कर"
            : "प्रकरण आवश्यक मूल नस्ती सहित";
        $body .= "अतः वाहन क्रमांक {$vehicle->registration_number} का {$workLabels} करने हेतु {$nastiText} नियमानुसार अवलोकनार्थ एवं उचित आदेशार्थ सादर प्रस्तुत है।\n\n";
        $body .= "शाखा प्रभारी\n\n";
        $body .= "--------------------------------------------------------\n";
        $body .= "जिला परिवहन अधिकारी (DTO) आदेश / टिप्पणी:\n\n\n\n";
        $body .= "दिनांक: ....................          हस्ताक्षर जिला परिवहन अधिकारी\n";

        // Save
        $notesheet->subject_line = $subject;
        $notesheet->content = $content;
        $notesheet->final_text = $body;
        $notesheet->save();

        return response()->json([
            'message' => 'Notesheet generated successfully',
            'notesheet' => $notesheet
        ]);
    }

    public function submit(Request $request, $id)
    {
        $notesheet = Notesheet::findOrFail($id);

        if ($notesheet->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft notesheets can be submitted.'
            ], 422);
        }

        $notesheet->status = 'submitted';
        $notesheet->submitted_at = Carbon::now();
        $notesheet->save();

        return response()->json([
            'message' => 'Notesheet submitted for approval successfully',
            'notesheet' => $notesheet
        ]);
    }

    public function approve(Request $request, $id)
    {
        $notesheet = Notesheet::findOrFail($id);

        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Admin only.'
            ], 403);
        }

        if ($notesheet->status !== 'submitted') {
            return response()->json([
                'message' => 'Only submitted notesheets can be approved.'
            ], 422);
        }

        $notesheet->status = 'approved';
        $notesheet->approved_by = $request->user()->id;
        $notesheet->approved_at = Carbon::now();
        $notesheet->save();

        // Update Vehicle data if relevant
        $vehicle = Vehicle::find($notesheet->vehicle_id);
        $content = $notesheet->content;
        $works = $notesheet->combined_works;

        if ($vehicle && $content) {
            $hasTransfer = collect($works)->contains('work_code', 'OWN_TRANSFER');
            $hasTransferDeath = collect($works)->contains('work_code', 'TRANSFER_DEATH');
            $hasHPRegister = collect($works)->contains('work_code', 'HP_REGISTER');
            $hasHPCancel = collect($works)->contains('work_code', 'HP_CANCEL');
            $hasAddressChange = collect($works)->contains('work_code', 'ADDRESS_CHANGE');

            if ($hasTransfer) {
                $vehicle->owner_name = $content['buyer_name'];
                $vehicle->owner_father_name = $content['buyer_father'];
                $vehicle->owner_address = $content['buyer_address'];
            } elseif ($hasTransferDeath) {
                $vehicle->owner_name = $content['applicant_name'];
                $vehicle->owner_father_name = $content['applicant_father'];
                $vehicle->owner_address = $content['applicant_address'];
            }

            if ($hasHPRegister) {
                $vehicle->current_hpa = $content['hp_bank_name'];
            } elseif ($hasHPCancel) {
                $vehicle->current_hpa = 'NA';
            }

            if ($hasAddressChange) {
                $vehicle->owner_address = $content['new_address'];
            }

            $hasConversion = collect($works)->contains('work_code', 'VEHICLE_CONVERSION');
            if ($hasConversion && isset($content['new_vehicle_class']) && $content['new_vehicle_class']) {
                $vehicle->vehicle_type = $content['new_vehicle_class'];
            }

            $vehicle->save();
        }

        return response()->json([
            'message' => 'Notesheet approved successfully',
            'notesheet' => $notesheet
        ]);
    }

    public function reject(Request $request, $id)
    {
        $notesheet = Notesheet::findOrFail($id);

        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Admin only.'
            ], 403);
        }

        if ($notesheet->status !== 'submitted') {
            return response()->json([
                'message' => 'Only submitted notesheets can be rejected.'
            ], 422);
        }

        $notesheet->status = 'rejected';
        $notesheet->save();

        return response()->json([
            'message' => 'Notesheet rejected successfully',
            'notesheet' => $notesheet
        ]);
    }
}
