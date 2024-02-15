const firebaseConfig = {
    apiKey: "AIzaSyD-GCRFbpLQwU55kShhS-DtNSNOPEySQ_g",
    authDomain: "octen-29d12.firebaseapp.com",
    databaseURL: "https://octen-29d12-default-rtdb.firebaseio.com",
    projectId: "octen-29d12",
    storageBucket: "octen-29d12.appspot.com",
    messagingSenderId: "1095439842170",
    appId: "1:1095439842170:web:da0dc8a2c414c60f33f4c3",
    measurementId: "G-483MYXKNVL"
  };
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;

// Check if user is logged in
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    enableInputs();
    // Fetch user data and save to Firestore
    saveUserDataToFirestore(user);
  } else {
    currentUser = null;
    disableInputs();
    // Show Google login button
    showLoginButton();
  }
});

// Function to enable inputs
function enableInputs() {
  document.getElementById('postTitle').disabled = false;
  quill.enable();
  document.getElementById('fileInput').disabled = false;
}

// Function to disable inputs
function disableInputs() {
  document.getElementById('postTitle').disabled = true;
  quill.disable();
  document.getElementById('fileInput').disabled = true;
}

// Function to show login button
function showLoginButton() {
  const loginContainer = document.createElement('div');
  loginContainer.style.textAlign = 'center';
  
  const loginButton = document.createElement('button');
  loginButton.textContent = 'Login with Google';
  loginButton.onclick = signInWithGoogle;
  
  loginContainer.appendChild(loginButton);
  
  document.body.innerHTML = ''; // Clear the body
  document.body.appendChild(loginContainer);
}

// Function to sign in with Google
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      console.log("Logged in user:", user.displayName);
      currentUser = user;
      saveUserDataToFirestore(user);
      enableInputs();
    })
    .catch(error => {
      console.error("Google sign-in error:", error);
    });
}

// Function to save user data to Firestore
function saveUserDataToFirestore(user) {
  db.collection('users').doc(user.uid).set({
    username: generateUsername(user.displayName),
    name: user.displayName,
    photoURL: user.photoURL
  })
  .then(() => {
    console.log("User data saved to Firestore");
  })
  .catch(error => {
    console.error("Error saving user data:", error);
  });
}

// Function to generate a unique username based on display name
function generateUsername(displayName) {
  // Implement your logic to generate a unique username from the display name
  // For simplicity, a basic approach is used here (you may want a more robust method)
  return displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
}

// Rest of your createPost() function and Quill initialization...