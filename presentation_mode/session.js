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

// Get the presentation ID from the URL hash
const presentationId = window.location.hash.substr(1);

// Retrieve presentation details
db.collection("presentations").doc(presentationId).get().then(doc => {
    if (doc.exists) {
        const presentationData = doc.data();
        const presentationInfoDiv = document.getElementById("presentationInfo");

      //  const titleElement = document.createElement("h2");
       // titleElement.textContent = presentationData.title;
      //  presentationInfoDiv.appendChild(titleElement);

        const userIdElement = document.createElement("p");
        userIdElement.textContent = presentationData.displayName + " is presenting";
        presentationInfoDiv.appendChild(userIdElement);

       
        // Retrieve and display images
        const imageContainer = document.getElementById("imageContainer");
        const imageURLs = presentationData.imageURLs || [];

        const carouselContainer = document.createElement("div");
        carouselContainer.className = "carouselContainer";
        const carouselOfImages = document.createElement("div");
        carouselOfImages.className = "carouselOfImages";

        imageURLs.forEach(url => {
            const imageElement = document.createElement("img");
            imageElement.src = url;
            imageElement.classList = 'carouselImage';
            carouselOfImages.appendChild(imageElement);
        });

        carouselContainer.appendChild(carouselOfImages);
        imageContainer.appendChild(carouselContainer);
    
        
    // Retrieve and set code from Realtime Database
    realtimeDBRef.once("value").then(snapshot => {
        const code = snapshot.val();
        htmlEditor.value = code.html || "";
        cssEditor.value = code.css || "";
        jsEditor.value = code.js || "";
        updatePreview();
    }).catch(error => {
        console.error(error);
    });
} else {
    console.log("Presentation not found.");
}
}).catch(error => {
console.error(error);
});


// Get reference to the toggle-view checkbox
const toggleViewCheckbox = document.getElementById('toggle-view');

// Get reference to the sub-editor div
const subEditorDiv = document.querySelector('.r-editor');

// Get reference to the preview-pane element
const previewPane = document.querySelector('.preview-pane');

// Reference to the checkbox value in Firebase Realtime Database
const toggleViewRef = firebase.database().ref(`presentations/${presentationId}/toggleView`);

// Add event listener to the toggle-view checkbox
toggleViewCheckbox.addEventListener('change', function () {
    if (this.checked) {
        subEditorDiv.style.display = 'none'; // Hide the sub-editor div
        previewPane.style.width = '100%'; // Set width of preview-pane to 100%
        previewPane.requestFullscreen(); // Enter fullscreen mode
    } else {
        subEditorDiv.style.display = 'block'; // Show the sub-editor div
        previewPane.style.width = ''; // Reset width of preview-pane
        document.exitFullscreen(); // Exit fullscreen mode
    }

    // Update the checkbox value in Realtime Database
    toggleViewRef.set(this.checked)
        .then(() => {
            console.log('Checkbox value updated in Realtime Database.');
        })
        .catch(error => {
            console.error('Error updating checkbox value:', error);
        });
});

// Listen for changes in the checkbox value
toggleViewRef.on('value', snapshot => {
    const isChecked = snapshot.val();
    toggleViewCheckbox.checked = isChecked; // Update the checkbox state
    if (isChecked) {
        subEditorDiv.style.display = 'none';
        previewPane.style.width = '100%';
        previewPane.requestFullscreen(); // Enter fullscreen mode
    } else {
        subEditorDiv.style.display = 'block';
        previewPane.style.width = '';
        document.exitFullscreen(); // Exit fullscreen mode
    }
});



// Get references to editor elements
const htmlEditor = document.getElementById("htmlEditor");
const cssEditor = document.getElementById("cssEditor");
const jsEditor = document.getElementById("jsEditor");
const previewFrame = document.getElementById("previewFrame").contentWindow.document;

// Function to update preview
function updatePreview() {
    const htmlCode = htmlEditor.value;
    const cssCode = `<style>${cssEditor.value}</style>`;
    const jsCode = `<script>${jsEditor.value}</script>`;

    const combinedCode = `${cssCode}\n${htmlCode}\n${jsCode}`;
    previewFrame.open();
    previewFrame.write(combinedCode);
    previewFrame.close();
}

// Real-time synchronization with Firebase Realtime Database
const realtimeDBRef = firebase.database().ref(`presentations/${presentationId}/code`);

// Retrieve and sync code using Realtime Database
realtimeDBRef.on("value", snapshot => {
    const code = snapshot.val();
    // Only update if the code exists in the snapshot
    if (code) {
        htmlEditor.value = code.html || "";
        cssEditor.value = code.css || "";
        jsEditor.value = code.js || "";
        updatePreview();
    }
});

// Update Firebase Realtime Database as the user types in any editor
function updateCodeInDatabase() {
    const code = {
        html: htmlEditor.value,
        css: cssEditor.value,
        js: jsEditor.value
    };
    realtimeDBRef.set(code).catch(error => {
        console.error(error);
    });
    updatePreview(); // Update the preview when any editor input changes
}
htmlEditor.addEventListener("input", updateCodeInDatabase);
cssEditor.addEventListener("input", updateCodeInDatabase);
jsEditor.addEventListener("input", updateCodeInDatabase);




// Get references to chat elements
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");
const sendMessageButton = document.getElementById("sendMessageButton");

// Reference to the chat messages in Firebase Realtime Database
const chatRef = firebase.database().ref(`presentations/${presentationId}/chat`);

// Listen for new chat messages
chatRef.on("child_added", snapshot => {
    const messageData = snapshot.val();
    displayMessage(messageData);
});

// Display a chat message in the chat pane
function displayMessage(messageData) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chat-message");

    const senderName = document.createElement("span");
    senderName.textContent = messageData.displayName || "Anonymous";
    senderName.classList.add("chat-sender");

    const senderPhoto = document.createElement("img");
    senderPhoto.src = messageData.photoURL || 'https://cdn.dribbble.com/users/886705/screenshots/2551108/media/7eff1defd80ac44ec7e177fdd9b0115f.jpg?resize=768x576&vertical=center';
    senderPhoto.classList.add("chat-photo");

    const messageContent = document.createElement("span");
    messageContent.textContent = messageData.message;

    // Use regular expression to find URLs and replace them with anchor tags
    const urlRegex = /((http|https):\/\/[^\s]+)/g;
    const messageHTML = messageContent.textContent.replace(urlRegex, (url) => {
        return `<a class="url" href="${url}" target="_blank">${url}</a>`;
    });

    let messageHTMLWithDetails = `
    <div class="chat-details">
        <img class="chat-photo" src="${senderPhoto.src}">
        <p class="chat-sender">${senderName.textContent}</p>
    </div>
    <p class="chat-content">${messageHTML}</p>
    `;

    if (messageData.imageURL) {
        messageHTMLWithDetails += `
            <img src="${messageData.imageURL}" class="chat-image">
        `;
    }

    // Append sender photo and name before appending to messageDiv
    const chatDetailsDiv = document.createElement("div");
    chatDetailsDiv.innerHTML = messageHTMLWithDetails;
    messageDiv.appendChild(chatDetailsDiv);

    chatMessages.appendChild(messageDiv);
}


// Send chat message
sendMessageButton.addEventListener("click", () => {
    const user = auth.currentUser;

    if (user) {
        const message = messageInput.value;
        const displayName = user.displayName || "Anonymous";

        // Upload image if selected
        const imageFile = imageInput.files[0];
        if (imageFile) {
            const imageFileName = `${Date.now()}_${imageFile.name}`;
            const storageRef = storage.ref(`presentations/${presentationId}/chatImages/${imageFileName}`);
            storageRef.put(imageFile).then(snapshot => {
                snapshot.ref.getDownloadURL().then(url => {
                    // Send chat message with image URL
                    chatRef.push({
                        message: message,
                        displayName: displayName,
                        imageURL: url
                    });
                });
            });
        } else {
            // Send chat message without image
            chatRef.push({
                message: message,
                displayName: displayName
            });
        }

        // Clear input fields
        messageInput.value = "";
        imageInput.value = "";
    }
});
