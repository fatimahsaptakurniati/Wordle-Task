let dictionary = "";
const state = {
  grid: Array(6).fill().map(() => Array(5).fill('')),
  currentRow: 0,
  currentCol: 0,
  secret: '',
  username: '', // To store the username
};

function createLoginForm() {
  const container = document.getElementById('game');
  container.innerHTML = ''; // Bersihkan kontainer

  // Hapus tombol logout jika ada
  const logoutContainer = document.getElementById('logOut');
  if (logoutContainer) {
    logoutContainer.innerHTML = ''; // Bersihkan elemen logout
  }

  // Buat form login
  container.innerHTML = `
    <form id="login-form">
      <h1>Wellcome to Wordle!</h1>
      <p>Username</p>
      <input type="text" id="username" placeholder="Username" required />
      <p>Password</p>
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  `;

  const form = document.getElementById('login-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    login(username, password); // Panggil login
  });
}


async function login(username, password) {
  try {
    const response = await fetch('https://delta-indie.vercel.app/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Login successful:", data);

    // Simpan token di localStorage
    localStorage.setItem('authToken', data.token);

    // Arahkan ke halaman permainan
    redirectToGamePage();
  } catch (error) {
    console.error("Error during login:", error);
    alert('Login failed. Please try again.');
  }
};




document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem('authToken'); // Ambil token dari localStorage
  if (token) {
    console.log("Token found:", token); // Debug token
    redirectToGamePage(); // Jika token ada, arahkan ke game
  } else {
    console.log("No token found. Showing login form.");
    createLoginForm(); // Jika token tidak ada, tampilkan login form
  }
});


function redirectToGamePage() {
  const token = localStorage.getItem('authToken'); // Verifikasi token
  if (!token) {
    alert('No token found. Redirecting to login...');
    createLoginForm(); // Jika token tidak ada, kembali ke login
    return;
  }
  createGamePage();

  const container = document.getElementById('game');
  container.innerHTML = '<h1>Guess the word!</h1>';
  // createLogoutButton(); // Tambahkan tombol logout
};




async function createGamePage() {
  try {
    const container = document.getElementById('game');
    container.innerHTML = ''; // Clear the login form

    console.log("Fetching random word...");
    dictionary = await getRandomWord(); // Get a random word
    console.log(dictionary);

    if (!dictionary) {
      alert("Failed to find a word. Please try again.");
      console.log("No word found.");
      return;
    }

    state.secret = dictionary; // Set the secret word
    console.log("Secret word:", state.secret);

    drawGrid(container); // Draw the game grid
    registerKeyboardEvents(); // Register keyboard events

  } catch (error) {
    console.error("Error in createGamePage:", error);
  }

  
}


async function getRandomWord() {
  try {
    const token = localStorage.getItem('authToken'); // Ambil token dari localStorage

    if (!token) {
      throw new Error('No valid token found.');
    }

    const response = await fetch('https://delta-indie.vercel.app/api/random-word', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // Kirimkan token di header Authorization
      }
    });

    const data = await response.json();
    if (!data || !data.word) {
      throw new Error('No word found in response.');
    }

    const word = data.word.toUpperCase();
    console.log("Random Word:", word);
    return word;

  } catch (error) {
    console.error("Error fetching random word:", error);
    return null; // Kembalikan null jika ada kesalahan
  }
}




function drawGrid(container) {
  const wordLength = state.secret.length;
  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.style.gridTemplateColumns = `repeat(${wordLength}, 50px)`; // Dynamic grid based on word length

  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < wordLength; j++) {
      drawBox(grid, i, j);
    }
  }

  container.appendChild(grid);
  createLogoutButton()

}

//updating word from grid
function updateGrid() {
  console.log("Updating grid...");
  for (let i = 0; i < state.grid.length; i++) {
    for (let j = 0; j < state.grid[i].length; j++) {
      const box = document.getElementById(`box${i}${j}`);
      box.textContent = state.grid[i][j];
    }
  }
}



function drawBox(container, row, col, letter = '') {
  const box = document.createElement('div');
  box.className = 'box';
  box.textContent = letter;
  box.id = `box${row}${col}`; //buat id

  container.appendChild(box);
  
  return box;

  
}

function registerKeyboardEvents() {
  document.body.onkeydown = (e) => {
    const key = e.key.toUpperCase(); // Pastikan uppercase

    if (key === 'ENTER') { // Enter condition
      if (state.currentCol === state.secret.length) {
        const word = getCurrentWord();
        if (isWordValid(word)) {
          revealWord(word);
          state.currentRow++;
          state.currentCol = 0;
        } else {
          alert('Not a valid word.');
        }
      }
    }
    if (key === 'BACKSPACE') { // Backspace condition
      removeLetter();
    }
    if (isLetter(key)) { // Validasi huruf
      addLetter(key);
    }

    updateGrid();
  };
};

function getCurrentWord() {//mendapatkan kata yang telah diinput user
  return state.grid[state.currentRow].reduce((prev, curr) => prev + (curr || ""), "");
}

function isWordValid(word) {//if the guess is right
  return word.length === state.secret.length; //updated
}

function getNumOfOccurrencesInWord(word, letter) {//menghitung berapa huruf pada word
  let result = 0;
  for (let i = 0; i < word.length; i++) {
    if (word[i] === letter) {
      result++;
    }
  }
  return result;
}

function getPositionOfOccurrence(word, letter, position) {//menghitung kemunculan letter pada word
  let result = 0;
  for (let i = 0; i <= position; i++) {
    if (word[i] === letter) {
      result++;
    }
  }
  return result;
}

//evaliasi tebakan dan memberi result
function revealWord(guess) {
  const row = state.currentRow;
  const animation_duration = 500;

  for (let i = 0; i < state.secret.length; i++) {
    const box = document.getElementById(`box${row}${i}`);
    const letter = box.textContent;

    setTimeout(() => {
      if (letter === state.secret[i]) {
        box.classList.add('right');
      } else if (state.secret.includes(letter)) {
        box.classList.add('wrong');
      } else {
        box.classList.add('empty');
      }
    }, ((i + 1) * animation_duration) / 2);

    box.classList.add('animated');
    box.style.animationDelay = `${(i * animation_duration) / 2}ms`;
  }

  const isWinner = state.secret === guess;
  const isGameOver = state.currentRow === 5;

  setTimeout(() => {
    if (isWinner) {
      alert('Congratulations!');
    } else if (isGameOver) {
      alert(`Better luck next time! The word was ${state.secret}.`);
    }
  }, 3 * animation_duration);
};


function isLetter(key) {
  return key.length === 1 && key.match(/[A-Z]/); // Hanya uppercase
};


function addLetter(letter) {
  if (state.currentCol === state.secret.length) return;

  // Tambahkan huruf ke grid
  state.grid[state.currentRow][state.currentCol] = letter;

  // Dapatkan elemen box yang sesuai
  const box = document.getElementById(`box${state.currentRow}${state.currentCol}`);

  // Menambahkan animasi ke kotak yang baru diisi
  box.classList.add('letter-appear'); // Menambahkan animasi

  // Update posisi kolom
  state.currentCol++;
}


function removeLetter() {//delete letter
  if (state.currentCol === 0) return;
  state.grid[state.currentRow][state.currentCol - 1] = '';
  state.currentCol--;
}

function createLogoutButton() {
  const container = document.getElementById('logOut');

  // Cek apakah tombol logout sudah ada
  if (document.getElementById('logoutButton')) {
    return; // Jangan tambahkan lagi jika sudah ada
  }

  // Buat tombol logout
  const logoutButton = document.createElement('button');
  logoutButton.id = 'logoutButton'; // Berikan ID unik
  logoutButton.textContent = 'Logout';

  // Tambahkan event listener untuk logout
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('authToken'); // Hapus token dari localStorage
    console.log('User logged out. Redirecting to login page.');
    createLoginForm(); // Tampilkan kembali halaman login
  });

  container.appendChild(logoutButton);
}


// Start with the login form
createLoginForm();

//handle login
//tokennya belum dillokal storage
//kalau udah gak usah show halaman login
//kata-katanya harus uppercase semua

