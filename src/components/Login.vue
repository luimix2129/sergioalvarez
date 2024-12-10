<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const router = useRouter();

const validUsers = [
  { email: 'admin@sergioalvarez.com', password: '12345678', name: 'Sergio' },
  { email: 'franny_sanchez@sergioalvarez.com', password: '12345678', name: 'Franny Sanchez' }
];

const login = () => {
  const user = validUsers.find(u => u.email === email.value && u.password === password.value);
  
  if (user) {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', user.name);
    router.push('/');
  } else {
    errorMessage.value = 'Invalid email or password';
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-form">
      <img src="https://firebasestorage.googleapis.com/v0/b/telemontv-web.appspot.com/o/loser.jpg?alt=media&token=5b68ec34-197d-43e3-ad50-3bb07b5a6d2f" alt="Sergio Alvarez Logo" class="logo">
      <h1>Welcome Back</h1>
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" required placeholder="Enter your email">
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="password" required placeholder="Enter your password">
        </div>
        <div class="form-group">
          <a href="#" class="forgot-password">Forgot Password?</a>
        </div>
        <button type="submit" class="login-button">Log in</button>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      </form>
      <div class="google-signin">
        <button class="google-button">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo">
          Sign in with Google
        </button>
      </div>
      <p class="create-account">Not registered yet? <a href="#">Create an Account</a></p>
    </div>
    <div class="login-image">
      <div class="image-overlay">
        <h2>Te ayudamos a cumplir tu sueño de viajar.</h2>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  height: 100vh;
  font-family: 'Roboto', sans-serif;
}

.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: white;
}

.logo {
  width: 200px;
  height: auto;
  margin-bottom: 2rem;
  object-fit: contain;
}

h1 {
  font-size: 2rem;
  color: #091545;
  margin-bottom: 2rem;
}

.form-group {
  width: 100%;
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #091545;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.forgot-password {
  display: block;
  text-align: right;
  color: #091545;
  text-decoration: none;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #091545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.error-message {
  color: red;
  margin-top: 1rem;
}

.google-signin {
  margin-top: 1rem;
  width: 100%;
}

.google-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.google-button img {
  width: 18px;
  margin-right: 0.5rem;
}

.create-account {
  margin-top: 1rem;
  text-align: center;
}

.create-account a {
  color: #091545;
  text-decoration: none;
}

.login-image {
  flex: 1;
  background-image: url('https://firebasestorage.googleapis.com/v0/b/telemontv-web.appspot.com/o/ert.jpg?alt=media&token=1d3649e8-ae3f-484c-9a92-1cbe4c685999');
  background-size: cover;
  background-position: center;
  position: relative;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-overlay h2 {
  color: white;
  font-size: 2.5rem;
  text-align: center;
  padding: 1rem;
}
</style>