<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::with(['creator', 'codeLogs.admin'])->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users',
            'mobile_no' => 'required|string|max:20|unique:users',
            'code' => 'required|string|max:50',
            'password' => 'required|string|min:6',
            'role' => ['required', Rule::in(['admin', 'user'])],
            'status' => 'required|boolean',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'mobile_no' => $request->mobile_no,
            'code' => $request->code,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $request->status,
            'created_by' => $request->user()->id,
        ]);

        // Create log entry for initial code selection
        \App\Models\UserCodeLog::create([
            'user_id' => $user->id,
            'old_code' => null,
            'new_code' => $user->code,
            'changed_by' => $request->user()->id,
            'active_duration' => 'Initial Selection',
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user
        ], 201);
    }

    public function show($id)
    {
        $user = User::with(['creator', 'codeLogs.admin'])->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'mobile_no' => ['required', 'string', 'max:20', Rule::unique('users')->ignore($user->id)],
            'code' => 'required|string|max:50',
            'password' => 'nullable|string|min:6',
            'role' => ['required', Rule::in(['admin', 'user'])],
            'status' => 'required|boolean',
        ]);

        $oldCode = $user->code;
        $newCode = $request->code;

        if ($oldCode !== $newCode) {
            $latestLog = \App\Models\UserCodeLog::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->first();

            $durationStr = 'N/A';
            if ($latestLog) {
                $durationStr = $latestLog->created_at->diffForHumans(now(), [
                    'syntax' => \Carbon\CarbonInterface::DIFF_ABSOLUTE,
                    'parts' => 3,
                ]);
            } else {
                $durationStr = $user->created_at->diffForHumans(now(), [
                    'syntax' => \Carbon\CarbonInterface::DIFF_ABSOLUTE,
                    'parts' => 3,
                ]);
            }

            // Create log
            \App\Models\UserCodeLog::create([
                'user_id' => $user->id,
                'old_code' => $oldCode,
                'new_code' => $newCode,
                'changed_by' => $request->user()->id,
                'active_duration' => $durationStr,
            ]);
        }

        $user->name = $request->name;
        $user->email = $request->email;
        $user->mobile_no = $request->mobile_no;
        $user->code = $request->code;
        $user->role = $request->role;
        $user->status = $request->status;

        if ($request->password) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Prevent admin from deleting themselves
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot delete your own account.'
            ], 400);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }
}
