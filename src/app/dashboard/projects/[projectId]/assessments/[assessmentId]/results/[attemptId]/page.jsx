import { getAttemptResults } from '@/actions';
import { ResultsClient } from './ResultsClient';
import { notFound } from 'next/navigation';

// Force dynamic rendering since we use headers() in auth
export const dynamic = 'force-dynamic';

/**
 * Assessment Results Page (Server Component)
 */
export default async function ResultsPage({ params, searchParams }) {
    const { projectId, assessmentId, attemptId } = await params;
    const resolvedSearchParams = await searchParams;

    // If grading is in progress, skip fetching results and let client handle it
    if (resolvedSearchParams?.grading === 'true') {
        return (
            <ResultsClient
                results={null}
                projectId={projectId}
                assessmentId={assessmentId}
                attemptId={attemptId}
                error={null}
            />
        );
    }

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
