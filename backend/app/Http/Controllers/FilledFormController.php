<?php

namespace App\Http\Controllers;

use App\Models\FilledForm;
use Illuminate\Http\Request;

class FilledFormController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = FilledForm::with('creator');

        if ($user->role !== 'admin') {
            $query->where('created_by', $user->id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'form_type' => 'required|string',
            'registration_number' => 'nullable|string',
            'form_data' => 'required|array',
        ]);

        $filledForm = FilledForm::create([
            'form_type' => $request->form_type,
            'registration_number' => strtoupper($request->registration_number),
            'form_data' => $request->form_data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Form saved successfully',
            'form' => $filledForm
        ], 201);
    }

    public function show($id)
    {
        $filledForm = FilledForm::with('creator')->findOrFail($id);
        return response()->json($filledForm);
    }

    public function update(Request $request, $id)
    {
        $filledForm = FilledForm::findOrFail($id);

        $request->validate([
            'registration_number' => 'nullable|string',
            'form_data' => 'required|array',
        ]);

        $filledForm->update([
            'registration_number' => strtoupper($request->registration_number),
            'form_data' => $request->form_data,
        ]);

        return response()->json([
            'message' => 'Form updated successfully',
            'form' => $filledForm
        ]);
    }

    public function destroy($id)
    {
        $filledForm = FilledForm::findOrFail($id);
        $filledForm->delete();

        return response()->json([
            'message' => 'Form deleted successfully'
        ]);
    }
}
