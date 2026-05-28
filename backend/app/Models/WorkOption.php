<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'work_code',
        'work_name',
        'form_required',
        'requires_original_document',
        'fee_amount',
        'requires_physical_verification',
        'sort_order',
        'is_active'
    ];

    protected $casts = [
        'form_required' => 'array',
        'requires_original_document' => 'boolean',
        'requires_physical_verification' => 'boolean',
        'is_active' => 'boolean'
    ];
}
