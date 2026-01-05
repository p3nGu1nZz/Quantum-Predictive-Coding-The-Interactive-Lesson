import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';
import { InlineMath } from '../../components/InlineMath';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step28: LessonStep = {
    title: "28. CDMA",
    content: null,
    subsections: [
        { at: 0, title: "Parallel Processing", content: <p>How do you process multiple streams of data in the same chunk of tissue without them becoming a garbled mess? We use <strong>Spin Coupling</strong>.</p> },
        { at: 30, title: "Invisible Channels", content: <div className="space-y-4">
            <p>By assigning orthogonal spins to different groups of particles, we create invisible channels. Green particles (Spin Up) interact strongly with other Green particles. Orange particles (Spin Down) interact with other Orange particles.</p>
            <p>But Green and Orange? They pass right through each other like ghosts. They occupy the same space, but they exist in different realities.</p>
        </div>},
        { at: 60, title: "Historical Context", content: <div className="space-y-4">
            <p>This is <strong>Code Division Multiple Access (CDMA)</strong> for the brain. The concept was famously pioneered by actress and inventor <strong>Hedy Lamarr</strong> during WWII to prevent torpedo jamming. She realized that by hopping frequencies, a signal could hide in plain sight.</p>
            <p>Our network uses "Spin Hopping" to achieve the same effect: layering parallel realities within a single computing volume.</p>
        </div>}
    ],
    config: p({ spinEnabled: true }), setup: 'spin_cluster', symbols: [],
    script: [ 
        { at: 20, type: 'highlight', targetId: 'all', label: "Multiplexing" }, 
        { at: 50, type: 'force', targetId: 'all', vector: {x:4, y:0}, label: "Orthogonal Flow" }, 
        { at: 80, type: 'annotate', label: "No Crosstalk" } 
    ],
    narration: "How do you process multiple streams of data in the same chunk of tissue without them becoming a garbled mess? We use Spin Coupling. By assigning orthogonal spins to different groups of particles, we create invisible channels. Green particles (Spin Up) interact strongly with other Green particles. Orange particles (Spin Down) interact with other Orange particles. But Green and Orange? They pass right through each other like ghosts. They occupy the same space, but they exist in different realities. This is Code Division Multiple Access (CDMA) for the brain—the same technology your cell phone uses to find your call in a room full of radio waves. It allows us to layer parallel realities within a single computing volume. We can process vision, sound, and memory in the same physical space, at the same time, without interference. It is density through dimensionality."
};