'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    
    // Check if we are in a Firebase App Hosting environment.
    // Firebase App Hosting sets specific environment variables like FIREBASE_CONFIG or K_SERVICE.
    const isFirebaseAppHosting = typeof process !== 'undefined' && !!(process.env.FIREBASE_CONFIG || process.env.K_SERVICE);

    if (isFirebaseAppHosting) {
      try {
        // Attempt to initialize via Firebase App Hosting environment variables
        firebaseApp = initializeApp();
      } catch (e) {
        // Only warn in production because it's normal to use the firebaseConfig to initialize
        // during development
        if (process.env.NODE_ENV === "production") {
          console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
        }
        firebaseApp = initializeApp(firebaseConfig);
      }
    } else {
      // For Vercel, Local, or other environments, use the explicit config object directly.
      // This avoids the "app/no-options" error in the logs.
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
