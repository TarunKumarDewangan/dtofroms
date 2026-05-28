<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WorkOption;

class WorkOptionsSeeder extends Seeder
{
    public function run(): void
    {
        $options = [
            [
                'work_code' => 'OWN_TRANSFER',
                'work_name' => 'Ownership Transfer (स्वामित्व अंतरण)',
                'form_required' => json_encode(['Form 29', 'Form 30']),
                'requires_original_document' => true,
                'fee_amount' => 11612.00,
                'requires_physical_verification' => true,
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'work_code' => 'HP_REGISTER',
                'work_name' => 'HP Agreement Registration (एच.पी.ए. दर्ज)',
                'form_required' => json_encode(['Form 34']),
                'requires_original_document' => true,
                'fee_amount' => 11612.00,
                'requires_physical_verification' => false,
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'work_code' => 'HP_CANCEL',
                'work_name' => 'HP Agreement Cancellation (एच.पी.ए. निरस्त)',
                'form_required' => json_encode(['Form 35']),
                'requires_original_document' => true,
                'fee_amount' => 500.00,
                'requires_physical_verification' => false,
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'work_code' => 'ADDRESS_CHANGE',
                'work_name' => 'Address Change (पता परिवर्तन)',
                'form_required' => json_encode(['Form 33']),
                'requires_original_document' => true,
                'fee_amount' => 200.00,
                'requires_physical_verification' => false,
                'sort_order' => 4,
                'is_active' => true,
            ],
            [
                'work_code' => 'DUPLICATE_RC',
                'work_name' => 'Duplicate RC Issue (पंजीयन प्रमाण पत्र की द्वितीय प्रति)',
                'form_required' => json_encode(['Form 26']),
                'requires_original_document' => false,
                'fee_amount' => 1000.00,
                'requires_physical_verification' => true,
                'sort_order' => 5,
                'is_active' => true,
            ],
            [
                'work_code' => 'TRANSFER_DEATH',
                'work_name' => 'Transfer after Death (मृत्यु उपरांत अंतरण)',
                'form_required' => json_encode(['Form 31']),
                'requires_original_document' => true,
                'fee_amount' => 5000.00,
                'requires_physical_verification' => true,
                'sort_order' => 6,
                'is_active' => true,
            ],
            [
                'work_code' => 'REG_RENEWAL',
                'work_name' => 'Renewal of Registration (पंजीयन नवीनीकरण)',
                'form_required' => json_encode(['Form 25']),
                'requires_original_document' => true,
                'fee_amount' => 1000.00,
                'requires_physical_verification' => true,
                'sort_order' => 7,
                'is_active' => true,
            ],
            [
                'work_code' => 'VEHICLE_ALTERATION',
                'work_name' => 'Alteration of Vehicle (वाहन वेधन/परिवर्तन)',
                'form_required' => json_encode(['Form 22C', 'Form 22D', 'Form 22G']),
                'requires_original_document' => true,
                'fee_amount' => 500.00,
                'requires_physical_verification' => true,
                'sort_order' => 8,
                'is_active' => true,
            ],
            [
                'work_code' => 'VEHICLE_CONVERSION',
                'work_name' => 'Conversion of Vehicle (वाहन वर्ग रूपांतरण)',
                'form_required' => json_encode(['Form 22']),
                'requires_original_document' => true,
                'fee_amount' => 1000.00,
                'requires_physical_verification' => true,
                'sort_order' => 9,
                'is_active' => true,
            ],
        ];

        foreach ($options as $option) {
            WorkOption::updateOrCreate(['work_code' => $option['work_code']], [
                'work_name' => $option['work_name'],
                'form_required' => json_decode($option['form_required']),
                'requires_original_document' => $option['requires_original_document'],
                'fee_amount' => $option['fee_amount'],
                'requires_physical_verification' => $option['requires_physical_verification'],
                'sort_order' => $option['sort_order'],
                'is_active' => $option['is_active'],
            ]);
        }
    }
}
