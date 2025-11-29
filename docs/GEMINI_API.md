# Gemini API Usage Guide

This document covers best practices for using the Gemini API in this project, including structured outputs, function calling, thinking/reasoning, and streaming.

## Table of Contents

- [Client Setup](#client-setup)
- [Basic Generation](#basic-generation)
- [Structured Outputs with Zod](#structured-outputs-with-zod)
- [Function Calling (Tools)](#function-calling-tools)
- [Thinking and Reasoning](#thinking-and-reasoning)
- [Streaming](#streaming)
- [File Handling](#file-handling)
- [Best Practices](#best-practices)

---

## Client Setup

The Gemini client is initialized lazily in `/src/utils/clients/gemini.js`:

```javascript
import { GoogleGenAI } from '@google/genai';

let instance = null;

export const getGemini = () => {
    if (!instance) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is not defined');
        }
        instance = new GoogleGenAI({ apiKey });
    }
    return instance;
};
```

### Available Models

```javascript
export const GEMINI_MODELS = {
    PRO: 'gemini-3-pro-preview',           // Best for complex reasoning, 1M context
    PRO_IMAGE: 'gemini-3-pro-image-preview', // Image generation and editing
    FLASH_25: 'gemini-2.5-flash',          // Fast performance
    FLASH_LITE_25: 'gemini-2.5-flash-lite', // Cost-efficient
};
```

---

## Basic Generation

### Simple Text Generation

```javascript
import { generateContent, GEMINI_MODELS } from '@/utils/clients';

const response = await generateContent({
    prompt: 'Explain photosynthesis in simple terms',
    model: GEMINI_MODELS.PRO,
});

// Access the response text
const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
```

### With Streaming

```javascript
const stream = await generateContent({
    prompt: 'Write a detailed essay...',
    model: GEMINI_MODELS.PRO,
    stream: true,
});

for await (const chunk of stream) {
    const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
        process.stdout.write(text);
    }
}
```

---

## Structured Outputs with Zod

Use structured outputs when you need **guaranteed JSON schema compliance** for the entire response.

### Defining a Schema

```javascript
import { z } from 'zod';

const AssessmentSchema = z.object({
    title: z.string().describe('Title of the assessment'),
    description: z.string().describe('Brief description'),
    questions: z.array(z.object({
        type: z.enum(['multiple_choice', 'true_false', 'short_answer'])
            .describe('Type of question'),
        question: z.string().describe('The question text'),
        options: z.array(z.object({
            id: z.string(),
            text: z.string(),
            isCorrect: z.boolean(),
        })).optional(),
        correctAnswer: z.string(),
        explanation: z.string(),
    })),
});
```

### Using the Schema

```javascript
const response = await generateContent({
    prompt: 'Create a quiz about biology',
    model: GEMINI_MODELS.PRO,
    responseSchema: AssessmentSchema,  // Guarantees JSON output matching schema
});

// Response is guaranteed to be valid JSON matching the schema
const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
const data = JSON.parse(text);
```

### With Streaming

```javascript
const stream = await generateContent({
    prompt: 'Create a quiz about biology',
    responseSchema: AssessmentSchema,
    stream: true,
});

let jsonBuffer = '';
for await (const chunk of stream) {
    const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
        jsonBuffer += text;
    }
}

const data = JSON.parse(jsonBuffer);
```

### Schema Best Practices

1. **Use `.describe()` on every field** - Helps the model understand what to generate
2. **Use enums for constrained values** - `z.enum(['a', 'b', 'c'])`
3. **Keep schemas relatively flat** - Deeply nested optional objects can confuse the model
4. **Avoid union types when possible** - `z.union([...])` can be ambiguous

---

## Function Calling (Tools)

Use function calling when:
- The model should **decide when** to call a function
- You need **mixed output** (text + function calls)
- Functions represent **actions** the model can take

### Defining Tools

```javascript
import { z } from 'zod';

const TOOLS = {
    create_memory: {
        name: 'create_memory',
        description: 'Save an important observation about the user',
        parameters: z.object({
            content: z.string().describe('The memory content'),
            category: z.enum(['preference', 'goal', 'context'])
                .describe('Category of the memory'),
        }),
    },
    create_flashcards: {
        name: 'create_flashcards',
        description: 'Create a set of flashcards for studying',
        parameters: z.object({
            title: z.string().describe('Title of the flashcard set'),
            cards: z.array(z.object({
                id: z.string(),
                front: z.string(),
                back: z.string(),
            })),
        }),
    },
};
```

### Building Function Declarations

```javascript
function buildFunctionDeclarations() {
    return Object.values(TOOLS).map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: z.toJSONSchema(tool.parameters),
    }));
}
```

### Using Tools with generateContent

```javascript
const functionDeclarations = buildFunctionDeclarations();

const stream = await generateContent({
    prompt: 'Help me study biology',
    model: GEMINI_MODELS.PRO,
    stream: true,
    tools: [{ functionDeclarations }],
});

let textBuffer = '';
const toolCalls = [];

for await (const chunk of stream) {
    const parts = chunk.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
        // Handle text
        if (part.text) {
            textBuffer += part.text;
        }

        // Handle function calls
        if (part.functionCall) {
            toolCalls.push({
                name: part.functionCall.name,
                args: part.functionCall.args,
            });
        }
    }
}

// Process tool calls
for (const call of toolCalls) {
    if (call.name === 'create_memory') {
        await saveMemory(call.args);
    } else if (call.name === 'create_flashcards') {
        await createFlashcards(call.args);
    }
}
```

### Function Calling Best Practices

1. **Separate tools by purpose** - Instead of one tool with many optional fields, create separate tools
   ```javascript
   // BAD: One complex tool
   artifact_create: { type: 'study_plan' | 'lesson' | 'flashcards', ... }

   // GOOD: Separate simple tools
   artifact_create_study_plan: { items: [...] }
   artifact_create_lesson: { sections: [...] }
   artifact_create_flashcards: { cards: [...] }
   ```

2. **Keep to 10-20 tools max** - More tools increase latency and confusion

3. **Use clear, specific descriptions** - The model uses descriptions to decide when to call

4. **Validate tool calls** - Always validate the returned args against your schema
   ```javascript
   const validated = TOOLS[call.name].parameters.parse(call.args);
   ```

---

## Thinking and Reasoning

Gemini 3 supports "thinking" - exposing the model's reasoning process.

### Thinking Levels

```javascript
export const THINKING_LEVELS = {
    LOW: 'low',   // Minimizes latency/cost, best for simple tasks
    HIGH: 'high', // Maximizes reasoning depth (default)
};
```

### Enabling Thinking

```javascript
const response = await generateContent({
    prompt: 'Solve this complex math problem...',
    model: GEMINI_MODELS.PRO,
    thinkingLevel: THINKING_LEVELS.HIGH,
});
```

### Streaming Thought Summaries

To see the model's reasoning as it streams:

```javascript
const stream = await generateContent({
    prompt: 'Analyze this research paper...',
    model: GEMINI_MODELS.PRO,
    thinkingLevel: THINKING_LEVELS.LOW,
    includeThoughts: true,  // Enable streaming thought summaries
    stream: true,
});

let textBuffer = '';
let thinkingBuffer = '';

for await (const chunk of stream) {
    const parts = chunk.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
        if (part.text && part.thought) {
            // This is a thinking/reasoning chunk
            thinkingBuffer += part.text;
            console.log('Thinking:', part.text);
        } else if (part.text) {
            // This is regular response content
            textBuffer += part.text;
            console.log('Response:', part.text);
        }
    }
}
```

### Displaying Thinking in UI

```jsx
// Stream thinking events to client
onProgress: (progress) => {
    if (progress.type === 'thinking') {
        sendSSE('thinking', { content: progress.content });
    } else if (progress.type === 'content') {
        sendSSE('content', { content: progress.content });
    }
}

// In React component - collapsible thinking preview
{hasThinking && (
    <div className="mb-2">
        <button onClick={() => setShowThinking(!showThinking)}>
            <Brain className="w-4 h-4" />
            {isStreaming ? 'Thinking...' : 'View reasoning'}
        </button>
        {showThinking && (
            <div className="p-3 bg-amber-50 rounded-lg">
                {message.thinking}
            </div>
        )}
    </div>
)}
```

---

## Streaming

### Basic Streaming Pattern

```javascript
const stream = await generateContent({
    prompt: 'Your prompt here',
    stream: true,
});

for await (const chunk of stream) {
    // Check finish reason
    const finishReason = chunk.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        console.log('Finish reason:', finishReason);
    }

    // Process parts
    const parts = chunk.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        if (part.text) {
            // Text content
        }
        if (part.functionCall) {
            // Function call
        }
        if (part.thought) {
            // Thinking content (if includeThoughts: true)
        }
    }
}
```

### Server-Sent Events (SSE) Pattern

```javascript
// In API route
const encoder = new TextEncoder();
const stream = new ReadableStream({
    async start(controller) {
        const sendSSE = (type, data) => {
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
            );
        };

        const aiStream = await generateContent({
            prompt,
            stream: true,
            onProgress: (progress) => {
                sendSSE(progress.type, { content: progress.content });
            },
        });

        // ... process stream

        sendSSE('complete', {});
        controller.close();
    },
});

return new Response(stream, {
    headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    },
});
```

### Client-Side SSE Handling

```javascript
const res = await fetch('/api/chat', { method: 'POST', body: ... });
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            const parsed = JSON.parse(data);
            switch (parsed.type) {
                case 'content':
                    // Append to message
                    break;
                case 'thinking':
                    // Update thinking preview
                    break;
                case 'tool_call':
                    // Handle tool call
                    break;
            }
        }
    }
}
```

---

## File Handling

### Uploading Files

```javascript
import { uploadFile, waitForFileProcessing } from '@/utils/clients';

// Upload a file
const uploadedFile = await uploadFile({
    file: buffer,  // Buffer, Blob, or file path
    mimeType: 'application/pdf',
    displayName: 'My Document.pdf',
});

// For videos/audio, wait for processing
const processedFile = await waitForFileProcessing(uploadedFile.name);
```

### Using Files in Generation

```javascript
const response = await generateContent({
    prompt: 'Summarize this document',
    files: [
        {
            type: 'file',
            uri: processedFile.uri,
            mimeType: processedFile.mimeType,
        },
    ],
});
```

### YouTube Videos

```javascript
const response = await generateContent({
    prompt: 'What topics are covered in this video?',
    files: [
        {
            type: 'youtube',
            url: 'https://www.youtube.com/watch?v=...',
        },
    ],
});
```

### Supported MIME Types

```javascript
export const SUPPORTED_MIME_TYPES = {
    images: ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'],
    videos: ['video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/webm'],
    audio: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aac', 'audio/ogg'],
    documents: ['application/pdf', 'text/plain', 'text/html', 'application/json'],
};
```

---

## Best Practices

### 1. Schema Design

| Do | Don't |
|---|---|
| Use flat schemas | Deeply nest optional objects |
| Use enums for constrained values | Use free-form strings for categories |
| Add `.describe()` to all fields | Leave fields undocumented |
| Split complex tools into simple ones | Create one tool with many optional fields |

### 2. Error Handling

```javascript
try {
    const stream = await generateContent({ ... });

    for await (const chunk of stream) {
        const finishReason = chunk.candidates?.[0]?.finishReason;

        // Handle non-STOP finish reasons
        if (finishReason === 'SAFETY') {
            throw new Error('Response blocked by safety filters');
        }
        if (finishReason === 'MAX_TOKENS') {
            console.warn('Response truncated due to max tokens');
        }

        // Process chunk...
    }
} catch (error) {
    if (error.message.includes('quota')) {
        // Handle rate limiting
    }
    throw error;
}
```

### 3. Prompt Engineering

```javascript
// Good: Clear structure with examples
const prompt = `You are a study tutor.

## Your Tools
- create_flashcards: Create flashcard sets
- create_lesson: Create comprehensive lessons

## Guidelines
1. Always include a text response with tool calls
2. Keep explanations concise

## Example Response
"I've created a flashcard set covering the key terms..."

Conversation:
${messages}

Tutor:`;
```

### 4. Performance Optimization

- Use `THINKING_LEVELS.LOW` for simple tasks
- Use `GEMINI_MODELS.FLASH_25` for speed-critical paths
- Batch multiple related requests when possible
- Cache file uploads (files persist for 48 hours)

### 5. Structured Outputs vs Function Calling

| Use Structured Outputs When | Use Function Calling When |
|---|---|
| Entire response must be JSON | Model decides when to call functions |
| No text explanation needed | Need mixed text + actions |
| Extracting data from content | Model should take actions |
| Response format is fixed | Response format varies |

### 6. Validating and Normalizing LLM Output

Always validate and normalize function call arguments:

```javascript
function normalizeArtifactContent(type, content) {
    if (type === 'lesson' && content.sections) {
        return {
            ...content,
            sections: content.sections.map((section, idx) => ({
                id: section.id || `section-${idx}`,
                type: section.type === 'multiple_choice' ? 'question' : section.type,
                // ... normalize other fields
            })),
        };
    }
    return content;
}
```

---

## References

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Function Calling Guide](https://ai.google.dev/gemini-api/docs/function-calling)
- [Structured Output Guide](https://ai.google.dev/gemini-api/docs/structured-output)
- [Thinking Guide](https://ai.google.dev/gemini-api/docs/thinking)
- [File API Guide](https://ai.google.dev/gemini-api/docs/files)
