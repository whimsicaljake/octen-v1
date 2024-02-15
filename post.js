// Initialize Quill editor
const quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Write something...'
  });
  
  // Function to create a post
  function createPost() {
    const postTitle = document.getElementById('postTitle').value;
    const postContent = quill.root.innerHTML; // Get HTML content from Quill editor
    const file = document.getElementById('fileInput').files[0];
  
    // Get currently signed-in user
    const currentUser = firebase.auth().currentUser;
  
    if (currentUser) {
      const { displayName, photoURL } = currentUser;
  
      // Save post data to Firestore
      db.collection('posts')
        .add({
          title: postTitle,
          content: postContent,
          file: file ? file.name : null,
          // Use currently signed-in user's information
          username: generateUsername(displayName),
          name: displayName,
          photoURL: photoURL || "https://example.com/default-user.jpg" // Use a default image if photoURL is not available
        })
        .then((docRef) => {
          console.log("Post written with ID: ", docRef.id);
          // Reset fields after successful submission
          document.getElementById('postTitle').value = '';
          quill.root.innerHTML = '';
          document.getElementById('fileInput').value = '';
        })
        .catch((error) => {
          console.error("Error adding document: ", error);
        });
    } else {
      console.log('No user signed in.');
    }
  }
  
  // Function to generate a unique username based on display name
  function generateUsername(displayName) {
    // Implement your logic to generate a unique username from the display name
    // For simplicity, a basic approach is used here (you may want a more robust method)
    return displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
  }
  