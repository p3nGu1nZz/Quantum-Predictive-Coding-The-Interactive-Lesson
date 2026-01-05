import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step02: LessonStep = {
    title: "2. The Driving Force",
    content: null,
    subsections: [
      { at: 0, title: "Entropy", content: <p>Intelligence is a rebellion against entropy. Free Energy is 'Surprise'.</p> },
      { at: 30, title: "The Principle", content: <div className="space-y-4">
          <p>At the core of this simulation lies the <strong>Free Energy Principle</strong>. In information theory, "Free Energy" is an upper bound on surprise (or self-information).</p>
          <p>To survive, any self-organizing system must minimize this quantity.</p>
      </div>},
      { at: 60, title: "The Equation", content: <div className="space-y-4">
          <p>We formally define the free energy functional <InlineMath math="F" /> (Eq 21) as a composite of two competing forces:</p>
          <MathBlock title="Variational Free Energy">{'F = E_{pred} + \\beta E_{pos}'}</MathBlock>
      </div>},
      { at: 80, title: "Interpretation", content: <div className="space-y-4">
          <p>Here, <InlineMath math="E_{pred}" /> (Eq 22) represents the <strong>Prediction Error</strong>—the difference between a particle's internal state and the consensus of its neighbors. <InlineMath math="E_{pos}" /> (Eq 23) represents the <strong>Spatial Constraint</strong>.</p>
          <p>By minimizing <InlineMath math="F" />, the system simultaneously solves the inference problem (finding the truth) and the structural problem (maintaining integrity).</p>
      </div>}
    ],
    config: p({ k: 0.02, damping: 0.95 }), setup: 'error_landscape', symbols: [{symbol:"F", definition:"Free Energy", context:"Surprise"}],
    script: [ 
        { at: 1, type: 'reset' }, 
        { at: 10, type: 'shake', targetId: 'all', duration: 15, label: "Entropy" }, 
        { at: 35, type: 'pulse', targetId: 'all', label: "Surprise" }, 
        { at: 50, type: 'spawn', targetId: 'all', label: "Landscape" },
        { at: 75, type: 'force', targetId: 'all', vector: {x: 0, y: 5}, label: "Gravity" }, 
        { at: 95, type: 'highlight', targetId: 'center', label: "Ground State" } 
    ],
    narration: "What is the driving force of the universe? In thermodynamics, it’s entropy—the tendency of all things to drift into chaos, to cool down, to scatter. But life? Life is different. Life is a rebellion against entropy. And intelligence is the weapon we use in that fight. In our simulation, this battle is captured by a single, all-encompassing law: the minimization of Variational Free Energy. Think of Free Energy as a measure of \"Surprise.\" When you walk into a dark room and bump your shin on a coffee table, that pain is surprise. It’s the difference between your internal model of the room (which said \"empty space\") and the reality (which said \"table\"). Your brain hates this. It wants to minimize that error at all costs. In our L-Group framework, we treat this \"Surprise\" as a literal, physical landscape. Imagine a vast, misty mountain range. The peaks represent high error, high confusion, high surprise. The valleys represent understanding, clarity, and prediction. Our particles are like rain falling on this landscape. They don't need to be told where to go; gravity does the work. They naturally, inevitably flow downhill, seeking the lowest point in the valley—the \"ground state\" of truth. We don't program the solution; we simply define the landscape and let the laws of physics pull the system toward the answer. You are watching a machine solve a complex Bayesian inference problem not by crunching numbers, but by sliding down a hill."
};