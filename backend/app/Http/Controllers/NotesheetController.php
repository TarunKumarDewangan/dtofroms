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
        try {
            $request->validate([
                'vehicle_id' => 'required|exists:vehicles,id',
                'combined_works' => 'required|array|min:1',
            ]);

            // Auto-generate Notesheet Number
            $year = Carbon::now()->year;
            $count = Notesheet::whereYear('created_at', $year)->count() + 1;
            do {
                $notesheetNumber = 'NS/DHAM/' . $year . '/' . str_pad($count, 3, '0', STR_PAD_LEFT);
                $count++;
            } while (Notesheet::where('notesheet_number', $notesheetNumber)->exists());

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
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create notesheet: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
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
        $notesheet = Notesheet::with(['vehicle', 'creator'])->findOrFail($id);
        
        $request->validate([
            'content' => 'required|array',
        ]);

        $content = $request->content;
        $vehicle = $notesheet->vehicle;
        $works = $notesheet->combined_works;

        $isBlank = (isset($content['is_blank']) && $content['is_blank'] === true) || 
                   ($vehicle && $vehicle->owner_name === '.....................');

        $getVal = function($val, $fallback = '.....................') use ($isBlank) {
            if ($isBlank) {
                return '.....................';
            }
            return ($val !== null && $val !== '') ? $val : $fallback;
        };

        $formatDate = function($date, $fallback = '.....................') use ($isBlank) {
            if ($isBlank) {
                return '.....................';
            }
            if (!$date || $date === '1970-01-01' || strpos($date, '1970-01-01') !== false) {
                return $fallback;
            }
            try {
                return Carbon::parse($date)->format('d-m-Y');
            } catch (\Exception $e) {
                return $fallback;
            }
        };

        $formatTax = function($amount) use ($isBlank) {
            if ($isBlank) {
                return '.....................';
            }
            return number_format((float)$amount, 2);
        };

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
            $saleDate = $formatDate($content['sale_date'] ?? null, '_______');
            $buyerName = $getVal($content['buyer_name'] ?? null, '_______');
            $buyerFather = $getVal($content['buyer_father'] ?? null, '_______');
            $buyerAddress = $getVal($content['buyer_address'] ?? null, '_______');
            $transferFee = $getVal($content['transfer_fee'] ?? null, '_______');
            $vOwnerName = $getVal($vehicle->owner_name);

            $body .= "उक्त वाहन को श्री {$buyerName} आत्मज श्री {$buyerFather} निवासी {$buyerAddress} ने मूल वाहन स्वामी श्री {$vOwnerName} से क्रय कर स्वामित्व अंतरण हेतु निर्धारित प्रारूप क्रय-विक्रय फार्म नं. 29 एवं 30 में विक्रय दिनांक {$saleDate} को प्रस्तुत कर शुल्क रु. {$transferFee}/- ऑनलाइन माध्यम से जमा कर आवेदन प्रस्तुत किया है।\n\n";
        }

        // 2. Transfer after Death
        if ($hasTransferDeath) {
            $deathDate = $formatDate($content['death_date'] ?? null, '_______');
            $applicantName = $getVal($content['applicant_name'] ?? null, '_______');
            $applicantFather = $getVal($content['applicant_father'] ?? null, '_______');
            $applicantAddress = $getVal($content['applicant_address'] ?? null, '_______');
            $relation = $getVal($content['relation_to_deceased'] ?? null, 'वारिस');
            $deathFee = $getVal($content['death_transfer_fee'] ?? null, '_______');
            $vOwnerName = $getVal($vehicle->owner_name);

            $body .= "मूल वाहन स्वामी श्री {$vOwnerName} की मृत्यु दिनांक {$deathDate} को हो जाने के कारण उनके विधिक {$relation} श्री {$applicantName} आत्मज श्री {$applicantFather} निवासी {$applicantAddress} द्वारा मृत्यु उपरांत स्वामित्व अंतरण हेतु निर्धारित प्रारूप फार्म नं. 31, मृत्यु प्रमाण पत्र, विधिक वारिस प्रमाण पत्र एवं शपथ पत्र के साथ विहित शुल्क रु. {$deathFee}/- ऑनलाइन माध्यम से जमा कर आवेदन प्रस्तुत किया गया है।\n\n";
        }

        // 3. HP Register
        if ($hasHPRegister) {
            $hpBank = $getVal($content['hp_bank_name'] ?? null, '_______');
            $hpFee = $getVal($content['hp_fee'] ?? null, '_______');
            $hpDate = $formatDate($content['hp_date'] ?? null, '_______');

            $body .= "आवेदक द्वारा वाहन में फाइनेंस/हायर परचेस (HPA) दर्ज करने हेतु बैंक/फाइनेंस कंपनी {$hpBank} के साथ निष्पादित समझौता प्रारूप फार्म नं. 34 में विहित शुल्क रूपये {$hpFee}/- ऑनलाइन माध्यम से दिनांक {$hpDate} को जमा कर प्रकरण प्रस्तुत किया गया है।\n\n";
        }

        // 4. HP Cancel
        if ($hasHPCancel) {
            $cancelBank = $getVal($content['cancel_bank_name'] ?? null, '_______');
            $cancelFee = $getVal($content['hp_cancel_fee'] ?? null, '_______');
            $cancelDate = $formatDate($content['cancel_date'] ?? null, '_______');

            $body .= "वाहन में पूर्व में दर्ज फाइनेंस अनुबंध को निरस्त करने हेतु फाइनेंसर {$cancelBank} द्वारा जारी अनापत्ति प्रमाण पत्र (NOC) एवं प्रारूप फार्म नं. 35 के साथ विहित शुल्क रूपये {$cancelFee}/- ऑनलाइन माध्यम से दिनांक {$cancelDate} को जमा कर आवेदन प्रस्तुत है।\n\n";
        }

        // 5. Address Change
        if ($hasAddressChange) {
            $newAddress = $getVal($content['new_address'] ?? null, '_______');
            $addressFee = $getVal($content['address_fee'] ?? null, '_______');
            $addressProofType = $getVal($content['address_proof_type'] ?? null, 'आधार कार्ड/निवास प्रमाण पत्र');

            $body .= "वाहन स्वामी द्वारा अपना निवास स्थान परिवर्तन करने के कारण पंजीयन प्रमाण पत्र में नया पता दर्ज करने हेतु निर्धारित प्रारूप फार्म नं. 33 में विहित शुल्क रु. {$addressFee}/- जमा कर आवेदन प्रस्तुत किया गया है। आवेदक द्वारा नया पता प्रमाण पत्र के रूप में {$addressProofType} संलग्न किया गया है।\n\n";
        }

        // 6. Duplicate RC
        if ($hasDuplicateRC) {
            $dupReason = $getVal($content['duplicate_reason'] ?? null, 'गुम हो जाने');
            $dupFee = $getVal($content['duplicate_rc_fee'] ?? null, '_______');

            $body .= "वाहन स्वामी द्वारा पंजीयन पुस्तिका (RC) {$dupReason} के कारण द्वितीय प्रति जारी करने हेतु निर्धारित प्रारूप फार्म नं. 26 में विहित शुल्क रु. {$dupFee}/- जमा कर आवेदन प्रस्तुत किया गया है। आवेदक द्वारा पुलिस थाना में दर्ज कराई गई गुमशुदगी रिपोर्ट/सनहा की प्रति एवं शपथ पत्र संलग्न किया गया है।\n\n";
        }

        // 7. Renewal of Registration
        if ($hasRenewal) {
            $renewalFee = $getVal($content['renewal_fee'] ?? null, '_______');
            $body .= "वाहन का पंजीयन अवधि समाप्त होने के कारण पंजीयन नवीनीकरण (Renewal of Registration) हेतु निर्धारित प्रारूप फार्म नं. 25 में विहित ऑनलाइन शुल्क रूपये {$renewalFee}/- जमा कर आवेदन प्रस्तुत किया गया है।\n\n";
        }

        // 8. Alteration of Vehicle
        if ($hasAlteration) {
            $altDetails = $getVal($content['alteration_details'] ?? null, '_______');
            $altFee = $getVal($content['alteration_fee'] ?? null, '_______');
            $body .= "वाहन की मूल बनावट में परिवर्तन (Alteration of Vehicle: {$altDetails}) दर्ज करने हेतु निर्धारित प्रारूप फार्म नं. 22C एवं 22D में विहित ऑनलाइन शुल्क रूपये {$altFee}/- जमा कर आवेदन प्रस्तुत किया गया है।\n\n";
        }

        // 9. Conversion of Vehicle
        if ($hasConversion) {
            $convFrom = $getVal($content['conversion_from'] ?? null, '_______');
            $convTo = $getVal($content['conversion_to'] ?? null, '_______');
            $convFee = $getVal($content['conversion_fee'] ?? null, '_______');
            $newClass = $content['new_vehicle_class'] ?? '';
            $classText = '';
            if ($isBlank) {
                $classText = ", नया वर्ग: .....................";
            } else if ($newClass) {
                $classText = ", नया वर्ग: {$newClass}";
            }
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
            $verifDate = $formatDate($content['physical_verification_date']);
            $supportingDocs[] = "वाहन का भौतिक सत्यापन (Physical Verification) कार्यालयीन उपनिरीक्षक/आरक्षक द्वारा दिनांक {$verifDate} को किया गया है तथा सत्यापन रिपोर्ट संलग्न है।";
        }

        if (count($supportingDocs) > 0) {
            $body .= implode("\n", $supportingDocs) . "\n\n";
        }

        // Vehicle Details Table Block
        $body .= "वाहन का विवरण निम्नानुसार है:-\n";
        $body .= "--------------------------------------------------------\n";
        $body .= "१. वाहन क्रमांक             : {$vehicle->registration_number}\n";
        $body .= "२. वाहन स्वामी का नाम         : " . $getVal($vehicle->owner_name) . "\n";
        $body .= "३. पिता/पति का नाम          : " . $getVal($vehicle->owner_father_name) . "\n";
        $body .= "४. वर्तमान पता               : " . $getVal($vehicle->owner_address) . "\n";
        $body .= "५. वाहन का प्रकार            : " . $getVal($vehicle->vehicle_type) . "\n";
        $body .= "६. मॉडल/निर्माण वर्ष          : " . $getVal($vehicle->model_year) . "\n";
        $body .= "७. पंजीयन दिनांक             : " . $formatDate($vehicle->registration_date) . "\n";
        $body .= "८. चेसिस नंबर              : " . $getVal($vehicle->chassis_number) . "\n";
        $body .= "९. इंजन नंबर               : " . $getVal($vehicle->engine_number) . "\n";
        
        $taxPaidDateFormatted = $formatDate($vehicle->tax_paid_date);
        $taxAmountFormatted = $formatTax($vehicle->tax_amount);
        $body .= "१०. टैक्स वैधता/भुगतान दिनांक    : {$taxPaidDateFormatted} (कर राशि रु. {$taxAmountFormatted}/-)\n";
        
        $fitnessFormatted = $formatDate($vehicle->fitness_validity);
        $body .= "११. फिटनेस वैधता दिनांक      : {$fitnessFormatted}\n";
        
        $insuranceFormatted = $formatDate($vehicle->insurance_validity);
        $body .= "१२. बीमा वैधता दिनांक        : {$insuranceFormatted}\n";
        
        if ($isBlank) {
            $body .= "१३. परमिट वैधता दिनांक       : .....................\n";
            $body .= "१४. प्रदूषण वैधता दिनांक       : .....................\n";
        } else {
            if ($vehicle->permit_validity) {
                $body .= "१३. परमिट वैधता दिनांक       : " . $formatDate($vehicle->permit_validity) . "\n";
            }
            if ($vehicle->pollution_validity) {
                $body .= "१४. प्रदूषण वैधता दिनांक       : " . $formatDate($vehicle->pollution_validity) . "\n";
            }
        }
        
        $body .= "१५. बंधक / फाइनेंस स्थिति       : " . $getVal($vehicle->current_hpa) . "\n";
        
        $originalFileAttached = $content['original_file_attached'] ?? 'yes';
        if ($isBlank) {
            $originalFileStatusText = '.....................';
        } else {
            $originalFileStatusText = ($originalFileAttached === 'no' || $originalFileAttached === false) 
                ? "नहीं, मूल नस्ती संलग्न नहीं है" 
                : "हाँ, मूल नस्ती संलग्न है";
        }
        $body .= "१६. हस्ताक्षर मिलान हेतु मूल नस्ती : {$originalFileStatusText}\n";
        $body .= "--------------------------------------------------------\n\n";

        // Closing Paragraph
        $workLabels = implode(" / ", $workNames);
        $originalFileAttached = $content['original_file_attached'] ?? 'yes';
        if ($originalFileAttached === 'no' || $originalFileAttached === false) {
            $body .= "अतः वाहन क्रमांक {$vehicle->registration_number} का {$workLabels} किये जाने हेतु मूल नस्ती प्राप्त नहीं होने की स्थिति में फार्म-20 में नोटरी द्वारा सत्यापित कर नियमानुसार अवलोकनार्थ एवं उचित आदेशार्थ सादर प्रस्तुत है।\n\n";
        } else {
            $body .= "अतः वाहन क्रमांक {$vehicle->registration_number} का {$workLabels} करने हेतु मूल नस्ती सहित नियमानुसार अवलोकनार्थ एवं उचित आदेशार्थ सादर प्रस्तुत है।\n\n";
        }
        $body .= "शाखा प्रभारी\n\n";

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
                $vehicle->owner_name = $content['buyer_name'] ?? null;
                $vehicle->owner_father_name = $content['buyer_father'] ?? null;
                $vehicle->owner_address = $content['buyer_address'] ?? null;
            } elseif ($hasTransferDeath) {
                $vehicle->owner_name = $content['applicant_name'] ?? null;
                $vehicle->owner_father_name = $content['applicant_father'] ?? null;
                $vehicle->owner_address = $content['applicant_address'] ?? null;
            }

            if ($hasHPRegister) {
                $vehicle->current_hpa = $content['hp_bank_name'] ?? null;
            } elseif ($hasHPCancel) {
                $vehicle->current_hpa = 'NA';
            }

            if ($hasAddressChange) {
                $vehicle->owner_address = $content['new_address'] ?? null;
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
