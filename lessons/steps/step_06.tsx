import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step06: LessonStep = {
    title: "6. Intrinsic Spin",
    content: null,
    subsections: [
        { at: 0, title: "Multiplexing", content: <p>Spin enables parallel processing channels (CDMA).</p> },
        { at: 50, title: "Deep Dive", content: <div className="space-y-4">
            <p>Intrinsic spin <InlineMath math="s_i" /> introduces an additional degree of freedom, modulating the coupling strength via the function <InlineMath math="M(s_i, s_j)" /> (Eq 18):</p>
            <MathBlock title="Spin Modulation">{'M(s_i, s_j) = 1 + \\gamma s_i s_j'}</MathBlock>
            <p>For spin-½ particles, this term enhances coupling for parallel spins (alignment) and suppresses it for anti-parallel spins. This creates <strong>Orthogonal Communication Channels</strong> within the same physical volume, akin to Code Division Multiple Access (CDMA) in telecommunications. A "Spin Up" network and a "Spin Down" network can coexist and compute simultaneously in the same space without crosstalk, doubling the computational density of the tissue.</p>
        </div>}
    ],
    config: p({ spinEnabled: true }), setup: 'spin_cluster', symbols: [],
    script: [ 
        { at: 20, type: 'highlight', targetId: 'all', label: "Spin States" }, 
        { at: 50, type: 'force', targetId: 'all', vector: {x:5, y:0}, label: "Channel A" }, 
        { at: 70, type: 'annotate', label: "Pass-Through" } 
    ],
    narration: "Here is where we get truly quantum. We introduce the concept of Spin. In the subatomic world, particles like electrons have a property called spin—often described as \"up\" or \"down.\" It doesn't mean they are literally spinning like tops, but it defines how they interact with magnetic fields. In our cognitive simulation, we use Spin as a way to create invisible channels of communication. Imagine being in a crowded room where half the people speak English and half speak French. You can stand right next to a French speaker, but if you only speak English, their words pass right through you. You are in the same space, but in different \"channels.\" We assign our particles a spin value—Spin Up or Spin Down. Our equations dictate that particles with parallel spins amplifies each other's signal, while particles with opposite spins ignore or even repel each other. This is called Biological Multiplexing. It allows us to layer multiple independent computations on top of each other in the same physical volume. We can process the color of an image on the \"Up\" channel and the motion of the image on the \"Down\" channel, simultaneously, without the signals ever getting garbled. It’s how the brain packs so much processing power into such a small space."
};