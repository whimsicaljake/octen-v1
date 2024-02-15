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
const realTimeDb = firebase.database();


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
        .then(function (result) {
            // User signed in successfully
            var user = result.user;

            // Check if it's the user's first time signing in
            var isNewUser = result.additionalUserInfo.isNewUser;
            if (isNewUser) {
                // User doesn't exist, redirect to register.html
                window.location.href = '/login.html';
            } else {
                // User already exists, log them in
                console.log('User already exists in Firestore. Logging in...');
                console.log(user);
            }
        })
        .catch(function (error) {
            // Handle sign in errors
            var errorCode = error.code;
            var errorMessage = error.message;
            console.error(errorCode, errorMessage);
        });
}

  


// Function to show success alert with presentation ID as a link
function showSuccessAlert(presentationId) {
    // Redirect the user to the presentation page
    window.location.href = `/view/${presentationId}`;
}

// Upload images to Firestore and Storage
document.getElementById("uploadButton").addEventListener("click", () => {
    const user = auth.currentUser;
    if (user) {
        const title = document.getElementById("titleInput").value;
        const priceInput = document.getElementById("price").value; // Get the price input value
        const price = priceInput ? parseFloat(priceInput) : 0; // Parse the price input or set default to 0

        const imageInput = document.getElementById("imageInput");
        const images = Array.from(imageInput.files);

        // Fetch user data from Firestore
        db.collection("users").doc(user.uid).get().then(userDoc => {
            const userData = userDoc.data();

            // Create a new presentation document in Firestore
            const newPresentation = {
                title: title,
                price: price, // Add price to the presentation
                uid: user.uid,
                username: userData.username, // Use username from Firestore
                photoURL: userData.photoURL,
                uid: user.uid // Use photoURL from Firestore
            };

            db.collection("presentations").add(newPresentation).then(presentationRef => {
                const presentationId = presentationRef.id; // Get the presentation ID
                const storageRef = storage.ref(`presentations/${user.uid}/${presentationId}`);
                // Update the Realtime Database with UID, Presentation ID, and create "code" subfolder
    realTimeDb.ref(`presentations/${presentationId}`).set({
        uid: user.uid,
        presentationId: presentationId
    });

    // Create a subfolder named "code" for the presentation in Realtime Database
    realTimeDb.ref(`presentations/${presentationId}/code`).set({
        css: "",
        html: "",
        js: ""
    });
                images.forEach(image => {
                    const imageFileName = `${Date.now()}_${image.name}`;
                    const imageRef = storageRef.child(imageFileName);

                    imageRef.put(image).then(snapshot => {
                        snapshot.ref.getDownloadURL().then(url => {
                            // Update the presentation document with the image URLs
                            presentationRef.update({
                                imageURLs: firebase.firestore.FieldValue.arrayUnion(url)
                            }).then(() => {
                                // Redirect the user to the presentation page
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


// Function to preview the selected images
function previewImages() {
    const imageInput = document.getElementById("imageInput");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    imagePreviewContainer.innerHTML = "";

    const images = Array.from(imageInput.files);
    
    images.forEach(image => {
        const reader = new FileReader();

        reader.onload = function (e) {
            // Create image element
            const imgElement = document.createElement("img");
            imgElement.src = e.target.result;
            imgElement.alt = "Selected Image";

            // Add the image to the image preview container
            imagePreviewContainer.appendChild(imgElement);
        };

        reader.readAsDataURL(image);
    });
}


// Load images from Firestore
function loadImages(uid) {
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    imagePreviewContainer.innerHTML = "";

    db.collection("presentations").where("uid", "==", uid).get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();

            // Assuming you want to show only the first image
            const imageURL = data.imageURLs[0];

            // Create image element
            const imgElement = document.createElement("img");
            imgElement.src = imageURL;
            imgElement.alt = "Presentation Image";

            // Add the image to the image preview container
            imagePreviewContainer.appendChild(imgElement);
        });
    });
}

