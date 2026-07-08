let titleFrame1;
let titleFrame2;
let currentFrame = 0;
let frameTimer = 0;
const frameInterval = 0.6;

function preload() {
  titleFrame1 = loadImage('assets/images/Title frame1.png');
  titleFrame2 = loadImage('assets/images/Title frame2.png');
}

function setup() {
  createCanvas(800, 450);
  imageMode(CORNER);
}

function windowResized() {
  // Prevent canvas from resizing with window
}

function draw() {
    
    frameTimer += deltaTime / 1000;

  if (frameTimer >= frameInterval) {
    frameTimer = 0;
    currentFrame = currentFrame === 0 ? 1 : 0;
  }

  if (currentFrame === 0 && titleFrame1) {
    image(titleFrame1, 0, 0, 800, 450);
  } else if (currentFrame === 1 && titleFrame2) {
    image(titleFrame2, 0, 0, 800, 450);
  }

  // Small red rectangle slightly beneath center
  fill(255, 0, 0);
  noStroke();
  rect(375, 260, 50, 40);
  
}

function mousePressed() {
  // Check if click is on the red button
  if (mouseX > 375 && mouseX < 425 && mouseY > 260 && mouseY < 300) {
    
    // Load sketch.js
    let newScript = document.createElement('script');
    newScript.src = 'sketch.js';
    document.body.appendChild(newScript);
    return false;
  }
}

