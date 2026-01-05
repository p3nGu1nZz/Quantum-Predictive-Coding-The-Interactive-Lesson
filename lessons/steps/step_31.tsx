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
        { at: 30, title: "3D Space", content: <div className="space-y-4">
            <p>You are currently viewing a 2D slice of a higher-dimensional reality. The configuration space of our system is mathematically defined in <strong>three-dimensional real space</strong> (or higher in abstract Hilbert space).</p>
        </div>},
        { at: 60, title: "Logic Crystals", content: <div className="space-y-4">
            <p>In two dimensions, wires cross, pathways get congested, and topology is strictly limited by the planar graph theorem.</p>
            <p>But in 3D, we can form <strong>Logic Crystals</strong>—intricate lattices where signal pathways spiral around each other in non-intersecting knots (e.g., Hopf fibration).</p>
        </div>},
        { at: 85, title: "Cortical Folding", content: <div className="space-y-4">
            <p>This computational necessity drives biological evolution. The <strong>cortical folding</strong> (gyrification) of the human brain is essentially nature's way of solving a topological packing problem.</p>
        </div>}
    ],
    config: p({ showGhosts: true }), setup: 'attractor', symbols: [],
    script: [ 
        { at: 20, type: 'zoom', targetZoom: 0.6, label: "2D Slice" }, 
        { at: 50, type: 'rotate', targetId: 'all', duration: 40, label: "3D Projection" }, 
        { at: 90, type: 'annotate', label: "Hyper-Connectivity" } 
    ],
    narration: "You are looking at a shadow. The simulation on your screen is a flat, two-dimensional slice of a much richer, higher-dimensional reality. In 2D, if you try to connect everything to everything, wires cross. You get tangles. You run out of space. But lift this graph into three dimensions, or four, and suddenly, the knots untie. Pathways can spiral around each other without ever touching. This is why the human brain is folded. That wrinkly structure—gyrification—is nature's solution to a topological packing problem. It is trying to cram a high-dimensional computing sheet into a 3D skull. In our L-Group framework, the particles are free to move in this higher-dimensional bulk, forming 'Logic Crystals' of incredible complexity that we can only glimpse as they pass through the plane of our screen."
};