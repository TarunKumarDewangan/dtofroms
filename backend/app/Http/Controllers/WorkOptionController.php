<?php

namespace App\Http\Controllers;

use App\Models\WorkOption;
use Illuminate\Http\Request;

class WorkOptionController extends Controller
{
    public function index()
    {
        return response()->json(WorkOption::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'work_code' => 'required|string|unique:work_options,work_code',
            'work_name' => 'required|string',
            'form_required' => 'required|array',
            'requires_original_document' => 'required|boolean',
            'fee_amount' => 'required|numeric',
            'requires_physical_verification' => 'required|boolean',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $option = WorkOption::create($request->all());

        return response()->json([
            'message' => 'Work option created successfully',
            'work_option' => $option
        ], 201);
    }

    public function show($id)
    {
        return response()->json(WorkOption::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $option = WorkOption::findOrFail($id);

        $request->validate([
            'work_code' => 'required|string|unique:work_options,work_code,' . $option->id,
            'work_name' => 'required|string',
            'form_required' => 'required|array',
            'requires_original_document' => 'required|boolean',
            'fee_amount' => 'required|numeric',
            'requires_physical_verification' => 'required|boolean',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $option->update($request->all());

        return response()->json([
            'message' => 'Work option updated successfully',
            'work_option' => $option
        ]);
    }

    public function destroy($id)
    {
        $option = WorkOption::findOrFail($id);
        $option->delete();
        return response()->json([
            'message' => 'Work option deleted successfully'
        ]);
    }
}
