<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'mobile_no' => 'required',
            'password' => 'required',
        ]);

        $user = User::where('mobile_no', $request->mobile_no)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'mobile_no' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->status) {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact admin.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'mobile_no' => 'required|string|unique:users,mobile_no|max:20',
            'code' => 'required|string|max:50',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $request->name,
            'mobile_no' => $request->mobile_no,
            'code' => $request->code,
            'password' => Hash::make($request->password),
            'role' => 'user',
            'status' => true,
        ]);

        // Create log entry for initial code selection on signup
        \App\Models\UserCodeLog::create([
            'user_id' => $user->id,
            'old_code' => null,
            'new_code' => $user->code,
            'changed_by' => null,
            'active_duration' => 'Initial Selection',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
