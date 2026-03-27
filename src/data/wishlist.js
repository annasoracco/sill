import { db } from '../firebase.js';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

function wishlistCollection(userId) {
  return collection(db, 'users', userId, 'wishlist');
}

export async function getWishlistItems(userId) {
  const q = query(wishlistCollection(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addWishlistItem(userId, item) {
  const data = {
    ...item,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(wishlistCollection(userId), data);
  return docRef.id;
}

export async function updateWishlistItem(userId, itemId, updates) {
  const ref = doc(db, 'users', userId, 'wishlist', itemId);
  await updateDoc(ref, updates);
}

export async function deleteWishlistItem(userId, itemId) {
  await deleteDoc(doc(db, 'users', userId, 'wishlist', itemId));
}
