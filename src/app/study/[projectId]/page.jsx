import { StudyChatClient } from '@/components/study';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Study Mode Entry Page
 *
 * Shows the new chat interface (empty state).
 * When user sends first message, a new chat is created.
 */
export default async function StudyModePage({ params }) {
    const { projectId } = await params;

    return <StudyChatClient chatId={null} initialMessages={[]} />;
}
