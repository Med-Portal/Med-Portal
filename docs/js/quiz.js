let currentQuizIndex = 0;
let quizzes = [];
let questions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let confettiMode = false;

// Load quizzes index
async function loadQuizzes() {
  try {
    const quizIndexResp = await fetch('quizzes/index.json'); // ✅ lowercase path
    quizzes = await quizIndexResp.json();
    displayQuizList();
  } catch (error) {
    console.error("Error loading quizzes index:", error);
  }
}

function displayQuizList() {
  const quizListDiv = document.getElementById("quizList");
  quizListDiv.innerHTML = "";
  quizzes.forEach((quiz, index) => {
    const btn = document.createElement("button");
    btn.textContent = quiz.title;
    btn.onclick = () => loadQuiz(index);
    quizListDiv.appendChild(btn);
  });
}

async function loadQuiz(index) {
  currentQuizIndex = index;
  const quizInfo = quizzes[index];
  try {
    const quizResp = await fetch(quizInfo.path); // ✅ already lowercase in index.json
    questions = await quizResp.json();
    currentQuestionIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    displayQuestion();
    document.getElementById("quizContainer").style.display = "block";
  } catch (error) {
    console.error("Error loading quiz:", error);
  }
}

function displayQuestion() {
  if (currentQuestionIndex >= questions.length) {
    showResults();
    return;
  }

  const q = questions[currentQuestionIndex];
  document.getElementById("question").textContent = q.question;
  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  q.choices.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => checkAnswer(i, q.answer);
    choicesDiv.appendChild(btn);
  });
}

function checkAnswer(selected, correct) {
  if (selected === correct) {
    correctCount++;
    if (confettiMode) triggerConfetti();
  } else {
    wrongCount++;
  }
  currentQuestionIndex++;
  displayQuestion();
}

function showResults() {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = `
    <h2>Results</h2>
    <p>Correct: ${correctCount}</p>
    <p>Wrong: ${wrongCount}</p>
  `;
}

function triggerConfetti() {
  // placeholder for confetti animation
  console.log("🎉 Confetti!");
}

// Navigation buttons
document.getElementById("prevBtn").addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    displayQuestion();
  }
});

document.getElementById("nextBtn").addEventListener("click", () => {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    displayQuestion();
  }
});

// Confetti toggle
document.getElementById("confettiToggle").addEventListener("change", (e) => {
  confettiMode = e.target.checked;
  localStorage.setItem("confettiMode", confettiMode);
});

// Restore confetti setting
document.addEventListener("DOMContentLoaded", () => {
  confettiMode = localStorage.getItem("confettiMode") === "true";
  document.getElementById("confettiToggle").checked = confettiMode;
  loadQuizzes();
});
