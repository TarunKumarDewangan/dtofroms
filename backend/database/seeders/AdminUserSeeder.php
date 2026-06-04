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
            ['mobile_no' => '9999999999'],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => true,
                'code' => 'CG05',
            ]
        );

        // Standard User
        User::updateOrCreate(
            ['mobile_no' => '8888888888'],
            [
                'name' => 'DTO User',
                'email' => 'user@example.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'status' => true,
                'code' => 'CG04',
            ]
        );
    }
}
