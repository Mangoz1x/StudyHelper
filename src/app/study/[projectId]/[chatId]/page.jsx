import { getStudyMessages } from '@/actions';
import { StudyChatClient } from '@/components/study';
import { notFound } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Individual Chat Page
 *
 * Displays an existing chat with message history.
 */
export default async function StudyChatPage({ params }) {
    const { projectId, chatId } = await params;

    const messagesResult = await getStudyMessages(chatId);

    if (messagesResult.error === 'Chat not found') {
        notFound();
    }

    const messages = messagesResult.data || [];

    return <StudyChatClient chatId={chatId} initialMessages={messages} />;
}
