import { getAttemptResults } from '@/actions';
import { ResultsClient } from './ResultsClient';
import { notFound } from 'next/navigation';

/**
 * Assessment Results Page (Server Component)
 */
export default async function ResultsPage({ params }) {
    const { projectId, assessmentId, attemptId } = await params;

    const result = await getAttemptResults(attemptId);

    if (result.error === 'Attempt not found') {
        notFound();
    }

    return (
        <ResultsClient
            results={result.data}
            projectId={projectId}
            assessmentId={assessmentId}
            attemptId={attemptId}
            error={result.error}
        />
    );
}
