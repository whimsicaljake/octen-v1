var firebaseConfig = {
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

// Function to get Firestore details of the current user
function getUserDetails() {
    // Check for changes in authentication state
    firebase.auth().onAuthStateChanged(function(currentUser) {
        // Check if there is a logged-in user
        if (currentUser) {
            var firestore = firebase.firestore();
            var usersCollection = firestore.collection('users');

            console.log('Attempting to get Firestore details for user:', currentUser.uid);

            usersCollection.doc(currentUser.uid).get().then(function(doc) {
                if (doc.exists) {
                    console.log('Firestore details of the current user:', doc.data());
                } else {
                    console.warn('No Firestore details found for the current user.');
                }
            }).catch(function(error) {
                console.error('Error getting Firestore details:', error);
            });
        } else {
            console.warn('No user is currently logged in.');
        }
    });
}

// Example usage:
// Call getUserDetails wherever you need to retrieve and log the Firestore details
getUserDetails();

    // Function to initiate Paystack payment
    function initiatePayment() {
        var coinAmountInput = document.getElementById('coinAmount');
        var coinAmount = parseInt(coinAmountInput.value);

        // Ensure a valid coin amount is entered
        if (isNaN(coinAmount) || coinAmount <= 0) {
            alert('Please enter a valid coin amount.');
            return;
        }

        // Replace with your Paystack public key
        var publicKey = 'pk_live_22fd10cc51cd5a71eb3a388a15498e543ebbdef2';

        // Get the email from the user through a prompt
        var userEmail = prompt('Please enter your email:');
        
        // Ensure a valid email is entered
        if (!isValidEmail(userEmail)) {
            alert('Please enter a valid email address.');
            return;
        }

        // Calculate the charge based on the coin amount (assumes 1 coin = 1 Naira)
        var amountInKobo = coinAmount * 100;

        // Initialize Paystack
        var handler = PaystackPop.setup({
            key: publicKey,
            email: userEmail,
            amount: amountInKobo,
            currency: 'NGN',
            ref: 'paystack_coin_purchase_' + Math.floor((Math.random() * 1000000000) + 1),
            callback: function(response) {
                handlePaymentSuccess(response.reference, coinAmount);
            },
            onClose: function() {
                console.log('Payment closed');
            }
        });

        // Open Paystack dialog
        handler.openIframe();
    }

   // Function to handle payment success
function handlePaymentSuccess(paymentReference, purchasedCoins) {
    var currentUser = firebase.auth().currentUser;

    // Check if there is a logged-in user
    if (currentUser) {
        var currentUserUID = currentUser.uid;

        // Update the user's coin balance in Firestore
        var firestore = firebase.firestore();
        var usersCollection = firestore.collection('users');

        // Use set with merge:true to update the existing document or create a new one if not exists
        usersCollection.doc(currentUserUID).set({
            coinBalance: firebase.firestore.FieldValue.increment(purchasedCoins)
        }, { merge: true })
        .then(function() {
            console.log('Firestore update completed successfully!');
        })
        .catch(function(error) {
            console.error('Error updating Firestore:', error);
        });

        console.log('Payment successful! Reference: ' + paymentReference);
    } else {
        console.warn('No user is currently logged in.');
    }
}


    function isValidEmail(email) {
        // A simple email validation check
        // You may want to implement a more robust email validation
        return /\S+@\S+\.\S+/.test(email);
    }
