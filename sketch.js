let handsData = [];
let video;
let particles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont('Arial');

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 0,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults(onResults);

  const camera = new Camera(video.elt, {
    onFrame: async () => {
      await hands.send({ image: video.elt });
    },
    width: 640,
    height: 480
  });

  camera.start();
}

function onResults(results) {
  handsData = [];

  if (results.multiHandLandmarks) {
    for (let hand of results.multiHandLandmarks) {
      let pts = [];

      for (let p of hand) {
        pts.push({
          x: width - p.x * width,
          y: p.y * height
        });
      }

      handsData.push(pts);
    }
  }
}

function draw() {
  background(0, 20);

  // webcam
  push();
  translate(width, 0);
  scale(-1, 1);
  tint(255, 130);
  image(video, 0, 0, width, height);
  pop();

  if (handsData.length >= 2) {
    drawBeam();
  }

  drawHands();
}

function drawBeam() {
  if (handsData.length < 2) return;

  let leftHand = handsData[0];
  let rightHand = handsData[1];

  // fingertip indexes
  let fingers = [4, 8, 12, 16, 20];

  for (let i = 0; i < fingers.length; i++) {
    let p1 = leftHand[fingers[i]];
    let p2 = rightHand[fingers[i]];

    let centerX = (p1.x + p2.x) / 2;
    let centerY = (p1.y + p2.y) / 2;

    // glow layers
    for (let glow = 0; glow < 3; glow++) {
      let alpha = glow == 0 ? 20 : glow == 1 ? 80 : 255;
      let weight = glow == 0 ? 8 : glow == 1 ? 3 : 1;

      stroke(180, 220, 255, alpha);
      strokeWeight(weight);
      noFill();

      beginShape();

      for (let t = 0; t <= 1; t += 0.05) {
        let x = lerp(p1.x, p2.x, t);

        let wave =
          sin(frameCount * 0.08 + t * TWO_PI * 2 + i) * 8 +
          sin(frameCount * 0.05 + t * TWO_PI * 4) * 4;

        let y = lerp(p1.y, p2.y, t) + wave;

        curveVertex(x, y);
      }

      endShape();
    }

    // moving orb on strand
    let tOrb = (frameCount * 0.01 + i * 0.15) % 1;

    let orbX = lerp(p1.x, p2.x, tOrb);

    let orbWave =
      sin(frameCount * 0.08 + tOrb * TWO_PI * 2 + i) * 8 +
      sin(frameCount * 0.05 + tOrb * TWO_PI * 4) * 4;

    let orbY = lerp(p1.y, p2.y, tOrb) + orbWave;

    noStroke();
    fill(255, 80);
    circle(orbX, orbY, 22);

    fill(255);
    circle(orbX, orbY, 7);

    // small core ring
    noFill();
    stroke(255, 90);
    strokeWeight(1);
    circle(centerX, centerY, 24);
  }
}

function drawHands() {
  let tips = [4, 8, 12, 16, 20];

  for (let hand of handsData) {
    for (let i of tips) {
      let p = hand[i];

      noStroke();
      fill(255, 50);
      circle(p.x, p.y, 16);

      fill(255);
      circle(p.x, p.y, 4);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}