<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicle;
use App\Models\User;

class VehiclesSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        $adminId = $admin ? $admin->id : 1;

        Vehicle::updateOrCreate(
            ['registration_number' => 'CG05AC5898'],
            [
                'owner_name' => 'BISAN BAI SAHU',
                'owner_father_name' => 'SUKHLAL SAHU',
                'owner_address' => 'VILLAGE POTIYADIH, DISTRICT DHAMTARI (C.G.)',
                'vehicle_type' => 'LMV/CAR (BOLERO)',
                'model_year' => '2017',
                'chassis_number' => 'MA1XX2XXJG8K27517',
                'engine_number' => 'MDI3200T89512',
                'fitness_validity' => '2032-10-15',
                'insurance_validity' => '2026-09-08',
                'tax_amount' => 11612.00,
                'tax_paid_date' => '2017-10-15',
                'permit_validity' => null,
                'pollution_validity' => '2026-11-20',
                'current_hpa' => 'CHHATTISGARH RAJYA GRAMIN BANK, DHAMTARI',
                'ncrb_report_status' => 'no',
                'created_by' => $adminId,
            ]
        );

        Vehicle::updateOrCreate(
            ['registration_number' => 'CG04HE1234'],
            [
                'owner_name' => 'RAMESH KUMAR DEWANGAN',
                'owner_father_name' => 'HARISH CHANDRA DEWANGAN',
                'owner_address' => 'SADAR BAZAR, DHAMTARI (C.G.)',
                'vehicle_type' => 'TWO WHEELER (MOPED)',
                'model_year' => '2020',
                'chassis_number' => 'MD623XE45KL891234',
                'engine_number' => 'E3W4E56789',
                'fitness_validity' => '2035-04-12',
                'insurance_validity' => '2027-04-10',
                'tax_amount' => 1500.00,
                'tax_paid_date' => '2020-04-12',
                'permit_validity' => null,
                'pollution_validity' => '2026-10-05',
                'current_hpa' => 'NA',
                'ncrb_report_status' => 'no',
                'created_by' => $adminId,
            ]
        );

        Vehicle::updateOrCreate(
            ['registration_number' => 'CG05B4567'],
            [
                'owner_name' => 'SANJAY SINGH',
                'owner_father_name' => 'PRATAP SINGH',
                'owner_address' => 'NEHRU CHOWK, DHAMTARI (C.G.)',
                'vehicle_type' => 'HEAVY GOODS VEHICLE (TRUCK)',
                'model_year' => '2015',
                'chassis_number' => 'MC215RD89TR123456',
                'engine_number' => 'ENG987654321',
                'fitness_validity' => '2027-02-18',
                'insurance_validity' => '2026-08-20',
                'tax_amount' => 18000.00,
                'tax_paid_date' => '2025-02-18',
                'permit_validity' => '2027-02-18',
                'pollution_validity' => '2026-07-15',
                'current_hpa' => 'EQUITAS SMALL FINANCE BANK',
                'ncrb_report_status' => 'no',
                'created_by' => $adminId,
            ]
        );
    }
}
