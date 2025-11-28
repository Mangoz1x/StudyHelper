import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Artifact } from '@/models';
import { connectDB } from '@/utils/clients';

/**
 * GET /api/study/artifacts/[artifactId]
 *
 * Get a single artifact
 */
export async function GET(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { artifactId } = await params;

        await connectDB();

        const artifact = await Artifact.findOne({
            _id: artifactId,
            userId: session.user.id,
        }).lean();

        if (!artifact) {
            return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
        }

        return NextResponse.json({
            data: {
                ...artifact,
                id: artifact._id.toString(),
                _id: artifact._id.toString(),
                chatId: artifact.chatId?.toString(),
                projectId: artifact.projectId?.toString(),
            },
        });
    } catch (error) {
        console.error('[Artifacts] Get error:', error);
        return NextResponse.json({ error: 'Failed to fetch artifact' }, { status: 500 });
    }
}

/**
 * PATCH /api/study/artifacts/[artifactId]
 *
 * Update an artifact
 */
export async function PATCH(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { artifactId } = await params;
        const body = await request.json();

        await connectDB();

        // Fetch current artifact
        const artifact = await Artifact.findOne({
            _id: artifactId,
            userId: session.user.id,
        });

        if (!artifact) {
            return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
        }

        // Build update object
        const updateObj = {
            $set: {
                version: artifact.version + 1,
                lastEditedBy: body.editedBy || 'user',
            },
        };

        // Handle metadata updates
        if (body.title) updateObj.$set.title = body.title;
        if (body.description !== undefined) updateObj.$set.description = body.description;
        if (body.status) updateObj.$set.status = body.status;

        // Handle content updates based on type
        const { updates } = body;
        if (updates) {
            // Lesson section operations
            if (updates.addSections && artifact.type === 'lesson') {
                updateObj.$push = updateObj.$push || {};
                updateObj.$push['content.sections'] = { $each: updates.addSections };
            }
            if (updates.updateSection && artifact.type === 'lesson') {
                const sectionIndex = artifact.content.sections.findIndex(
                    (s) => s.id === updates.updateSection.sectionId
                );
                if (sectionIndex !== -1) {
                    if (updates.updateSection.content !== undefined) {
                        updateObj.$set[`content.sections.${sectionIndex}.content`] =
                            updates.updateSection.content;
                    }
                }
            }
            if (updates.removeSection && artifact.type === 'lesson') {
                updateObj.$pull = updateObj.$pull || {};
                updateObj.$pull['content.sections'] = { id: updates.removeSection };
            }

            // Study plan item operations
            if (updates.addItems && artifact.type === 'study_plan') {
                updateObj.$push = updateObj.$push || {};
                updateObj.$push['content.items'] = { $each: updates.addItems };
            }
            if (updates.updateItem && artifact.type === 'study_plan') {
                const itemIndex = artifact.content.items.findIndex(
                    (i) => i.id === updates.updateItem.itemId
                );
                if (itemIndex !== -1) {
                    updateObj.$set[`content.items.${itemIndex}.text`] = updates.updateItem.text;
                }
            }
            if (updates.removeItem && artifact.type === 'study_plan') {
                updateObj.$pull = updateObj.$pull || {};
                updateObj.$pull['content.items'] = { id: updates.removeItem };
            }

            // Flashcard operations
            if (updates.addCards && artifact.type === 'flashcards') {
                updateObj.$push = updateObj.$push || {};
                updateObj.$push['content.cards'] = { $each: updates.addCards };
            }
            if (updates.updateCard && artifact.type === 'flashcards') {
                const cardIndex = artifact.content.cards.findIndex(
                    (c) => c.id === updates.updateCard.cardId
                );
                if (cardIndex !== -1) {
                    if (updates.updateCard.front !== undefined) {
                        updateObj.$set[`content.cards.${cardIndex}.front`] = updates.updateCard.front;
                    }
                    if (updates.updateCard.back !== undefined) {
                        updateObj.$set[`content.cards.${cardIndex}.back`] = updates.updateCard.back;
                    }
                }
            }
            if (updates.removeCard && artifact.type === 'flashcards') {
                updateObj.$pull = updateObj.$pull || {};
                updateObj.$pull['content.cards'] = { id: updates.removeCard };
            }
        }

        // Perform update
        const updatedArtifact = await Artifact.findByIdAndUpdate(artifactId, updateObj, {
            new: true,
        }).lean();

        return NextResponse.json({
            data: {
                ...updatedArtifact,
                id: updatedArtifact._id.toString(),
                _id: updatedArtifact._id.toString(),
                chatId: updatedArtifact.chatId?.toString(),
                projectId: updatedArtifact.projectId?.toString(),
            },
        });
    } catch (error) {
        console.error('[Artifacts] Update error:', error);
        return NextResponse.json({ error: 'Failed to update artifact' }, { status: 500 });
    }
}

/**
 * DELETE /api/study/artifacts/[artifactId]
 *
 * Archive (soft delete) an artifact
 */
export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { artifactId } = await params;

        await connectDB();

        const artifact = await Artifact.findOneAndUpdate(
            { _id: artifactId, userId: session.user.id },
            { $set: { status: 'archived' } },
            { new: true }
        );

        if (!artifact) {
            return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Artifacts] Delete error:', error);
        return NextResponse.json({ error: 'Failed to delete artifact' }, { status: 500 });
    }
}
