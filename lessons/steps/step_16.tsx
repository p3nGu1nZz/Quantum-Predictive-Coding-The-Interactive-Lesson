import React from 'react';
import { PHYSICS } from '../../constants';
import { LessonStep } from '../../types';
import { InlineMath } from '../../components/InlineMath';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step16: LessonStep = {
    title: "16. Morphogenesis",
    content: null,
    subsections: [
        { at: 0, title: "Growth", content: <p>Classical AI has fixed architecture. Our system has <strong>Living Architecture</strong>. The hardware evolves in real-time to fit the software requirements.</p> },
        { at: 30, title: "Equilibrium", content: <div className="space-y-4">
            <p>We employ a dynamic equilibrium parameter <InlineMath math="r_0(t)" /> that responds to the local stress tensor (Error Density).</p>
            <p>The system can dynamically adjust this parameter based on local stress, pulling nodes closer or pushing them apart.</p>
        </div>},
        { at: 60, title: "Stress", content: <div className="space-y-4">
            <p className="text-center font-mono bg-slate-800 p-2 rounded border border-slate-700">Stress <span className="text-cyan-400">∝</span> Prediction Error</p>
            <p>High local error triggers <strong>contraction</strong> (densification), creating high-bandwidth processing hubs. Low error triggers <strong>relaxation</strong> (rarefaction).</p>
        </div>},
        { at: 80, title: "Bio-Patterning", content: <div className="space-y-4">
             <p>This mimics biological morphogenesis, where bioelectric fields guide the physical growth of the embryo. The computer builds itself.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'morphogenesis', symbols: [],
    script: [ 
        { at: 20, type: 'highlight', targetId: 'all', label: "Structure" }, 
        { at: 50, type: 'spawn', targetId: 'all', label: "Growth" }, 
        { at: 80, type: 'force', targetId: 'all', vector: {x:-0.5, y:-0.5}, label: "Densification" } 
    ],
    narration: "In classical AI, the architecture of the network is a fossil. It is fixed by a human engineer before the software ever runs. The layers are set, the connections are defined. But here, we observe Morphogenesis—the biological development of form. The network grows. It adapts its own body. We discussed the equilibrium separation parameter earlier; well, the system can dynamically adjust this parameter based on local stress. If a region of the network is experiencing high error—high stress—it can contract. It pulls nodes closer together to increase bandwidth and reduce communication latency. It densifies the processing power where it is needed most, like a muscle tensing to lift a heavy weight. Conversely, in areas of low error, it can expand and relax, saving energy. This is \"Bioelectric Prepatterning.\" The hardware is evolving in real-time to fit the software. We are not just training a network; we are witnessing the embryogenesis of a connectome, growing and adapting to the challenges we throw at it."
};