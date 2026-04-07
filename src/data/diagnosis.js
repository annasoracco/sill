// Plant diagnosis using Azure OpenAI GPT-4o vision
// Analyzes a photo of a struggling plant and returns a diagnosis with action steps

const AZURE_ENDPOINT = 'https://eastus.api.cognitive.microsoft.com';
const DEPLOYMENT_NAME = 'gpt-4o';
const API_VERSION = '2024-10-21';
const API_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY || '';

const SYSTEM_PROMPT = `You are a friendly, expert plant doctor. A user is showing you a photo of their houseplant because something looks wrong. Examine the photo carefully for signs of trouble: yellowing, browning, wilting, spots, pests, leggy growth, leaf drop, mold, or any other issue.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "diagnosis": "A clear, concise name for the likely issue (e.g. 'Overwatering' or 'Root Rot')",
  "confidence": "high" | "medium" | "low",
  "urgency": "urgent" | "moderate" | "low",
  "explanation": "2-3 sentences explaining what you see in the photo and what is likely happening, written in a warm and friendly tone.",
  "causes": ["cause 1", "cause 2"],
  "actions": [
    {
      "step": "What to do",
      "detail": "Brief explanation of how to do it"
    }
  ],
  "prevention": "A sentence about how to prevent this in the future."
}

If the plant looks healthy, set diagnosis to "Looking Good!" with urgency "low" and explain what you see.
Keep it practical and encouraging. Limit to 3-5 action steps.`;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function buildUserMessage(plant, description, imageBase64) {
  const plantContext = [
    `Plant: ${plant.name}`,
    plant.species ? `Species: ${plant.species}` : null,
    plant.room ? `Room: ${plant.room}` : null,
    plant.lightNeeds ? `Light: ${plant.lightNeeds}` : null,
    plant.wateringFrequencyDays ? `Watering: every ${plant.wateringFrequencyDays} days` : null,
  ].filter(Boolean).join(', ');

  const textParts = [`Here's a photo of my plant. ${plantContext}.`];
  if (description) textParts.push(description);
  textParts.push('What do you see? Is something wrong?');

  return [
    { type: 'text', text: textParts.join(' ') },
    { type: 'image_url', image_url: { url: imageBase64, detail: 'high' } },
  ];
}

/**
 * Diagnose a plant from a photo.
 * Accepts either a File object (new upload) or uses the plant's existing photoURL.
 */
export async function diagnosePlant(plant, photoFile, description) {
  let imageBase64;
  if (photoFile) {
    imageBase64 = await fileToBase64(photoFile);
  } else if (plant.photoURL) {
    imageBase64 = await fetchImageAsBase64(plant.photoURL);
  } else {
    throw new Error('No photo available. Please upload a photo to diagnose.');
  }

  const url = `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': API_KEY,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(plant, description, imageBase64) },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Diagnosis API error:', response.status, errorText);
    throw new Error(`Diagnosis failed (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from diagnosis service');
  }

  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
