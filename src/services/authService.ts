import { supabase } from "@/integrations/supabase/client";

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const isRateLimited = (email: string): boolean => {
  const attempts = loginAttempts.get(email);
  if (!attempts) return false;
  
  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(email);
    return false;
  }
  
  return attempts.count >= MAX_LOGIN_ATTEMPTS;
};

const recordLoginAttempt = (email: string, success: boolean) => {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: now };
  
  if (success) {
    loginAttempts.delete(email);
  } else {
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(email, attempts);
    
    // Log failed attempt for security monitoring
    console.warn('Failed login attempt:', {
      email: email.substring(0, 3) + '***', // Partially obscured for privacy
      timestamp: new Date().toISOString(),
      attemptCount: attempts.count
    });
  }
};

const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase().substring(0, 254); // RFC 5321 limit
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 128;
};

export const loginUser = async (email: string, password: string) => {
  try {
    // Sanitize and validate inputs
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!validateEmail(sanitizedEmail)) {
      throw new Error('Email inválido');
    }
    
    if (!validatePassword(password)) {
      throw new Error('Senha deve ter entre 6 e 128 caracteres');
    }
    
    // Check rate limiting
    if (isRateLimited(sanitizedEmail)) {
      throw new Error('Muitas tentativas de login. Tente novamente em 15 minutos.');
    }
    
    console.log("AuthService: Attempting login for:", sanitizedEmail.substring(0, 3) + '***');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password
    });
    
    if (error) {
      recordLoginAttempt(sanitizedEmail, false);
      console.error("AuthService: Login error:", error);
      throw error;
    }
    
    recordLoginAttempt(sanitizedEmail, true);
    console.log("AuthService: Login successful");
    
    return data;
  } catch (error) {
    console.error("AuthService: Login error:", error);
    throw error;
  }
};

export const registerUser = async (email: string, password: string, name?: string) => {
  try {
    // Sanitize and validate inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = name ? name.trim().substring(0, 100) : undefined; // Limit name length
    
    if (!validateEmail(sanitizedEmail)) {
      throw new Error('Email inválido');
    }
    
    if (!validatePassword(password)) {
      throw new Error('Senha deve ter entre 6 e 128 caracteres');
    }
    
    console.log("AuthService: Attempting registration for:", sanitizedEmail.substring(0, 3) + '***');
    
    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          name: sanitizedName
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    
    if (error) {
      console.error("AuthService: Registration error:", error);
      throw error;
    }
    
    console.log("AuthService: Registration successful");
    return data;
  } catch (error) {
    console.error("AuthService: Registration error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    // console.log("AuthService: Attempting logout");
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("AuthService: Logout error:", error);
      throw error;
    }
    
    // console.log("AuthService: Logout successful");
    return true;
  } catch (error) {
    console.error("AuthService: Logout error:", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    // console.log("AuthService: Attempting password reset for:", email);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      console.error("AuthService: Password reset error:", error);
      throw error;
    }
    
    // console.log("AuthService: Password reset email sent for:", email);
    return true;
  } catch (error) {
    console.error("AuthService: Password reset error:", error);
    throw error;
  }
};

export const getCurrentSession = async () => {
  try {
    // console.log("AuthService: Getting current session");
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("AuthService: Error getting session:", error);
      throw error;
    }
    // console.log("AuthService: Session retrieved:", !!data.session);
    return data.session;
  } catch (error) {
    console.error("AuthService: Error getting session:", error);
    return null;
  }
};

export const setupAuthListener = (callback: (session: any) => void) => {
  // console.log("AuthService: Setting up auth state listener");
  
  return supabase.auth.onAuthStateChange((event, session) => {
    // console.log("AuthService: Auth state change event:", event);
    // console.log("AuthService: Session in event:", !!session);
    // console.log("AuthService: User in session:", session?.user?.email || 'no user');
    
    // Call the callback immediately without setTimeout for faster response
    callback(session);
  });
};
