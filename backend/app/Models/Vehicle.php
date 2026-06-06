<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_number',
        'owner_name',
        'owner_father_name',
        'owner_address',
        'vehicle_type',
        'model_year',
        'chassis_number',
        'engine_number',
        'registration_date',
        'fitness_validity',
        'insurance_validity',
        'tax_amount',
        'tax_paid_date',
        'permit_validity',
        'pollution_validity',
        'current_hpa',
        'ncrb_report_status',
        'created_by'
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
