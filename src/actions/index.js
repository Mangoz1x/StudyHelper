/**
 * Server Actions Index
 *
 * Barrel export for all server actions.
 *
 * Usage:
 * import { createProject, getProjects } from '@/actions';
 */

// Project actions
export {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
} from './projects';

// Material actions
export {
    addTextMaterial,
    addYouTubeMaterial,
    addLinkMaterial,
    getMaterials,
    deleteMaterial,
    updateMaterialOrder,
} from './materials';

// Assessment actions
export {
    generateAssessment,
    getAssessments,
    getAssessment,
    startAssessmentAttempt,
    submitAnswer,
    submitAssessmentAttempt,
    getAttemptResults,
    deleteAssessment,
} from './assessments';

// Study mode actions
export {
    getStudyChats,
    getStudyChat,
    getStudyMessages,
    getStudyMemories,
    deleteStudyChat,
} from './study';
