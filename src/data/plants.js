import { db, storage } from '../firebase.js';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

function plantsCollection(userId) {
  return collection(db, 'users', userId, 'plants');
}

export async function getPlants(userId) {
  const q = query(plantsCollection(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPlant(userId, plantId) {
  const snap = await getDoc(doc(db, 'users', userId, 'plants', plantId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function addPlant(userId, plant) {
  const data = {
    ...plant,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(plantsCollection(userId), data);
  return docRef.id;
}

export async function updatePlant(userId, plantId, updates) {
  const docRef = doc(db, 'users', userId, 'plants', plantId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlant(userId, plantId) {
  await deleteDoc(doc(db, 'users', userId, 'plants', plantId));
}

export async function uploadPlantPhoto(userId, plantId, file) {
  const path = `users/${userId}/plants/${plantId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

// Helpers
export function getWateringStatus(plant) {
  if (!plant.lastWatered || !plant.wateringFrequencyDays) return 'unknown';
  const last = plant.lastWatered.toDate ? plant.lastWatered.toDate() : new Date(plant.lastWatered);
  const now = new Date();
  const daysSince = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  const freq = plant.wateringFrequencyDays;

  if (daysSince >= freq + 2) return 'overdue';
  if (daysSince >= freq) return 'due';
  if (daysSince >= freq - 1) return 'soon';
  return 'happy';
}

export function daysSinceWatered(plant) {
  if (!plant.lastWatered) return null;
  const last = plant.lastWatered.toDate ? plant.lastWatered.toDate() : new Date(plant.lastWatered);
  return Math.floor((new Date() - last) / (1000 * 60 * 60 * 24));
}

const WATERING_META = {
  overdue: { label: 'Overdue', icon: 'fa-triangle-exclamation', cssClass: 'status-overdue' },
  due: { label: 'Needs water', icon: 'fa-droplet', cssClass: 'status-due' },
  soon: { label: 'Water soon', icon: 'fa-clock', cssClass: 'status-soon' },
  happy: { label: 'Happy', icon: 'fa-face-smile', cssClass: 'status-happy' },
  unknown: { label: 'Not tracked', icon: 'fa-question', cssClass: 'status-unknown' },
};

export function getWateringMeta(plant) {
  return WATERING_META[getWateringStatus(plant)];
}
