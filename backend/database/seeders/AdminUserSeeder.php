<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'status' => true,
            ]
        );

        // Standard User
        User::updateOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'DTO User',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => true,
            ]
        );
    }
}
