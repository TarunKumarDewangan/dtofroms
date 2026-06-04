<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\WorkOptionController;
use App\Http\Controllers\NotesheetController;
use App\Http\Controllers\FilledFormController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Vehicle routes
    Route::get('/vehicles/search/{reg_number}', [VehicleController::class, 'search']);
    Route::apiResource('/vehicles', VehicleController::class);

    // Active Work Options
    Route::get('/works', [WorkOptionController::class, 'index']);

    // Notesheet routes
    Route::apiResource('/notesheets', NotesheetController::class);
    Route::post('/notesheets/{id}/generate', [NotesheetController::class, 'generate']);
    Route::post('/notesheets/{id}/submit', [NotesheetController::class, 'submit']);

    // Filled Forms routes
    Route::apiResource('/filled-forms', FilledFormController::class);


    // Admin Only routes
    Route::middleware('admin')->group(function () {
        Route::apiResource('/users', UserController::class);
        Route::apiResource('/work-options', WorkOptionController::class);
        Route::post('/notesheets/{id}/approve', [NotesheetController::class, 'approve']);
        Route::post('/notesheets/{id}/reject', [NotesheetController::class, 'reject']);
    });
});
