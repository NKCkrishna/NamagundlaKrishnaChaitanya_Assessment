
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/mockApi';
import { Button, Card, Input, Spinner } from './ui';

interface AuthProps {
    onAuthSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validatePassword = (pass: string) => {
        const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        return regex.test(pass);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!isLogin && !name) {
            setError('Name is required.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email.');
            return;
        }
        if (!validatePassword(password)) {
            setError('Password must be at least 8 characters, with 1 number and 1 special character.');
            return;
        }
        
        setLoading(true);
        try {
            const user = isLogin 
                ? await api.login(email, password)
                : await api.signup(name, email, password);
            onAuthSuccess(user);
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };
    
    const toggleForm = () => {
        setIsLogin(!isLogin);
        setError('');
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <Card className="w-full max-w-md">
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-6">
                        {isLogin ? 'Welcome To Sambhāṣa!' : 'Create an Account'}
                    </h2>

                    {isLogin && (
                        <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-md mb-4 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">Demo Credentials:</p>
                            <p><strong className="font-medium">Admin:</strong> admin@example.com / Admin@1234!</p>
                            <p><strong className="font-medium">Student:</strong> student@example.com / Student@1234!</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && <Input id="name" label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />}
                        <Input id="email" label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Spinner /> : (isLogin ? 'Log In' : 'Sign Up')}
                        </Button>
                    </form>
                    <div className="mt-6 text-center">
                        <button onClick={toggleForm} className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                           {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
