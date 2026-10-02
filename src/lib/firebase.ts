import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

export { onAuthStateChanged, type User };
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  writeBatch,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Question, GameSettings, Team } from '../types/game';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Authentication & Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection on boot per Firebase guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice.');
    }
  }
}
testFirestoreConnection();

// Google Sign-In helper
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Upsert user profile
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(
    userDocRef,
    {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Teacher',
      photoURL: user.photoURL || '',
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return user;
}

// Sign-Out helper
export async function logoutTeacher(): Promise<void> {
  await signOut(auth);
}

// ---------------- FIRESTORE STORAGE FOR QUESTIONS ----------------

/**
 * Loads all questions stored for this Google account.
 * If none exist, returns null so caller can seed initial questions.
 */
export async function loadTeacherQuestions(userId: string): Promise<Question[] | null> {
  try {
    const questionsCol = collection(db, 'teachers', userId, 'questions');
    const snapshot = await getDocs(questionsCol);

    if (snapshot.empty) {
      return null;
    }

    const loadedQuestions: Question[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      loadedQuestions.push({
        id: data.id || docSnap.id,
        question: data.question,
        options: data.options,
        correctAnswer: data.correctAnswer,
        difficulty: data.difficulty || 'Easy',
        points: data.points || 10,
        movementSteps: data.movementSteps || 1,
        explanation: data.explanation || '',
        category: data.category || '',
        topic: data.topic || '',
      });
    });

    return loadedQuestions;
  } catch (error) {
    console.error('Error loading questions from Firestore:', error);
    return null;
  }
}

/**
 * Saves/replaces the entire active question bank for this Google account in Firestore.
 */
export async function saveTeacherQuestions(userId: string, questions: Question[]): Promise<void> {
  try {
    const questionsCol = collection(db, 'teachers', userId, 'questions');
    
    // 1. Get existing docs to delete old ones that were removed
    const existingSnapshot = await getDocs(questionsCol);
    const existingIds = new Set(existingSnapshot.docs.map(d => d.id));
    const newIds = new Set(questions.map(q => q.id));

    const batch = writeBatch(db);

    // Delete removed questions
    existingSnapshot.docs.forEach(docSnap => {
      if (!newIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });

    // Write all current questions
    questions.forEach((q, idx) => {
      const docRef = doc(questionsCol, q.id);
      batch.set(docRef, {
        id: q.id,
        userId: userId,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        points: q.points || 10,
        movementSteps: q.movementSteps || 1,
        explanation: q.explanation || '',
        category: q.category || '',
        topic: q.topic || '',
        orderIndex: idx,
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    console.log(`Saved ${questions.length} questions to Firestore under account ${userId}`);
  } catch (error) {
    console.error('Error saving questions to Firestore:', error);
    throw error;
  }
}

// ---------------- FIRESTORE STORAGE FOR SETTINGS & TEAMS ----------------

export async function saveTeacherSettings(userId: string, settings: GameSettings): Promise<void> {
  try {
    const settingsDoc = doc(db, 'teachers', userId, 'settings', 'default');
    await setDoc(settingsDoc, {
      ...settings,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving settings to Firestore:', error);
  }
}

export async function loadTeacherSettings(userId: string): Promise<GameSettings | null> {
  try {
    const settingsDoc = doc(db, 'teachers', userId, 'settings', 'default');
    const snap = await getDoc(settingsDoc);
    if (snap.exists()) {
      return snap.data() as GameSettings;
    }
    return null;
  } catch (error) {
    console.error('Error loading settings from Firestore:', error);
    return null;
  }
}

export async function saveTeacherTeams(userId: string, teams: Team[]): Promise<void> {
  try {
    const teamsDoc = doc(db, 'teachers', userId, 'teams', 'default');
    await setDoc(teamsDoc, {
      userId,
      teams,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving teams to Firestore:', error);
  }
}

export async function loadTeacherTeams(userId: string): Promise<Team[] | null> {
  try {
    const teamsDoc = doc(db, 'teachers', userId, 'teams', 'default');
    const snap = await getDoc(teamsDoc);
    if (snap.exists() && Array.isArray(snap.data().teams)) {
      return snap.data().teams as Team[];
    }
    return null;
  } catch (error) {
    console.error('Error loading teams from Firestore:', error);
    return null;
  }
}
