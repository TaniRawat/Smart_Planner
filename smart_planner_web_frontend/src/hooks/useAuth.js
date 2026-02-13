import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signOut,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth } from '../firebase/config';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setError(null);
    }, (error) => {
      setError(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Phone authentication
  const phoneLogin = async (phoneNumber) => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize reCAPTCHA
      const recaptchaVerifier = new RecaptchaVerifier(
        auth, 
        'recaptcha-container', 
        {
          size: 'invisible',
        }
      );

      const formattedPhoneNumber = `+${phoneNumber.replace(/\D/g, '')}`;
      
      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        formattedPhoneNumber, 
        recaptchaVerifier
      );
      
      return confirmationResult;
      
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async (confirmationResult, otp) => {
    try {
      setLoading(true);
      const credential = await confirmationResult.confirm(otp);
      setUser(credential.user);
      return credential.user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    phoneLogin,
    verifyOTP,
    logout,
    isAuthenticated: !!user
  };
};