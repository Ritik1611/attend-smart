
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ApiService from '../services/apiService';
import { toast } from 'sonner';

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserSettings: (settings: any) => Promise<void>;
  userSettings: {
    requiredAttendance: number;
    subjectThresholds?: Record<string, number>;
  } | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<{
    requiredAttendance: number;
    subjectThresholds?: Record<string, number>;
  } | null>(null);

  async function fetchUserSettings(userId: string) {
    console.log(`🔄 Fetching user settings for: ${userId}`);
    
    try {
      // First attempt to use API
      const response = await ApiService.get<{
        requiredAttendance: number;
        subjectThresholds?: Record<string, number>;
      }>('/users/settings', { userId });
      
      if (response.success && response.data) {
        console.log(`✅ User settings fetched via API for: ${userId}`);
        setUserSettings(response.data);
        return;
      }
      
      console.log(`⚠️ API call failed for settings, falling back to Firestore for: ${userId}`);
      // Fallback to Firestore
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserSettings({
          requiredAttendance: userData.requiredAttendance || 75,
          subjectThresholds: userData.subjectThresholds || {}
        });
      } else {
        // Default settings if user doc doesn't exist
        setUserSettings({
          requiredAttendance: 75,
          subjectThresholds: {}
        });
      }
    } catch (error) {
      console.error("❌ Error fetching user settings:", error);
      // Set default settings on error
      setUserSettings({
        requiredAttendance: 75,
        subjectThresholds: {}
      });
    }
  }

  function signup(email: string, password: string) {
    console.log(`🔄 Signing up user: ${email}`);
    
    return createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Signed up
        const user = userCredential.user;
        console.log(`✅ Firebase auth sign-up successful for: ${user.email}`);
        
        try {
          // First attempt to use API
          const response = await ApiService.post('/auth/signup', {
            userId: user.uid,
            email: user.email,
            createdAt: new Date().toISOString(),
            requiredAttendance: 75,
            subjectThresholds: {}
          });
          
          if (response.success) {
            console.log(`✅ API sign-up successful for: ${user.email}`);
            return;
          }
          
          console.log(`⚠️ API signup failed, falling back to Firestore for: ${user.email}`);
        } catch (apiError) {
          console.error("❌ API sign-up error:", apiError);
          console.log(`⚠️ Falling back to Firestore for: ${user.email}`);
        }
        
        // Create user document with default settings (Firestore fallback)
        return setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: new Date().toISOString(),
          requiredAttendance: 75,
          subjectThresholds: {}
        });
      })
      .catch((error) => {
        console.error("❌ Error signing up:", error.code, error.message);
        throw error;
      });
  }

  function login(email: string, password: string) {
    console.log(`🔄 Logging in user: ${email}`);
    
    return signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Logged in
        const user = userCredential.user;
        console.log(`✅ Firebase auth login successful for: ${user.email}`);
        
        try {
          // First attempt to use API to log login
          await ApiService.post('/auth/login', {
            userId: user.uid,
            email: user.email,
            timestamp: new Date().toISOString(),
          });
        } catch (apiError) {
          console.error("❌ API login logging error (non-critical):", apiError);
        }
        
        fetchUserSettings(user.uid);
      })
      .catch((error) => {
        console.error("❌ Error logging in:", error.code, error.message);
        throw error;
      });
  }

  function logout() {
    console.log("🔄 Logging out user");
    
    return signOut(auth)
      .then(async () => {
        console.log("✅ Firebase auth logout successful");
        
        try {
          // Attempt to use API to log logout
          if (currentUser) {
            await ApiService.post('/auth/logout', {
              userId: currentUser.uid,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (apiError) {
          console.error("❌ API logout logging error (non-critical):", apiError);
        }
        
        setUserSettings(null);
      })
      .catch((error) => {
        console.error("❌ Error logging out:", error);
        throw error;
      });
  }

  async function updateUserSettings(settings: any) {
    if (!currentUser) throw new Error("No user is logged in");
    
    console.log(`🔄 Updating user settings for: ${currentUser.uid}`);
    
    try {
      // First attempt to use API
      const response = await ApiService.put(`/users/settings`, {
        userId: currentUser.uid,
        ...settings
      });
      
      if (response.success) {
        console.log(`✅ User settings updated via API for: ${currentUser.uid}`);
        
        // Update local state
        setUserSettings(prev => ({
          ...prev,
          ...settings
        }));
        
        return;
      }
      
      console.log(`⚠️ API update failed, falling back to Firestore for: ${currentUser.uid}`);
      // Fallback to Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, settings, { merge: true });
      
      // Update local state
      setUserSettings(prev => ({
        ...prev,
        ...settings
      }));
    } catch (error) {
      console.error("❌ Error updating user settings:", error);
      toast.error("Failed to update settings. Please try again.");
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        console.log(`✅ Auth state changed: user logged in (${user.uid})`);
        fetchUserSettings(user.uid);
      } else {
        console.log("ℹ️ Auth state changed: no user logged in");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    updateUserSettings,
    userSettings
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
