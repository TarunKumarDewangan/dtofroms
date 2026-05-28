<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FilledForm extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_type',
        'registration_number',
        'form_data',
        'created_by',
    ];

    protected $casts = [
        'form_data' => 'array',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
