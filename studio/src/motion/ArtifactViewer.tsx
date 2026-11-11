import { lazy, Suspense, type ComponentType } from 'react';
import type { ArtifactKind, SessionArtifact } from '../../../shared/session';
import { MotionLoading } from './MotionLoading';

// Add a viewer adapter here when a mode introduces a new artifact kind.
// The session and browser shell do not own the editor's internal state.
const viewers: Record<ArtifactKind, ComponentType> = {
  'motion-project': lazy(() => import('../App').then(module => ({ default: module.StudioApp }))),
};
export function ArtifactViewer({ artifact }: { artifact: SessionArtifact }) {
  const Viewer = viewers[artifact.kind];
  return <Suspense fallback={<MotionLoading />}><Viewer /></Suspense>;
}
