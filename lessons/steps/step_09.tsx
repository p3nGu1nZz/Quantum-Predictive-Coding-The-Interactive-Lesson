import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step09: LessonStep = {
    title: "9. Vector Forces",
    content: null,
    subsections: [
        { at: 0, title: "Vectors", content: <p>We are not dealing with vague "influences" here. We are dealing with <strong>Vectors</strong>. In physics, a vector is a quantity that has both a magnitude (how strong it is) and a direction (where it is going).</p> },
        { at: 30, title: "Geometry", content: <div className="space-y-4">
            <p>Every force in this simulation—every urge to predict, every correction of error—is a vector. This is important because scalar numbers (just magnitude) can simply add up to a mess. But vectors? Vectors have geometry. Vectors can oppose each other.</p>
        </div>},
        { at: 60, title: "Conflict Resolution", content: <div className="space-y-4">
            <p>Imagine two conflicting pieces of evidence. One says "Turn Left," the other says "Turn Right." In a simple system, these might average out to "Go Straight," which could be disastrous. But in a vector system, the Force North and the Force South can preserve their identities while interacting. They can create tension.</p>
        </div>},
        { at: 80, title: "Intentionality", content: <div className="space-y-4">
             <p>They can create a "null space" where the forces perfectly cancel out, creating a moment of hesitation. This vector nature prevents information from spreading out like a diffuse gas. Instead, it propagates with intention, driving the system along specific trajectories.</p>
        </div>}
    ],
    config: p({ k: 0.05 }), setup: 'fluid_flow', symbols: [],
    script: [ 
        { at: 10, type: 'highlight', targetId: 'all', label: "Vectors" }, 
        { at: 35, type: 'force', targetId: 'all', vector: {x: -3, y: 0}, label: "Turn Left" }, 
        { at: 45, type: 'force', targetId: 'all', vector: {x: 3, y: 0}, label: "Turn Right" }, 
        { at: 65, type: 'reset', label: "Null Space" },
        { at: 85, type: 'force', targetId: 'all', vector: {x: 0, y: 5}, label: "Trajectory" }
    ],
    narration: "We are not dealing with vague \"influences\" here. We are dealing with Vectors. In physics, a vector is a quantity that has both a magnitude (how strong it is) and a direction (where it is going). Every force in this simulation—every urge to predict, every correction of error—is a vector. This is important because scalar numbers (just magnitude) can simply add up to a mess. But vectors? Vectors have geometry. Vectors can oppose each other. Imagine two conflicting pieces of evidence. One says \"Turn Left,\" the other says \"Turn Right.\" In a simple system, these might average out to \"Go Straight,\" which could be disastrous. But in a vector system, the Force North and the Force South can preserve their identities while interacting. They can create tension. They can create a \"null space\" where the forces perfectly cancel out, creating a moment of hesitation, a \"saddle point\" in the decision landscape. This vector nature prevents information from spreading out like a diffuse gas. Instead, it propagates with intention. It drives the system along specific trajectories, preserving momentum, allowing the thought to carry inertia and direction as it navigates the solution space."
};