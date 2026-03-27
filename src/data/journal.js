import { db, storage } from '../firebase.js';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

export const ENTRY_TYPES = {
  observation: { label: 'Observation', icon: 'fa-eye', color: 'var(--sage)' },
  watering: { label: 'Watering', icon: 'fa-droplet', color: '#5B9BD5' },
  repotting: { label: 'Repotting', icon: 'fa-arrows-up-down', color: 'var(--terracotta)' },
  fertilizing: { label: 'Fertilizing', icon: 'fa-flask', color: 'var(--brass)' },
  milestone: { label: 'Milestone', icon: 'fa-star', color: '#D4A039' },
  issue: { label: 'Issue', icon: 'fa-triangle-exclamation', color: 'var(--danger)' },
};

function journalCollection(userId, plantId) {
  return collection(db, 'users', userId, 'plants', plantId, 'journal');
}

export async function getJournalEntries(userId, plantId) {
  const q = query(journalCollection(userId, plantId), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addJournalEntry(userId, plantId, entry) {
  const data = {
    ...entry,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(journalCollection(userId, plantId), data);
  return docRef.id;
}

export async function deleteJournalEntry(userId, plantId, entryId) {
  await deleteDoc(doc(db, 'users', userId, 'plants', plantId, 'journal', entryId));
}

export async function uploadJournalPhoto(userId, plantId, file) {
  const path = `users/${userId}/plants/${plantId}/journal/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export function formatEntryDate(dateVal) {
  const date = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
