import { auth } from '@/auth';
import { Artifact } from '@/models';
import { connectDB } from '@/utils/clients';

/**
 * PATCH /api/study/artifacts/[artifactId]/progress
 *
 * Update progress on artifacts (checkboxes for study plans, studied status for flashcards)
 *
 * Body:
 * For study_plan:
 * - itemId: string - The item ID to toggle
 * - childId?: string - Optional child item ID (for nested items)
 * - completed: boolean - New completion status
 *
 * For flashcards:
 * - cardId: string - The card ID
 * - studied: boolean - Whether the card has been studied
 */
export async function PATCH(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { artifactId } = await params;
        const body = await request.json();

        await connectDB();

        // Fetch the artifact
        const artifact = await Artifact.findOne({
            _id: artifactId,
            userId: session.user.id,
        });

        if (!artifact) {
            return Response.json({ error: 'Artifact not found' }, { status: 404 });
        }

        let updateObj = { $set: { lastEditedBy: 'user' } };

        if (artifact.type === 'study_plan') {
            const { itemId, childId, completed } = body;

            if (!itemId || completed === undefined) {
                return Response.json(
                    { error: 'itemId and completed are required' },
                    { status: 400 }
                );
            }

            const itemIndex = artifact.content.items.findIndex((i) => i.id === itemId);
            if (itemIndex === -1) {
                return Response.json({ error: 'Item not found' }, { status: 404 });
            }

            if (childId) {
                // Update nested child item
                const childIndex = artifact.content.items[itemIndex].children?.findIndex(
                    (c) => c.id === childId
                );
                if (childIndex === -1) {
                    return Response.json({ error: 'Child item not found' }, { status: 404 });
                }
                updateObj.$set[`content.items.${itemIndex}.children.${childIndex}.completed`] =
                    completed;
                if (completed) {
                    updateObj.$set[`content.items.${itemIndex}.children.${childIndex}.completedAt`] =
                        new Date();
                } else {
                    updateObj.$unset = updateObj.$unset || {};
                    updateObj.$unset[
                        `content.items.${itemIndex}.children.${childIndex}.completedAt`
                    ] = '';
                }
            } else {
                // Update top-level item
                updateObj.$set[`content.items.${itemIndex}.completed`] = completed;
                if (completed) {
                    updateObj.$set[`content.items.${itemIndex}.completedAt`] = new Date();
                } else {
                    updateObj.$unset = updateObj.$unset || {};
                    updateObj.$unset[`content.items.${itemIndex}.completedAt`] = '';
                }
            }
        } else if (artifact.type === 'flashcards') {
            const { cardId, studied } = body;

            if (!cardId || studied === undefined) {
                return Response.json({ error: 'cardId and studied are required' }, { status: 400 });
            }

            const cardIndex = artifact.content.cards.findIndex((c) => c.id === cardId);
            if (cardIndex === -1) {
                return Response.json({ error: 'Card not found' }, { status: 404 });
            }

            updateObj.$set[`content.cards.${cardIndex}.studied`] = studied;
            if (studied) {
                updateObj.$set[`content.cards.${cardIndex}.lastStudiedAt`] = new Date();
            }
        } else {
            return Response.json(
                { error: 'Progress updates only supported for study_plan and flashcards' },
                { status: 400 }
            );
        }

        // Perform update
        await Artifact.updateOne({ _id: artifactId }, updateObj);

        // Fetch updated artifact
        const updatedArtifact = await Artifact.findById(artifactId).lean();

        return Response.json({
            data: {
                ...updatedArtifact,
                id: updatedArtifact._id.toString(),
                _id: updatedArtifact._id.toString(),
            },
        });
    } catch (error) {
        console.error('[Artifact Progress] PATCH error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
