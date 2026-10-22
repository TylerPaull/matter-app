/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MaterialAnalysis } from './material-schema.ts';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without passing firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot per Firestore integration guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore connection: client is offline or initializing.');
    }
    return false;
  }
}

/**
 * Real-time listener for the shared specimens collection.
 * Syncs seamlessly across all tabs, phones, laptops, and visitors.
 */
export function subscribeToSharedSpecimens(
  onUpdate: (specimens: MaterialAnalysis[]) => void,
  onError?: (err: unknown) => void
) {
  const specimensCol = collection(db, 'specimens');
  const q = query(specimensCol, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: MaterialAnalysis[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as MaterialAnalysis;
        if (data && data.specimenId && data.identification) {
          items.push(data);
        }
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'specimens');
    }
  );
}

/**
 * Save a specimen to Firestore so it appears for all users and devices
 */
export async function saveSpecimenToCloud(specimen: MaterialAnalysis): Promise<void> {
  const pathStr = `specimens/${specimen.specimenId}`;
  try {
    // Sanitize undefined fields
    const sanitized = JSON.parse(JSON.stringify(specimen));
    await setDoc(doc(db, 'specimens', specimen.specimenId), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathStr);
  }
}

/**
 * Delete a specimen from Firestore
 */
export async function deleteSpecimenFromCloud(specimenId: string): Promise<void> {
  const pathStr = `specimens/${specimenId}`;
  try {
    await deleteDoc(doc(db, 'specimens', specimenId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, pathStr);
  }
}
