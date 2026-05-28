<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_options', function (Blueprint $table) {
            $table->id();
            $table->string('work_code')->unique();
            $table->string('work_name');
            $table->json('form_required');
            $table->boolean('requires_original_document')->default(false);
            $table->decimal('fee_amount', 10, 2);
            $table->boolean('requires_physical_verification')->default(false);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_options');
    }
};
