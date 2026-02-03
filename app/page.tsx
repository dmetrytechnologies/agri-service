'use client';

import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Smartphone, ArrowRight, UserPlus, LogIn, User, MapPin, Loader2 } from 'lucide-react';
import ServiceAreaSelector from '@/components/ServiceAreaSelector';

const TypingEffect = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 70);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <span className="relative">
      {displayText}
      <span className="inline-block w-[4px] h-[1em] bg-[var(--primary)] animate-pulse ml-1 align-middle" />
    </span>
  );
};



export default function LoginPage() {
  const { user, login, verifyOtp, signUp, checkUserExists, isLoading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  // Operator Specific State
  const [servicePincodes, setServicePincodes] = useState<string[]>([]);
  const [serviceVillages, setServiceVillages] = useState<string[]>([]);

  // Timer States
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const startTimer = () => {
    setTimer(30);
    setCanResend(false);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      // Strict Registry Check before OTP for LOGIN mode
      if (mode === 'login') {
        const exists = await checkUserExists(phone);
        if (!exists) {
          setError('User not found. Please create an account.');
          setIsSubmitting(false);
          return;
        }
      }

      // Trigger OTP
      await login(phone);

      setError('');
      setStep('otp');
      startTimer();
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (canResend) {
      setError('');
      try {
        await login(phone);
        startTimer();
      } catch (err) {
        setError('Failed to resend OTP');
      }
    }
  };

  // ... (countdown logic stays same)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { // Updated to 6 digits
      setError('Please enter the OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      // Correctly call verifyOtp for both Login and Signup flows
      // verifyOtp in auth-context will handle profile creation if it was a signup
      const success = await verifyOtp(phone, otp, rememberMe);
      if (!success) throw new Error('Invalid OTP');

      // Redirect handled by useEffect
    } catch (err: any) {
      setError(err.message || 'Verification failed. please try again.');
      // Don't reset step to phone, let them retry OTP
      setIsSubmitting(false);
    }
  };


  const handleSignUpInit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || phone.length < 10) {
      setError('Please fill name and phone correctly');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if user already exists
      const exists = await checkUserExists(phone);
      if (exists) {
        setError('Account already registered. Please Sign In.');
        // setIsSubmitting(false); // Handled in finally
        return;
      }

      // Validations
      if (role === 'farmer') {
        if (!pincode || pincode.length !== 6) throw new Error('Please enter a valid 6-digit pincode');
        if (!village || !district) throw new Error('Please fill distinct and village details');
      } else if (role === 'operator') {
        if (!address) throw new Error('Please enter your base location');
        if (servicePincodes.length === 0 || serviceVillages.length === 0) throw new Error("Please add a service area. Enter Pincode -> Search -> Select Villages -> Click 'Add Villages' button.");
      }

      // Init Signup -> Stores data and triggers OTP
      await signUp(name, phone, role, address, pincode, village, district, servicePincodes, serviceVillages);

      setError('');
      setStep('otp');
      startTimer();

    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'admin') router.push('/dashboard/admin');
      else if (user.role === 'operator') router.push('/dashboard/operator');
      else if (user.role === 'farmer') router.push('/dashboard/farmer');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div className="flex h-screen items-center justify-center font-bold text-[var(--foreground)]">Loading...</div>;

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 font-sans overflow-hidden">
      {/* Subtle background image hint - darker filter for better text readability on glass */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: "url('/images/bg-agri.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      />


      {/* Top Right Navigation */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          {/* Logo could go here */}
        </div>
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setStep('phone');
            setError('');
          }}
          className="glass-button text-sm px-6 py-2.5 flex items-center gap-2"
        >
          {mode === 'login' ? (
            <><UserPlus className="h-4 w-4" /> Create Account</>
          ) : (
            <><LogIn className="h-4 w-4" /> Sign In</>
          )}
        </button>
      </div>

      <div className="relative w-full max-w-2xl space-y-8 md:space-y-12 overflow-hidden glass-card p-8 md:p-16 transition-all duration-700 animate-in fade-in zoom-in duration-1000 mt-12">
        <div className="text-center space-y-4 md:space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[var(--foreground)] tracking-tighter italic leading-none drop-shadow-sm">
              Agri Drone
            </h1>
            <div className="min-h-[40px] flex items-center justify-center px-2">
              <p className="text-base md:text-xl lg:text-2xl font-bold text-[var(--primary)] tracking-wide italic leading-snug drop-shadow-sm">
                <TypingEffect text="On-demand drone spraying service" />
              </p>
            </div>
          </div>

          {/* Removed Corporate Text Here as requested */}
        </div>

        {step === 'otp' ? (
          /* OTP VERIFICATION (BOTH LOGIN & SIGNUP) */
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-[var(--primary)] font-medium mb-1">
                {mode === 'login' ? 'Proceeding with Login' : 'Verifying Identity'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-[var(--muted)]">Sent to +91 {phone}</span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-[10px] glass-button px-3 py-1 font-bold uppercase hover:bg-white/20 border-none shadow-none"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="otp" className="block text-xs font-black text-[var(--muted)] uppercase tracking-widest text-center">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                autoFocus
                className="glass-input text-center text-4xl font-black tracking-[0.5em] h-20 placeholder:text-gray-400/50"
                placeholder=""
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>

            <div className="text-center">
              <button
                type="button"
                disabled={!canResend}
                onClick={handleResendOtp}
                className={`text-xs font-black uppercase tracking-widest transition-colors ${canResend ? 'text-[var(--primary)] hover:scale-105 active:scale-95' : 'text-gray-400 cursor-not-allowed'}`}
              >
                {canResend ? 'Resend OTP' : `Resend in ${timer}s`}
              </button>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer h-6 w-6 appearance-none rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] transition-all checked:bg-[var(--primary)]"
                  />
                  <div className="absolute text-white scale-0 transition-transform peer-checked:scale-100 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">Remember me</span>
              </label>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50/80 backdrop-blur-sm px-3 py-2 rounded-xl text-center border border-red-200">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="glass-button glass-button-primary w-full py-4 text-lg disabled:opacity-70 disabled:cursor-wait"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Verifying...
                </span>
              ) : (
                mode === 'login' ? 'Secure Login' : 'Finalize Registration'
              )}
            </button>
          </form>
        ) : mode === 'login' ? (
          /* LOGIN PHONE ENTRY */
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2 text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Welcome Back</h2>
              <p className="text-sm text-[var(--muted)]">Please sign in to your dashboard</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                  <Smartphone className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  required
                  className="glass-input pl-14 h-14 font-bold"
                  placeholder=""
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-5">
                  <span className="text-[10px] font-bold text-[var(--muted)]">IND</span>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50/80 backdrop-blur-sm px-3 py-2 rounded-xl text-center border border-red-200">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="glass-button glass-button-primary w-full py-4 text-lg mt-4 disabled:opacity-70 disabled:cursor-wait"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Checking...
                </span>
              ) : (
                <>Continue <ArrowRight className="h-5 w-5 ml-2" /></>
              )}
            </button>


          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUpInit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">I want to register as:</label>
              <div className="grid grid-cols-2 gap-4 p-2 glass-panel rounded-[1.25rem]">
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === 'farmer' ? 'glass-button-primary shadow-lg' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                >
                  Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('operator')}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === 'operator' ? 'glass-button-primary shadow-lg' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                >
                  Drone Operator
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">Full Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                  <User className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  className="glass-input pl-14 h-14 font-bold"
                  placeholder=""
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone-signup" className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">Phone Number</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                  <Smartphone className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <input
                  id="phone-signup"
                  type="text"
                  required
                  className="glass-input pl-14 h-14 font-bold"
                  placeholder=""
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>

            {role === 'farmer' && (
              <div className="grid grid-cols-1 gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="address" className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">Address</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                        <MapPin className="h-4 w-4 text-[var(--primary)]" />
                      </div>
                      <input
                        id="address"
                        type="text"
                        required
                        className="glass-input pl-12 h-14 font-bold"
                        placeholder="H.No / Street"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="pincode" className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">PIN Code</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                        <span className="text-[var(--primary)] font-bold">#</span>
                      </div>
                      <input
                        id="pincode"
                        type="text"
                        required
                        className="glass-input pl-12 h-14 font-bold"
                        placeholder="6 Digit PIN"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="village" className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">Village</label>
                    <input
                      id="village"
                      type="text"
                      required
                      className="glass-input pl-4 h-14 font-bold"
                      placeholder="Village Name"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="district" className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">District</label>
                    <input
                      id="district"
                      type="text"
                      required
                      className="glass-input pl-4 h-14 font-bold"
                      placeholder="District"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {role === 'operator' && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label htmlFor="address" className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest pl-1">Base Location</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                      <MapPin className="h-4 w-4 text-[var(--primary)]" />
                    </div>
                    <input
                      id="address"
                      type="text"
                      required
                      className="glass-input pl-12 h-14 font-bold"
                      placeholder="Base Station / Town"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                <ServiceAreaSelector
                  onUpdate={(data) => {
                    setServicePincodes(data.pincodes);
                    setServiceVillages(data.villages);
                  }}
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50/80 backdrop-blur-sm px-3 py-2 rounded-xl text-center border border-red-200">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="glass-button glass-button-primary w-full py-4 text-lg mt-4 disabled:opacity-70 disabled:cursor-wait"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Processing...
                </span>
              ) : (
                <>Request OTP <ArrowRight className="h-5 w-5 ml-2" /></>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Corporate Footer */}
      <div className="absolute bottom-6 md:bottom-8 left-0 right-0 text-center pointer-events-none px-6">
        <p className="text-[8px] md:text-xs font-black text-[var(--muted)] uppercase tracking-[0.3em] md:tracking-[0.6em] animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
          Dmetry Technologies Private Limited
        </p>
      </div>
    </div>
  );
}
