<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('registration_number')->unique();
            $table->string('owner_name');
            $table->string('owner_father_name');
            $table->text('owner_address');
            $table->string('vehicle_type');
            $table->string('model_year');
            $table->string('chassis_number');
            $table->string('engine_number');
            $table->date('fitness_validity');
            $table->date('insurance_validity');
            $table->decimal('tax_amount', 10, 2);
            $table->date('tax_paid_date');
            $table->date('permit_validity')->nullable();
            $table->date('pollution_validity')->nullable();
            $table->string('current_hpa')->default('NA');
            $table->string('ncrb_report_status')->default('no');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
