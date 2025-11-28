/**
 * Models Index
 *
 * Barrel export for all Mongoose models.
 * Always use named imports for models.
 *
 * Usage:
 * import { User, Account, Project, Material } from '@/models';
 */

// Auth models
export { User } from './User';
export { Account } from './Account';
export { Session } from './Session';
export { VerificationToken } from './VerificationToken';

// Application models
export { Project } from './Project';
export { Material } from './Material';
export { Assessment } from './Assessment';
export { AssessmentAttempt } from './AssessmentAttempt';

// Study mode models
export { StudyChat } from './StudyChat';
export { StudyMessage } from './StudyMessage';
export { StudyMemory } from './StudyMemory';
export { Artifact } from './Artifact';
