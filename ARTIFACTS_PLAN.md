# Artifacts Feature Implementation Plan

## Overview

Artifacts are rich, interactive study documents that appear in a side panel next to the chat. They can contain multiple sections mixing explanations, quiz questions, and flashcards. The LLM can create and update artifacts via tool calls, and users can also manually edit them.

## Artifact Types

### 1. Study Plan
- Checkable list of topics/objectives
- Progress tracking (persisted checkbox state)
- LLM has access to completion status

### 2. Lesson
- Rich markdown content sections
- Embedded quiz questions (using existing question types)
- Multiple sections can be mixed (content → question → content → question)

### 3. Flashcard Set
- Front/back cards
- Study mode with flip interaction
- Simple navigation between cards

## Data Model

### Artifact Schema (`/src/models/Artifact.js`)

```javascript
{
  _id: ObjectId,
  chatId: ObjectId,        // Which chat created this (indexed)
  projectId: ObjectId,     // For project-level access (indexed)
  userId: ObjectId,        // Owner (indexed)

  type: enum ['study_plan', 'lesson', 'flashcards'],
  title: String,
  description: String,     // Brief summary

  // Content varies by type
  content: {
    // For study_plan:
    items: [{
      id: String,
      text: String,
      completed: Boolean,
      children: [{ id, text, completed }]  // Optional nested items
    }],

    // For lesson:
    sections: [{
      id: String,
      type: enum ['content', 'question'],
      // If content:
      content: String,       // Markdown
      // If question:
      question: {
        type: enum ['multiple_choice', 'true_false', 'short_answer', 'fill_blank'],
        question: String,
        options: [{ id, text, isCorrect }],
        correctAnswer: Mixed,
        explanation: String,
        hint: String,
        userAnswer: Mixed,
        answeredAt: Date,
        isCorrect: Boolean
      }
    }],

    // For flashcards:
    cards: [{
      id: String,
      front: String,         // Markdown supported
      back: String,          // Markdown supported
      studied: Boolean,      // For study mode tracking
      lastStudiedAt: Date
    }]
  },

  // Metadata
  status: enum ['active', 'archived'],
  version: Number,          // For optimistic updates
  lastEditedBy: enum ['user', 'assistant'],

  timestamps: { createdAt, updatedAt }
}
```

### Indexes
- `{ chatId, createdAt }` - Load artifacts for a chat
- `{ projectId, status, updatedAt }` - Project artifacts list
- `{ userId, projectId }` - User's project artifacts

## Tool Definitions

### artifact_create
Creates a new artifact with initial content.

```javascript
{
  name: 'artifact_create',
  description: 'Create a new study artifact (lesson, study plan, or flashcards). Use this to create structured, interactive study materials.',
  parameters: z.object({
    type: z.enum(['study_plan', 'lesson', 'flashcards']),
    title: z.string(),
    description: z.string().optional(),
    content: z.object({
      // Varies by type - see schema above
    })
  })
}
```

### artifact_update
Updates an existing artifact (add/edit/remove sections).

```javascript
{
  name: 'artifact_update',
  description: 'Update an existing artifact. Can modify title, add sections, update content, etc.',
  parameters: z.object({
    artifactId: z.string(),
    updates: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      // For lessons - add/update/remove sections
      addSections: z.array(SectionSchema).optional(),
      updateSection: z.object({
        sectionId: z.string(),
        content: z.string().optional(),
        question: QuestionSchema.optional()
      }).optional(),
      removeSection: z.string().optional(),
      // For study plans - add/update items
      addItems: z.array(ItemSchema).optional(),
      updateItem: z.object({ itemId: z.string(), text: z.string() }).optional(),
      // For flashcards - add/update cards
      addCards: z.array(CardSchema).optional(),
      updateCard: z.object({ cardId: z.string(), front: z.string(), back: z.string() }).optional()
    })
  })
}
```

### artifact_delete
Soft-delete an artifact.

```javascript
{
  name: 'artifact_delete',
  description: 'Archive an artifact (soft delete).',
  parameters: z.object({
    artifactId: z.string()
  })
}
```

## API Routes

### `/api/study/artifacts`
- `GET` - List artifacts for a project
- `POST` - Create artifact (used by tool call handler)

### `/api/study/artifacts/[artifactId]`
- `GET` - Get single artifact
- `PATCH` - Update artifact (user edits or tool calls)
- `DELETE` - Archive artifact

### `/api/study/artifacts/[artifactId]/answer`
- `POST` - Submit answer to embedded question
  - Reuses existing grading logic from inline questions

### `/api/study/artifacts/[artifactId]/progress`
- `PATCH` - Update study plan checkboxes or flashcard studied status

## Streaming Events

New SSE event types for artifacts:

```javascript
// Artifact created - opens side panel, adds tab
{ type: 'artifact_created', artifactId: string, artifact: ArtifactObject }

// Artifact content streaming (for lesson content sections)
// Streams content chunk by chunk as LLM generates
{ type: 'artifact_content', artifactId: string, sectionId: string, content: string, append: boolean }

// Artifact section added (new section started)
{ type: 'artifact_section_added', artifactId: string, section: SectionObject }

// Artifact section complete (section finished streaming)
{ type: 'artifact_section_complete', artifactId: string, sectionId: string }

// Artifact updated (for non-streaming updates like title changes)
{ type: 'artifact_updated', artifactId: string, updates: Object }

// Artifact complete (all content finished)
{ type: 'artifact_complete', artifactId: string }

// Artifact deleted
{ type: 'artifact_deleted', artifactId: string }
```

### Streaming Flow for Lessons

1. `artifact_created` - Creates artifact shell, opens panel, adds tab
2. For each section:
   - `artifact_section_added` - Adds section placeholder
   - Multiple `artifact_content` events - Streams content chunks
   - `artifact_section_complete` - Marks section done
3. `artifact_complete` - Marks artifact fully generated

### Tab Behavior
- Each artifact gets its own tab in the side panel
- Tabs auto-switch to the artifact currently being worked on
- User can manually switch tabs while streaming continues in background
- Tabs persist until explicitly closed

## Component Architecture

### StudyModeContext Updates
Add to context:
```javascript
{
  artifacts: [],           // All artifacts for project
  activeArtifactId: null,  // Currently open in side panel
  artifactPanelOpen: false,

  // Actions
  addArtifact(artifact),
  updateArtifact(artifactId, updates),
  removeArtifact(artifactId),
  setActiveArtifact(artifactId),
  openArtifactPanel(),
  closeArtifactPanel(),
}
```

### New Components

#### `/src/components/study/artifacts/`

1. **ArtifactPanel.jsx**
   - Side panel container
   - Header with title, close button
   - Tabs if multiple artifacts open (or list/select)
   - Content area that renders appropriate type

2. **ArtifactCard.jsx**
   - Clickable card shown in chat when artifact is created
   - Shows: type icon, title, brief description
   - Click opens artifact in side panel

3. **LessonArtifact.jsx**
   - Renders lesson type artifacts
   - Maps through sections
   - Content sections: ReactMarkdown
   - Question sections: Reuse `Question.jsx` component

4. **StudyPlanArtifact.jsx**
   - Renders study plan type
   - Checkable items with nested support
   - Updates via API on checkbox change

5. **FlashcardsArtifact.jsx**
   - Renders flashcard set
   - Card flip interaction
   - Study mode: sequential with flip, mark as studied
   - Progress indicator

6. **ArtifactEditor.jsx** (optional, phase 2)
   - Allows user manual editing
   - Inline text editing
   - Add/remove sections

### Text Selection Reference Feature

When user selects text in the chat:
1. Show floating button/tooltip near selection
2. On click, store selection in context
3. Show indicator in ChatInput: "Referencing: '...selected text...'"
4. Include reference in message to LLM
5. Clear on send or explicit dismiss

## UI Layout Changes

### StudyChatClient.jsx
```jsx
<div className="flex h-full">
  {/* Main chat area */}
  <div className={`flex-1 flex flex-col ${artifactPanelOpen ? 'w-1/2' : 'w-full'}`}>
    {/* Messages */}
    {/* Input */}
  </div>

  {/* Artifact side panel */}
  {artifactPanelOpen && (
    <div className="w-1/2 border-l">
      <ArtifactPanel />
    </div>
  )}
</div>
```

### ArtifactCard in Chat
Show card for both creation and updates:
```jsx
{message.artifactActions?.map(action => (
  <ArtifactCard
    key={`${action.artifactId}-${action.type}`}
    artifact={action.artifact}
    actionType={action.type}  // 'created' | 'updated' | 'deleted'
    onClick={() => setActiveArtifact(action.artifactId)}
  />
))}
```

Card displays:
- Type icon (lesson, plan, flashcards)
- Title
- Action badge: "Created" (green) | "Updated" (blue) | "Deleted" (red)
- Brief description or change summary

## System Prompt Updates

Add to `studyModePrompt.js`:

```
## Artifacts

You can create rich, interactive study artifacts using the artifact tools:

### artifact_create
Create structured study materials:
- **study_plan**: Create a plan with checkable items for tracking progress
- **lesson**: Create lessons with content sections and embedded quiz questions
- **flashcards**: Create flashcard sets for memorization

### artifact_update
Modify existing artifacts - add sections, update content, etc.

### When to create artifacts:
- When student asks to "plan" or "create a study plan"
- When creating multi-part lessons with questions
- When student wants flashcards for memorization
- When content would benefit from structured, interactive format

### Best practices:
- Give artifacts clear, descriptive titles
- For lessons, mix explanatory content with practice questions
- For study plans, break down into manageable items
- You can create multiple artifacts at once (e.g., "Lesson 1", "Lesson 2")
```

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create Artifact model
2. Add artifact tools to studyModeTools.js
3. Create artifact API routes
4. Update StudyModeContext with artifact state
5. Basic ArtifactPanel component
6. Wire up streaming events

### Phase 2: Artifact Types
1. LessonArtifact with embedded questions
2. StudyPlanArtifact with checkboxes
3. FlashcardsArtifact with study mode
4. Grading for embedded questions

### Phase 3: Polish & Features
1. ArtifactCard in chat messages
2. Text selection reference feature
3. User editing capabilities
4. Project-level artifacts view
5. Streaming content to artifacts

### Phase 4: Enhancements
1. Artifact versioning/history
2. Export artifacts (PDF, etc.)
3. Share artifacts between projects

## File Changes Summary

### New Files
- `/src/models/Artifact.js`
- `/src/app/api/study/artifacts/route.js`
- `/src/app/api/study/artifacts/[artifactId]/route.js`
- `/src/app/api/study/artifacts/[artifactId]/answer/route.js`
- `/src/app/api/study/artifacts/[artifactId]/progress/route.js`
- `/src/components/study/artifacts/ArtifactPanel.jsx`
- `/src/components/study/artifacts/ArtifactCard.jsx`
- `/src/components/study/artifacts/LessonArtifact.jsx`
- `/src/components/study/artifacts/StudyPlanArtifact.jsx`
- `/src/components/study/artifacts/FlashcardsArtifact.jsx`

### Modified Files
- `/src/utils/ai/studyModeTools.js` - Add artifact tools
- `/src/utils/ai/studyModePrompt.js` - Add artifact instructions
- `/src/components/study/StudyModeContext.jsx` - Add artifact state
- `/src/components/study/StudyChatClient.jsx` - Add side panel layout
- `/src/components/study/MessageBubble.jsx` - Render artifact cards
- `/src/app/api/study/chats/[chatId]/messages/route.js` - Handle artifact tool calls
- `/src/models/index.js` - Export Artifact model
