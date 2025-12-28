import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step31: LessonStep = {
    title: "31. Higher Dimensions",
    content: null,
    subsections: [
        { at: 0, title: "Topology", content: <p>Complex pathways in 3D Manifolds.</p> },
        { at: 50, title: "Deep Dive", content: <div className="space-y-4">
            <p>You are currently viewing a 2D slice of a higher-dimensional reality. The configuration space of our system is mathematically defined in <strong>three-dimensional real space</strong> (or higher in abstract Hilbert space).</p>
            <p>In two dimensions, wires cross, pathways get congested, and topology is strictly limited by the planar graph theorem. But in 3D? In 3D, we can form <strong>Logic Crystals</strong>—intricate lattices where signal pathways spiral around each other in non-intersecting knots (e.g., Hopf fibration). This allows for vastly more complex connectivity graphs.</p>
            <p>This computational necessity drives biological evolution. The <strong>cortical folding</strong> (gyrification) of the human brain is essentially nature's way of solving a topological packing problem: maximizing the surface area of a 2D computing sheet within a finite 3D volumetric skull to increase adjacency and minimize conduction delays.</p>
        </div>}
    ],
    config: p({ showGhosts: true }), setup: 'attractor', symbols: [],
    script: [ 
        { at: 20, type: 'zoom', targetZoom: 0.6, label: "2D Slice" }, 
        { at: 50, type: 'rotate', targetId: 'all', duration: 40, label: "3D Projection" }, 
        { at: 90, type: 'annotate', label: "Hyper-Connectivity" } 
    ],
    narration: "You are currently viewing a 2D slice of a higher-dimensional reality. The configuration space of our system is mathematically defined in three-dimensional real space, or even higher. In two dimensions, wires cross, pathways get congested, and topology is limited. You can only connect so many things before they overlap. But in 3D? In 3D, we can form Logic Crystals with complex, non-crossing pathways. We can build knots and loops of incredible complexity. The folding of the human cerebral cortex is essentially nature's way of packing this high-dimensional surface area into the finite volume of the skull. The true complexity, and the true power of the L-Group dynamics, exists in the bulk, where geometry allows for infinite connectivity. We are watching the shadows of a hyper-dimensional object dancing on a flat screen."
};