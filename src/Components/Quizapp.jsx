import React, { useState, useEffect } from "react";
import { openDB } from "idb";
import { quizData } from "../utils/quizdata";
import '../styles.css'


// array of random feedback on selecting an option 
const correctFeedback = ["Great job!", "You're on fire!", "That's right!", "Awesome!", "Well done!"];
const incorrectFeedback = ["Oops! Try again.", "Not quite!", "Better luck next time!", "Keep practicing!", "Incorrect, but keep going!"];


// function which provide random feedback from above arrays 
const getRandomFeedback = (feedbackArray) => {
  return feedbackArray[Math.floor(Math.random() * feedbackArray.length)];
};

// our component starts from here 
const QuizApp = () => {

    // all state variables for our app 
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [attemptSaved, setAttemptSaved] = useState(false);

//   useEffect hook to handle timing of a question 
  useEffect(() => {
    if (quizStarted && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }else if (quizStarted && !quizCompleted) {
      handleNext(true);
    }
  }, [quizStarted, timer]);

//   use effect to store attempt history using indexdb 
  useEffect(() => {
    initDB();
    fetchAttemptHistory();
  }, []);

  const initDB = async () => {
    const db = await openDB("QuizDB", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("attempts")) {
          db.createObjectStore("attempts", { keyPath: "id", autoIncrement: true });
        }
      }
    });
  };

//   when a user clicks on answer  

  const handleAnswerClick = (answer) => {
    if (!selectedAnswer) {
    setSelectedAnswer(answer);
    if (answer === quizData[currentQuestion].correctAnswer) {
      setScore((prev) => prev + 1);
      setFeedback(getRandomFeedback(correctFeedback));
    } else {
      setFeedback(getRandomFeedback(incorrectFeedback) + " The correct answer is " + quizData[currentQuestion].correctAnswer);
    }
}
  };

//   handles next button functin to show next question 

  const handleNext = () => {
    if (quizCompleted || attemptSaved) return; 
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setTimer(30);
      setFeedback("");
    } else {
      setQuizCompleted(true);
      if (!attemptSaved) {
        saveAttempt();
        setAttemptSaved(true);
      }
    }
  };

//   function to handle reattempt 

  const handleReattempt = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setTimer(30);
    setQuizCompleted(false);
    setQuizStarted(true);
    setFeedback("");
    setAttemptSaved(false);
  };

//   it will save a user attempt when he or she attempted the quiz 
  const saveAttempt = async () => {
    const db = await openDB("QuizDB", 1);
    const tx = db.transaction("attempts", "readwrite");
    const store = tx.objectStore("attempts");
    await store.add({ score, date: new Date().toLocaleString() });
    await tx.done;
    fetchAttemptHistory();
  };

//   function to fetch attemtp history 

  const fetchAttemptHistory = async () => {
    const db = await openDB("QuizDB", 1);
    const tx = db.transaction("attempts", "readonly");
    const store = tx.objectStore("attempts");
    const allAttempts = await store.getAll();
    setAttemptHistory(allAttempts);
  };

  return (
    <div className="flex">
    <div className="quiz-container">
      {!quizStarted ? (
        // when quiz is not started 
        <div><h1 className="quiz-heading">Welcome to Quiz !</h1>
        <button className="start-quiz" onClick={() => setQuizStarted(true)}>Start Quiz</button></div>
      ) :
    //   when quiz started checking if quiz completed or not 
      quizCompleted ? (
        <div className="quiz-completed">
          <h2>Quiz Completed !</h2>
          <p className="score">Your Score: {score} / {quizData.length}</p>
          <div className="all-attempts">
          <h3>Previous Attempts:</h3>
          <ol>
            {attemptHistory.map((attempt, index) => (
              <li key={index}>Score: {attempt.score} - Date: {attempt.date}</li>
            ))}
          </ol>
          </div>
          <br />
          <button className="reattempt" onClick={handleReattempt}>Reattempt Quiz</button>
        </div>
      ) : (
        <div className="quiz-started">
          <h2>Question {currentQuestion + 1}</h2>
          <p>{quizData[currentQuestion].question}</p>
          <ol type="a">
            {quizData[currentQuestion].options.map((option, index) => (
              <li
                key={index}
                className={
                  selectedAnswer === option ? "selected" : ""
                }
                onClick={() => handleAnswerClick(option)}
              >
                {option}
              </li>
            ))}
          </ol>
          <p className={feedback?`feedback`:""}>{feedback}</p>
          <p><i className="fa-solid fa-stopwatch fa-lg mr-10"></i>Time Left: {timer} sec</p>
          <button className="next-button" onClick={handleNext} disabled={!selectedAnswer}>Next</button>
        </div>
      )}
    </div>
    </div>
  );
};

export default QuizApp;
