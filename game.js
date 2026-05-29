(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var W = canvas.width;
  var H = canvas.height;

  var mathPanel = document.getElementById("mathPanel");
  var gameFrame = document.getElementById("gameFrame");
  var touchControls = document.getElementById("touchControls");
  var currentLevelLabel = document.getElementById("currentLevel");
  var panelEyebrow = document.getElementById("panelEyebrow");
  var panelTitle = document.getElementById("panelTitle");
  var panelCopy = document.getElementById("panelCopy");
  var skillGrid = document.getElementById("skillGrid");
  var quizBoard = document.getElementById("quizBoard");
  var resultBoard = document.getElementById("resultBoard");
  var questionCount = document.getElementById("questionCount");
  var quizScore = document.getElementById("quizScore");
  var progressFill = document.getElementById("progressFill");
  var questionText = document.getElementById("questionText");
  var answerGrid = document.getElementById("answerGrid");
  var feedback = document.getElementById("feedback");
  var nextQuestion = document.getElementById("nextQuestion");
  var resultScore = document.getElementById("resultScore");
  var resultCopy = document.getElementById("resultCopy");
  var resultActions = document.getElementById("resultActions");

  var SKILLS = [
    {
      key: "mixed",
      label: "Mixed Mission",
      hint: "Addition, subtraction, multiplication, division, and time"
    },
    {
      key: "addition",
      label: "Addition",
      hint: "Whole numbers, money, and decimals"
    },
    {
      key: "subtraction",
      label: "Subtraction",
      hint: "Difference, change, and decimal subtraction"
    },
    {
      key: "multiplication",
      label: "Multiplication",
      hint: "Two-digit products, powers of 10, and percentages"
    },
    {
      key: "division",
      label: "Division",
      hint: "Exact division, sharing, and fractions of quantities"
    },
    {
      key: "time",
      label: "Time",
      hint: "Elapsed time, timetables, and 24-hour time"
    }
  ];

  var quiz = {
    skill: "mixed",
    questions: [],
    index: 0,
    score: 0,
    answered: false
  };

  var currentLevel = 1;
  var bestLevel = 1;

  try {
    bestLevel = Number(localStorage.getItem("mathsInvadersBestLevel")) || 1;
  } catch (error) {
    bestLevel = 1;
  }

  var COLORS = {
    text: "#f5f7ff",
    textMuted: "#96a4c7",
    red: "#ff3434",
    orange: "#ff9148",
    yellow: "#f7ff66",
    green: "#41ff6a",
    cyan: "#57f4ff",
    magenta: "#ff61f5",
    player: "#6bffeb",
    playerDark: "#0ea89d",
    shield: "#ff5f57",
    shieldDim: "#9d2c3d",
    bullet: "#fff678",
    enemyBullet: "#7bff69",
    void: "#02030a"
  };

  var SPRITES = {
    squid: [
      [
        "00011011000",
        "00111111100",
        "01111111110",
        "11011011011",
        "11111111111",
        "00101110100",
        "01010001010",
        "10100000101"
      ],
      [
        "00011011000",
        "10111111101",
        "11111111111",
        "01011011010",
        "11111111111",
        "00010101000",
        "00101010100",
        "01001001010"
      ]
    ],
    crab: [
      [
        "00100100100",
        "00011111000",
        "00111111100",
        "01101110110",
        "11111111111",
        "10111111101",
        "10100000101",
        "00011011000"
      ],
      [
        "00100100100",
        "10011111001",
        "10111111101",
        "11101110111",
        "11111111111",
        "00111111100",
        "01000000010",
        "10000000001"
      ]
    ],
    beetle: [
      [
        "00011111000",
        "01111111110",
        "11111111111",
        "11001110011",
        "11111111111",
        "00110110100",
        "01100000110",
        "11000000011"
      ],
      [
        "00011111000",
        "01111111110",
        "11111111111",
        "11001110011",
        "11111111111",
        "00010101000",
        "00101010100",
        "01001001010"
      ]
    ]
  };

  var SHIELD_PATTERN = [
    "000011111110000",
    "000111111111000",
    "001111111111100",
    "011111111111110",
    "111111111111111",
    "111111111111111",
    "111111111111111",
    "111110000011111",
    "111100000001111",
    "111000000000111"
  ];

  var INVADER_COLS = 7;

  var keys = {
    left: false,
    right: false,
    fire: false
  };

  var keyboard = {
    left: false,
    right: false,
    fire: false
  };

  var pointerHolds = new Map();
  var pointerHoldStarts = new Map();
  var canvasPointer = null;
  var lastCanvasTap = 0;
  var stars = createStars();
  var player = createPlayer();
  var invaders = [];
  var shields = [];
  var playerShots = [];
  var enemyShots = [];
  var particles = [];
  var saucer = null;
  var score = 0;
  var highScore;
  var level = currentLevel;
  var lives = 3;
  var state = "idle";
  var stateTimer = 0;
  var levelElapsed = 0;
  var invaderOffset = 0;
  var invaderBaseY = 0;
  var invaderDir = 1;
  var invaderFrame = 0;
  var stepDistance = 0;
  var shotTimer = 1.9;
  var fireLatch = false;
  var arcadeActive = false;
  var lastTime = performance.now();

  try {
    highScore = Number(localStorage.getItem("mathsInvadersHiScore")) || 0;
  } catch (error) {
    highScore = 0;
  }

  function setupSkillButtons() {
    skillGrid.textContent = "";
    for (var i = 0; i < SKILLS.length; i += 1) {
      var skill = SKILLS[i];
      var button = document.createElement("button");
      var label = document.createElement("strong");
      var hint = document.createElement("span");
      button.className = "skill-button";
      button.type = "button";
      button.dataset.skill = skill.key;
      label.textContent = skill.label;
      hint.textContent = skill.hint;
      button.appendChild(label);
      button.appendChild(hint);
      skillGrid.appendChild(button);
    }
  }

  function showSkillPicker(copy) {
    arcadeActive = false;
    state = "idle";
    clearInput();
    document.body.classList.remove("is-arcade");
    mathPanel.hidden = false;
    gameFrame.hidden = true;
    touchControls.hidden = true;
    skillGrid.hidden = false;
    quizBoard.hidden = true;
    resultBoard.hidden = true;
    panelEyebrow.textContent = "Level " + currentLevel + " quiz";
    panelTitle.textContent = "Choose a maths skill";
    panelCopy.textContent = copy || "Score 9 or 10 to unlock one Space Invaders level.";
    updateLevelLabel();
  }

  function startQuiz(skillKey) {
    quiz.skill = skillKey;
    quiz.questions = buildQuiz(skillKey);
    quiz.index = 0;
    quiz.score = 0;
    quiz.answered = false;
    skillGrid.hidden = true;
    resultBoard.hidden = true;
    quizBoard.hidden = false;
    panelEyebrow.textContent = skillLabel(skillKey);
    panelTitle.textContent = "Launch quiz";
    panelCopy.textContent = "Earn at least 9 out of 10. The maths gets harder every few arcade levels.";
    renderQuestion();
  }

  function renderQuestion() {
    var q = quiz.questions[quiz.index];
    quiz.answered = false;
    questionCount.textContent = "Question " + (quiz.index + 1) + " of 10";
    quizScore.textContent = "Score " + quiz.score + "/10";
    progressFill.style.width = (quiz.index * 10) + "%";
    questionText.textContent = q.prompt;
    answerGrid.textContent = "";
    feedback.textContent = "";
    feedback.className = "feedback";
    nextQuestion.hidden = true;

    for (var i = 0; i < q.choices.length; i += 1) {
      var button = document.createElement("button");
      button.className = "answer-button";
      button.type = "button";
      button.textContent = q.choices[i];
      button.dataset.answer = q.choices[i];
      answerGrid.appendChild(button);
    }
  }

  function answerQuestion(choice, button) {
    if (quiz.answered) return;

    var q = quiz.questions[quiz.index];
    var correct = choice === q.answer;
    quiz.answered = true;

    if (correct) {
      quiz.score += 1;
      button.classList.add("is-correct");
      feedback.textContent = "Correct. " + q.explanation;
      feedback.classList.add("is-correct");
    } else {
      button.classList.add("is-wrong");
      feedback.textContent = "Not this time. Correct answer: " + q.answer + ". " + q.explanation;
      feedback.classList.add("is-wrong");
    }

    var buttons = answerGrid.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].disabled = true;
      if (buttons[i].dataset.answer === q.answer) {
        buttons[i].classList.add("is-correct");
      }
    }

    quizScore.textContent = "Score " + quiz.score + "/10";
    progressFill.style.width = ((quiz.index + 1) * 10) + "%";
    nextQuestion.textContent = quiz.index === 9 ? "See score" : "Next";
    nextQuestion.hidden = false;
  }

  function showQuizResult() {
    var passed = quiz.score >= 9;
    quizBoard.hidden = true;
    resultBoard.hidden = false;
    panelEyebrow.textContent = passed ? "Launch code accepted" : "Launch code blocked";
    panelTitle.textContent = passed ? "Arcade level unlocked" : "Try the quiz again";
    panelCopy.textContent = passed ? "Level " + currentLevel + " is ready." : "A score of 9 or 10 unlocks the next Space Invaders run.";
    resultScore.textContent = quiz.score + "/10";
    resultCopy.textContent = passed
      ? "Great work. Clear the wave to reach the next level."
      : "Review the answer feedback, then make another run at the launch code.";
    resultActions.textContent = "";

    if (passed) {
      resultActions.appendChild(actionButton("Launch Level " + currentLevel, "primary-action", startArcadeLevel));
      resultActions.appendChild(actionButton("Change Skill", "secondary-action", function () {
        showSkillPicker();
      }));
    } else {
      resultActions.appendChild(actionButton("Retry " + skillLabel(quiz.skill), "primary-action", function () {
        startQuiz(quiz.skill);
      }));
      resultActions.appendChild(actionButton("Choose Skill", "secondary-action", function () {
        showSkillPicker();
      }));
    }
  }

  function showArcadeOutcome(won) {
    var clearedLevel = currentLevel;
    arcadeActive = false;
    clearInput();
    document.body.classList.remove("is-arcade");
    gameFrame.hidden = true;
    touchControls.hidden = true;
    mathPanel.hidden = false;
    skillGrid.hidden = true;
    quizBoard.hidden = true;
    resultBoard.hidden = false;
    resultActions.textContent = "";

    if (won) {
      currentLevel += 1;
      bestLevel = Math.max(bestLevel, currentLevel);
      saveBestLevel();
      panelEyebrow.textContent = "Level " + clearedLevel + " cleared";
      panelTitle.textContent = "Next quiz required";
      panelCopy.textContent = "To play Level " + currentLevel + ", pass another 10-question quiz with 9 or 10.";
      resultScore.textContent = "Clear";
      resultCopy.textContent = "Arcade score: " + score + ". Best unlocked level: " + bestLevel + ".";
      resultActions.appendChild(actionButton("Next Quiz", "primary-action", function () {
        showSkillPicker("Choose a skill to unlock Level " + currentLevel + ".");
      }));
    } else {
      panelEyebrow.textContent = "Level " + currentLevel + " attempt ended";
      panelTitle.textContent = "Earn another launch";
      panelCopy.textContent = "Retake a maths quiz and score 9 or 10 to replay this level.";
      resultScore.textContent = "Try";
      resultCopy.textContent = "Arcade score: " + score + ". You are still on Level " + currentLevel + ".";
      resultActions.appendChild(actionButton("Retry Quiz", "primary-action", function () {
        startQuiz(quiz.skill);
      }));
      resultActions.appendChild(actionButton("Choose Skill", "secondary-action", function () {
        showSkillPicker();
      }));
    }

    updateLevelLabel();
  }

  function actionButton(text, className, handler) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", handler);
    return button;
  }

  function buildQuiz(skillKey) {
    var result = [];
    var used = new Set();

    while (result.length < 10) {
      var q = createQuestion(skillKey, result.length);
      if (used.has(q.prompt)) continue;
      used.add(q.prompt);
      result.push(q);
    }

    return result;
  }

  function createQuestion(skillKey, questionIndex) {
    var key = skillKey;
    var difficulty = getMathDifficulty(currentLevel, questionIndex);
    if (key === "mixed") {
      var pool = ["addition", "subtraction", "multiplication", "division", "time"];
      key = pool[randomInt(0, pool.length - 1)];
    }

    if (key === "addition") return additionQuestion(difficulty);
    if (key === "subtraction") return subtractionQuestion(difficulty);
    if (key === "multiplication") return multiplicationQuestion(difficulty);
    if (key === "division") return divisionQuestion(difficulty);
    return timeQuestion(difficulty);
  }

  function getMathDifficulty(levelNumber, questionIndex) {
    var level = Math.max(1, levelNumber);
    var levelBand = Math.floor((level - 1) / 3);
    var quizRamp = level >= 4 && questionIndex >= 8 ? 1 : 0;
    var heat = clamp(1 + levelBand + quizRamp, 1, 8);
    var tier = heat <= 2 ? 1 : heat <= 4 ? 2 : heat <= 6 ? 3 : 4;
    var starter = level === 1;

    return {
      heat: heat,
      tier: tier,
      starter: starter,
      decimalStep: tier === 1 ? starter ? 2 : 1 : tier === 2 ? 0.5 : 0.1,
      wholeStep: tier === 1 ? starter ? 200 : 100 : tier === 2 ? 50 : tier === 3 ? 20 : 10,
      smallStep: tier === 1 ? starter ? 10 : 5 : tier === 2 ? 4 : 3,
      minuteStep: tier === 1 ? starter ? 60 : 30 : tier === 2 ? 15 : 5
    };
  }

  function additionQuestion(difficulty) {
    var type = randomInt(0, difficulty.tier === 1 ? 2 : 3);
    if (type === 0) {
      var a = difficulty.tier === 1 ? randomInt(difficulty.starter ? 10 : 12, difficulty.starter ? 50 : 89) / 10 : decimalFromCents(randomInt(1200, difficulty.tier >= 4 ? 18500 : 9900));
      var b = difficulty.tier === 1 ? randomInt(difficulty.starter ? 10 : 11, difficulty.starter ? 40 : 59) / 10 : decimalFromCents(randomInt(350, difficulty.tier >= 4 ? 9800 : 7250));
      var sum = difficulty.tier === 1 ? round1(a + b) : round2(a + b);
      return numericQuestion(
        "Calculate " + formatDecimal(a) + " + " + formatDecimal(b) + ".",
        sum,
        formatDecimal,
        "Add tenths and hundredths by lining up the decimal point.",
        difficulty.decimalStep
      );
    }

    if (type === 1) {
      var first = difficulty.tier === 1 ? randomInt(difficulty.starter ? 500 : 800, difficulty.starter ? 3000 : 6500) / 100 : randomInt(12000, difficulty.tier >= 4 ? 78500 : 48500) / 100;
      var second = difficulty.tier === 1 ? randomInt(difficulty.starter ? 100 : 300, difficulty.starter ? 2000 : 3500) / 100 : randomInt(8500, difficulty.tier >= 4 ? 59500 : 39500) / 100;
      var total = round2(first + second);
      return numericQuestion(
        "A fundraiser collects $" + money(first) + " and then $" + money(second) + ". What is the total?",
        total,
        moneyAnswer,
        "Add dollars and cents just like decimals.",
        difficulty.decimalStep
      );
    }

    if (type === 2) {
      var n1 = difficulty.tier === 1 ? randomInt(difficulty.starter ? 80 : 120, difficulty.starter ? 420 : 860) : randomInt(2400, difficulty.tier >= 4 ? 17800 : 7800);
      var n2 = difficulty.tier === 1 ? randomInt(difficulty.starter ? 20 : 90, difficulty.starter ? 280 : 540) : randomInt(650, difficulty.tier >= 4 ? 8950 : 2950);
      var n3 = difficulty.tier === 1 ? 0 : randomInt(105, difficulty.tier >= 4 ? 1890 : 890);
      var prompt = n3 ? "What is " + n1 + " + " + n2 + " + " + n3 + "?" : "What is " + n1 + " + " + n2 + "?";
      return numericQuestion(
        prompt,
        n1 + n2 + n3,
        whole,
        "Add by place value and check with estimation.",
        difficulty.wholeStep
      );
    }

    var d1 = randomInt(15, difficulty.tier >= 4 ? 146 : 86) / 10;
    var d2 = randomInt(12, difficulty.tier >= 4 ? 194 : 94) / 100;
    var d3 = randomInt(120, difficulty.tier >= 4 ? 1680 : 980) / 100;
    var answer = round2(d1 + d2 + d3);
    return numericQuestion(
      "Calculate " + formatDecimal(d1) + " + " + formatDecimal(d2) + " + " + formatDecimal(d3) + ".",
      answer,
      formatDecimal,
      "Group the decimal parts, then combine with the whole numbers.",
      difficulty.decimalStep
    );
  }

  function subtractionQuestion(difficulty) {
    var type = randomInt(0, difficulty.tier === 1 ? 2 : 3);
    if (type === 0) {
      var a = difficulty.tier === 1 ? randomInt(difficulty.starter ? 30 : 45, difficulty.starter ? 90 : 125) / 10 : decimalFromCents(randomInt(5800, difficulty.tier >= 4 ? 24500 : 14500));
      var b = difficulty.tier === 1 ? randomInt(difficulty.starter ? 5 : 10, Math.floor(a * (difficulty.starter ? 4 : 6))) / 10 : decimalFromCents(randomInt(900, Math.floor(a * 70)));
      var difference = difficulty.tier === 1 ? round1(a - b) : round2(a - b);
      return numericQuestion(
        "Calculate " + formatDecimal(a) + " - " + formatDecimal(b) + ".",
        difference,
        formatDecimal,
        "Subtract hundredths from hundredths and tenths from tenths.",
        difficulty.decimalStep
      );
    }

    if (type === 1) {
      var budget = difficulty.tier === 1 ? randomInt(difficulty.starter ? 1000 : 2500, difficulty.starter ? 5000 : 9000) / 100 : randomInt(45000, difficulty.tier >= 4 ? 149000 : 99000) / 100;
      var spent = difficulty.tier === 1 ? randomInt(difficulty.starter ? 100 : 500, Math.floor(budget * (difficulty.starter ? 45 : 60))) / 100 : randomInt(12500, Math.floor(budget * 85)) / 100;
      var left = round2(budget - spent);
      return numericQuestion(
        "You have $" + money(budget) + " and spend $" + money(spent) + ". How much is left?",
        left,
        moneyAnswer,
        "Subtract the cents column before the dollars column.",
        difficulty.decimalStep
      );
    }

    if (type === 2) {
      var high = difficulty.tier === 1 ? randomInt(difficulty.starter ? 400 : 700, difficulty.starter ? 1200 : 1800) : randomInt(7200, difficulty.tier >= 4 ? 28600 : 14600);
      var low = difficulty.tier === 1 ? randomInt(difficulty.starter ? 50 : 120, high - (difficulty.starter ? 300 : 200)) : randomInt(2400, high - 1200);
      return numericQuestion(
        "What is the difference between " + high + " and " + low + "?",
        high - low,
        whole,
        "Difference means subtract the smaller number from the larger number.",
        difficulty.wholeStep
      );
    }

    var start = randomInt(250, difficulty.tier >= 4 ? 1490 : 890) / 10;
    var change = randomInt(35, Math.floor(start * 7)) / 10;
    var answer = round1(start - change);
    return numericQuestion(
      "A tank held " + formatDecimal(start) + " L. It used " + formatDecimal(change) + " L. How many litres remain?",
      answer,
      formatDecimal,
      "Litres use decimal place value, so subtract them like decimal numbers.",
      difficulty.decimalStep
    );
  }

  function multiplicationQuestion(difficulty) {
    var type = randomInt(0, difficulty.tier === 1 ? 2 : 3);
    if (type === 0) {
      var a = difficulty.tier === 1 ? randomInt(difficulty.starter ? 2 : 11, difficulty.starter ? 12 : 24) : randomInt(16, difficulty.tier >= 4 ? 72 : 49);
      var b = difficulty.tier === 1 ? randomInt(2, difficulty.starter ? 10 : 9) : randomInt(12, difficulty.tier >= 4 ? 38 : 29);
      return numericQuestion(
        "Calculate " + a + " x " + b + ".",
        a * b,
        whole,
        "Break one factor into tens and ones, then add the partial products.",
        difficulty.tier === 1 ? 10 : difficulty.wholeStep
      );
    }

    if (type === 1) {
      var value = difficulty.tier === 1 ? randomInt(difficulty.starter ? 10 : 12, difficulty.starter ? 50 : 98) / 10 : randomInt(125, difficulty.tier >= 4 ? 1987 : 987) / 100;
      var power = Math.random() < 0.5 ? 10 : 100;
      var answer = round2(value * power);
      return numericQuestion(
        "Calculate " + formatDecimal(value) + " x " + power + ".",
        answer,
        formatDecimal,
        "Multiplying by a power of 10 shifts digits left in place value.",
        power === 10 ? difficulty.smallStep : difficulty.wholeStep
      );
    }

    if (type === 2) {
      var percentOptions = difficulty.tier === 1 ? [10, 50] : difficulty.tier === 2 ? [10, 20, 25, 50] : [10, 20, 25, 50, 75];
      var percent = percentOptions[randomInt(0, percentOptions.length - 1)];
      var quantity = randomInt(difficulty.tier === 1 ? difficulty.starter ? 4 : 8 : 12, difficulty.tier === 1 ? difficulty.starter ? 20 : 48 : difficulty.tier >= 4 ? 96 : 48) * 10;
      var answerPercent = quantity * percent / 100;
      return numericQuestion(
        "Find " + percent + "% of " + quantity + ".",
        answerPercent,
        whole,
        "Convert the percentage to a simple fraction or decimal of the quantity.",
        difficulty.tier === 1 ? 20 : 10
      );
    }

    var length = randomInt(14, difficulty.tier >= 4 ? 58 : 36);
    var width = randomInt(8, difficulty.tier >= 4 ? 32 : 24);
    return numericQuestion(
      "A rectangle is " + length + " m by " + width + " m. What is its area in m2?",
      length * width,
      areaAnswer,
      "Area of a rectangle is length x width.",
      difficulty.wholeStep
    );
  }

  function divisionQuestion(difficulty) {
    var type = randomInt(0, difficulty.tier === 1 ? 2 : 3);
    if (type === 0) {
      var divisor = difficulty.tier === 1 ? randomInt(2, difficulty.starter ? 10 : 12) : randomInt(12, difficulty.tier >= 4 ? 32 : 24);
      var quotient = difficulty.tier === 1 ? randomInt(difficulty.starter ? 2 : 3, difficulty.starter ? 12 : 15) : randomInt(12, difficulty.tier >= 4 ? 68 : 46);
      return numericQuestion(
        "Calculate " + (divisor * quotient) + " / " + divisor + ".",
        quotient,
        whole,
        "Use multiplication facts to check the division.",
        difficulty.smallStep
      );
    }

    if (type === 1) {
      var power = difficulty.starter ? 10 : Math.random() < 0.5 ? 10 : 100;
      var value = difficulty.tier === 1 ? randomInt(difficulty.starter ? 40 : 120, difficulty.starter ? 500 : 980) : power === 10 ? randomInt(1250, 9875) / 10 : randomInt(125, difficulty.tier >= 4 ? 1987 : 987);
      var answer = round2(value / power);
      return numericQuestion(
        "Calculate " + formatDecimal(value) + " / " + power + ".",
        answer,
        formatDecimal,
        "Dividing by a power of 10 shifts digits right in place value.",
        power === 10 ? difficulty.decimalStep : 0.1
      );
    }

    if (type === 2) {
      var groups = difficulty.tier === 1 ? randomInt(difficulty.starter ? 2 : 3, difficulty.starter ? 10 : 12) : randomInt(12, difficulty.tier >= 4 ? 36 : 28);
      var each = difficulty.tier === 1 ? randomInt(difficulty.starter ? 2 : 4, difficulty.starter ? 12 : 18) : randomInt(14, difficulty.tier >= 4 ? 58 : 42);
      return numericQuestion(
        (groups * each) + " stickers are shared equally into " + groups + " groups. How many per group?",
        each,
        whole,
        "Equal sharing is division.",
        difficulty.smallStep
      );
    }

    var denominators = difficulty.tier === 1 ? [2, 4, 5, 10] : difficulty.tier === 2 ? [3, 4, 5, 6, 8] : [3, 4, 5, 6, 8, 10, 12];
    var denominator = denominators[randomInt(0, denominators.length - 1)];
    var part = randomInt(difficulty.tier === 1 ? 4 : 12, difficulty.tier >= 4 ? 64 : 38);
    var total = denominator * part;
    return numericQuestion(
      "What is 1/" + denominator + " of " + total + "?",
      part,
      whole,
      "To find 1/" + denominator + " of a quantity, divide by " + denominator + ".",
      difficulty.smallStep
    );
  }

  function timeQuestion(difficulty) {
    var type = randomInt(0, difficulty.tier === 1 ? 2 : 3);
    if (type === 0) {
      var hour24 = difficulty.tier === 1 ? randomInt(13, 17) : randomInt(13, 23);
      var minute = difficulty.tier === 1 ? randomInt(0, 1) * 30 : randomInt(0, difficulty.tier === 2 ? 3 : 11) * (difficulty.tier === 2 ? 15 : 5);
      var minutes = hour24 * 60 + minute;
      return choiceQuestion(
        "What is " + format24(minutes) + " in 12-hour time?",
        format12(minutes),
        timeChoices(minutes, format12, difficulty.minuteStep),
        "Subtract 12 from afternoon and evening 24-hour times."
      );
    }

    if (type === 1) {
      var hour = randomInt(1, 11);
      var mins = difficulty.tier === 1 ? randomInt(0, 1) * 30 : randomInt(0, difficulty.tier === 2 ? 3 : 11) * (difficulty.tier === 2 ? 15 : 5);
      var pmMinutes = (hour + 12) * 60 + mins;
      return choiceQuestion(
        "What is " + format12(pmMinutes) + " in 24-hour time?",
        format24(pmMinutes),
        timeChoices(pmMinutes, format24, difficulty.minuteStep),
        "For pm times after midday, add 12 to the hour."
      );
    }

    if (type === 2) {
      var start = randomInt(7 * 60, difficulty.tier === 1 ? 12 * 60 : 17 * 60);
      start = start - (start % difficulty.minuteStep);
      var duration = difficulty.tier === 1 ? randomInt(1, 4) * 30 : randomInt(9, difficulty.tier >= 4 ? 52 : 38) * 5;
      var end = start + duration;
      return choiceQuestion(
        "A train leaves at " + format24(start) + " and arrives at " + format24(end) + ". How long is the trip?",
        formatDuration(duration),
        durationChoices(duration, difficulty.minuteStep),
        "Count hours first, then remaining minutes."
      );
    }

    var movieStart = randomInt(10 * 60, difficulty.tier >= 4 ? 21 * 60 : 19 * 60);
    movieStart = movieStart - (movieStart % difficulty.minuteStep);
    var runTime = randomInt(13, difficulty.tier >= 4 ? 46 : 34) * 5;
    var finish = movieStart + runTime;
    return choiceQuestion(
      "A movie starts at " + format12(movieStart) + " and runs for " + formatDuration(runTime) + ". What time does it finish?",
      format12(finish),
      timeChoices(finish, format12, difficulty.minuteStep),
      "Add the hours, then add the remaining minutes."
    );
  }

  function numericQuestion(prompt, answer, formatter, explanation, step) {
    var formatted = formatter(answer);
    return choiceQuestion(
      prompt,
      formatted,
      numericChoices(answer, formatter, step),
      explanation
    );
  }

  function choiceQuestion(prompt, answer, choices, explanation) {
    return {
      prompt: prompt,
      answer: answer,
      choices: shuffle(uniqueWithAnswer(answer, choices)).slice(0, 4),
      explanation: explanation
    };
  }

  function uniqueWithAnswer(answer, choices) {
    var result = [answer];
    var seen = new Set(result);

    for (var i = 0; i < choices.length; i += 1) {
      if (!seen.has(choices[i])) {
        seen.add(choices[i]);
        result.push(choices[i]);
      }
      if (result.length === 4) break;
    }

    return result;
  }

  function numericChoices(answer, formatter, step) {
    var choices = [];
    var offsets = shuffle([-3, -2, -1, 1, 2, 3, 4, -4]);
    var safeStep = step || 1;

    for (var i = 0; i < offsets.length; i += 1) {
      var candidate = answer + offsets[i] * safeStep;
      if (candidate < 0) candidate = answer + Math.abs(offsets[i]) * safeStep;
      candidate = round2(candidate);
      choices.push(formatter(candidate));
    }

    return choices;
  }

  function timeChoices(minutes, formatter, step) {
    var gap = step || 15;
    var offsets = shuffle([-4 * gap, -3 * gap, -2 * gap, -gap, gap, 2 * gap, 3 * gap, 4 * gap]);
    var choices = [];
    for (var i = 0; i < offsets.length; i += 1) {
      choices.push(formatter(wrapDay(minutes + offsets[i])));
    }
    return choices;
  }

  function durationChoices(duration, step) {
    var gap = step || 15;
    var offsets = shuffle([-4 * gap, -3 * gap, -2 * gap, -gap, gap, 2 * gap, 3 * gap, 4 * gap]);
    var choices = [];
    for (var i = 0; i < offsets.length; i += 1) {
      var value = Math.max(gap, duration + offsets[i]);
      choices.push(formatDuration(value));
    }
    return choices;
  }

  function skillLabel(key) {
    for (var i = 0; i < SKILLS.length; i += 1) {
      if (SKILLS[i].key === key) return SKILLS[i].label;
    }
    return "Mixed Mission";
  }

  function updateLevelLabel() {
    currentLevelLabel.textContent = String(currentLevel);
  }

  function saveBestLevel() {
    try {
      localStorage.setItem("mathsInvadersBestLevel", String(bestLevel));
    } catch (error) {
      // Progress is best effort when storage is unavailable.
    }
  }

  function decimalFromCents(cents) {
    return cents / 100;
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function formatDecimal(value) {
    var rounded = round2(value);
    if (Math.abs(rounded - Math.round(rounded)) < 0.001) return String(Math.round(rounded));
    return String(rounded.toFixed(2)).replace(/0$/, "").replace(/\.0$/, "");
  }

  function money(value) {
    return round2(value).toFixed(2);
  }

  function moneyAnswer(value) {
    return "$" + money(value);
  }

  function whole(value) {
    return String(Math.round(value));
  }

  function areaAnswer(value) {
    return Math.round(value) + " m2";
  }

  function format24(minutes) {
    var wrapped = wrapDay(minutes);
    var hour = Math.floor(wrapped / 60);
    var minute = wrapped % 60;
    return pad(hour, 2) + ":" + pad(minute, 2);
  }

  function format12(minutes) {
    var wrapped = wrapDay(minutes);
    var hour = Math.floor(wrapped / 60);
    var minute = wrapped % 60;
    var suffix = hour >= 12 ? "pm" : "am";
    var hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    return hour12 + ":" + pad(minute, 2) + " " + suffix;
  }

  function formatDuration(minutes) {
    var hours = Math.floor(minutes / 60);
    var mins = minutes % 60;
    if (hours === 0) return mins + " min";
    if (mins === 0) return hours + " h";
    return hours + " h " + mins + " min";
  }

  function wrapDay(minutes) {
    var day = 24 * 60;
    return ((minutes % day) + day) % day;
  }

  function startArcadeLevel() {
    arcadeActive = true;
    document.body.classList.add("is-arcade");
    mathPanel.hidden = true;
    gameFrame.hidden = false;
    touchControls.hidden = false;
    level = currentLevel;
    lives = 3;
    state = "playing";
    stateTimer = 0;
    fireLatch = false;
    resetLevel();
    updateLevelLabel();
    canvas.focus();
    lastTime = performance.now();
  }

  function resetLevel() {
    player = createPlayer();
    invaders = createInvaders();
    shields = createShields();
    enemyShots.length = 0;
    playerShots.length = 0;
    particles.length = 0;
    saucer = null;
    invaderOffset = 0;
    invaderBaseY = 0;
    invaderDir = 1;
    invaderFrame = 0;
    stepDistance = 0;
    shotTimer = 1.9;
    levelElapsed = 0;
    player.x = W * 0.5;
    player.cooldown = 0;
    player.invulnerable = 1.2;
  }

  function createPlayer() {
    return {
      x: W * 0.5,
      y: H - 58,
      w: 34,
      h: 18,
      speed: 202,
      cooldown: 0,
      invulnerable: 0
    };
  }

  function createInvaders() {
    var rows = [
      { color: COLORS.red, type: "squid", points: 40 },
      { color: COLORS.orange, type: "beetle", points: 30 },
      { color: COLORS.yellow, type: "crab", points: 25 },
      { color: COLORS.green, type: "crab", points: 20 },
      { color: COLORS.cyan, type: "beetle", points: 15 }
    ];
    var list = [];
    var cols = INVADER_COLS;
    var startY = 86;
    var gapX = 35;
    var gapY = 31;
    var formationWidth = (cols - 1) * gapX + 22;
    var startX = Math.round((W - formationWidth) * 0.5);

    for (var row = 0; row < rows.length; row += 1) {
      for (var col = 0; col < cols; col += 1) {
        list.push({
          x: startX + col * gapX,
          y: startY + row * gapY,
          row: row,
          col: col,
          type: rows[row].type,
          color: rows[row].color,
          points: rows[row].points,
          alive: true,
          flash: 0
        });
      }
    }

    return list;
  }

  function createShields() {
    var result = [];
    var shieldWidth = SHIELD_PATTERN[0].length * 4;
    var startX = 32;
    var gap = (W - startX * 2 - shieldWidth * 4) / 3;

    for (var i = 0; i < 4; i += 1) {
      var cells = [];
      for (var y = 0; y < SHIELD_PATTERN.length; y += 1) {
        var row = [];
        for (var x = 0; x < SHIELD_PATTERN[y].length; x += 1) {
          row.push(SHIELD_PATTERN[y][x] === "1" ? 3 : 0);
        }
        cells.push(row);
      }
      result.push({
        x: Math.round(startX + i * (shieldWidth + gap)),
        y: 452,
        cell: 4,
        cells: cells,
        cols: SHIELD_PATTERN[0].length,
        rows: SHIELD_PATTERN.length
      });
    }

    return result;
  }

  function createStars() {
    var result = [];
    for (var i = 0; i < 90; i += 1) {
      result.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 0.8 + 0.2,
        phase: Math.random() * Math.PI * 2
      });
    }
    return result;
  }

  function update(dt) {
    if (!arcadeActive) return;

    stateTimer += dt;

    if (state === "cleared") {
      updateParticles(dt);
      if (stateTimer > 1.4) showArcadeOutcome(true);
      return;
    }

    if (state === "gameover") {
      updateParticles(dt);
      if (stateTimer > 1.25) showArcadeOutcome(false);
      return;
    }

    levelElapsed += dt;
    updatePlayer(dt);
    updateInvaders(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateSaucer(dt);

    if (countAliveInvaders() === 0) {
      score += 150 + level * 20;
      setHighScore();
      state = "cleared";
      stateTimer = 0;
      burst(W * 0.5, 178, COLORS.cyan, 34);
    }
  }

  function updatePlayer(dt) {
    var move = 0;
    if (keys.left) move -= 1;
    if (keys.right) move += 1;

    player.x += move * player.speed * getTouchMoveBoost(move) * dt;
    player.x = clamp(player.x, 20, W - 20);
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);

    if (keys.fire) firePlayerShot();
  }

  function firePlayerShot() {
    if (state !== "playing" || player.cooldown > 0 || playerShots.length >= 2) return false;

    playerShots.push({
      x: player.x,
      y: player.y - 14,
      prevY: player.y - 14,
      w: 3,
      h: 13,
      vy: -420,
      color: COLORS.bullet
    });
    player.cooldown = Math.max(0.17, 0.32 - level * 0.01);
    burst(player.x, player.y - 13, COLORS.bullet, 4);
    return true;
  }

  function updateInvaders(dt) {
    var alive = countAliveInvaders();
    var shieldsDown = areShieldsDestroyed();
    var pressure = (invaders.length - alive) * 0.42;
    var speed = 11 + Math.min(level, 12) * 4.1 + pressure;
    var dx = invaderDir * speed * dt;
    invaderOffset += dx;
    stepDistance += Math.abs(dx);

    if (stepDistance > 9) {
      invaderFrame = 1 - invaderFrame;
      stepDistance = 0;
    }

    var bounds = getInvaderBounds();
    var rightLimit = W - 17;
    var leftLimit = 17;

    if (bounds.right >= rightLimit) {
      invaderOffset -= bounds.right - rightLimit;
      invaderDir = -1;
      if (shieldsDown) descendInvaders(12 + Math.min(8, level));
    } else if (bounds.left <= leftLimit) {
      invaderOffset += leftLimit - bounds.left;
      invaderDir = 1;
      if (shieldsDown) descendInvaders(12 + Math.min(8, level));
    }

    var driftDelay = Math.max(9, 26 - level * 1.2);
    if (shieldsDown && levelElapsed > driftDelay) {
      invaderBaseY += (2.5 + level * 0.58) * dt;
    }

    for (var i = 0; i < invaders.length; i += 1) {
      if (invaders[i].flash > 0) invaders[i].flash -= dt;
    }

    shotTimer -= dt;
    var maxEnemyShots = Math.min(7, 2 + Math.floor(level / 2));
    if (shotTimer <= 0 && enemyShots.length < maxEnemyShots) {
      fireEnemyShot();
      var low = Math.max(0.36, 1.35 - level * 0.07);
      var high = Math.max(0.7, 2.3 - level * 0.09);
      shotTimer = randomRange(low, high);
    }

    if (bounds.bottom > player.y - 15) {
      loseLife(true);
    }
  }

  function descendInvaders(amount) {
    invaderBaseY += amount;
    invaderFrame = 1 - invaderFrame;
  }

  function updateProjectiles(dt) {
    for (var i = playerShots.length - 1; i >= 0; i -= 1) {
      var shot = playerShots[i];
      shot.prevY = shot.y;
      shot.y += shot.vy * dt;

      if (shot.y < 35) {
        playerShots.splice(i, 1);
        continue;
      }

      if (hitShield(shot, true)) {
        playerShots.splice(i, 1);
        continue;
      }

      var hit = hitInvader(shot);
      if (hit) {
        score += hit.points;
        hit.alive = false;
        playerShots.splice(i, 1);
        burst(hit.x + invaderOffset + 11, hit.y + invaderBaseY + 8, hit.color, 18);
        setHighScore();
      } else if (saucer && hitSaucer(shot)) {
        score += 120 + level * 5;
        saucer = null;
        playerShots.splice(i, 1);
        burst(shot.x, shot.y, COLORS.red, 28);
        setHighScore();
      }
    }

    for (var j = enemyShots.length - 1; j >= 0; j -= 1) {
      var bullet = enemyShots[j];
      bullet.prevY = bullet.y;
      bullet.y += bullet.vy * dt;
      bullet.wobble += dt * 18;

      if (bullet.y > H - 21) {
        enemyShots.splice(j, 1);
        continue;
      }

      if (hitShield(bullet, false)) {
        enemyShots.splice(j, 1);
        continue;
      }

      if (player.invulnerable <= 0 && rectsOverlap(
        bullet.x - bullet.w * 0.5,
        bullet.y - bullet.h * 0.5,
        bullet.w,
        bullet.h,
        player.x - player.w * 0.5,
        player.y - player.h * 0.5,
        player.w,
        player.h
      )) {
        enemyShots.splice(j, 1);
        loseLife(false);
      }
    }
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i -= 1) {
      var p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 24 * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateSaucer(dt) {
    if (!saucer) {
      if (state === "playing" && levelElapsed > 7 && Math.random() < dt * 0.035) {
        saucer = {
          x: Math.random() < 0.5 ? -36 : W + 36,
          y: 58,
          dir: Math.random() < 0.5 ? 1 : -1,
          speed: 64 + level * 4
        };
      }
      return;
    }

    saucer.x += saucer.dir * saucer.speed * dt;
    if (saucer.x < -46 || saucer.x > W + 46) saucer = null;
  }

  function fireEnemyShot() {
    var columns = [];
    for (var c = 0; c < INVADER_COLS; c += 1) {
      var bottom = null;
      for (var i = 0; i < invaders.length; i += 1) {
        var inv = invaders[i];
        if (inv.alive && inv.col === c && (!bottom || inv.row > bottom.row)) {
          bottom = inv;
        }
      }
      if (bottom) columns.push(bottom);
    }

    if (!columns.length) return;

    var shooter = columns[Math.floor(Math.random() * columns.length)];
    enemyShots.push({
      x: shooter.x + invaderOffset + 11,
      y: shooter.y + invaderBaseY + 18,
      prevY: shooter.y + invaderBaseY + 18,
      w: 5,
      h: 14,
      vy: 115 + level * 12,
      color: Math.random() < 0.5 ? COLORS.enemyBullet : COLORS.magenta,
      wobble: Math.random() * 9
    });
  }

  function hitInvader(shot) {
    for (var i = 0; i < invaders.length; i += 1) {
      var inv = invaders[i];
      if (!inv.alive) continue;
      var x = inv.x + invaderOffset;
      var y = inv.y + invaderBaseY;
      if (rectsOverlap(shot.x - 2, shot.y - 8, 4, 16, x, y, 22, 16)) {
        return inv;
      }
    }
    return null;
  }

  function hitSaucer(shot) {
    return rectsOverlap(shot.x - 2, shot.y - 8, 4, 16, saucer.x - 22, saucer.y - 8, 44, 16);
  }

  function hitShield(shot, fromPlayer) {
    for (var i = 0; i < shields.length; i += 1) {
      var shield = shields[i];
      var hit = shieldCellAt(shield, shot.x, shot.y);
      if (!hit && fromPlayer) {
        hit = shieldCellAt(shield, shot.x, shot.y - shot.h);
      } else if (!hit) {
        hit = shieldCellAt(shield, shot.x, shot.y + shot.h);
      }
      if (hit) {
        damageShield(shield, hit.cx, hit.cy, fromPlayer ? 4 : 8);
        return true;
      }
    }
    return false;
  }

  function shieldCellAt(shield, px, py) {
    var cx = Math.floor((px - shield.x) / shield.cell);
    var cy = Math.floor((py - shield.y) / shield.cell);
    if (cx < 0 || cy < 0 || cx >= shield.cols || cy >= shield.rows) return null;
    if (shield.cells[cy][cx] <= 0) return null;
    return { cx: cx, cy: cy };
  }

  function damageShield(shield, cx, cy, force) {
    for (var y = -2; y <= 2; y += 1) {
      for (var x = -2; x <= 2; x += 1) {
        var tx = cx + x;
        var ty = cy + y;
        if (tx < 0 || ty < 0 || tx >= shield.cols || ty >= shield.rows) continue;
        if (shield.cells[ty][tx] <= 0) continue;

        var distance = Math.abs(x) + Math.abs(y);
        if (distance > 2) continue;

        var amount = distance === 0 ? force : Math.ceil(force / (distance + 1));
        shield.cells[ty][tx] = Math.max(0, shield.cells[ty][tx] - amount);
      }
    }
  }

  function loseLife(resetWave) {
    if (state !== "playing") return;

    lives -= 1;
    burst(player.x, player.y, COLORS.player, 34);
    enemyShots.length = 0;
    playerShots.length = 0;

    if (lives <= 0) {
      state = "gameover";
      stateTimer = 0;
      fireLatch = keys.fire;
      setHighScore();
      return;
    }

    player.x = W * 0.5;
    player.cooldown = 0.7;
    player.invulnerable = 1.8;

    if (resetWave) {
      invaderOffset = 0;
      invaderBaseY = 0;
      levelElapsed = 0;
    }
  }

  function draw() {
    if (!arcadeActive) return;
    drawBackground();
    drawHud();
    drawSaucer();
    drawInvaders();
    drawShields();
    drawPlayer();
    drawProjectiles();
    drawParticles();
    drawOverlay();
  }

  function drawBackground() {
    ctx.fillStyle = COLORS.void;
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < stars.length; i += 1) {
      var star = stars[i];
      var twinkle = 0.55 + Math.sin(performance.now() * 0.0018 + star.phase) * 0.35;
      ctx.globalAlpha = clamp(star.z * twinkle, 0.24, 1);
      ctx.fillStyle = star.z > 0.72 ? "#fff6a7" : "#d7f7ff";
      ctx.fillRect(Math.round(star.x), Math.round(star.y), star.z > 0.72 ? 2 : 1, star.z > 0.54 ? 2 : 1);
    }
    ctx.globalAlpha = 1;

    var horizon = ctx.createLinearGradient(0, H - 132, 0, H);
    horizon.addColorStop(0, "rgba(87,244,255,0)");
    horizon.addColorStop(0.54, "rgba(87,244,255,0.11)");
    horizon.addColorStop(0.58, "rgba(255,180,71,0.42)");
    horizon.addColorStop(1, "rgba(18,45,64,0.25)");
    ctx.fillStyle = horizon;
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H + 105, 305, 150, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(87,244,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H + 104, 304, 150, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  function drawHud() {
    ctx.save();
    ctx.font = "12px Menlo, Consolas, monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText("SCORE", 12, 10);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(pad(score, 6), 12, 26);

    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText("HI", 132, 10);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(pad(highScore, 6), 132, 26);

    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText("LEVEL", 240, 10);
    ctx.fillStyle = COLORS.yellow;
    ctx.fillText(pad(level, 2), 240, 26);

    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText("LIVES", 310, 10);
    for (var i = 0; i < lives; i += 1) {
      drawPlayerIcon(313 + i * 22, 29, 0.55);
    }
    ctx.restore();
  }

  function drawInvaders() {
    ctx.save();
    for (var i = 0; i < invaders.length; i += 1) {
      var inv = invaders[i];
      if (!inv.alive) continue;
      var nudge = invaderFrame ? (inv.row % 2 === 0 ? 1 : -1) : 0;
      var x = Math.round(inv.x + invaderOffset + nudge);
      var y = Math.round(inv.y + invaderBaseY);
      var color = inv.flash > 0 ? "#ffffff" : inv.color;
      drawPixelSprite(SPRITES[inv.type][invaderFrame], x, y, 2, color);
    }
    ctx.restore();
  }

  function drawSaucer() {
    if (!saucer) return;
    ctx.save();
    ctx.translate(Math.round(saucer.x), Math.round(saucer.y));
    ctx.fillStyle = COLORS.red;
    ctx.shadowColor = COLORS.red;
    ctx.shadowBlur = 10;
    ctx.fillRect(-18, -2, 36, 8);
    ctx.fillRect(-12, -7, 24, 6);
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(-6, -9, 12, 2);
    ctx.fillStyle = "#ffb0b0";
    ctx.fillRect(-22, 2, 6, 4);
    ctx.fillRect(16, 2, 6, 4);
    ctx.restore();
  }

  function drawShields() {
    for (var i = 0; i < shields.length; i += 1) {
      var shield = shields[i];
      for (var y = 0; y < shield.rows; y += 1) {
        for (var x = 0; x < shield.cols; x += 1) {
          var hp = shield.cells[y][x];
          if (hp <= 0) continue;
          ctx.fillStyle = hp === 3 ? COLORS.shield : hp === 2 ? "#e84b55" : COLORS.shieldDim;
          ctx.fillRect(shield.x + x * shield.cell, shield.y + y * shield.cell, shield.cell, shield.cell);
        }
      }
    }
  }

  function drawPlayer() {
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0) return;
    drawPlayerIcon(player.x, player.y, 1);
  }

  function drawPlayerIcon(x, y, scale) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(scale, scale);
    ctx.fillStyle = COLORS.playerDark;
    ctx.fillRect(-17, 2, 34, 11);
    ctx.fillStyle = COLORS.player;
    ctx.shadowColor = COLORS.player;
    ctx.shadowBlur = 8;
    ctx.fillRect(-14, -2, 28, 8);
    ctx.fillRect(-5, -10, 10, 8);
    ctx.fillRect(-22, 7, 44, 9);
    ctx.fillStyle = "#d9fff9";
    ctx.fillRect(-2, -14, 4, 5);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawProjectiles() {
    for (var i = 0; i < playerShots.length; i += 1) {
      var shot = playerShots[i];
      ctx.fillStyle = shot.color;
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(Math.round(shot.x - shot.w * 0.5), Math.round(shot.y - shot.h), shot.w, shot.h);
    }

    for (var j = 0; j < enemyShots.length; j += 1) {
      var bullet = enemyShots[j];
      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8;
      for (var k = 0; k < 4; k += 1) {
        var wobble = Math.sin(bullet.wobble + k * 0.8) * 2;
        ctx.fillRect(Math.round(bullet.x + wobble - 2), Math.round(bullet.y + k * 4), 4, 3);
      }
    }
    ctx.shadowBlur = 0;
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i += 1) {
      var p = particles[i];
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawOverlay() {
    if (state === "cleared") {
      drawCenterMessage("LEVEL CLEAR", "NEXT QUIZ");
    } else if (state === "gameover") {
      drawCenterMessage("SHIP DOWN", "QUIZ TO RETRY");
    }
  }

  function drawCenterMessage(primary, secondary) {
    ctx.save();
    ctx.fillStyle = "rgba(2,3,10,0.62)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.text;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 12;
    ctx.font = "26px Menlo, Consolas, monospace";
    ctx.fillText(primary, W * 0.5, H * 0.46);
    if (secondary) {
      ctx.font = "14px Menlo, Consolas, monospace";
      ctx.shadowColor = COLORS.magenta;
      ctx.fillText(secondary, W * 0.5, H * 0.53);
    }
    ctx.restore();
  }

  function drawPixelSprite(pattern, x, y, scale, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    for (var row = 0; row < pattern.length; row += 1) {
      for (var col = 0; col < pattern[row].length; col += 1) {
        if (pattern[row][col] === "1") {
          ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
        }
      }
    }
    ctx.shadowBlur = 0;
  }

  function burst(x, y, color, amount) {
    for (var i = 0; i < amount; i += 1) {
      var angle = Math.random() * Math.PI * 2;
      var speed = randomRange(18, 96);
      var life = randomRange(0.24, 0.72);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: Math.random() < 0.7 ? 2 : 3,
        life: life,
        maxLife: life
      });
    }
  }

  function getInvaderBounds() {
    var left = Infinity;
    var right = -Infinity;
    var bottom = -Infinity;
    for (var i = 0; i < invaders.length; i += 1) {
      var inv = invaders[i];
      if (!inv.alive) continue;
      var x = inv.x + invaderOffset;
      var y = inv.y + invaderBaseY;
      left = Math.min(left, x);
      right = Math.max(right, x + 22);
      bottom = Math.max(bottom, y + 16);
    }
    if (left === Infinity) {
      return { left: 0, right: 0, bottom: 0 };
    }
    return { left: left, right: right, bottom: bottom };
  }

  function countAliveInvaders() {
    var alive = 0;
    for (var i = 0; i < invaders.length; i += 1) {
      if (invaders[i].alive) alive += 1;
    }
    return alive;
  }

  function areShieldsDestroyed() {
    for (var i = 0; i < shields.length; i += 1) {
      var shield = shields[i];
      for (var y = 0; y < shield.rows; y += 1) {
        for (var x = 0; x < shield.cols; x += 1) {
          if (shield.cells[y][x] > 0) return false;
        }
      }
    }
    return true;
  }

  function getTouchMoveBoost(move) {
    if (move === 0) return 1;

    var action = move < 0 ? "left" : "right";
    var holders = pointerHolds.get(action);
    var startedAt = pointerHoldStarts.get(action);
    if (!holders || startedAt === undefined) return 1;

    var heldSeconds = (performance.now() - startedAt) / 1000;
    if (heldSeconds < 0.24) return 1;
    return clamp(1.04 + heldSeconds * 0.34, 1, 1.58);
  }

  function setHighScore() {
    if (score <= highScore) return;
    highScore = score;
    try {
      localStorage.setItem("mathsInvadersHiScore", String(highScore));
    } catch (error) {
      // Best effort only.
    }
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pad(value, width) {
    var text = String(Math.max(0, Math.floor(value)));
    while (text.length < width) text = "0" + text;
    return text;
  }

  function shuffle(list) {
    var result = list.slice();
    for (var i = result.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function loop(now) {
    var dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function updateHeldKeys() {
    keys.left = pointerHolds.has("left") || keyboard.left;
    keys.right = pointerHolds.has("right") || keyboard.right;
    keys.fire = pointerHolds.has("fire") || keyboard.fire;
  }

  function clearInput() {
    keyboard.left = false;
    keyboard.right = false;
    keyboard.fire = false;
    pointerHolds.clear();
    pointerHoldStarts.clear();
    canvasPointer = null;
    updateHeldKeys();
    document.querySelectorAll(".control-button.is-active").forEach(function (button) {
      button.classList.remove("is-active");
    });
  }

  function setPointerHold(action, pointerId) {
    var holders = pointerHolds.get(action);
    if (!holders) {
      holders = new Set();
      pointerHolds.set(action, holders);
      pointerHoldStarts.set(action, performance.now());
    }
    holders.add(pointerId);
  }

  function releasePointerHold(action, pointerId) {
    var holders = pointerHolds.get(action);
    if (!holders) return;

    if (pointerId === undefined) {
      holders.clear();
    } else {
      holders.delete(pointerId);
    }

    if (holders.size === 0) {
      pointerHolds.delete(action);
      pointerHoldStarts.delete(action);
    }
  }

  function isLeftKey(event) {
    return event.key === "ArrowLeft" || event.key === "<" || event.key === "," || event.code === "Comma";
  }

  function isRightKey(event) {
    return event.key === "ArrowRight" || event.key === ">" || event.key === "." || event.code === "Period";
  }

  function canvasPointFromEvent(event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * W / rect.width,
      y: (event.clientY - rect.top) * H / rect.height
    };
  }

  function shieldControlLine() {
    return shields && shields.length ? shields[0].y : 452;
  }

  function triggerFireAction() {
    return firePlayerShot();
  }

  function updateCanvasHold(event) {
    if (!canvasPointer || canvasPointer.id !== event.pointerId) return;

    var point = canvasPointFromEvent(event);
    if (point.y < shieldControlLine()) {
      releaseCanvasHold(event);
      return;
    }

    var nextAction = point.x < player.x ? "left" : "right";
    if (nextAction !== canvasPointer.action) {
      releasePointerHold(canvasPointer.action, event.pointerId);
      canvasPointer.action = nextAction;
      setPointerHold(nextAction, event.pointerId);
      updateHeldKeys();
    }
  }

  function releaseCanvasHold(event) {
    if (!canvasPointer || canvasPointer.id !== event.pointerId) return;
    releasePointerHold(canvasPointer.action, event.pointerId);
    canvasPointer = null;
    updateHeldKeys();
  }

  skillGrid.addEventListener("click", function (event) {
    var button = event.target.closest("[data-skill]");
    if (!button) return;
    startQuiz(button.dataset.skill);
  });

  answerGrid.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;
    answerQuestion(button.dataset.answer, button);
  });

  nextQuestion.addEventListener("click", function () {
    if (!quiz.answered) return;
    if (quiz.index >= 9) {
      showQuizResult();
      return;
    }
    quiz.index += 1;
    renderQuestion();
  });

  window.addEventListener("keydown", function (event) {
    if (!arcadeActive) return;
    if (isLeftKey(event)) {
      keyboard.left = true;
      event.preventDefault();
    } else if (isRightKey(event)) {
      keyboard.right = true;
      event.preventDefault();
    } else if (event.key === " " || event.key === "ArrowUp") {
      keyboard.fire = true;
      event.preventDefault();
    }
    updateHeldKeys();
  });

  window.addEventListener("keyup", function (event) {
    if (!arcadeActive) return;
    if (isLeftKey(event)) {
      keyboard.left = false;
      event.preventDefault();
    } else if (isRightKey(event)) {
      keyboard.right = false;
      event.preventDefault();
    } else if (event.key === " " || event.key === "ArrowUp") {
      keyboard.fire = false;
      event.preventDefault();
    }
    updateHeldKeys();
  });

  document.querySelectorAll("[data-hold], [data-fire]").forEach(function (button) {
    button.addEventListener("pointerdown", function (event) {
      if (!arcadeActive) return;
      button.setPointerCapture(event.pointerId);
      var action = button.dataset.hold || "fire";
      setPointerHold(action, event.pointerId);
      button.classList.add("is-active");
      updateHeldKeys();
      canvas.focus();
      event.preventDefault();
    });

    function release(event) {
      var action = button.dataset.hold || "fire";
      releasePointerHold(action, event.pointerId);
      button.classList.remove("is-active");
      updateHeldKeys();
      event.preventDefault();
    }

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", function (event) {
      var action = button.dataset.hold || "fire";
      releasePointerHold(action, event.pointerId);
      button.classList.remove("is-active");
      updateHeldKeys();
    });
  });

  canvas.addEventListener("pointerdown", function (event) {
    if (!arcadeActive) return;
    canvas.setPointerCapture(event.pointerId);
    canvas.focus();

    var now = performance.now();
    if (now - lastCanvasTap < 300) {
      triggerFireAction();
    }
    lastCanvasTap = now;

    var point = canvasPointFromEvent(event);
    if (point.y < shieldControlLine()) {
      triggerFireAction();
      event.preventDefault();
      return;
    }

    var action = point.x < player.x ? "left" : "right";
    canvasPointer = { id: event.pointerId, action: action };
    setPointerHold(action, event.pointerId);
    updateHeldKeys();
    event.preventDefault();
  });

  canvas.addEventListener("pointermove", function (event) {
    updateCanvasHold(event);
    event.preventDefault();
  });

  canvas.addEventListener("pointerup", function (event) {
    releaseCanvasHold(event);
    event.preventDefault();
  });

  canvas.addEventListener("pointercancel", function (event) {
    releaseCanvasHold(event);
    event.preventDefault();
  });

  canvas.addEventListener("lostpointercapture", function (event) {
    releaseCanvasHold(event);
  });

  window.addEventListener("blur", function () {
    keyboard.left = false;
    keyboard.right = false;
    keyboard.fire = false;
    pointerHolds.clear();
    pointerHoldStarts.clear();
    canvasPointer = null;
    updateHeldKeys();
  });

  setupSkillButtons();
  showSkillPicker();
  requestAnimationFrame(loop);
}());
