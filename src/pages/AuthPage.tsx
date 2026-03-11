import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { UtensilsCrossed, Lock, Mail, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Mars, Venus } from "lucide-react";

interface AuthPageProps {
  onNavigate: (page: string) => void;
}

const RESET_CODES_KEY = 'planeats_reset_codes';
const RESET_CODE_EXPIRES_MINUTES = 10;

export function AuthPage({ onNavigate }: AuthPageProps) {
  const { login, register, sendPasswordResetCode, loginAsAdmin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [error, setError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'password'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState(''); 
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const resetAllErrors = () => setError('');

  const resetForgotFields = () => {
    setForgotStep('email');
    setForgotEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setGeneratedCode('');
  };

  const openForgot = () => {
    resetAllErrors();
    resetForgotFields();
    setMode('forgot');
  };
  

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!loginEmail || !loginPassword) {
    setError("Please fill in all fields");
    return;
  }

  const success = await login(loginEmail, loginPassword);

  if (!success) {
    setError("Invalid email or password");
    return;
  }

  const saved = localStorage.getItem("user");
  const u = saved ? JSON.parse(saved) : null;

  if (u?.isAdmin) {
    onNavigate("admin");
  } else {
    onNavigate("home");
  }
};
const verifyResetCode = async (
  email: string,
  code: string,
  newPassword: string
): Promise<boolean> => {
  try {
    const res = await fetch("http://localhost:5000/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        recoveryCode: code,
        newPassword: newPassword,
      }),
    });

    if (!res.ok) {
      return false;
    }

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!registerFullName || !registerEmail || !registerPassword || !confirmPassword || !dateOfBirth) {
    setError("Please fill in all fields");
    return;
  }

  if (registerPassword !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

 const success = await register(
  registerFullName,
  registerEmail,
  registerPassword,
  gender,
  dateOfBirth
);
  if (!success) {
    setError("Registration failed");
    return;
  }

  onNavigate("profile");
};

  const handleSendResetCode = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!forgotEmail) {
    setError("Please enter your email");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Failed to send code");
      return;
    }

    setForgotStep("code");
    toast.success("Recovery code sent to your email!");
  } catch (err) {
    console.error(err);
    setError("Server error");
  }
};
const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!resetCode) {
    setError("Enter the verification code");
    return;
  }

  if (!newPassword || !confirmNewPassword) {
    setError("Please fill in all fields");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    setError("Passwords do not match");
    return;
  }

  const success = await verifyResetCode(
    forgotEmail,
    resetCode,
    newPassword
  );

  if (!success) {
    setError("Invalid or expired code");
    return;
  }

  toast.success("Password reset successfully!");

  const loginSuccess = await login(forgotEmail, newPassword);

  if (loginSuccess) {
    onNavigate("home");
  } else {
    onNavigate("login");
  }

  resetForgotFields();
};

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not available in demo mode`);
  };

  const headerSubtitle =
    mode === 'login'
      ? 'Login to continue your meal planning journey'
      : mode === 'register'
      ? 'Start your journey to healthier eating today'
      : forgotStep === 'email'
      ? 'Enter your email to receive a reset code'
      : forgotStep === 'code'
      ? 'Enter the 6-digit code we sent you'
      : 'Create a new password for your account';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <CardContent className="p-0">
          <div className="text-center space-y-4 pt-8 px-8">
<div className="flex justify-center mt-6">              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center">
                <UtensilsCrossed className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl text-gray-900">
                {mode === 'login' ? 'Welcome to Nutrio' : mode === 'register' ? 'Join Nutrio' : 'Reset Password'}
              </h1>
              <p className="text-gray-600 mt-2">{headerSubtitle}</p>
            </div>
          </div>

          <div className="relative p-8 min-h-[420px]">
            <AnimatePresence mode="wait">
              {mode === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={openForgot}
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      Forgot password?
                    </button>

                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-11">
                      Login
                    </Button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500"></span>
                      </div>
                    </div>

                    

                    <div className="text-center text-sm text-gray-600 pt-4">
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setError('');
                        }}
                        className="text-green-600 hover:text-green-700 font-semibold"
                      >
                        Sign up
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {mode === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Full Name</Label>
                      <Input
  id="register-fullname"
  type="text"
  placeholder="John Doe"
  value={registerFullName}
  onChange={(e) => setRegisterFullName(e.target.value)}
  className="h-11"
/>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="h-11"
                      />
                    </div>
<div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="h-11"
              />
              
            </div>
            <div className="space-y-2">
  <Label>Gender</Label>

  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => setGender("male")}
      className={`flex items-center justify-center gap-2 h-11 rounded-xl border transition
      ${
        gender === "male"
          ? "border-green-600 bg-green-50 text-green-700 shadow-sm"
          : "border-gray-300 hover:border-green-400 hover:bg-green-50"
      }`}
    >
      <Mars className="w-4 h-4" />
      Male
    </button>

    <button
      type="button"
      onClick={() => setGender("female")}
      className={`flex items-center justify-center gap-2 h-11 rounded-xl border transition
      ${
        gender === "female"
          ? "border-green-600 bg-green-50 text-green-700 shadow-sm"
          : "border-gray-300 hover:border-green-400 hover:bg-green-50"
      }`}
    >
      <Venus className="w-4 h-4" />
      Female
    </button>
  </div>
</div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11"
                      />
                    </div>

                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-11">
                      Create Account
                    </Button>

                    <div className="text-center text-sm text-gray-600 pt-4">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError('');
                        }}
                        className="text-green-600 hover:text-green-700 font-semibold"
                      >
                        Login
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {mode === 'forgot' && (
  <motion.div
    key={`forgot-${forgotStep}`}
    initial={{ opacity: 0, x: -50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 50 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >

    {/* EMAIL STEP */}
    {forgotStep === 'email' && (
      <form onSubmit={handleSendResetCode} className="space-y-6">

        <div className="space-y-3">
          <Label htmlFor="forgot-email" className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-green-600" />
            Email Address
          </Label>

          <Input
            id="forgot-email"
            type="email"
            placeholder="your@email.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            className="h-11"
          />

          <p className="text-sm text-gray-500">
            Enter the email associated with your account and we&apos;ll send you a 6-digit reset code.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 h-11"
        >
          Send Reset Code
        </Button>

        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError('');
            resetForgotFields();
          }}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-green-600 pt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

      </form>
    )}

    {/* CODE STEP */}
    {forgotStep === 'code' && (
      <form
  onSubmit={async (e) => {
    e.preventDefault();
    setError("");

    if (resetCode.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/auth/verify-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotEmail,
          recoveryCode: resetCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid code");
        return;
      }

      setForgotStep("password");
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  }}
  className="space-y-6"
>

        <div className="space-y-4 text-center">

          <Label className="block text-gray-700">
            Enter the 6-digit code sent to your email
          </Label>

          <div className="flex justify-center pt-2">
            <InputOTP maxLength={6} value={resetCode} onChange={setResetCode}>
              <InputOTPGroup className="gap-3">

                <InputOTPSlot index={0} className="h-12 w-12 rounded-xl border border-green-300 text-lg" />
                <InputOTPSlot index={1} className="h-12 w-12 rounded-xl border border-green-300 text-lg" />
                <InputOTPSlot index={2} className="h-12 w-12 rounded-xl border border-green-300 text-lg" />
                <InputOTPSlot index={3} className="h-12 w-12 rounded-xl border border-green-300 text-lg" />
                <InputOTPSlot index={4} className="h-12 w-12 rounded-xl border border-green-300 text-lg" />
                <InputOTPSlot index={5} className="h-12 w-12 rounded-xl border border-green-300 text-lg" />

              </InputOTPGroup>
            </InputOTP>
          </div>

        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 h-11"
        >
          Verify Code
        </Button>

        <div className="grid grid-cols-2 gap-3 pt-2">

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError('');
              setForgotStep('email');
              setResetCode('');
            }}
            className="h-11"
          >
            Back
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              setError('');

              const code = await sendPasswordResetCode(forgotEmail);

              if (!code) {
                setError("Email not found");
                return;
              }

              setGeneratedCode(code);
              setResetCode('');

              toast.success(`New code sent to ${forgotEmail}!`);
            }}
            className="h-11"
          >
            Resend
          </Button>

        </div>
        </form>
    )}

                  {forgotStep === 'password' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-green-600" />
                          New Password
                        </Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                        <Input
                          id="confirm-new-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="h-11"
                        />
                      </div>

                      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-11">
                        Reset Password
                      </Button>

                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setForgotStep('code');
                        }}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-green-600"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}