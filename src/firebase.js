import { initializeApp } from "firebase/app";
import { getFirestore } from "@firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAU-l9LMEE0S2Xo_MEFJwQCf_7oMkSgv2I",
  authDomain: "aptmgmtaw.firebaseapp.com",
  projectId: "aptmgmtaw",
  storageBucket: "aptmgmtaw.appspot.com",
  messagingSenderId: "308003370695",
  appId: "1:308003370695:web:720dc4fb7578956149b0e2",
  measurementId: "G-EXQFHDWJEP"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);