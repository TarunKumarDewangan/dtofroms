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
            'owner_name' => 'required|string',
            'owner_father_name' => 'required|string',
            'owner_address' => 'required|string',
            'vehicle_type' => 'required|string',
            'model_year' => 'required|string',
            'chassis_number' => 'required|string',
            'engine_number' => 'required|string',
            'fitness_validity' => 'required|date',
            'insurance_validity' => 'required|date',
            'tax_amount' => 'required|numeric',
            'tax_paid_date' => 'required|date',
            'permit_validity' => 'nullable|date',
            'pollution_validity' => 'nullable|date',
            'current_hpa' => 'nullable|string',
            'ncrb_report_status' => 'required|string',
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
            'owner_name' => 'required|string',
            'owner_father_name' => 'required|string',
            'owner_address' => 'required|string',
            'vehicle_type' => 'required|string',
            'model_year' => 'required|string',
            'chassis_number' => 'required|string',
            'engine_number' => 'required|string',
            'fitness_validity' => 'required|date',
            'insurance_validity' => 'required|date',
            'tax_amount' => 'required|numeric',
            'tax_paid_date' => 'required|date',
            'permit_validity' => 'nullable|date',
            'pollution_validity' => 'nullable|date',
            'current_hpa' => 'nullable|string',
            'ncrb_report_status' => 'required|string',
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
