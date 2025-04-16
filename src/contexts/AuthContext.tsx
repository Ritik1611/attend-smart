
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
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
      // Fetch directly from Firestore
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserSettings({
          requiredAttendance: userData.requiredAttendance || 75,
          subjectThresholds: userData.subjectThresholds || {}
        });
        console.log(`✅ User settings fetched for: ${userId}`);
      } else {
        // Default settings if user doc doesn't exist
        setUserSettings({
          requiredAttendance: 75,
          subjectThresholds: {}
        });
        console.log(`ℹ️ No user settings found, using defaults for: ${userId}`);
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
        
        // Create user document with default settings
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
      .then((userCredential) => {
        // Logged in
        const user = userCredential.user;
        console.log(`✅ Firebase auth login successful for: ${user.email}`);
        
        // Log login in Firestore (optional)
        setDoc(doc(db, "user_logins", `${user.uid}_${new Date().getTime()}`), {
          userId: user.uid,
          email: user.email,
          timestamp: new Date().toISOString(),
        }, { merge: true }).catch(error => {
          console.error("❌ Error logging login event (non-critical):", error);
        });
        
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
      .then(() => {
        console.log("✅ Firebase auth logout successful");
        
        // Log logout in Firestore (optional)
        if (currentUser) {
          setDoc(doc(db, "user_logouts", `${currentUser.uid}_${new Date().getTime()}`), {
            userId: currentUser.uid,
            timestamp: new Date().toISOString(),
          }, { merge: true }).catch(error => {
            console.error("❌ Error logging logout event (non-critical):", error);
          });
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
      // Update directly in Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, settings, { merge: true });
      
      // Update local state
      setUserSettings(prev => ({
        ...prev,
        ...settings
      }));
      
      console.log(`✅ User settings updated for: ${currentUser.uid}`);
      toast.success("Settings updated successfully");
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
