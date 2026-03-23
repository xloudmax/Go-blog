import { MechanismNode } from '../generated/graphql';

/**
 * Represents an analogical cue for a mechanism node.
 */
export interface AnalogicalCue {
  domain: string;
  context: string;
  example: string;
  strategy: string;
}

/**
 * Data passed to the React Flow node.
 */
export interface MechanismNodeData extends Record<string, unknown> {
  title: string;
  active_ingredient?: string | null;
  communityId?: number | null;
  applications?: AnalogicalCue[];
  isRoot: boolean;
  isMechanism: boolean;
}

/**
 * Extends the generated MechanismNode with frontend-specific metadata.
 */
export interface ExtendedMechanismNode extends MechanismNode {
  community_id?: number;
  children?: ExtendedMechanismNode[];
  applications?: AnalogicalCue[];
}
