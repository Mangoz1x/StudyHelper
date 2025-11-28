import { getAssessment, startAssessmentAttempt } from '@/actions';
import { AssessmentClient } from './AssessmentClient';
import { notFound } from 'next/navigation';

// Force dynamic rendering since we use headers() in auth
export const dynamic = 'force-dynamic';

/**
 * Assessment Page (Server Component)
 */
export default async function AssessmentPage({ params }) {
    const { projectId, assessmentId } = await params;

    // Get assessment without answers (for taking)
    const assessmentResult = await getAssessment(assessmentId, false);

    if (assessmentResult.error === 'Assessment not found') {
        notFound();
    }

    // Start or resume an attempt
    const attemptResult = await startAssessmentAttempt(assessmentId);

    return (
        <AssessmentClient
            assessment={assessmentResult.data}
            attempt={attemptResult.data}
            projectId={projectId}
            error={assessmentResult.error || attemptResult.error}
        />
    );
}
