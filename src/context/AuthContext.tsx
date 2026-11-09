import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  type FirebaseUser,
} from '../firebase/config';

export interface UserWalletProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'customer';
  realBalance: number;
  deposit: number;
  bonusPoints: number;
  lastAccrualTimestamp: number;
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserWalletProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateWallet: (data: Partial<UserWalletProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
  updateWallet: async () => {},
});

const ADMIN_EMAIL = 'araik1415@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserWalletProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const path = `users/${currentUser.uid}`;

        try {
          const docSnap = await getDoc(userDocRef);
          const isUserAdmin = currentUser.email === ADMIN_EMAIL;

          if (!docSnap.exists()) {
            const initialProfile: UserWalletProfile = {
              userId: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Участник',
              photoURL: currentUser.photoURL || undefined,
              role: isUserAdmin ? 'admin' : 'customer',
              realBalance: 50000,
              deposit: 150000,
              bonusPoints: 1500,
              lastAccrualTimestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago for interest demo
              createdAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, initialProfile);
            setProfile(initialProfile);
          } else {
            const data = docSnap.data() as UserWalletProfile;
            // Ensure admin role for bootstrapped admin email
            if (isUserAdmin && data.role !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin' });
              data.role = 'admin';
            }
            setProfile(data);
          }

          // Real-time synchronization of wallet state
          unsubscribeSnapshot = onSnapshot(
            userDocRef,
            (snap) => {
              if (snap.exists()) {
                setProfile(snap.data() as UserWalletProfile);
              }
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, path);
            }
          );
        } catch (error) {
          console.error('Error fetching/creating user profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Sign-in with Google failed:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateWallet = async (data: Partial<UserWalletProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const path = `users/${user.uid}`;
    try {
      await updateDoc(userDocRef, data);
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const isAdmin = profile?.role === 'admin' || user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        signInWithGoogle,
        signOutUser,
        updateWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
