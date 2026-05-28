<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notesheets', function (Blueprint $table) {
            $table->id();
            $table->string('notesheet_number')->unique();
            $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
            $table->text('subject_line')->nullable();
            $table->json('combined_works');
            $table->json('content')->nullable();
            $table->text('final_text')->nullable();
            $table->string('status')->default('draft'); // draft, submitted, approved, rejected
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notesheets');
    }
};
