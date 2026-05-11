import { useState, type FormEvent, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import './LoginSignup.css';

function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState('patient');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (isLogin) {
      console.log('Login submitted:', { email });

      const { data: loginUser, error: loginError } = await supabase
        .from('users')
        .select('id, role, password, full_name, email')
        .eq('email', email)
        .maybeSingle();

      if (loginError) {
        alert(`Login failed: ${loginError.message}`);
        return;
      }

      if (!loginUser) {
        alert('Login failed: no account found for this email.');
        return;
      }

      if (loginUser.password !== password) {
        alert('Login failed: incorrect password.');
        return;
      }

      localStorage.setItem('sessionUser', JSON.stringify({
        id: loginUser.id,
        role: loginUser.role,
        full_name: loginUser.full_name,
        email: loginUser.email
      }));

      if (loginUser.role === 'pt') {
        navigate('/dashboard/pt');
      } else if (loginUser.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard/patient');
      }
    } else {
      const fullName = formData.get('fullName') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      const trimmedName = fullName.trim();
      console.log('Signup submitted:', { fullName: trimmedName, email, role: selectedRole });


      // Find user with matching name + role + no password yet
      const { data: availableUsers, error: findError } = await supabase
        .from('users')
        .select('id, email')
        .eq('full_name', trimmedName)
        .eq('role', selectedRole)
        .is('password', null);

      if (findError) {
        alert(`Signup failed: ${findError.message}`);
        return;
      }

      if (!availableUsers || availableUsers.length === 0) {
        alert('Signup failed: name and role were not found in our records, or all accounts are already registered.');
        return;
      }

      // Pick the first available user slot
      const existingUser = availableUsers[0];


      // Check if this email already exists in a DIFFERENT account
      const { data: emailExists, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', existingUser.id)
        .maybeSingle();

      if (emailError) {
        alert(`Signup failed: ${emailError.message}`);
        return;
      }

      if (emailExists) {
        alert('This email already exists in our system.');
        return;
      }

      // Save email and password to the existing user record  
      const { data: updatedRows, error: updateError } = await supabase
        .from('users')
        .update({
          email: email,
          password: password,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select('id, email, full_name');

      if (updateError) {
        alert(`Signup failed: ${updateError.message}`);
        return;
      }

      if (!updatedRows || updatedRows.length === 0) {
        alert('Signup failed: update was blocked. Check RLS policies for the users table.');
        return;
      }

      // Fetch the complete updated user record to verify
      const { data: verifiedUser, error: verifyError } = await supabase
        .from('users')
        .select('id, role, password, full_name, email')
        .eq('id', existingUser.id)
        .maybeSingle();

      if (verifyError || !verifiedUser) {
        alert(`Signup successful but verification failed. Please log in manually.`);
        navigate('/?mode=login');
        return;
      }

      // Store the session and redirect
      localStorage.setItem('sessionUser', JSON.stringify({
        id: verifiedUser.id,
        role: verifiedUser.role,
        full_name: verifiedUser.full_name,
        email: verifiedUser.email
      }));

      alert('Signup successful! Logging you in...');

      // Redirect based on role
      if (selectedRole === 'pt') {
        navigate('/dashboard/pt');
      } else if (selectedRole === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard/patient');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="floating-horseshoes">
        <img src="/horseshoe-red.png" alt="" className="horseshoe horseshoe-1" />
        <img src="/horseshoe-blue.png" alt="" className="horseshoe horseshoe-2" />
        <img src="/horseshoe-purple.png" alt="" className="horseshoe horseshoe-3" />
        <img src="/horseshoe-green.png" alt="" className="horseshoe horseshoe-4" />
        <img src="/horseshoe-orange.png" alt="" className="horseshoe horseshoe-5" />
        <img src="/horseshoe-yellow.png" alt="" className="horseshoe horseshoe-6" />
        <img src="/horseshoe-pink.png" alt="" className="horseshoe horseshoe-7" />
      </div>

      <div className="auth-container">
        <div className="auth-header">
          <Link to="/">
            <img src="/gallop_logo_t.png" alt="Gallop Logo" className="auth-logo" />
          </Link>
          <img src="/gallop_text_t.png" alt="Gallop" className="auth-title-logo" />
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              <span className="tab-icon">🏇</span>
              Log In
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              <span className="tab-icon">⭐</span>
              Sign Up
            </button>
          </div>

          <div className="auth-form-container">
            <h2 className="auth-form-title">
              {isLogin ? 'Welcome Back!' : 'Join Now!'}
            </h2>
            <p className="auth-form-subtitle">
              {isLogin
                ? 'Ready to continue your journey?'
                : 'Start your rehab today!'}
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="fullName">
                    <span className="label-icon">👤</span>
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="Enter your Full name"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">
                  <span className="label-icon">📧</span>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <span className="label-icon">🔒</span>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <span className="label-icon">🔐</span>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              )}

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="role">
                    <span className="label-icon">🏅</span>
                    I am a...
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    required
                  >
                    <option value="patient">Patient</option>
                    <option value="pt">Physical Therapist</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              )}

              {isLogin && (
                <div className="form-options">
                  <label className="remember-me">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="forgot-password">Forgot password?</a>
                </div>
              )}

              <button type="submit" className="btn-submit">
                {isLogin ? 'Start Training!' : 'Join Now!'}
              </button>
            </form>

            <p className="toggle-auth">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLogin(!isLogin)} className="toggle-link">
                {isLogin ? 'Sign up now!' : 'Log in here!'}
              </button>
            </p>
          </div>
        </div>

        <div className="auth-decoration">
          <img src="/horseshoe-blue.png" alt="" className="deco-horseshoe deco-1" />
          <img src="/horseshoe-pink.png" alt="" className="deco-horseshoe deco-2" />
        </div>
      </div>
    </div>
  );
}

export default LoginSignup;