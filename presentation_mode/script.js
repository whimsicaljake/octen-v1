// Firebase configuration
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

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Check if user is logged in
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById("loginDiv").style.display = "none";
        document.getElementById("mainDiv").style.display = "block";
        loadImages(user.uid);
    } else {
        document.getElementById("loginDiv").style.display = "block";
        document.getElementById("mainDiv").style.display = "none";
    }
});

// Get references to form elements
var googleSignInButton = document.getElementById('loginButton');

// Add event listener for the Google Sign in button
googleSignInButton.addEventListener('click', signInWithGoogle);

// Function to sign in with Google
function signInWithGoogle() {
  var provider = new firebase.auth.GoogleAuthProvider();

  // Sign in with Google using Firebase Auth
  firebase.auth().signInWithPopup(provider)
    .then(function(result) {
      // User signed in successfully
      var user = result.user;

      // Check if it's the user's first time signing in
      if (result.additionalUserInfo.isNewUser) {
        // Get user data
        var photoURL = user.photoURL;
        var displayName = user.displayName;
        var uid = user.uid;

        // Set additional user data in Firestore
        var db = firebase.firestore();
        var userRef = db.collection('users').doc(uid);

        userRef.set({
          photoURL: photoURL,
          displayName: displayName,
          subscription: false,
          coinBalance: 0,
          hash: uid,
          uid: uid,  // Add the user's UID field
          verified: false
        })
        .then(function() {
          console.log('User data saved successfully.');
        })
        .catch(function(error) {
          console.error('Error saving user data:', error);
        });
      }
      
      console.log(user);
    })
    .catch(function(error) {
      // Handle sign in errors
      var errorCode = error.code;
      var errorMessage = error.message;
      console.error(errorCode, errorMessage);
    });
}


// Upload images to Firestore and Storage
document.getElementById("uploadButton").addEventListener("click", () => {
    const user = auth.currentUser;
    if (user) {
        const title = document.getElementById("titleInput").value;
        const imageInput = document.getElementById("imageInput");
        const images = Array.from(imageInput.files);

        // Fetch user data from Firestore
        db.collection("users").doc(user.uid).get().then(userDoc => {
            const userData = userDoc.data();

            // Create a new presentation document in Firestore
            const newPresentation = {
                title: title,
                uid: user.uid,
                displayName: userData.displayName, // Use displayName from Firestore
                photoURL: userData.photoURL // Use photoURL from Firestore
            };

            db.collection("presentations").add(newPresentation).then(presentationRef => {
                const presentationId = presentationRef.id; // Get the presentation ID
                const storageRef = storage.ref(`presentations/${user.uid}/${presentationId}`);

                images.forEach(image => {
                    const imageFileName = `${Date.now()}_${image.name}`;
                    const imageRef = storageRef.child(imageFileName);

                    imageRef.put(image).then(snapshot => {
                        snapshot.ref.getDownloadURL().then(url => {
                            // Update the presentation document with the image URLs
                            presentationRef.update({
                                imageURLs: firebase.firestore.FieldValue.arrayUnion(url)
                            }).then(() => {
                                // Show success alert with presentation ID as a link
                                showSuccessAlert(presentationId);
                            });
                        });
                    });
                });
            });
        }).catch(error => {
            console.error('Error fetching user data:', error);
        });
    }
});
// Function to show success alert with presentation ID as a link
function showSuccessAlert(presentationId) {
    // You can customize the alert appearance based on your needs
    const successAlert = document.createElement("div");
    successAlert.classList.add("success-alert");
    successAlert.innerHTML = `
        Images uploaded successfully! View your post <a href="./session.html#${presentationId}">Go to Presentation</a>.
    `;
    
    document.body.appendChild(successAlert);
}


// Load images from Firestore
function loadImages(uid) {
    const imageContainer = document.getElementById("imageContainer");
    imageContainer.innerHTML = "";

    db.collection("presentations").where("uid", "==", uid).get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const image = document.createElement("img");
            image.src = data.imageURL;
            imageContainer.appendChild(image);
        });
    });
}
