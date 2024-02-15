// Function to retrieve all posts from Firestore
function getAllPosts() {
    const postsList = document.getElementById('postsList');
  
    // Clear existing posts from the list
    postsList.innerHTML = '';
  
    // Get all documents from the 'posts' collection
    db.collection('posts').get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const post = doc.data();
          const listItem = document.createElement('li');
          
          // Create a link to the post with post ID as a hash
          const postLink = document.createElement('a');
          postLink.href = `oct-project.html#${doc.id}`; // Assuming 'doc.id' is the post ID
          postLink.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <p>Username: ${post.username}</p>
            <img src="${post.photoURL}" alt="User Photo">
            <hr>
          `;
          listItem.appendChild(postLink);
          postsList.appendChild(listItem);
        });
      })
      .catch((error) => {
        console.error("Error getting documents: ", error);
      });
  }
  
  // Call function to retrieve all posts when the page loads
  getAllPosts();
  