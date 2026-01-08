import { LessonStep, VideoClip } from '../types';
import { Step00_Intro } from './steps/step_00_intro';
import { Step01 } from './steps/step_01';
import { Step02 } from './steps/step_02';
import { Step03 } from './steps/step_03';
import { Step04 } from './steps/step_04';
import { Step05 } from './steps/step_05';
import { Step06 } from './steps/step_06';
import { Step07 } from './steps/step_07';
import { Step08 } from './steps/step_08';
import { Step09 } from './steps/step_09';
import { Step10 } from './steps/step_10';
import { Step11 } from './steps/step_11';
import { Step12 } from './steps/step_12';
import { Step13 } from './steps/step_13';
import { Step14 } from './steps/step_14';
import { Step15 } from './steps/step_15';
import { Step16 } from './steps/step_16';
import { Step17 } from './steps/step_17';
import { Step18 } from './steps/step_18';
import { Step19 } from './steps/step_19';
import { Step20 } from './steps/step_20';
import { Step21 } from './steps/step_21';
import { Step22 } from './steps/step_22';
import { Step23 } from './steps/step_23';
import { Step24 } from './steps/step_24';
import { Step25 } from './steps/step_25';
import { Step26 } from './steps/step_26';
import { Step27 } from './steps/step_27';
import { Step28 } from './steps/step_28';
import { Step29 } from './steps/step_29';
import { Step30 } from './steps/step_30';
import { Step31 } from './steps/step_31';
import { Step32 } from './steps/step_32';

// --- Veo Video Prompts Registry ---
// Using specific clips for Lesson 0, 1, 2 and distributing them throughout the rest of the course.

// Pool of "High Quality" Clips (IDs reused for caching)
const CLIPS = {
    intro_1: { at: 0, id: 'v00_1', prompt: "Cinematic abstract visualization of a neural network dissolving into fluid light. High contrast, neon cyan and black, futuristic HUD elements." },
    intro_2: { at: 35, id: 'v00_2', prompt: "Thermodynamic heat map of a brain, colors shifting from red chaos to blue order as energy is minimized." },
    intro_3: { at: 75, id: 'v00_3', prompt: "A complex self-organizing system of glowing nodes forming a cohesive, beating geometric shape in a void." },
    
    liq_1: { at: 0, id: 'v01_1', prompt: "A cinematic shot of a futuristic city skyline made of rigid, glowing blue grid lines, representing traditional AI architecture." },
    liq_2: { at: 30, id: 'v01_2', prompt: "A murmuration of starlings in a twilight sky, moving fluidly and organically, representing dynamic intelligence." },
    liq_3: { at: 60, id: 'v01_3', prompt: "Abstract visualization of glowing particles floating in a dark, high-dimensional mathematical fluid, connected by thin strands of light." },
    
    force_1: { at: 0, id: 'v02_1', prompt: "Visual representation of entropy: particles scattering randomly into a dark infinite void, chaotic motion." },
    force_2: { at: 40, id: 'v02_2', prompt: "A misty 3D mountain landscape representing a free energy surface, with glowing droplets rolling downhill." },
    force_3: { at: 80, id: 'v02_3', prompt: "Particles settling into a glowing crystalline formation at the bottom of a dark valley, symbolizing minimized surprise." },
};

const VIDEO_CLIPS_MAP: Record<number, VideoClip[]> = {
    // --- FOUNDATION (Unique Clips) ---
    0: [ CLIPS.intro_1, CLIPS.intro_2, CLIPS.intro_3 ], // Overview
    1: [ CLIPS.liq_1, CLIPS.liq_2, CLIPS.liq_3 ],       // Liquid Mind
    2: [ CLIPS.force_1, CLIPS.force_2, CLIPS.force_3 ], // Driving Force

    // --- REUSED CLIPS FOR REST OF COURSE (Thematic Mapping) ---
    3: [ // The Particle
        { ...CLIPS.intro_3, at: 0 }, 
        { ...CLIPS.liq_3, at: 50 },
        { ...CLIPS.intro_1, at: 80 }
    ],
    4: [ // Activation Waves
        { ...CLIPS.liq_2, at: 0 },
        { ...CLIPS.intro_2, at: 50 },
        { ...CLIPS.force_1, at: 80 }
    ],
    5: [ // Synchronization
        { ...CLIPS.intro_3, at: 0 }, // Beating shape
        { ...CLIPS.liq_2, at: 50 },  // Murmuration
        { ...CLIPS.force_3, at: 90 } // Crystalline formation
    ],
    6: [ // Intrinsic Spin
        { ...CLIPS.liq_3, at: 0 },
        { ...CLIPS.intro_1, at: 50 },
        { ...CLIPS.intro_2, at: 80 }
    ],
    7: [ // The Cavity
        { ...CLIPS.force_1, at: 0 }, // Gas expanding
        { ...CLIPS.force_3, at: 60 } // Settling
    ],
    8: [ // Euclidean Learning
        { ...CLIPS.force_2, at: 0 }, // Landscape
        { ...CLIPS.liq_3, at: 50 }   // Fluid connections
    ],
    9: [ // Vector Forces
        { ...CLIPS.force_2, at: 0 }, // Rolling downhill
        { ...CLIPS.liq_1, at: 60 }   // Grid lines (vectors)
    ],
    10: [ // Harmonic Connection
        { ...CLIPS.intro_3, at: 0 },
        { ...CLIPS.liq_2, at: 50 }
    ],
    11: [ // Hamiltonian
        { ...CLIPS.force_2, at: 0 }, // Potential energy landscape
        { ...CLIPS.intro_2, at: 50 } // Heat/Energy
    ],
    12: [ // Gradient Descent
        { ...CLIPS.force_2, at: 0 }, // Skiing/Rolling
        { ...CLIPS.force_3, at: 80 } // Valley bottom
    ],
    13: [ // Reciprocity
        { ...CLIPS.liq_2, at: 0 },
        { ...CLIPS.intro_3, at: 50 }
    ],
    14: [ // Mean Field
        { ...CLIPS.force_1, at: 0 }, // Chaos
        { ...CLIPS.force_3, at: 70 } // Consensus/Order
    ],
    15: [ // Free Energy
        { ...CLIPS.intro_2, at: 0 }, // Heat map
        { ...CLIPS.force_2, at: 50 } // Landscape
    ],
    16: [ // Morphogenesis
        { ...CLIPS.liq_3, at: 0 },
        { ...CLIPS.intro_3, at: 50 }
    ],
    17: [ // Logic Gates
        { ...CLIPS.liq_1, at: 0 }, // Grid/Architecture
        { ...CLIPS.force_2, at: 50 } // Terrain logic
    ],
    18: [ // Dynamic Attractors
        { ...CLIPS.intro_3, at: 0 }, // Stable shape
        { ...CLIPS.force_3, at: 60 } // Ground state
    ],
    19: [ // Superposition
        { ...CLIPS.liq_3, at: 0 },
        { ...CLIPS.intro_1, at: 50 }
    ],
    20: [ // Feedforward Inhibition
        { ...CLIPS.liq_1, at: 0 },
        { ...CLIPS.intro_2, at: 60 }
    ],
    21: [ // Simulated Annealing
        { ...CLIPS.intro_2, at: 0 }, // Heat
        { ...CLIPS.force_1, at: 40 }, // Chaos
        { ...CLIPS.force_3, at: 80 } // Cooling
    ],
    22: [ // Rotational Invariance
        { ...CLIPS.intro_3, at: 0 },
        { ...CLIPS.liq_3, at: 50 }
    ],
    23: [ // Quantum Correction
        { ...CLIPS.liq_3, at: 0 },
        { ...CLIPS.intro_1, at: 50 }
    ],
    24: [ // Hydrodynamics
        { ...CLIPS.liq_2, at: 0 }, // Fluid flow
        { ...CLIPS.liq_3, at: 50 }
    ],
    25: [ // Adaptive Activation
        { ...CLIPS.intro_2, at: 0 },
        { ...CLIPS.intro_3, at: 60 }
    ],
    26: [ // Criticality
        { ...CLIPS.force_1, at: 0 }, // Edge of chaos
        { ...CLIPS.intro_3, at: 60 }
    ],
    27: [ // Global Correction
        { ...CLIPS.force_3, at: 0 },
        { ...CLIPS.intro_3, at: 50 }
    ],
    28: [ // CDMA
        { ...CLIPS.liq_1, at: 0 }, // Layers/Grid
        { ...CLIPS.liq_3, at: 50 }
    ],
    29: [ // Kuramoto Order
        { ...CLIPS.force_1, at: 0 }, // Disorder
        { ...CLIPS.liq_2, at: 50 }   // Sync
    ],
    30: [ // Nonlocal Elasticity
        { ...CLIPS.intro_3, at: 0 },
        { ...CLIPS.force_2, at: 50 }
    ],
    31: [ // Higher Dimensions
        { ...CLIPS.liq_3, at: 0 },
        { ...CLIPS.intro_1, at: 60 }
    ],
    32: [ // Conclusion
        { ...CLIPS.intro_1, at: 0 }, // Intro recap
        { ...CLIPS.force_3, at: 40 },
        { ...CLIPS.intro_3, at: 80 } // System online
    ]
};

const RAW_STEPS: LessonStep[] = [
  Step00_Intro,
  Step01, Step02, Step03, Step04, Step05, Step06, Step07, Step08,
  Step09, Step10, Step11, Step12, Step13, Step14, Step15, Step16,
  Step17, Step18, Step19, Step20, Step21, Step22, Step23, Step24,
  Step25, Step26, Step27, Step28, Step29, Step30, Step31, Step32
];

export const LESSON_STEPS: LessonStep[] = RAW_STEPS.map((step, idx) => ({
    ...step,
    // Merge provided map with existing scripts, preferring the map if it exists
    videoScript: VIDEO_CLIPS_MAP[idx] || step.videoScript
}));
