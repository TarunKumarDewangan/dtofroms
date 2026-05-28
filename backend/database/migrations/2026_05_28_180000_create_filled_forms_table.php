<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('filled_forms', function (Blueprint $table) {
            $table->id();
            $table->string('form_type'); // 'Form 29', 'Form 30', 'Form 33', 'Form 34', 'Form 35'
            $table->string('registration_number')->nullable();
            $table->json('form_data'); // Stores the key-value pairs of all input fields
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('filled_forms');
    }
};
