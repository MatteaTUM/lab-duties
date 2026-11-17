// Lab Duties ISBM – settings filled in once by whoever sets up the app.
// See SETUP.md. While "firebase" is empty, the app runs in demo mode (data stays on the device).
window.LAB_CONFIG = {
  // Paste the firebaseConfig object from Firebase (Project settings → Your apps → Web app).
  // These values are not secret; access is controlled by the Firestore rules.
  firebase: {
    apiKey: "AIzaSyDf7okp8x0stpB-OBjAizoM0fCX1zNo7tk",
    authDomain: "lab-duties.firebaseapp.com",
    projectId: "lab-duties",
    storageBucket: "lab-duties.firebasestorage.app",
    messagingSenderId: "692795913990",
    appId: "1:692795913990:web:7ecd758a56f6e909c19087"
  },

  // Name of this lab's checklist inside the database (keep as is).
  lab: "isbm"
};
