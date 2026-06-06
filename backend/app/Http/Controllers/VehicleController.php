<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index()
    {
        return response()->json(Vehicle::with('creator')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'registration_number' => 'required|string|unique:vehicles,registration_number',
            'owner_name' => 'nullable|string',
            'owner_father_name' => 'nullable|string',
            'owner_address' => 'nullable|string',
            'vehicle_type' => 'nullable|string',
            'model_year' => 'nullable|string',
            'chassis_number' => 'nullable|string',
            'engine_number' => 'nullable|string',
            'registration_date' => 'nullable|date',
            'fitness_validity' => 'nullable|date',
            'insurance_validity' => 'nullable|date',
            'tax_amount' => 'nullable|numeric',
            'tax_paid_date' => 'nullable|date',
            'permit_validity' => 'nullable|date',
            'pollution_validity' => 'nullable|date',
            'current_hpa' => 'nullable|string',
            'ncrb_report_status' => 'nullable|string',
        ]);

        $vehicle = Vehicle::create(array_merge(
            $request->all(),
            ['created_by' => $request->user()->id]
        ));

        return response()->json([
            'message' => 'Vehicle added successfully',
            'vehicle' => $vehicle
        ], 201);
    }

    public function show($id)
    {
        return response()->json(Vehicle::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $vehicle = Vehicle::findOrFail($id);

        $request->validate([
            'registration_number' => 'required|string|unique:vehicles,registration_number,' . $vehicle->id,
            'owner_name' => 'nullable|string',
            'owner_father_name' => 'nullable|string',
            'owner_address' => 'nullable|string',
            'vehicle_type' => 'nullable|string',
            'model_year' => 'nullable|string',
            'chassis_number' => 'nullable|string',
            'engine_number' => 'nullable|string',
            'registration_date' => 'nullable|date',
            'fitness_validity' => 'nullable|date',
            'insurance_validity' => 'nullable|date',
            'tax_amount' => 'nullable|numeric',
            'tax_paid_date' => 'nullable|date',
            'permit_validity' => 'nullable|date',
            'pollution_validity' => 'nullable|date',
            'current_hpa' => 'nullable|string',
            'ncrb_report_status' => 'nullable|string',
        ]);

        $vehicle->update($request->all());

        return response()->json([
            'message' => 'Vehicle updated successfully',
            'vehicle' => $vehicle
        ]);
    }

    public function destroy($id)
    {
        $vehicle = Vehicle::findOrFail($id);
        $vehicle->delete();
        return response()->json([
            'message' => 'Vehicle deleted successfully'
        ]);
    }

    public function search($reg_number)
    {
        // Trim and normalize search
        $reg_number = strtoupper(trim($reg_number));
        $vehicle = Vehicle::where('registration_number', $reg_number)->first();

        if (!$vehicle) {
            return response()->json([
                'message' => 'Vehicle not found'
            ], 404);
        }

        return response()->json($vehicle);
    }
}
