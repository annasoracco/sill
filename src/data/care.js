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

function careCollection(userId, plantId) {
  return collection(db, 'users', userId, 'plants', plantId, 'careSchedule');
}

export const CARE_TYPES = {
  fertilize: {
    label: 'Fertilize',
    icon: 'fa-flask',
    color: 'var(--brass)',
    defaultFrequency: 30,
    description: 'Feed your plant nutrients for healthy growth',
  },
  repot: {
    label: 'Repot',
    icon: 'fa-arrows-up-down',
    color: 'var(--terracotta)',
    defaultFrequency: 365,
    description: 'Move to a bigger pot when roots outgrow the current one',
  },
  rotate: {
    label: 'Rotate',
    icon: 'fa-rotate',
    color: 'var(--sage)',
    defaultFrequency: 14,
    description: 'Turn the pot so all sides get even light',
  },
  prune: {
    label: 'Prune',
    icon: 'fa-scissors',
    color: 'var(--moss)',
    defaultFrequency: 90,
    description: 'Trim dead or overgrown leaves and stems',
  },
  clean: {
    label: 'Clean leaves',
    icon: 'fa-hand-sparkles',
    color: 'var(--sage-mist)',
    defaultFrequency: 30,
    description: 'Wipe dust off leaves so they can breathe',
  },
};

export async function getCareSchedules(userId, plantId) {
  const q = query(careCollection(userId, plantId), orderBy('nextDue', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addCareSchedule(userId, plantId, schedule) {
  const data = {
    ...schedule,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(careCollection(userId, plantId), data);
  return docRef.id;
}

export async function updateCareSchedule(userId, plantId, scheduleId, updates) {
  const ref = doc(db, 'users', userId, 'plants', plantId, 'careSchedule', scheduleId);
  await updateDoc(ref, updates);
}

export async function deleteCareSchedule(userId, plantId, scheduleId) {
  await deleteDoc(doc(db, 'users', userId, 'plants', plantId, 'careSchedule', scheduleId));
}

export async function markCareDone(userId, plantId, scheduleId, frequencyDays) {
  const now = new Date();
  const nextDue = new Date(now);
  nextDue.setDate(nextDue.getDate() + frequencyDays);

  await updateCareSchedule(userId, plantId, scheduleId, {
    lastDone: now,
    nextDue: nextDue,
  });
}

// Helpers
export function getCareStatus(schedule) {
  if (!schedule.nextDue) return 'unknown';
  const due = schedule.nextDue.toDate ? schedule.nextDue.toDate() : new Date(schedule.nextDue);
  const now = new Date();
  const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'due';
  if (daysUntil <= 3) return 'soon';
  return 'ok';
}

export function daysUntilDue(schedule) {
  if (!schedule.nextDue) return null;
  const due = schedule.nextDue.toDate ? schedule.nextDue.toDate() : new Date(schedule.nextDue);
  return Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
}

export function formatDueDate(schedule) {
  const days = daysUntilDue(schedule);
  if (days === null) return 'Not scheduled';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  return `In ${Math.ceil(days / 7)} weeks`;
}
