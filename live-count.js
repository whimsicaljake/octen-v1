// Your Firebase configuration
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
  
  // Get a reference to Firestore
  const db = firebase.firestore();
  
  // Function to fetch and display data
  function fetchData() {
    // Reference to 'users' collection in Firestore
    const usersRef = db.collection('users');
  
    // Fetch user count
    usersRef.get()
      .then(snapshot => {
        const userCount = snapshot.size;
        document.getElementById('userCount').textContent = userCount;
  
        // Triple the user count and get presentations count
        const tripleUserCount = userCount * 3;
        document.getElementById('moneyMade').textContent = tripleUserCount;
  
        // Reference to 'presentations' collection in Firestore
        const presentationsRef = db.collection('presentations');
  
        // Fetch presentation count
        presentationsRef.get()
          .then(snapshot => {
            const presentationCount = snapshot.size;
            document.getElementById('presentationCount').textContent = presentationCount;
  
            // Add presentation count to the tripled user count for 'money made'
            const moneyMade = tripleUserCount + presentationCount;
            document.getElementById('moneyMade').textContent = moneyMade;
          })
          .catch(error => {
            console.error("Error fetching presentations:", error);
          });
      })
      .catch(error => {
        console.error("Error fetching users:", error);
      });
  }
  
  // Call the fetchData function to display the data
  fetchData();
  