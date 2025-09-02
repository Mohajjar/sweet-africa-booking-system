import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { db, auth } from "./firebase-config.js";

export async function fetchAllBookings() {
  try {
    const querySnapshot = await getDocs(query(collection(db, "bookings")));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all bookings: ", error);
    return [];
  }
}

export async function fetchUsersByRole(role) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error(`Error fetching ${role}s: `, error);
    return [];
  }
}

export async function updateBookingStatus(bookingId, newStatus) {
  const bookingRef = doc(db, "bookings", bookingId);
  try {
    await updateDoc(bookingRef, { status: newStatus });
    return true;
  } catch (error) {
    console.error("Error updating booking status: ", error);
    return false;
  }
}

export async function createNewStaff(name, email, phone, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      phone,
      role: "staff",
    });
    return true;
  } catch (error) {
    console.error("Error creating staff member: ", error);
    throw error;
  }
}
