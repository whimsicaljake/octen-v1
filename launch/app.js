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
const realtimeDB = firebase.database();

// Check if the user is already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
      // User is logged in already
      console.log('User is logged in already:', user.displayName);
      document.getElementById('loginDiv').style.display = 'none';
      document.getElementById('appDiv').style.display = 'block';
      showChats();
    }
  });

// Google Sign-In
function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((result) => {
        const user = result.user;
        // Once authenticated, show the appDiv and load user chats
        document.getElementById('loginDiv').style.display = 'none';
        document.getElementById('appDiv').style.display = 'block';
        showChats();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
  
// Show user chats
function showChats() {
    const userList = document.getElementById('userList');
    userList.innerHTML = ''; // Clear previous list

    // Fetch the list of friends for the current user using Firestore
    const currentUser = auth.currentUser;
    db.collection('users').doc(currentUser.uid).collection('friends').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const friendData = doc.data();
                const friendId = friendData.targetUserId;
                const friendName = friendData.targetUserName;

                const listItem = document.createElement('li');
                listItem.textContent = friendName;
                listItem.onclick = () => openChat(friendId, friendName);
                userList.appendChild(listItem);
            });
        })
        .catch((error) => {
            console.error(error.message);
        });
}


  
// Open an individual chat
function openChat(userId, userName) {
    clearPage(); // Clear the entire page
    const chatHeader = document.getElementById('chatHeader');
    const messagesDiv = document.getElementById('messages');
    const individualChatDiv = document.getElementById('individualChat');

    // Set chat header with the user's name
    chatHeader.textContent = `Chat with: ${userName}`;

    // Show the individual chat div and hide other elements
    document.getElementById('chatDisplay').style.display = 'none';
    individualChatDiv.style.display = 'block';

    // Fetch and display messages for the selected user using Firestore
    const currentUser = auth.currentUser;
    const chatId = getChatId(currentUser.uid, userId);

    db.collection('chats').doc(chatId).collection('messages').orderBy('timestamp').onSnapshot((snapshot) => {
        messagesDiv.innerHTML = ''; // Clear previous messages
        snapshot.forEach((doc) => {
            const message = doc.data();
            displayMessage(message);
        });
    });

    // Set up event listener for the "Go Back" button
    document.querySelector('#individualChat header button').onclick = () => {
        individualChatDiv.style.display = 'none';
        document.getElementById('chatDisplay').style.display = 'block';
    };
}

  
// Helper function to generate a unique chat ID
function getChatId(userId1, userId2) {
    return userId1 < userId2 ? userId1 + '_' + userId2 : userId2 + '_' + userId1;
}

// Send a message with optional media file
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');
    const currentUser = auth.currentUser;
    const chatHeader = document.getElementById('chatHeader');
    const recipientUserId = getUserIdFromHeader(chatHeader.textContent);

    if (recipientUserId) {
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();

        // Determine message type based on the presence of a file
        let messageType = 'text';
        let messageContent = messageInput.value.trim();

        try {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const storageRef = firebase.storage().ref('media/' + recipientUserId + '/' + file.name);

                storageRef.put(file).then((snapshot) => {
                    // File uploaded successfully
                    snapshot.ref.getDownloadURL().then((downloadURL) => {
                        // Determine the file type and set the message content
                        if (file.type.startsWith('image')) {
                            messageType = 'image';
                        } else if (file.type.startsWith('video')) {
                            messageType = 'video';
                        } else if (file.type.startsWith('audio')) {
                            messageType = 'audio';
                        }

                        messageContent = downloadURL;

                        // Get or create a chat ID
                        const chatId = getChatId(currentUser.uid, recipientUserId);

                        // Save the message to the recipient's UID under the "chats" folder with the correct chatId
                        saveMessageToFirestore(currentUser.uid, currentUser.displayName, recipientUserId, messageType, messageContent, timestamp, chatId);

                        // Save the message to the sender's UID under the "chats" folder with the correct chatId
                        saveMessageToFirestore(recipientUserId, currentUser.displayName, recipientUserId, messageType, messageContent, timestamp, chatId);

                        // Clear the message input and file input
                        messageInput.value = '';
                        fileInput.value = '';
                    });
                });
            } else {
                // Get or create a chat ID
                const chatId = getChatId(currentUser.uid, recipientUserId);

                // Save the message to the recipient's UID under the "chats" folder with the correct chatId for text messages
                saveMessageToFirestore(currentUser.uid, currentUser.displayName, recipientUserId, messageType, messageContent, timestamp, chatId);

                // Save the message to the sender's UID under the "chats" folder with the correct chatId for text messages
                saveMessageToFirestore(recipientUserId, currentUser.displayName, recipientUserId, messageType, messageContent, timestamp, chatId);

                // Clear the message input
                messageInput.value = '';
            }
        } catch (error) {
            console.error('Error sending message:', error.message);
            // You can add further error handling or UI feedback here
        }
    }
}

function saveMessageToFirestore(senderId, senderName, recipientId, type, content, timestamp, chatId) {
    // Save the message to the recipient's UID under the "chats" folder with the correct chatId
    db.collection('users').doc(recipientId).collection('chats').doc(chatId).collection('messages').add({
        senderId: senderId,
        senderName: senderName,
        timestamp: timestamp,
        type: type,
        content: content
    }).then(() => {
        console.log('Message saved to recipient Firestore successfully!');
    }).catch((error) => {
        console.error('Error saving message to recipient Firestore:', error.message);
    });
}



function saveMessageToFirestore(senderId, senderName, recipientId, type, content, timestamp, chatId) {

    // Save the message to the sender's Firestore
    db.collection('users').doc(senderId).collection('chats').doc(chatId).collection('messages').add({
        senderId: senderId,
        senderName: senderName,
        timestamp: timestamp,
        type: type,
        content: content
    }).then(() => {
        console.log('Message saved to sender Firestore successfully!');
    }).catch((error) => {
        console.error('Error saving message to sender Firestore:', error.message);
    });

    // Save the message to the recipient's Firestore
    db.collection('users').doc(recipientId).collection('chats').doc(chatId).collection('messages').add({
        senderId: senderId,
        senderName: senderName,
        timestamp: timestamp,
        type: type,
        content: content
    }).then(() => {
        console.log('Message saved to recipient Firestore successfully!');
    }).catch((error) => {
        console.error('Error saving message to recipient Firestore:', error.message);
    });
}



  
  // Display a message in the chat window
  function displayMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
  
    // Identify the message type and display accordingly
    switch (message.type) {
      case 'text':
        messageElement.textContent = `${message.senderName}: ${message.content}`;
        break;
      case 'image':
        messageElement.innerHTML = `${message.senderName}: <img src="${message.content}" alt="Image">`;
        break;
      case 'video':
        messageElement.innerHTML = `${message.senderName}: <video controls><source src="${message.content}" type="video/mp4"></video>`;
        break;
      case 'audio':
        messageElement.innerHTML = `${message.senderName}: <audio controls><source src="${message.content}" type="audio/mp3"></audio>`;
        break;
      default:
        break;
    }
  
    messagesDiv.appendChild(messageElement);
  }
  
 // Helper function to generate a unique chat ID
function getChatId(userId1, userId2) {
    return userId1 < userId2 ? userId1 + '_' + userId2 : userId2 + '_' + userId1;
}
  
  // Helper function to extract the user ID from the chat header
  function getUserIdFromHeader(headerText) {
    // Assuming the header format is "Chat with: [USER_NAME]"
    const regex = /Chat with: (.+)/;
    const match = headerText.match(regex);
    return match ? match[1] : null;
  }
  

 
// Show other tab2 - All users and send requests
function showOtherTab2() {
    const userList2 = document.getElementById('userList2'); // Change ID here
    userList2.innerHTML = ''; // Clear previous list

    // Fetch all users from Firestore
    db.collection('users').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const userId = doc.id;

                // Exclude the current user from the list
                if (userId !== auth.currentUser.uid) {
                    const userName = userData.displayName;

                    const listItem = document.createElement('li');

                    // Fetch user image
                    const userImage = userData.photoURL; // replace 'picture' with the actual field name
                    const imageElement = document.createElement('img');
                    imageElement.src = userImage;
                    imageElement.alt = userName;
                    listItem.appendChild(imageElement);

                    // Display user name
                    const nameElement = document.createElement('span');
                    nameElement.textContent = userName;
                    listItem.appendChild(nameElement);

                    // Button to send a request
                    const sendRequestButton = document.createElement('button');
                    sendRequestButton.textContent = 'Send Request';
                    sendRequestButton.onclick = () => sendRequest(userId, userName);
                    listItem.appendChild(sendRequestButton);

                    userList2.appendChild(listItem); // Change ID here
                }
            });
        })
        .catch((error) => {
            console.error(error.message);
        });
}

  
  
 // Send a friend request and store it in Firestore
function sendRequest(targetUserId, targetUserName) {
    const currentUser = auth.currentUser;

    // Add the request to the target user's requests in Firestore
    db.collection('users').doc(targetUserId).collection('requests').doc(currentUser.uid).set({
        senderUserId: currentUser.uid,
        senderUserName: currentUser.displayName,
        targetUserId: currentUser.uid,
        targetUserName: currentUser.displayName
    })
        .then(() => {
            console.log('Friend request sent successfully!');
        })
        .catch((error) => {
            console.error(error.message);
        });
}

  
  // Show other tab1 - Display requests
  function showOtherTab1() {
    const userList = document.getElementById('userList');
    userList.innerHTML = ''; // Clear previous list
  
    // Fetch friend requests for the current user from Firestore
    const currentUser = auth.currentUser;
    db.collection('users').doc(currentUser.uid).collection('requests').get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const requestData = doc.data();
          const requestId = doc.id;
  
          const userName = requestData.targetUserName;
  
          const listItem = document.createElement('li');
          listItem.textContent = userName;
  
          // Button to accept the request
          const acceptButton = document.createElement('button');
          acceptButton.textContent = 'Accept';
          acceptButton.onclick = () => acceptRequest(requestId, requestData.targetUserId, userName);
          listItem.appendChild(acceptButton);
  
          userList.appendChild(listItem);
        });
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
  
// Show other tab1 - Display requests
function showOtherTab1() {
    const userList1 = document.getElementById('userList1'); // Change ID here
    userList1.innerHTML = ''; // Clear previous list

    // Fetch friend requests sent to the current user from Firestore
    const currentUser = auth.currentUser;
    db.collection('users').doc(currentUser.uid).collection('requests').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const requestData = doc.data();
                const requestId = doc.id;

                const userName = requestData.targetUserName;

                const listItem = document.createElement('li');
                listItem.textContent = userName;

                // Button to accept the request
                const acceptButton = document.createElement('button');
                acceptButton.textContent = 'Accept';
                acceptButton.onclick = () => acceptRequest(requestId, requestData.senderUserId, userName);
                listItem.appendChild(acceptButton);

                userList1.appendChild(listItem); // Change ID here
            });
        })
        .catch((error) => {
            console.error(error.message);
        });
}


  
// Function to add a chat to the list of the person's chat
function addChatToUser(targetUserId, targetUserName) {
    const currentUser = auth.currentUser;
  
    // Get or create a chat ID
    const chatId = getChatId(currentUser.uid, targetUserId);
  
    // Add the chat to the list of the current user's chats in Firestore
    db.collection('users').doc(currentUser.uid).collection('chats').doc(targetUserId).set({
        targetUserId: targetUserId,
        targetUserName: targetUserName,
        chatId: chatId
    })
    .then(() => {
        console.log('Chat added to the current user\'s list successfully!');
        
        // Add the chat to the list of the target user's chats
        db.collection('users').doc(targetUserId).collection('chats').doc(currentUser.uid).set({
            targetUserId: currentUser.uid,
            targetUserName: currentUser.displayName,
            chatId: chatId
        })
        .then(() => {
            console.log('Chat added to the target user\'s list successfully!');
        })
        .catch((error) => {
            console.error('Error adding chat to the target user\'s list:', error.message);
        });
    })
    .catch((error) => {
        console.error('Error adding chat to the current user\'s list:', error.message);
    });
}

// Accept a friend request and update Firestore
function acceptRequest(requestId, targetUserId, targetUserName) {
    const currentUser = auth.currentUser;

    // Add the target user to the current user's friends list in Firestore
    db.collection('users').doc(currentUser.uid).collection('friends').doc(targetUserId).set({
        targetUserId: targetUserId,
        targetUserName: targetUserName
    })
    .then(() => {
        // Remove the request from the current user's requests in Firestore
        db.collection('users').doc(currentUser.uid).collection('requests').doc(requestId).delete()
        .then(() => {
            console.log('Friend request accepted successfully!');

            // Add the current user as a friend to the target user
            db.collection('users').doc(targetUserId).collection('friends').doc(currentUser.uid).set({
                targetUserId: currentUser.uid,
                targetUserName: currentUser.displayName
            })
            .then(() => {
                console.log('Current user added as a friend to the target user successfully!');

                // Automatically add the chat to the list of the person's chat for both users
                addChatToUser(targetUserId, targetUserName);
                
                // Refresh the requests list
                showOtherTab1();
            })
            .catch((error) => {
                console.error('Error adding current user as a friend to the target user:', error.message);
            });
        })
        .catch((error) => {
            console.error('Error removing request from current user\'s requests:', error.message);
        });
    })
    .catch((error) => {
        console.error('Error adding the target user to the current user\'s friends list:', error.message);
    });
}


// Helper function to clear the entire page
function clearPage() {
    document.getElementById('chatDisplay').style.display = 'none';
    document.getElementById('individualChat').style.display = 'none';
    // Add other elements you want to hide or clear here
}

  
  