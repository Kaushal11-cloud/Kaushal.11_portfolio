const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ffmpeg = 'C:\\Users\\kaushal shrestha\\AppData\\Local\\CapCut\\Apps\\9.5.0.4050\\ffmpeg.exe';
const inputVideo = path.join(__dirname, '..', 'images', 'dumbbell-motion.mp4');
const outputVideo = path.join(__dirname, '..', 'images', 'dumbbell-hero-clean.mp4');

const W = 1280;
const H = 720;
const FRAME_BYTES = W * H * 3;

console.log('Starting video background replacement...');
console.log('Input:', inputVideo);
console.log('Output:', outputVideo);

// Decoder
const decoder = spawn(ffmpeg, [
  '-i', inputVideo,
  '-f', 'rawvideo',
  '-pix_fmt', 'rgb24',
  '-'
]);

// Encoder
const encoder = spawn(ffmpeg, [
  '-f', 'rawvideo',
  '-pixel_format', 'rgb24',
  '-video_size', W + 'x' + H,
  '-framerate', '24',
  '-i', '-',
  '-c:v', 'h264_mf',
  '-b:v', '4M',
  '-pix_fmt', 'yuv420p',
  '-y',
  outputVideo
]);

decoder.stderr.on('data', () => {});
encoder.stderr.on('data', () => {});

encoder.on('close', code => {
  console.log('Encoder finished with exit code:', code);
  if (fs.existsSync(outputVideo)) {
    console.log('Clean video size:', fs.statSync(outputVideo).size, 'bytes');
  }
});

let buffer = Buffer.alloc(0);
let frameCount = 0;

const visited = new Uint8Array(W * H);
const queue = new Int32Array(W * H);

function processFrame(frameBuf) {
  visited.fill(0);
  let head = 0, tail = 0;

  function isBg(idx) {
    const r = frameBuf[idx];
    const g = frameBuf[idx + 1];
    const b = frameBuf[idx + 2];
    const minVal = Math.min(r, g, b);
    const maxVal = Math.max(r, g, b);
    return minVal >= 170 && (maxVal - minVal) <= 25;
  }

  // Seed borders
  for (let x = 0; x < W; x++) {
    if (isBg(x * 3)) { visited[x] = 1; queue[tail++] = x; }
    const bPixel = (H - 1) * W + x;
    if (isBg(bPixel * 3)) { visited[bPixel] = 1; queue[tail++] = bPixel; }
  }
  for (let y = 0; y < H; y++) {
    const lPixel = y * W;
    if (!visited[lPixel] && isBg(lPixel * 3)) { visited[lPixel] = 1; queue[tail++] = lPixel; }
    const rPixel = y * W + (W - 1);
    if (!visited[rPixel] && isBg(rPixel * 3)) { visited[rPixel] = 1; queue[tail++] = rPixel; }
  }

  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % W;
    const cy = Math.floor(curr / W);

    if (cx > 0) {
      const n = curr - 1;
      if (!visited[n] && isBg(n * 3)) { visited[n] = 1; queue[tail++] = n; }
    }
    if (cx < W - 1) {
      const n = curr + 1;
      if (!visited[n] && isBg(n * 3)) { visited[n] = 1; queue[tail++] = n; }
    }
    if (cy > 0) {
      const n = curr - W;
      if (!visited[n] && isBg(n * 3)) { visited[n] = 1; queue[tail++] = n; }
    }
    if (cy < H - 1) {
      const n = curr + W;
      if (!visited[n] && isBg(n * 3)) { visited[n] = 1; queue[tail++] = n; }
    }
  }

  // Replace background with #08090b
  for (let i = 0; i < W * H; i++) {
    if (visited[i]) {
      const idx = i * 3;
      frameBuf[idx] = 8;
      frameBuf[idx + 1] = 9;
      frameBuf[idx + 2] = 11;
    }
  }

  encoder.stdin.write(frameBuf);
  frameCount++;
  if (frameCount % 48 === 0) {
    console.log(`Processed ${frameCount} frames...`);
  }
}

decoder.stdout.on('data', chunk => {
  buffer = Buffer.concat([buffer, chunk]);
  while (buffer.length >= FRAME_BYTES) {
    const frame = buffer.subarray(0, FRAME_BYTES);
    processFrame(Buffer.from(frame));
    buffer = buffer.subarray(FRAME_BYTES);
  }
});

decoder.stdout.on('end', () => {
  console.log(`Completed reading all frames. Total processed: ${frameCount} frames.`);
  encoder.stdin.end();
});
