// Listen for changes in authentication state
auth.onAuthStateChanged(user => {
    if (user) {
        const currentUserUid = user.uid;
        const userRef = db.collection('users').doc(currentUserUid);

        userRef.get().then(userDoc => {
            if (userDoc.exists) {
                const userData = userDoc.data();
                const photoURL = userData.photoURL || ''; // Assuming 'photoURL' is the field name in Firestore
                const coinBalance = userData.coinBalance || 0; // Assuming 'coinBalance' is the field name in Firestore

                // Set the favicon to the user's photo URL
                setFavicon(photoURL);
                const username = userData.username || 'Anonymous';
// Update the coinBalance div
const coinBalanceDiv = document.getElementById('coinBalance');
if (coinBalanceDiv) {
    coinBalanceDiv.textContent = `${coinBalance}`;
}
                // Set the title of the webpage to the username
                document.title = `${username}'s Presentations`;

                // Retrieve all presentations matching the user's UID from Firestore
                const userPresentationsRef = db.collection('presentations').where('uid', '==', currentUserUid);

                userPresentationsRef.get().then(querySnapshot => {
                    querySnapshot.forEach(presentationDoc => {
                        const presentationData = presentationDoc.data();
                        const presentationId = presentationDoc.id;
                        const title = presentationData.title || 'Untitled';
                        
                        // Revenue will be fetched from Realtime Database
                        const realtimeDatabaseRef = firebase.database().ref(`presentations/${presentationId}/revenue`);

                        realtimeDatabaseRef.once('value').then(snapshot => {
                            const revenue = snapshot.val() || 0; // Assuming 'revenue' is the field name in Realtime Database
                            generatePresentationCard(presentationId, title, revenue);
                        }).catch(error => {
                            console.error("Error fetching revenue from Realtime Database:", error);
                        });
                    });
                }).catch(error => {
                    console.error("Error fetching user's presentations from Firestore:", error);
                });

            } else {
                console.log("User data not found");
            }
        }).catch(error => {
            console.error("Error fetching user data:", error);
        });
    } else {
        // No user is signed in
        console.log("No user signed in");
        // Redirect the user to the login page
        window.location.href = '/login.html';
    }
});

// Function to generate the presentation cards
function generatePresentationCard(presentationId, title, price) {
    const cardContainer = document.getElementById('presentationCards');

    const article = document.createElement('article');
    article.classList.add('card');

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header');

    const divContent = document.createElement('div');

    const iconSpan = document.createElement('span');
    const iconImg = document.createElement('img');
    iconImg.src = '/images/lgo_unveil.png';
    iconSpan.appendChild(iconImg);

    const titleHeading = document.createElement('h3');
    titleHeading.textContent = title || 'Untitled'; // Assuming presentation has a title

    divContent.appendChild(iconSpan);
    divContent.appendChild(titleHeading);

    const toggleLabel = document.createElement('label');
    toggleLabel.classList.add('toggle');

    const toggleInput = document.createElement('input');
    toggleInput.setAttribute('type', 'checkbox');
    toggleInput.checked = true;

    const toggleSpan = document.createElement('span');
    toggleLabel.appendChild(toggleInput);
    toggleLabel.appendChild(toggleSpan);

    cardHeader.appendChild(divContent);
    cardHeader.appendChild(toggleLabel);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const priceParagraph = document.createElement('p');
    priceParagraph.textContent = price !== undefined && price !== null && price !== '' ? `Revenue: ${price}` : 'No revenue';

    cardBody.appendChild(priceParagraph);

    const cardFooter = document.createElement('div');
    cardFooter.classList.add('card-footer');

    const viewLink = document.createElement('a');
    viewLink.href = `/view/${presentationId}`;
    viewLink.textContent = 'View presentation';

    cardFooter.appendChild(viewLink);

    article.appendChild(cardHeader);
    article.appendChild(cardBody);
    article.appendChild(cardFooter);

    cardContainer.appendChild(article);
}



auth.onAuthStateChanged(user => {
    if (user) {
        const currentUserUid = user.uid;
        const userRef = db.collection('users').doc(currentUserUid);

        userRef.get().then(userDoc => {
            if (userDoc.exists) {
                const userData = userDoc.data();
                const photoURL = userData.photoURL || ''; // Assuming 'photoURL' is the field name in Firestore

                // Set the favicon to the user's photo URL
                setFavicon(photoURL);
                const username = userData.username || 'Anonymous';

                // Set the title of the webpage to the username
                document.title = `${username}'s Presentations`;
                // Rest of your code for retrieving user data and presentations
                // ...
            } else {
                console.log("User data not found");
            }
        }).catch(error => {
            console.error("Error fetching user data:", error);
        });
    } else {
        // No user is signed in
        console.log("No user signed in");
        // Redirect the user to the login page
        window.location.href = '/login.html';
    }
});
function setFavicon(photoURL) {
    const link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = photoURL; // Set the user's photo URL here

    // Remove existing favicon (if any)
    const existingFavicon = document.querySelector('link[rel="shortcut icon"]');
    if (existingFavicon) {
        document.head.removeChild(existingFavicon);
    }

    // Append the new favicon to the head of the document
    document.head.appendChild(link);
}