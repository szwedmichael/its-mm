import { useState, useEffect } from "react";
import api from "../api.js";
import "../styles/HomepageLogged.css";
import likeButton from "../images/like-button.png";

/*
This is the homepage for a logged in user
It is located at /home

DONE:
- get request for username
- get request for posts
- logout
- like or unlike post

IN PROGRESS:
- post request for posts (creating posts)
- authentication tokens ($$$)
*/
function HomepageLogged() {
  const [userName, setUserName] = useState("");

  // some mock posts
  const [posts, setPosts] = useState([]);

  // new post
  const [newPost, setNewPost] = useState({
    location: "",
    description: "",
    date: "",
  });

  useEffect(() => {
    // get request for username
    const fetchUserDetails = async () => {
      try {
        const response = await api.get("/user-details", {
          withCredentials: true,
        });
        if (response.data.username) {
          setUserName(response.data.username);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    // get request for posts
    const fetchPosts = async () => {
      try {
        const response = await api.get("/all-posts", { withCredentials: true });
        if (response.status === 200) {
          setPosts(response.data);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchUserDetails();
    fetchPosts();
  }, []);

  // logout
  const logout = async (event) => {
    event.preventDefault();
    try {
      await api.post("/logout", { withCredentials: true });
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // like or unlike post
  const likePost = async (postId) => {
    const data = {
      post_id: postId,
    };
    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        // updates on frontend
        const likedByUser = !post.likedByUser;
        const likes = likedByUser ? post.likes + 1 : post.likes - 1;
        return { ...post, likedByUser, likes };
      }
      return post;
    });
    setPosts(updatedPosts);

    // change request whether like or unlike
    const endpoint = updatedPosts.find((post) => post.id === postId).likedByUser
      ? "/like-post"
      : "/unlike-post";

    // send that post request (like-post or unlike-post)
    try {
      await api.post(endpoint, data);
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  // resets values after pressing post button
  const postReset = (event) => {
    const { name, value } = event.target;
    setNewPost({ ...newPost, [name]: value });
  };

  const handlePost = async (event) => {
    event.preventDefault();
    const postData = {
      post: newPost,
    };
    try {
      const response = await api.post("/add-post", newPost, {
        withCredentials: true,
      });
      const createdPost = response.data;
      setPosts([createdPost, ...posts]);
      setNewPost({ location: "", description: "", date: "" });
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  // posts {"location": "Buffalo, NY", "description": "I went to Niagara Falls and it was awesome", "date": MM/YYYY}
  return (
    <>
      <div className="homepage-welcome">
        <h1>Welcome, {userName}!</h1>
      </div>
      <div className="homepage-logout">
        <button onClick={logout}>Logout</button>
      </div>
      <div className="homepage-new-post">
        <h2>Create New Post</h2>
        <form onSubmit={handlePost}>
          <label>
            Location:
            <input
              type="text"
              name="location"
              value={newPost.location}
              onChange={postReset}
              placeholder="Enter your location here..."
            />
          </label>
          <label>
            Description:
            <textarea
              type="text"
              name="description"
              value={newPost.description}
              onChange={postReset}
              placeholder="Enter your description here..."
            />
          </label>
          <label>
            Date:
            <input
              type="text"
              name="date"
              value={newPost.date}
              onChange={postReset}
              placeholder="MM/YYYY"
            />
          </label>
          <button type="submit">Post</button>
        </form>
      </div>
      <div className="homepage-all-posts">
        <h1>Posts</h1>
        <ul>
          {posts.map((post) => (
            <li key={post.id} className="post">
              <h2>{post.username}</h2>
              <h4>{post.content.location}</h4>
              <p>{post.content.description}</p>
              <div className="post-date">{post.content.date}</div>
              <div className="like-section">
                <img
                  src={likeButton}
                  alt="Like"
                  onClick={() => likePost(post.id)}
                />
                <span className="like-count">{post.likes}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
export default HomepageLogged;
