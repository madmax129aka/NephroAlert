/**
 * Stage 1A — Home Eye Screening image analysis.
 *
 * IMPORTANT: No pre-trained AI image classification model is used here,
 * and no external AI API is called. This module only does:
 *   1. Pure JavaScript canvas pixel-data math (brightness / red dominance
 *      quality checks).
 *   2. TensorFlow.js used strictly for pixel TENSOR arithmetic (mean of
 *      R/G/B channels over a region) — not for running any classifier.
 *
 * @tensorflow/tfjs is a free, open-source library (Apache-2.0). No paid
 * API, no OpenAI/Claude calls of any kind.
 */
import * as tf from '@tensorflow/tfjs';

/**
 * Extract RGB pixel data for a rectangular region of a canvas.
 * Returns { data, width, height } where data is a Uint8ClampedArray
 * of RGBA values (4 bytes per pixel).
 */
function getRegionImageData(canvas, region) {
  const ctx = canvas.getContext('2d');
  const { x, y, width, height } = region;
  return ctx.getImageData(x, y, width, height);
}

/**
 * STEP 2 — Image Quality Check (pure JavaScript, no AI needed).
 *
 * Checks the centre region (inside the guide box) for:
 *  - average brightness (too dark / too bright)
 *  - red dominance (is the conjunctiva actually visible?)
 *
 * Returns { pass: boolean, errorEn, errorTa, avgBrightness, redDominance }
 */
export function checkImageQuality(canvas, region) {
  const imageData = getRegionImageData(canvas, region);
  const { data } = imageData;

  let sumR = 0, sumG = 0, sumB = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    sumR += data[i];
    sumG += data[i + 1];
    sumB += data[i + 2];
  }

  const avgR = sumR / pixelCount;
  const avgG = sumG / pixelCount;
  const avgB = sumB / pixelCount;

  const avgBrightness = (avgR + avgG + avgB) / 3;
  const redDominance = avgR - avgG;

  if (avgBrightness < 80) {
    return {
      pass: false,
      errorEn: 'Too dark. Move to better light.',
      errorTa: 'இருட்டாக உள்ளது. நல்ல வெளிச்சத்திற்கு நகரவும்.',
      avgBrightness,
      redDominance
    };
  }

  if (avgBrightness > 220) {
    return {
      pass: false,
      errorEn: 'Too bright. Avoid direct light.',
      errorTa: 'மிகவும் பிரகாசமாக உள்ளது. நேரடி வெளிச்சத்தை தவிர்க்கவும்.',
      avgBrightness,
      redDominance
    };
  }

  if (redDominance < 15) {
    return {
      pass: false,
      errorEn: 'Eyelid not visible. Please pull down lower eyelid more.',
      errorTa: 'இமை தெரியவில்லை. கீழ் இமையை இன்னும் அதிகமாக இழுக்கவும்.',
      avgBrightness,
      redDominance
    };
  }

  return { pass: true, avgBrightness, redDominance };
}

/**
 * STEP 3 — Pallor Analysis using TensorFlow.js pixel tensor operations.
 *
 * Loads the captured region into a tf.tensor3d([height, width, 3]) and
 * computes channel means with tf.mean — pure numeric/tensor arithmetic,
 * no classifier, no model weights, no network calls.
 *
 * Returns { meanR, meanG, meanB, pallourIndex, ...pallorLevelInfo }
 * where pallorLevelInfo comes from classifyPallourIndex (stage1Scoring.js).
 */
export async function analyzePallor(canvas, region) {
  const imageData = getRegionImageData(canvas, region);

  // tf.browser.fromPixels(imageData, 3) reads the ImageData directly into
  // an int32 tensor of shape [height, width, 3] (RGB, alpha channel
  // automatically dropped). This is pure pixel-tensor I/O — no model.
  const meanTensor = tf.tidy(() => {
    const rgbTensor = tf.browser.fromPixels(imageData, 3);
    return rgbTensor.mean([0, 1]); // shape [3] -> [meanR, meanG, meanB]
  });

  const [meanR, meanG, meanB] = await meanTensor.array();
  meanTensor.dispose();

  const pallourIndex = meanR - ((meanG + meanB) / 2);

  return { meanR, meanG, meanB, pallourIndex };
}

/**
 * Convenience helper: given a full captured canvas and the guide-box
 * region (in canvas pixel coordinates), run the Step 2 quality check
 * and, if it passes, the Step 3 pallor analysis in one call.
 */
export async function analyzeEyeCapture(canvas, region) {
  const quality = checkImageQuality(canvas, region);
  if (!quality.pass) {
    return { quality, pallor: null };
  }
  const pallor = await analyzePallor(canvas, region);
  return { quality, pallor };
}
