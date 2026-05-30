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
            $table->string('owner_name')->nullable();
            $table->string('owner_father_name')->nullable();
            $table->text('owner_address')->nullable();
            $table->string('vehicle_type')->nullable();
            $table->string('model_year')->nullable();
            $table->string('chassis_number')->nullable();
            $table->string('engine_number')->nullable();
            $table->date('fitness_validity')->nullable();
            $table->date('insurance_validity')->nullable();
            $table->decimal('tax_amount', 10, 2)->nullable();
            $table->date('tax_paid_date')->nullable();
            $table->date('permit_validity')->nullable();
            $table->date('pollution_validity')->nullable();
            $table->string('current_hpa')->default('NA')->nullable();
            $table->string('ncrb_report_status')->default('no')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
