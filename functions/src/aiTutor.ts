import * as functions from "firebase-functions";
// import * as logger from "firebase-functions/logger";
import { genkit, z } from "genkit";
import { firebase } from "@genkit-ai/firebase"; // If using Firebase plugin for Genkit
import { googleAI } from "@genkit-ai/googleai"; // Or your preferred AI model plugin
// import { openai } from "@genkit-ai/openai"; // Example if using OpenAI

// Ensure Genkit is configured. This might be in a separate genkitSetup.ts or here.
// If not already initialized globally (e.g. in index.ts or a setup file)
if (!genkit.isConfigured()) {
  genkit.configure({
    plugins: [
      firebase(), // For Firebase integration (e.g., auth context in flows)
      googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }),
      // openai({ apiKey: process.env.OPENAI_API_KEY }),
    ],
    logLevel: "debug",
    enableTracingAndMetrics: true,
  });
}

// --- Define Genkit Schemas (Input/Output for the flow) ---
const HomeworkHelpInputSchema = z.object({
  questionText: z.string().optional().describe("The text of the homework question."),
  imageDataUri: z.string().optional().describe("A base64 encoded image of the homework as a data URI."),
  userId: z.string().describe("The ID of the user requesting help."), // For context/personalization
});
type HomeworkHelpInput = z.infer<typeof HomeworkHelpInputSchema>;

const HomeworkHelpOutputSchema = z.object({
  answerText: z.string().describe("The AI-generated answer or explanation."),
  // You could add more fields like `steps`, `relatedConcepts`, etc.
});
type HomeworkHelpOutput = z.infer<typeof HomeworkHelpOutputSchema>;


// --- Define Genkit Prompt ---
const homeworkHelperPrompt = genkit.definePrompt({
  name: "homeworkHelperPrompt",
  model: "googleai/gemini-1.5-flash-latest", // Specify your desired model
  input: { schema: HomeworkHelpInputSchema },
  output: { schema: HomeworkHelpOutputSchema },
  prompt: (input: HomeworkHelpInput) => {
    let promptText = `You are Orbii, a kind, patient, and highly intelligent AI tutor for the KindMind Learning app.
Your purpose is to help students—especially neurodiverse learners and those with autism—understand, explore, and master academic subjects.
Always maintain a friendly, teacher-like tone with plenty of positive encouragement. Keep explanations clear, step-by-step.

A student (User ID: ${input.userId}) needs help with the following:
`;
    if (input.questionText) {
      promptText += `Question: ${input.questionText}\n`;
    }
    if (input.imageDataUri) {
      promptText += `Image: {{media url=${input.imageDataUri}}}\n`;
      promptText += `Please analyze the image and the question (if any) and provide a step-by-step explanation to help the student understand. If it's a math problem, show the steps to solve it.`;
    } else {
      promptText += `Please provide a clear explanation for the question.`;
    }
    return promptText;
  },
});

// --- Define Genkit Flow ---
const getHomeworkHelpFlow = genkit.defineFlow(
  {
    name: "getHomeworkHelpFlow",
    inputSchema: HomeworkHelpInputSchema,
    outputSchema: HomeworkHelpOutputSchema,
  },
  async (input) => {
    const llmResponse = await homeworkHelperPrompt.generate({ input });
    return llmResponse.output() || { answerText: "Sorry, I couldn't generate an answer right now." };
  }
);

// --- Firebase Callable Function ---
export const getHomeworkHelp = functions.https.onCall(async (data, context) => {
  // Authenticate the user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Validate input data (Zod can be used here too on the raw 'data' object if preferred)
  const { questionText, imageDataUri } = data as { questionText?: string, imageDataUri?: string };

  if (!questionText && !imageDataUri) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Please provide either a question text or an image."
    );
  }

  try {
    const result = await getHomeworkHelpFlow.run({
      questionText,
      imageDataUri,
      userId: context.auth.uid,
    });
    return result;
  } catch (error) {
    functions.logger.error("Error in getHomeworkHelp flow:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while processing your request.",
      error
    );
  }
});


// TODO: Implement other AI-related flows and callable functions:
// - generateLessonPlan(studentId, topic, learningStyle)
// - generateProgressReport(studentId, sessionData)
// - handleChatMessage(userId, messageText, chatId) (for real-time chat responses)

// Example for Lesson Plan (scaffold)
const LessonPlanInputSchema = z.object({
  studentId: z.string(),
  topic: z.string(),
  learningStyle: z.string().optional(),
  // add current grades, strengths, struggles
});
const LessonPlanOutputSchema = z.object({
  plan: z.string(), // HTML or Markdown formatted lesson plan
});

const generateLessonPlanFlow = genkit.defineFlow(
  {
    name: "generateLessonPlanFlow",
    inputSchema: LessonPlanInputSchema,
    outputSchema: LessonPlanOutputSchema,
    // Define prompt or use other Genkit tools
  },
  async (input) => {
    // Placeholder - implement actual LLM call
    return { plan: `Lesson plan for ${input.topic} tailored for ${input.studentId}...` };
  }
);

export const generateLessonPlanCallable = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  // Validate data
  const { studentId, topic, learningStyle } = data as z.infer<typeof LessonPlanInputSchema>; // Basic validation

  try {
    return await generateLessonPlanFlow.run({ studentId: studentId || context.auth.uid, topic, learningStyle });
  } catch (error) {
    functions.logger.error("Error generating lesson plan:", error);
    throw new functions.https.HttpsError("internal", "Failed to generate lesson plan.");
  }
});
