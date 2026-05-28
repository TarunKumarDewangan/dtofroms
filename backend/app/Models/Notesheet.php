<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notesheet extends Model
{
    use HasFactory;

    protected $fillable = [
        'notesheet_number',
        'vehicle_id',
        'subject_line',
        'combined_works',
        'content',
        'final_text',
        'status',
        'created_by',
        'submitted_at',
        'approved_by',
        'approved_at'
    ];

    protected $casts = [
        'combined_works' => 'array',
        'content' => 'array',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime'
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
