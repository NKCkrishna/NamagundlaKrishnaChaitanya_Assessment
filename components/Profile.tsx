
import React, { useState, useContext } from 'react';
import { User, Role } from '../types';
import { AuthContext } from '../App';
import { Button, Card, Input, Spinner } from './ui';
import { api } from '../services/mockApi';

export const Profile: React.FC = () => {
    const { user, setUser } = useContext(AuthContext);
    const [formData, setFormData] = useState<Partial<User>>({
        name: user?.name,
        phoneNumber: user?.phoneNumber,
        dateOfBirth: user?.dateOfBirth,
        address: user?.address,
    });
    const [profilePic, setProfilePic] = useState<string | undefined>(user?.profilePicture);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [passMessage, setPassMessage] = useState('');

    if (!user) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const updatedUser = await api.updateProfile(user.id, { ...formData, profilePicture: profilePic });
            setUser(updatedUser);
            setMessage('Profile updated successfully!');
        } catch (error) {
            setMessage('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };
    
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if(newPassword !== confirmPassword){
            setPassMessage('New passwords do not match.');
            return;
        }
        const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if(!regex.test(newPassword)){
            setPassMessage('Password must be at least 8 characters, with 1 number and 1 special character.');
            return;
        }
        
        setPassLoading(true);
        setPassMessage('');
        try {
            await api.changePassword(user.id, currentPassword, newPassword);
            setPassMessage('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPassMessage(error.message || 'Failed to change password.');
        } finally {
            setPassLoading(false);
        }
    };

    const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Profile Picture</h3>
                    <div className="flex flex-col items-center">
                        <img src={profilePic || `https://i.pravatar.cc/150?u=${user.id}`} alt="Profile" className="w-32 h-32 rounded-full object-cover mb-4" />
                        <label htmlFor="profile-pic-upload" className="cursor-pointer bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 px-4 py-2 text-sm rounded-md">
                            Upload Image
                        </label>
                        <input id="profile-pic-upload" type="file" className="hidden" accept="image/*" onChange={handlePictureUpload} />
                    </div>
                </Card>
            </div>
            <div className="md:col-span-2 space-y-6">
                 <Card>
                    <form onSubmit={handleProfileUpdate} className="p-6">
                        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Personal Information</h3>
                        {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Full Name" name="name" value={formData.name} onChange={handleInputChange} />
                            <Input label="Email Address" name="email" value={user.email} disabled className="bg-slate-100 dark:bg-slate-700"/>
                            <Input label="Phone Number" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleInputChange} />
                            <Input label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth || ''} onChange={handleInputChange} />
                            <div className="md:col-span-2">
                                <Input label="Address" name="address" value={formData.address || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button type="submit" disabled={loading}>{loading ? <Spinner/> : 'Save Changes'}</Button>
                        </div>
                    </form>
                </Card>
                 <Card>
                    <form onSubmit={handlePasswordChange} className="p-6">
                        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Change Password</h3>
                        {passMessage && <p className="text-sm text-red-500 mb-4">{passMessage}</p>}
                        <div className="space-y-4">
                            <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required/>
                            <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required/>
                            <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required/>
                        </div>
                        <div className="mt-6">
                            <Button type="submit" disabled={passLoading}>{passLoading ? <Spinner/> : 'Change Password'}</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};
