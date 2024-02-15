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

// Get the presentation ID from the URL path
const presentationId = extractPresentationIdFromPath();

// Check if presentationId is valid
if (!presentationId) {
    console.error('Invalid presentationId:', presentationId);
    // Handle the error or redirect the user to an error page
}

function extractPresentationIdFromPath() {
    // Example: If your path is "/presentations/abc123", this function should return "abc123"
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}
// Reference to the presentation document in Firestore
const presentationRef = db.collection('presentations').doc(presentationId);

// Function to update achievement based on user count
function updateAchievement(userCount) {
    const achievement = userCount === 1 ? 'Achievement first chat' :
        userCount === 100 ? 'Achievement hundred user' :
        userCount === 1000 ? 'Achievement mile' : null;

    if (achievement) {
        presentationRef.update({
                [achievement]: true
            })
            .then(() => {
                console.log(`Achievement "${achievement}" unlocked!`);
            })
            .catch((error) => {
                console.error('Error updating achievement:', error);
            });
    }
}
const presentationTitleElement = document.getElementById('presentationInfo'); // Assuming 'presentationTitle' is the ID of the element where you want to insert the HTML

// Retrieve presentation details to get the title
presentationRef.get().then((doc) => {
    if (doc.exists) {
        const presentationData = doc.data();
        const presentationTitle = presentationData.title || "Untitled Presentation";
        const presentationPrice = presentationData.price || "Free";

        // Update the page title
        document.title = `${presentationTitle} for N${presentationPrice}`;

        // Update metadata for sharing
        updateSharingMetadata(presentationTitle, presentationPrice);
        
         // Set HTML content in the presentationTitleElement
         presentationTitleElement.innerHTML = `<span>@${presentationData.username}</span><br> Is presenting <strong>${presentationTitle}</strong>`;

        } else {
        presentationTitleElement.innerHTML = "<em>Presentation Not Found</em>"; // Or handle accordingly if presentation doesn't exist
    }
}).catch((error) => {
    console.error(error);
});

function updateSharingMetadata(title, price) {
    // Update Open Graph metadata for sharing
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
        ogTitleTag.content = `${title} for N${price}`;
    }

    // Add/update other metadata tags as needed (e.g., og:description, og:image, etc.)
}

// Reference to the purchase container and purchase button
const purchaseContainer = document.querySelector('.purchase-container');
const purchaseButton = document.getElementById('purchaseButton');

// Function to update sales count and revenue in Firebase Realtime Database
function updateSalesAndRevenue(presentationPrice) {
    const salesRef = realtimeDB.ref(`presentations/${presentationId}/sales`);
    const revenueRef = realtimeDB.ref(`presentations/${presentationId}/revenue`);

    salesRef.transaction(currentSales => (currentSales || 0) + 1);
    revenueRef.transaction(currentRevenue => (currentRevenue || 0) + presentationPrice);
}

// Function to process the purchase logic
function processPurchase(presentationData, userData, presentationCreatorId) {
    const presentationPrice = presentationData.price || 0;
    console.log(`Presentation Price: ${presentationPrice > 0 ? presentationPrice : 'Free'}`);
    const user = auth.currentUser;

    if (!user || (presentationPrice > 0 && !userData.premiumPresentations?.includes(presentationId))) {
        // Clear the entire page to show the purchase container
        document.body.innerHTML = '';
        document.body.appendChild(purchaseContainer);
    // User is not logged in or hasn't purchased the presentation
    purchaseContainer.style.display = 'flex'; // Show the purchase container
    purchaseButton.innerHTML = 'Purchase presentation for a fee of N' + presentationData.price + '<i class="fa fa-shopping-cart"></i>';

    // Purchase button click event
    purchaseButton.addEventListener('click', () => {
      if (!user) {
        // Not logged in - Handle accordingly (redirect to login, etc.)
        console.log('User not logged in. Please log in to make a purchase.');
        window.location.href = `/login.html`;
        return;
      }

      // User is logged in - Proceed with purchase
      const currentUserUid = user.uid;
      const userRef = db.collection('users').doc(currentUserUid);
      const presentationOwnerUid = presentationData.uid;

      const userCoins = userData.coinBalance || 0;
      if (userCoins >= presentationPrice) {
        // Deduct the price from the user's coins
        const updatedCoins = userCoins - presentationPrice;

        // Deduct the price from the user's coins field
        userRef.update({ coinBalance: updatedCoins })
          .then(() => {
            // Add 80% of the price to the presentation owner's coins
            const ownerRef = db.collection('users').doc(presentationOwnerUid);

            ownerRef.get().then(ownerDoc => {
              const ownerData = ownerDoc.data();
              const ownerCoins = ownerData.coinBalance || 0;

              const addedToOwner = (presentationPrice * 0.8) + ownerCoins;

              // Update the owner's coins with the added amount
              ownerRef.update({ coinBalance: addedToOwner })
                .then(() => {
                  // Add the presentation to the user's premium presentations
                  const premiumPresentations = userData.premiumPresentations || [];
                  premiumPresentations.push(presentationId);

                  // Update the user's premium presentations list
                  userRef.update({ premiumPresentations: premiumPresentations })
                    .then(() => {
                      console.log('Purchase successful!');
                      // Hide the purchase container after successful purchase
                      purchaseContainer.style.display = 'none';
                      // Grant access or perform necessary action after successful purchase
                      // Display presentation details or anything else needed
                      console.log('Presentation Details:', presentationData);
                      updateSalesAndRevenue(presentationPrice);

                      // Notify the presentation owner about the purchase
                      notifyOwnerAboutPurchase(
                          presentationCreatorId,
                          presentationData.title || "Untitled Presentation", // Use presentationData.title or a default value
                          presentationPrice,
                          user.displayName || 'Anonymous'
                      );
                      notifyOwnerAboutPurchase(presentationData.uid, presentationData.title, presentationPrice, user.displayName || 'Anonymous');

                  
                    })
                    .catch(error => {
                      console.error('Error updating user data:', error);
                    });
                })
                .catch(error => {
                  console.error('Error updating owner data:', error);
                });
            }).catch(error => {
              console.error('Error fetching presentation owner data:', error);
            });
          })
          .catch(error => {
            console.error('Error updating user data:', error);
          });
      } else {
        // Not enough coins - Handle accordingly
        console.log('Insufficient coins!');
        alert("Insufficient coins. Price is " + presentationData.price);
        console.log("User's coin balance:", userCoins);
      }
    });
  } else {
    // User is logged in and has already purchased the presentation
    purchaseContainer.style.display = 'none'; // Hide the purchase container
    // Grant access or perform necessary action for purchased presentation
    // Display presentation details or anything else needed
    console.log('Presentation Details:', presentationData);
  }
}


function notifyOwnerAboutPurchase(presentationOwnerUid, title, price) {
    const ownerNotificationsRef = db.collection('users').doc(presentationOwnerUid).collection('notifications');

    const notificationMessage = `bought access to ${title} for ${price}`;

    ownerNotificationsRef.add({
        message: notificationMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Notification sent to the presentation owner.');
    })
    .catch((error) => {
        console.error('Error sending notification:', error);
    });
}





// Retrieve presentation details
db.collection("presentations").doc(presentationId).get().then(doc => {
    if (doc.exists) {
      const presentationData = doc.data();
  
      // Check if the presentation has a price greater than 0
      const user = auth.currentUser;
  
      if (user) {
        const currentUserUid = user.uid;
  
        const userRef = db.collection('users').doc(currentUserUid);
  
        // Check if the user has already purchased the presentation
        userRef.get().then(userDoc => {
          const userData = userDoc.data();
          processPurchase(presentationData, userData);
        }).catch(error => {
          console.error('Error fetching user data:', error);
        });
      } else {
        processPurchase(presentationData, {}); // Not logged in, show purchase container
      }
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


// Function to check if the current user is the creator
function isPresentationOwner(currentUser, presentationCreatorId) {
    return currentUser && currentUser.uid === presentationCreatorId;
}

// Function to check if the current user is the creator
function checkCurrentUserIsCreator(currentUser, presentationCreatorId) {
    const toggleViewCheckbox = document.getElementById('toggle-view');
    const privateModeDiv = document.querySelector('.private_mode');
    const isOwner = isPresentationOwner(currentUser, presentationCreatorId);

    // Add event listener to the toggle-view checkbox
    toggleViewCheckbox.addEventListener('change', function () {
        if (this.checked) {
            // Disable editing for others, except the presentation owner
            privateModeDiv.style.display = 'block';
        } else {
            // Enable editing for everyone
            privateModeDiv.style.display = 'none';
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

    // If the user is the presentation owner, always enable editing
    if (isOwner) {
        toggleViewCheckbox.checked = true;
        privateModeDiv.style.display = 'block';
    } else {
        // If the user is not the owner, initialize based on the toggle-view value
        toggleViewRef.once('value')
            .then(snapshot => {
                const isChecked = snapshot.val();
                toggleViewCheckbox.checked = isChecked;
                if (isChecked) {
                    // Disable editing for others, except the presentation owner
                    privateModeDiv.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching toggle-view value:', error);
            });
    }
}

// Assuming you have a function like this to check if the current user is the owner
function isPresentationOwner(currentUser, presentationCreatorId) {
    // Implement the logic to check if currentUser is the owner
    // Return true if currentUser is the owner; otherwise, return false
}





auth.onAuthStateChanged(user => {
    if (user) {
        // If the user is logged in, check if the user data exists in Firestore
        const currentUserUid = user.uid;
        const userRef = db.collection('users').doc(currentUserUid);

        userRef.get().then(userDoc => {
            if (userDoc.exists) {
                // User data exists, proceed with the rest of the page logic
                const currentUser = auth.currentUser;

                db.collection("presentations").doc(presentationId).get().then(doc => {
                    if (doc.exists) {
                        const presentationData = doc.data();

                        const presentationCreatorId = presentationData.uid;
                        checkCurrentUserIsCreator(currentUser, presentationCreatorId);

                        // Other code for displaying presentation details and more...
                       

                    } else {
                        console.log("Presentation not found.");
                    }
                }).catch(error => {
                    console.error(error);
                });

            } else {
                // User data doesn't exist in Firestore
                // Redirect or show a message as per your requirement
                // Create a div to display the message
                document.body.innerHTML = '';
                const errorMessageDiv = document.createElement('div');
                errorMessageDiv.innerHTML = "<p>You signed up from a browser which is not Chrome.</p><a href='/login.html'>First time login should be in chrome</a>";
                errorMessageDiv.classList = 'error';
                document.body.appendChild(errorMessageDiv);

               
            }
        }).catch(error => {
            console.error('Error fetching user data:', error);
        });
    } else {
        // Handle scenario when the user is not logged in
        // Example: Redirect to the login page
        window.location.href = '/login.html';
    }
});


function deleteAccount() {
    const user = auth.currentUser;

    if (user) {
        const currentUserUid = user.uid;
        const userRef = db.collection('users').doc(currentUserUid);

        // Check if the user has a Firestore document
        userRef.get()
            .then((docSnapshot) => {
                if (docSnapshot.exists) {
                    console.log('User has a Firestore document. Cannot delete account.');
                    // Handle the case where the user has a Firestore document
                } else {
                    // User doesn't have a Firestore document, proceed with deletion
                    // Delete the user's Firestore document
                    userRef.delete()
                        .then(() => {
                            console.log('User document deleted successfully.');

                            // Delete the user's account
                            user.delete()
                                .then(() => {
                                    console.log('User account deleted successfully.');
                                })
                                .catch((error) => {
                                    console.error('Error deleting user account:', error);
                                    // Handle account deletion error
                                });
                        })
                        .catch((error) => {
                            console.error('Error deleting user document:', error);
                            // Handle document deletion error
                        });
                }
            })
            .catch((error) => {
                console.error('Error checking user document:', error);
                // Handle document check error
            });
    } else {
        console.log('No user is currently signed in.');
    }
}







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


// Function to store user's UID and update achievements on chat
function storeUserAndChat() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const currentUserUid = user.uid;

            // Store user's UID if not already stored
            presentationRef.get().then((docSnapshot) => {
                const presentationData = docSnapshot.data();

                if (!presentationData.users || !presentationData.users.includes(currentUserUid)) {
                    presentationRef.update({
                            users: firebase.firestore.FieldValue.arrayUnion(currentUserUid)
                        })
                        .then(() => {
                            console.log('User stored:', currentUserUid);

                            // Get the current user count
                            const userCount = presentationData.users ? presentationData.users.length + 1 : 1;
                            updateAchievement(userCount);
                        })
                        .catch((error) => {
                            console.error('Error storing user:', error);
                        });
                }
            });
        }
    });
}

// Declare a variable to store presentation data
let presentationOwnerUid;
let presentationData;
// Retrieve presentation details
presentationRef.get().then((doc) => {
        if (doc.exists) {
            const presentationData = doc.data();
// Use presentationData.uid here
presentationOwnerUid = presentationData.uid;
            // Check if the presentation has a price greater than 0
            const user = auth.currentUser;

            if (user) {
                const currentUserUid = user.uid;

                const userRef = db.collection('users').doc(currentUserUid);

                // Check if the user has already purchased the presentation
                userRef.get().then((userDoc) => {
                    const userData = userDoc.data();
                    processPurchase(presentationData, userData);
                }).catch((error) => {
                    console.error('Error fetching user data:', error);
                });
            } else {
                processPurchase(presentationData, {}); // Not logged in, show purchase container
            }
        } else {
            console.log('Presentation not found.');
        }
    })
    .catch((error) => {
        console.error(error);
    });







// Get a reference to the Firebase Authentication service

// Assuming you have a Firestore collection called "presentations"
const presentationsCollection = firebase.firestore().collection('presentations');

// Authentication state observer
// Listen for authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        const currentUser = auth.currentUser;
        const deleteButtonContainer = document.querySelector('.navigator .delete-button-container');

        realtimeDB.ref(`presentations/${presentationId}/toggleView`).once('value').then(snapshot => {
            const toggleView = snapshot.val();

            if (toggleView !== true) {
                // If toggleView is not true, only the owner should have editing privilege
                db.collection("presentations").doc(presentationId).get().then(doc => {
                    if (doc.exists) {
                        const presentationData = doc.data();
                        const presentationCreatorId = presentationData.uid;

                        // Function to check if the current user is the creator
                        function isPresentationOwner(currentUser, presentationCreatorId) {
                            return currentUser && currentUser.uid === presentationCreatorId;
                        }

                        // Function to handle visibility and pointer events of the toggle-view label
                        function handleToggleViewLabel(currentUser, presentationCreatorId) {
                            const isOwner = isPresentationOwner(currentUser, presentationCreatorId);

                            // Add reference to the toggle-view label
                            const toggleViewLabel = document.querySelector('.toggle-view-label');
                            const textareas = document.querySelectorAll('textarea');
                            const detailsTags = document.querySelectorAll('details');

                            if (isOwner) {
                                // If the user is the presentation owner, proceed
                                if (!deleteButtonContainer) {
                                    // Create a delete button container
                                    const deleteButtonContainer = document.createElement('div');
                                    deleteButtonContainer.classList.add('delete-button-container');

                                    // Create a delete button
                                    const deleteButton = document.createElement('button');
                                    deleteButton.innerHTML = '<i class="fa-solid fa-trash-can-arrow-up"></i>';
                                    deleteButton.addEventListener('click', () => {
                                        // Add logic to handle presentation deletion
                                        // Call a function like deletePresentation() passing the presentationId
                                        deletePresentation();
                                    });

                                    // Append the delete button to the container
                                    deleteButtonContainer.appendChild(deleteButton);

                                    // Append the delete button container to the navigator div
                                    const navigatorDiv = document.querySelector('.navigator');
                                    navigatorDiv.appendChild(deleteButtonContainer);
                                }

                                toggleViewLabel.style.display = 'flex';
                                toggleViewLabel.style.pointerEvents = 'auto';
                                console.log('You are the owner!');

                                // Enable editing for the owner
                                textareas.forEach(textarea => {
                                    textarea.disabled = false;
                                    textarea.style.pointerEvents = 'auto';
                                });

                                // Enable details tags for the owner
                                detailsTags.forEach(detailsTag => {
                                    detailsTag.removeAttribute('disabled');
                                });
                            } else {
                                // If the user is not the owner, hide and disable the toggle-view label
                                toggleViewLabel.style.display = 'none';
                                toggleViewLabel.style.pointerEvents = 'none';
                                console.log('You are just a guest.');

                                // Disable textareas and set pointer events to none for guests
                                textareas.forEach(textarea => {
                                    textarea.disabled = true;
                                });

                                const saveversion = document.getElementById("saveVersionButton");
                                saveversion.disabled = true;
                                saveversion.style.pointerEvents = 'none';
                                saveversion.style.display = 'none';

                                // If the user is not the owner, remove the delete button if it exists
                                if (deleteButtonContainer) {
                                    deleteButtonContainer.remove();
                                }

                                // Observe changes in the DOM and apply modifications when details tags are added
                                const observer = new MutationObserver(() => {
                                    const detailsTags = document.querySelectorAll('details');
                                    detailsTags.forEach(detailsTag => {
                                        detailsTag.setAttribute('disabled', 'disabled');
                                        detailsTag.style.pointerEvents = 'none';
                                        const ul = detailsTag.querySelector('ul');
                                        if (ul) {
                                            ul.style.display = 'none';
                                        }
                                    });

                                    // Disconnect the observer after applying modifications
                                    observer.disconnect();
                                });

                                // Start observing the DOM for changes
                                observer.observe(document.body, { childList: true, subtree: true });
                            }
                        }

                        // Check and handle visibility and pointer events of toggle-view label
                        handleToggleViewLabel(currentUser, presentationCreatorId);

                        // Other code for displaying presentation details and more...
                        console.log('Presentation UID (Firestore):', presentationData.uid);
                        console.log('Your UID:', user.uid);
                    } else {
                        console.log("Presentation not found.");
                    }
                }).catch(error => {
                    console.error(error);
                });
            } else {
                // If toggleView is true, allow editing for everyone
                console.log('Toggle view is true. Allow editing for everyone.');
            }
        }).catch(error => {
            console.error(error);
        });
    } else {
        // Handle scenario when the user is not logged in
        console.log('User is not signed in. Redirecting to login page...');

        // Get the current path and hash, and set them as the return parameters
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        const returnUrl = encodeURIComponent(`${currentPath}${currentHash}`);

        window.location.href = `/login.html?returnTo=${returnUrl}`;
    }
});




// Function to delete the presentation
function deletePresentation() {
    // Ask for user confirmation
    const userConfirmed = confirm('Are you sure you want to delete this presentation?');

    if (userConfirmed) {
        // User confirmed, proceed with deletion

        // Delete presentation from Firestore
        db.collection("presentations").doc(presentationId).delete()
            .then(() => {
                console.log('Presentation deleted from Firestore successfully.');
            })
            .catch((error) => {
                console.error('Error deleting presentation from Firestore:', error);
            });

        // Delete presentation from Realtime Database
        realtimeDB.ref(`presentations/${presentationId}`).remove()
            .then(() => {
                console.log('Presentation deleted from Realtime Database successfully.');
            })
            .catch((error) => {
                console.error('Error deleting presentation from Realtime Database:', error);
            });

        // Add any additional logic or redirects as needed after deletion
    } else {
        // User canceled, do nothing or provide feedback
        console.log('Presentation deletion canceled by the user.');
    }
}





// Reference to the import button
const importButton = document.getElementById('importButton');

// Event listener for the import button click
importButton.addEventListener('click', () => {
    // Display an input prompt to get the external presentation ID
    const externalPresentationId = prompt('Enter External Presentation ID:');

    // Check if the input is not null or empty
    if (externalPresentationId) {
        // Check if the external presentation exists
        db.collection('presentations').doc(externalPresentationId).get()
            .then((externalDoc) => {
                if (externalDoc.exists) {
                    const externalPresentationData = externalDoc.data();

                    // Grant admin access to the owner of the external presentation
                    const externalOwnerUid = externalPresentationData.uid;

                    // Fetch CSS from Realtime Database linked to the external presentation ID
                    const externalCssRef = firebase.database().ref(`presentations/${externalPresentationId}/code/css`);
                    externalCssRef.once('value')
                        .then((snapshot) => {
                            const externalCss = snapshot.val();
                            if (externalCss) {
                                // Log the extracted CSS content
                                consoleExtractedCss(externalCss);

                                // Assuming you have a function to add CSS to the current presentation
                                addExternalCssToCurrentPresentation(externalCss);
                            } else {
                                console.log('CSS not found for the external presentation.');
                            }
                        })
                        .catch((error) => {
                            console.error('Error fetching CSS for the external presentation:', error);
                        });

                    // For simplicity, let's assume you have a function to grant admin access
                    grantAdminAccess(externalOwnerUid);

                    console.log(`Admin access granted to ${externalOwnerUid} for the external presentation.`);
                } else {
                    console.log('External presentation not found.');
                }
            })
            .catch((error) => {
                console.error('Error checking external presentation:', error);
            });
    }
});

// Function to add external CSS to the current presentation (replace this with your actual logic)
function addExternalCssToCurrentPresentation(externalCss) {
    // Fetch the current CSS from the Realtime Database
    const currentCssRef = realtimeDB.ref(`presentations/${presentationId}/code/css`);
    currentCssRef.once('value')
        .then((snapshot) => {
            const currentCss = snapshot.val();
            if (currentCss) {
                // Concatenate external CSS with the current CSS
                const updatedCss = currentCss + '\n' + externalCss;
                // Update the CSS in the current presentation's Realtime Database
                currentCssRef.set(updatedCss)
                    .then(() => {
                        console.log('External CSS added to the current presentation.');
                    })
                    .catch((error) => {
                        console.error('Error updating CSS for the current presentation:', error);
                    });
            } else {
                // If no current CSS exists, simply set the external CSS
                currentCssRef.set(externalCss)
                    .then(() => {
                        console.log('External CSS added to the current presentation.');
                    })
                    .catch((error) => {
                        console.error('Error updating CSS for the current presentation:', error);
                    });
            }
        })
        .catch((error) => {
            console.error('Error fetching current CSS for the current presentation:', error);
        });
}


// Function to log extracted CSS content
function consoleExtractedCss(cssContent) {
    console.log('Extracted CSS Content:', cssContent);
}






// Get the current hash from the URL
const currentHash = window.location.hash;

// Get the anchor element by its ID (replace 'yourAnchorId' with the actual ID)
const anchorElement = document.getElementById('fullpage');

// Set the href attribute of the anchor tag to the current hash
anchorElement.href = '/presentation_mode/full.html#'+presentationId;

const imageContainer = document.getElementById('imageContainer');

// Reference to the Firestore document for the current presentation
const presentationDoc = db.collection('presentations').doc(presentationId);

// Retrieve presentation details including the imageURL array
presentationDoc.get().then((doc) => {
    if (doc.exists) {
        const presentationData = doc.data();
        console.log('Presentation Data:', presentationData); // Log the entire presentation data

        // Check if the presentationData object is defined
        if (presentationData && presentationData.forked_from) {
            // Log the content of the forked_from field
            console.log('Forked from:', presentationData.forked_from);

            // Check if the navigator div is available
            const navigatorDiv = document.querySelector('.navigator');

           
           
        } else {
            console.log('Presentation Data or forked_from field is undefined.');
        }
        const imageUrls = presentationData.imageURLs;

        // Check if imageURLs array is available
        if (Array.isArray(imageUrls) && imageUrls.length > 0) {
            // Loop through each imageURL and create an image element for each
            imageUrls.forEach((imageUrl) => {
                // Create an image element and set its source to the current imageURL
                const imageElement = document.createElement('img');
                imageElement.src = imageUrl;

                // Append the image element to the imageContainer div
                imageContainer.appendChild(imageElement);
            });
        } else {
            console.log('ImageURLs not found or empty in presentation data.');
        }
    } else {
        console.log('Presentation not found.');
    }
}).catch((error) => {
    console.error('Error fetching presentation details:', error);
});






// Function to generate and download the zip file
async function downloadAll() {
    // Initialize JSZip
    const zip = new JSZip();

    // Add HTML, CSS, and JS files to the zip
    zip.file("index.html", htmlEditor.value);
    zip.file("index.css", cssEditor.value);
    zip.file("index.js", jsEditor.value);

    // Generate the zip file
    const blob = await zip.generateAsync({ type: "blob" });

    // Save the zip file
    saveAs(blob, "presentation_files.zip");
}

// Get reference to the downloadAll button
const downloadAllButton = document.getElementById('downloadAll');

// Event listener for the downloadAll button click
downloadAllButton.addEventListener('click', downloadAll);

// Reference to the versions data in Firebase Realtime Database
const versionsRef = realtimeDB.ref(`presentations/${presentationId}/versions`);

// Get a reference to the "Save Version" button
const saveVersionButton = document.getElementById("saveVersionButton");

// Function to replace invalid characters in the version name
function sanitizeVersionName(name) {
    return name.replace(/[\.\#\$\/\[\]]/g, "_");
}

function timeAgo(timestamp) {
    const currentDate = new Date();
    const previousDate = new Date(timestamp);
    const seconds = Math.floor((currentDate - previousDate) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }

    return 'just now';
}


// Function to save the current version
function saveCurrentVersionFunction(versionName) {
    // Get the user UID
    const userUID = auth.currentUser ? auth.currentUser.uid : null;

    // Create an object to store HTML, CSS, JS versions, and user UID
    const versionData = {
        html: {
            content: htmlEditor.value,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        },
        css: {
            content: cssEditor.value,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        },
        js: {
            content: jsEditor.value,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        },
        uid: userUID
    };

    // Store the entire version data under the specified version name
    versionsRef.child(versionName).set(versionData);
}

// Function to generate a random ID
function generateRandomId() {
    // Generate a random ID (replace this with your logic)
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Event listener for the "Save Version" button
saveVersionButton.addEventListener("click", () => {
    // Get the current count of versions
    versionsRef.once("value", (snapshot) => {
        const versionsCount = snapshot.numChildren();

        // Prompt user for a version name
        const versionNameInput = prompt("Enter a name for the version:");
        const versionName = sanitizeVersionName(versionNameInput || `v${versionsCount + 1}.0`);

        // Check if the version name already exists
        if (snapshot.child(versionName).exists()) {
            alert(`Version name "${versionName}" already exists. Please choose a different name.`);
            return;
        }

        // Get the user UID
        const userUID = auth.currentUser ? auth.currentUser.uid : null;

    

        // Log information about the saved version
        console.log(`Version "${versionName}" saved successfully.`);

        // Check if user is logged in
        if (userUID) {
            // Fetch user details from Firestore based on UID
            const userDocRef = db.collection('users').doc(userUID);

            userDocRef.get().then((userDoc) => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const userName = userData.displayName || 'Anonymous';
                    const userPhotoURL = userData.photoURL || 'default-photo-url';

                    // Now you have userName, userPhotoURL, and versionName available for use
                    console.log(`User: ${userName}, Photo URL: ${userPhotoURL}, Version Name: ${versionName}`);
                } else {
                    console.log('User document not found.');
                }
            }).catch((error) => {
                console.error('Error fetching user document:', error);
            });
        }

        // ... Rest of your existing code ...

    });
});




// Get a reference to the versions list div
const versionsListDiv = document.getElementById("versionsList");
let openDetails; // Variable to store the currently open details tag

function displayVersions(versions) {
    versionsListDiv.innerHTML = ""; // Clear existing content

    for (const [versionName, versionData] of Object.entries(versions)) {
        const versionTimestamp = versionData.html ? timeAgo(versionData.html.timestamp) : "N/A";
        const versionUid = versionData.uid || "Unknown";

        const versionDetails = document.createElement("details");
        const versionSummary = document.createElement("summary");

        // Fetch user details on page load
        const userUID = versionData.uid;
        if (userUID) {
            const userDocRef = db.collection('users').doc(userUID);

            userDocRef.get().then((userDoc) => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const userName = userData.displayName || 'Anonymous';
                    const userPhotoURL = userData.photoURL || 'default-photo-url';

                    // Display user details in the version summary
                    versionSummary.innerHTML = `<div><i class="fa-solid fa-code-compare"></i> ${versionName}  </div>  <div class="userdetails"><img class="user-image" src="${userPhotoURL}" alt="User Photo" style="width: 30px;">${userName}</div> <div>${versionTimestamp}</div> `;
                } else {
                    versionSummary.innerText = `${versionName} - ${versionTimestamp} - User: User document not found.`;
                }
            }).catch((error) => {
                versionSummary.innerText = `${versionName} - ${versionTimestamp} - User: Error fetching user document: ${error}`;
            });
        } else {
            versionSummary.innerText = `${versionName} - ${versionTimestamp} - User: User UID not available.`;
        }

        const versionList = document.createElement("ul");

        // HTML
        const htmlItem = document.createElement("li");
        const htmlRevertButton = document.createElement("button");
        htmlRevertButton.innerText = "Revert HTML to this version";
        htmlRevertButton.addEventListener("click", () => {
            // Revert content to the selected version
            htmlEditor.value = versionData.html ? versionData.html.content : "";
            console.log(`HTML content reverted to version ${versionName}`);
        });
        htmlItem.appendChild(htmlRevertButton);
        versionList.appendChild(htmlItem);

        // CSS
        const cssItem = document.createElement("li");
        const cssRevertButton = document.createElement("button");
        cssRevertButton.innerText = "Revert CSS to this version";
        cssRevertButton.addEventListener("click", () => {
            // Revert content to the selected version
            cssEditor.value = versionData.css ? versionData.css.content : "";
            console.log(`CSS content reverted to version ${versionName}`);
        });
        cssItem.appendChild(cssRevertButton);
        versionList.appendChild(cssItem);

        // JS
        const jsItem = document.createElement("li");
        const jsRevertButton = document.createElement("button");
        jsRevertButton.innerText = "Revert JS to this version";
        jsRevertButton.addEventListener("click", () => {
            // Revert content to the selected version
            jsEditor.value = versionData.js ? versionData.js.content : "";
            console.log(`JS content reverted to version ${versionName}`);
        });
        jsItem.appendChild(jsRevertButton);
        versionList.appendChild(jsItem);

        versionDetails.appendChild(versionSummary);
        versionDetails.appendChild(versionList);
        versionsListDiv.appendChild(versionDetails);

         // Add an event listener to close the previously open details tag
     versionDetails.addEventListener("click", () => {
        if (openDetails && openDetails !== versionDetails) {
            openDetails.removeAttribute("open");
        }
        openDetails = versionDetails;
    });
    }
    
}


// Event listener to fetch and display versions
versionsRef.on("value", (snapshot) => {
    const versions = snapshot.val();
    if (versions) {
        displayVersions(versions);
    }
});
















// Get references to chat elements
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");

const sendMessageButton = document.getElementById("sendMessageButton");

// Reference to the chat messages in Firebase Realtime Database
const chatRef = firebase.database().ref(`presentations/${presentationId}/chat`);

// Audio elements for incoming and outgoing messages
const incomingMessageSound = new Audio('/audio/message_received.wav');
const outgoingMessageSound = new Audio('/audio/sent.wav');


chatRef.on("child_added", snapshot => {
    const messageData = snapshot.val();
    messageData.key = snapshot.key; // Add this line to store the key in the messageData object
    // Play sound for incoming messages
    incomingMessageSound.play();
    displayMessage(messageData);
});


imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = "block";
        };

        reader.readAsDataURL(file);
    }
});

// Display a chat message in the chat pane
function displayMessage(messageData) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chat-message");
    messageDiv.id = messageData.key; // Set the id for easy retrieval

    const senderName = document.createElement("span");
    senderName.textContent = messageData.displayName || "Anonymous";
    senderName.classList.add("chat-sender");

    const senderPhoto = document.createElement("img");
    senderPhoto.src = messageData.photoURL || "https://cdn.dribbble.com/userupload/9304874/file/original-230e13271792b58a2a94a9e269b49b0b.png?resize=752x564";
    senderPhoto.classList.add("chat-photo");

    const messageContent = document.createElement("span");
    messageContent.textContent = messageData.message;

    // Use regular expression to find URLs and version tags and replace them with anchor tags and span elements
    const urlAndVersionTagRegex = /((http|https):\/\/[^\s]+)|(\/\w+)/g;
    const messageHTML = messageContent.textContent.replace(urlAndVersionTagRegex, match => {
        if (match.startsWith('/')) {
            return `<span class="version-tag">${match}</span>`;
        } else {
            return `<a class="url" href="${match}" target="_blank">${match}</a>`;
        }
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



// Check if the message is a reply and find the parent message
if (messageData.parentId) {
    const parentMessageDiv = document.getElementById(messageData.parentId);
    if (parentMessageDiv) {
        // Include parent message content in the reply container
        const parentMessageContent = parentMessageDiv.querySelector(".chat-content").innerHTML;
        const parentMessageContentDiv = document.createElement("div");
        parentMessageContentDiv.innerHTML = `<p class="reply-to">Replying to: ${parentMessageContent}</p>`;
        messageDiv.appendChild(parentMessageContentDiv);

        // Append the reply message to the parent message div
        parentMessageDiv.appendChild(messageDiv);
    } else {
        // If the parent message is not found, add it to the chatMessages directly
        chatMessages.appendChild(messageDiv);
    }
} else {
    // If it's not a reply, add it to the chatMessages directly
    chatMessages.appendChild(messageDiv);
}
// Append chatDetailsDiv to messageDiv
messageDiv.appendChild(chatDetailsDiv);
// Create a reply button
const replyButton = document.createElement("button");
replyButton.innerHTML = "<i class='fa fa-reply' aria-hidden='true'></i>";
replyButton.addEventListener("click", () => {
    showReplyForm(messageData);
});

const replyContainer = document.createElement("div");
replyContainer.classList.add("reply-container");
replyContainer.appendChild(replyButton);

// Append replyContainer after chatDetailsDiv
messageDiv.appendChild(replyContainer);

// Add the 'reply' class to all replies
if (messageData.parentId) {
    messageDiv.classList.add("reply");
}
// Check if the message is from the creator
const isCreatorMessage = messageData.isCreator || false;


  // Find the chat container
  const chatContainer = document.getElementById("chatMessages");


  if (chatContainer) {
    // Append the messageDiv to the chat container
    chatContainer.appendChild(messageDiv);

    // Scroll down to the last chat message
    chatContainer.scrollTop = chatContainer.scrollHeight;
} else {
    console.error("Chat container not found");
}
}
  // Check if the chat container is found
  // if (chatContainer) {
    // Append the messageDiv to the chat container based on whether it's from the creator
   // if (isCreatorMessage) {
        // If it's from the creator, insert at the beginning (top) of the chat container
    //    chatContainer.appendChild(messageDiv);
  //  } else {
        // If it's not from the creator, append it to the end (bottom) of the chat container
    //    chatContainer.prepend(messageDiv);
    //}

    // Scroll down to the last chat message
   // chatContainer.scrollTop = chatContainer.scrollHeight;
// } else {
  //  console.error("Chat container not found");
//}
//}

function showReplyForm(messageData) {
    const replyForm = document.createElement("div");
    replyForm.classList.add("reply-form");
    replyForm.innerHTML = `
        <p>Replying to: ${messageData.displayName}</p><br>
        <div class="reply-box">
        <input type='text' id="replyInput" placeholder="Type your reply...">
        </div>
        <button id="sendReplyButton"><i class="fa-solid fa-paper-plane"></i></button>
        <button id="cancelReplyButton">Cancel</button>
    `;

     // Attach event listener for sending the reply
     const sendReplyButton = replyForm.querySelector("#sendReplyButton");
     sendReplyButton.addEventListener("click", () => {
         sendReply(messageData, replyForm.querySelector("#replyInput").value);
         replyForm.remove();
     });
 
     // Attach event listener for canceling the reply
     const cancelReplyButton = replyForm.querySelector("#cancelReplyButton");
     cancelReplyButton.addEventListener("click", () => {
         replyForm.remove();
     });

    // Find the message container
    const messageContainer = document.getElementById(messageData.key);

    if (messageContainer) {
        // Append the reply form after the message container
        messageContainer.insertAdjacentElement('afterend', replyForm);
    } else {
        console.error("Message container not found for ID:", messageData.key);
    }
}


function sendReply(parentMessage, replyMessage) {
    const user = auth.currentUser;
    const photoURL = user.photoURL;
    if (user && parentMessage && parentMessage.key) {
        const displayName = user.displayName || "Anonymous";

        if (replyMessage.startsWith("/")) {
            handleVersionTag(replyMessage);
        } else {
            chatRef.push({
                message: replyMessage,
                displayName: displayName,
                photoURL: photoURL,
                parentId: parentMessage.key
            });
        }
    } else {
        console.error("Invalid parentMessage:", parentMessage);
    }
}

function handleVersionTag(taggedMessage) {
    const versionId = taggedMessage.substring(1); // Remove the "/" character
    const versionElement = document.getElementById(versionId);

    if (versionElement) {
        // Create a span element for the version tag
       
        versionElement.style.color = "#79b791"; // Apply the desired color

        }
}




// Send chat message
sendMessageButton.addEventListener("click", () => {
    const user = auth.currentUser;
    const parentId = null;
    if (user) {
        const message = messageInput.value;
        const displayName = user.displayName || "Anonymous";
        const photoURL = user.photoURL;
         // Check if the message is a request to GPT-3
         if (message.startsWith('@gpt')) {
            const gptQuestion = message.replace('@gpt', '').trim();
             // Send a specific message to Firebase indicating that GPT is down
             chatRef.push({
                message: 'GPT is currently unavailable. Please try again later.',
                displayName: 'System'
            });
        } else {
        // Upload image if selected
        const imageFile = imageInput.files[0];
        if (imageFile) {
            const imageFileName = `${Date.now()}_${imageFile.name}`;
            const storageRef = storage.ref(`presentations/${presentationId}/chatImages/${imageFileName}`);
            storageRef.put(imageFile).then(snapshot => {
                snapshot.ref.getDownloadURL().then(url => {
                    // Send chat message with image URL and parent ID
        chatRef.push({
            message: message,
            displayName: displayName,
            photoURL: photoURL,
            imageURL: url,
            parentId: parentId
        });
  // Play sound for outgoing messages
  outgoingMessageSound.play();

                    // Clear input fields and hide image preview
                    messageInput.value = "";
                    imageInput.value = "";
                    imagePreview.src = "";
                    imagePreview.style.display = "none";
                });
            });
        } else {
            // Send chat message without image
            chatRef.push({
                message: message,
                photoURL: photoURL,
                displayName: displayName
            });

  // Play sound for outgoing messages
  outgoingMessageSound.play();


            // Clear input fields and hide image preview
            messageInput.value = "";
            imageInput.value = "";
            imagePreview.src = "";
            imagePreview.style.display = "none";
        }
    }
    }
});

// Event listener for the message input
messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // Prevent the default behavior of Enter (submitting the form)

        // Check if the message input is not empty
        if (messageInput.value.trim() !== "") {
            // Trigger the send message button click event
            sendMessageButton.click();
        }
    }
    if (event.key === "/" && !event.shiftKey) {
        event.preventDefault();
        showVersionOptions();
    }
});




function showVersionOptions() {
    // Reference to the versions data in Firebase Realtime Database
    const versionsRef = realtimeDB.ref(`presentations/${presentationId}/versions`);

    // Fetch version IDs from the database
    versionsRef.once("value")
        .then((snapshot) => {
            const versionsData = snapshot.val();
            const versionIds = Object.keys(versionsData || []);

            // Prompt user to choose a version
            const selectedVersion = prompt("Choose a version: \n" + versionIds.join("\n"));

            if (selectedVersion && versionIds.includes(selectedVersion)) {
                const versionTag = `/${selectedVersion}`;
                // Insert the selected version tag into the message input
                insertTextAtCursor(messageInput, versionTag);
            }
        })
        .catch((error) => {
            console.error('Error fetching version IDs:', error);
        });
}


function insertTextAtCursor(input, text) {
    const startPos = input.selectionStart;
    const endPos = input.selectionEnd;
    const textBefore = input.value.substring(0, startPos);
    const textAfter = input.value.substring(endPos, input.value.length);
    input.value = textBefore + text + textAfter;
    input.focus();
    const newPosition = startPos + text.length;
    input.setSelectionRange(newPosition, newPosition);
}


let previousContent = ''; // Store previous content for undo

htmlEditor.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.shiftKey) {
        if (event.key === 'D') {
            event.preventDefault(); // Prevent the default behavior of the keyboard shortcut

            const lines = htmlEditor.value.split('\n');
            const caretPos = htmlEditor.selectionStart;
            const lineIndex = htmlEditor.value.substr(0, caretPos).split('\n').length - 1;

            if (lineIndex >= 0 && lineIndex < lines.length) {
                // Duplicate the selected line
                const duplicatedLine = lines[lineIndex];
                lines.splice(lineIndex + 1, 0, duplicatedLine);

                // Update the textarea content
                previousContent = htmlEditor.value;
                htmlEditor.value = lines.join('\n');

                // Move the caret to the next line
                const newCaretPos = caretPos + duplicatedLine.length + 1;
                htmlEditor.setSelectionRange(newCaretPos, newCaretPos);
            }
        } else if (event.key === 'K') {
            event.preventDefault(); // Prevent the default behavior of the keyboard shortcut

            const lines = htmlEditor.value.split('\n');
            const caretPos = htmlEditor.selectionStart;
            const lineIndex = htmlEditor.value.substr(0, caretPos).split('\n').length - 1;

            if (lineIndex >= 0 && lineIndex < lines.length) {
                // Remove the selected line
                lines.splice(lineIndex, 1);

                // Update the textarea content
                previousContent = htmlEditor.value;
                htmlEditor.value = lines.join('\n');
            }
        }
    }
});
  storeUserAndChat();

  const forkButton = document.getElementById('fork');

  if (forkButton) {
      forkButton.addEventListener('click', async () => {
          try {
              // Ensure presentation data is available
              const presentationSnapshot = await db.collection('presentations').doc(presentationId).get();
              if (!presentationSnapshot.exists) {
                  console.error('Presentation not found.');
                  return;
              }
  
              const presentationData = presentationSnapshot.data();
  
              const isConfirmed = confirm('Do you want to fork this project?');
  
              if (isConfirmed) {
                  // Copy information from the existing presentation in Realtime Database
                  const clonedPresentationData = {
                      uid: auth.currentUser.uid,
                  };
                  const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
                 
                      const userData = userDoc.data();
                      const username = userData.username;
                     // Fetch owner's ID from the presentation data
const ownerID = presentationData.uid;
                      // No Copy information specific to the user (uid, displayName, etc.)
                  const userSpecificInfo = {
                      uid: auth.currentUser.uid,
                      displayName: auth.currentUser.displayName,
                      photoURL: auth.currentUser.photoURL,
                      forked_from: presentationId,
                      username: username,
                      owner: ownerID,
                      // Add other user-specific details as needed
                      // ...
                    };
               
  
                  // Combine the cloned presentation data
                  let forkedTitle = document.title + ' forked';
                  let forkedPresentationId = `forked_${presentationId}`;
  
                  // Check if the forked ID already exists, if yes, append a number
                  let counter = 1;
                  while (await presentationExists(forkedPresentationId)) {
                      forkedTitle = document.title + ` forked ${counter}`;
                      forkedPresentationId = `forked${counter < 10 ? '0' : ''}${counter}_${presentationId}`;
                      counter++;
                  }
  
                  const clonedPresentation = {
                      ...clonedPresentationData,
                      ...userSpecificInfo,
                      title: forkedTitle,
                      // Add other details as needed
                      // ...
                  };
  
                  // Clone presentation data in Realtime Database
                  await realtimeDB.ref(`presentations/${forkedPresentationId}`).set(clonedPresentationData);
  
                  // Fetch and clone the "code" folder from Realtime Database
                  const codeFolderSnapshot = await realtimeDB.ref(`presentations/${presentationId}/code`).once('value');
                  const codeFolder = codeFolderSnapshot.val();
                  await realtimeDB.ref(`presentations/${forkedPresentationId}/code`).set(codeFolder);
  
                  // Clone presentation data in Firestore
                  await db.collection('presentations').doc(forkedPresentationId).set(clonedPresentation);
  
                  // Fetch and clone the "code" folder from Firestore
                  const codeCollectionSnapshot = await db.collection('presentations').doc(presentationId).collection('code').get();
                  codeCollectionSnapshot.forEach((doc) => {
                      const fileData = doc.data();
                      db.collection('presentations').doc(forkedPresentationId).collection('code').doc(doc.id).set(fileData);
                  });
               

 // Fetch and clone the "imageURLs" folder from Firestore
const imageURLsCollectionRef = db.collection('presentations').doc(presentationId).collection('imageURLs');
const imageURLsCollectionSnapshot = await imageURLsCollectionRef.get();

// Log the number of documents found in the "imageURLs" sub-collection
console.log('Number of imageURLs documents:', imageURLsCollectionSnapshot.size);

// Loop through the documents and directly copy them to the "imageURLs" collection of the forked presentation in Firestore
const batch = db.batch();

imageURLsCollectionSnapshot.forEach((doc) => {
    const imageData = doc.data();
    console.log('Cloning image data:', imageData); // Log the image data for debugging

    // Create a new document in the "imageURLs" collection for the forked presentation
    const newDocRef = db.collection('presentations').doc(forkedPresentationId).collection('imageURLs').doc();

    // Add the document data to the batch
    batch.set(newDocRef, imageData);
});

// Commit the batch to Firestore
await batch.commit();

console.log('ImageURLs cloned successfully.');


                  console.log('Presentation forked successfully.');
                  console.log('Forked Presentation ID:', forkedPresentationId);
              }
          } catch (error) {
              console.error('Error while forking presentation:', error);
          }
      });
  }
  
  async function presentationExists(presentationId) {
      const presentationSnapshot = await db.collection('presentations').doc(presentationId).get();
      return presentationSnapshot.exists;
  }
  
  