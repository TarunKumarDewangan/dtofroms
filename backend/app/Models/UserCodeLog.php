<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCodeLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'old_code',
        'new_code',
        'changed_by',
        'active_duration',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
