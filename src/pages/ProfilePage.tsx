import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import {
  User as UserIcon,
  Target,
  Activity,
  Ruler,
  Weight,
  CreditCard,
  CheckCircle2,
  Lock,
  Utensils,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

import {
  fetchUserProfile,
  updateUserProfile,
  changeUserPassword,
  cancelMembership,
} from '../services/profileService';

interface ProfilePageProps {
  onNavigate?: (page: string, params?: any) => void;
  membershipActive: boolean;
  membershipLoading: boolean;
  refreshMembership: () => Promise<void>;
}

export function ProfilePage({
  onNavigate,
  membershipActive,
  membershipLoading,
  refreshMembership,
}: ProfilePageProps) {
  const [user, setUser] = useState<any>(null);

  const [rawUser, setRawUser] = useState<any>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    height: '',
    weight: '',
    goalWeight: '',
    dietType: 'omnivore',
    goal: 'maintain',
    activityLevel: 'moderate',
    gender: '',
    dateOfBirth: '',
    dailyCalories: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchUserProfile();

        setRawUser(data);

        setUser(data);

        setFormData({
          fullName: data.fullName || '',
          age: (data.age ?? '').toString(),
          height: (data.height ?? '').toString(),
          weight: (data.weight ?? '').toString(),
          goalWeight: (data.goalWeight ?? '').toString(),
          dietType: data.dietType ?? 'omnivore',
          goal: data.goal ?? 'maintain',
          activityLevel: data.activityLevel ?? 'moderate',
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth || '',
          dailyCalories: (data.dailyCalories ?? '').toString(),
        });

        await refreshMembership();
      } catch (err: any) {
        toast.error(err.message || 'Failed to load profile');
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      if (!user?.id) {
        toast.error('User not loaded.');
        return;
      }

      const updated = await updateUserProfile(user.id, {
        FullName: formData.fullName,
        Sex: formData.gender,
        DateOfBirth: formData.dateOfBirth || null,
        HeightCm: formData.height ? Number(formData.height) : undefined,
        CurrentWeightKg: formData.weight ? Number(formData.weight) : undefined,
        GoalWeightKg: formData.goalWeight ? Number(formData.goalWeight) : undefined,
        Goal: formData.goal,
        ActivityLevel: formData.activityLevel,
        DietType: formData.dietType,
        DailyTargetCal: formData.dailyCalories ? Number(formData.dailyCalories) : undefined,
      });

      const nextUser = {
        ...user,
        ...updated,
        fullName: updated.FullName ?? user.fullName,
        height: updated.HeightCm ?? user.height,
        weight: updated.CurrentWeightKg ?? user.weight,
        goalWeight: updated.GoalWeightKg ?? user.goalWeight,
        dietType: updated.DietType ?? user.dietType,
        goal: updated.Goal ?? user.goal,
        activityLevel: updated.ActivityLevel ?? user.activityLevel,
        gender: updated.Sex ?? user.gender,
        dateOfBirth: updated.DateOfBirth ?? user.dateOfBirth,
        dailyCalories: updated.DailyTargetCal ?? user.dailyCalories,
      };

      setUser(nextUser);

      setRawUser((prev: any) => ({
        ...(prev ?? {}),
        ...nextUser,
      }));

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    if (!user) return;

    const src = rawUser ?? user;

    setFormData({
      fullName: src.fullName || '',
      age: (src.age ?? '').toString(),
      height: (src.height ?? '').toString(),
      weight: (src.weight ?? '').toString(),
      goalWeight: (src.goalWeight ?? '').toString(),
      dietType: src.dietType ?? 'omnivore',
      goal: src.goal ?? 'maintain',
      activityLevel: src.activityLevel ?? 'moderate',
      gender: src.gender || '',
      dateOfBirth: src.dateOfBirth || '',
      dailyCalories: (src.dailyCalories ?? '').toString(),
    });

    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    try {
      if (!user?.id) {
        setPasswordError('User not loaded.');
        return;
      }

      const { currentPassword, newPassword, confirmPassword } = passwordData;

      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordError('All fields are required.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match.');
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters.');
        return;
      }

      await changeUserPassword(user.id, currentPassword, newPassword);

      toast.success('Password updated successfully!');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    }
  };

  const handleCancelMembership = async () => {
    try {
      await cancelMembership();
      await refreshMembership();
      toast.success('Membership cancelled.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel membership');
    }
  };

  if (!user) return <p className="text-center mt-10">Loading profile...</p>;

  const num = (v: any) => {
    const n = typeof v === 'string' ? Number(v) : v;
    return Number.isFinite(n) ? n : null;
  };

  const heightN = num(rawUser?.height);
  const weightN = num(rawUser?.weight);
  const goalWeightN = num(rawUser?.goalWeight);
  const caloriesN = num(rawUser?.dailyCalories);

  const hasBodyData =
    (heightN != null && heightN > 0) ||
    (weightN != null && weightN > 0) ||
    (goalWeightN != null && goalWeightN > 0);

  const hasGoalsData =
    (rawUser?.goal && rawUser.goal !== 'maintain') ||
    (rawUser?.activityLevel && rawUser.activityLevel !== 'moderate') ||
    (rawUser?.dietType && rawUser.dietType !== 'omnivore') ||
    (caloriesN != null && caloriesN > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl text-gray-900 mb-2">My Profile</h1>
          <p className="text-xl text-gray-600">Manage your personal information</p>
        </div>

        {!user?.isAdmin && (
          <Card
            className={`mb-6 ${
              membershipActive ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
            }`}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    membershipActive ? 'bg-green-100' : 'bg-amber-100'
                  }`}
                >
                  {membershipActive ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-amber-600" />
                  )}
                </div>

                <div>
                  <h3 className={`font-semibold ${membershipActive ? 'text-green-900' : 'text-amber-900'}`}>
                    {membershipActive ? 'Premium Member' : 'Free Account'}
                  </h3>
                  <p className={`text-sm ${membershipActive ? 'text-green-700' : 'text-amber-700'}`}>
                    {membershipActive
                      ? 'You have full access to all features'
                      : 'Upgrade to unlock meal planning features'}
                  </p>
                </div>
              </div>

              {membershipLoading ? (
                <Button disabled variant="outline">Loading...</Button>
              ) : !membershipActive ? (
                <Button
                  onClick={() => onNavigate?.('payment', { returnTo: 'profile' })}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Upgrade Now
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                      Cancel Membership
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will cancel your premium membership and you will lose access to meal planning features.
                        You can always resubscribe later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, Keep My Membership</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelMembership} className="bg-red-600 hover:bg-red-700">
                        Yes, Cancel Membership
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-green-600" />
              Personal Information
            </CardTitle>

            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="bg-green-600 hover:bg-green-700">
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  Save Changes
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled className="mt-2 bg-gray-100" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
  <div>
    <Label htmlFor="age">Age</Label>
    <Input
      id="age"
      type="number"
      value={formData.age}
      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
      disabled={!isEditing}
      className="mt-2"
    />
  </div>

  <div>
  <Label className="mb-2 block">Gender</Label>

  <Select
    value={formData.gender}
    onValueChange={(value: any) =>
      setFormData({ ...formData, gender: value })
    }
    disabled={!isEditing}
  >
    <SelectTrigger className="w-full mt-2">
      <SelectValue placeholder="Select gender" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="male">Male</SelectItem>
      <SelectItem value="female">Female</SelectItem>
    </SelectContent>
  </Select>
</div>
</div>
          </CardContent>
        </Card>

        {hasBodyData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-6 h-6 text-green-600" />
                Body Measurements
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="height" className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-green-600" />
                    Height (cm)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="weight" className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-green-600" />
                    Current Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="goalWeight" className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-green-600" />
                    Goal Weight (kg)
                  </Label>
                  <Input
                    id="goalWeight"
                    type="number"
                    step="0.1"
                    value={formData.goalWeight}
                    onChange={(e) => setFormData({ ...formData, goalWeight: e.target.value })}
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {hasGoalsData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6 text-green-600" />
                Goals & Activity
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Goal</Label>
                <RadioGroup
                  value={formData.goal}
                  onValueChange={(value: any) => setFormData({ ...formData, goal: value })}
                  disabled={!isEditing}
                >
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'lose', label: 'Lose Weight' },
                      { value: 'maintain', label: 'Maintain' },
                      { value: 'gain', label: 'Gain Weight' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          formData.goal === option.value
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <RadioGroupItem value={option.value} className="sr-only" />
                        <p className="text-center">{option.label}</p>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-3 block flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  Activity Level
                </Label>
                <RadioGroup
                  value={formData.activityLevel}
                  onValueChange={(value: any) => setFormData({ ...formData, activityLevel: value })}
                  disabled={!isEditing}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'sedentary', label: 'Sedentary' },
                      { value: 'light', label: 'Light' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'active', label: 'Very Active' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          formData.activityLevel === option.value
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <RadioGroupItem value={option.value} className="sr-only" />
                        <p className="text-center text-sm">{option.label}</p>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-3 block flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-green-600" />
                  Diet Type
                </Label>
                <Select
                  value={formData.dietType}
                  onValueChange={(value: any) => setFormData({ ...formData, dietType: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select diet type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: 'omnivore', label: 'Omnivore' },
                      { value: 'vegetarian', label: 'Vegetarian' },
                      { value: 'vegan', label: 'Vegan' },
                      { value: 'pescatarian', label: 'Pescatarian' },
                    ].map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-6 h-6 text-green-600" />
              Security
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-gray-500">Change your account password</p>
              </div>

              <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Change Password
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[320px] sm:w-[360px]">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new password.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPasswordDialog">Confirm New Password</Label>
                      <Input
                        id="confirmPasswordDialog"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                      />
                    </div>

                    {passwordError && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                        {passwordError}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowChangePassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordError('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleChangePassword}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Change Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}