import { Particle } from '../types';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export const createParticles = (type: string): Particle[] => {
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const zeroForce = { x: 0, y: 0 };
    
    // Helper to create a particle
    const mkP = (id: number, x: number, y: number, color: string, val = 0, spin = 0.5, fixed = false, phase = 0): Particle => ({
        id, pos: { x, y }, vel: { x: 0, y: 0 }, force: zeroForce,
        val, valVel: 0, phase, phaseVel: 0.1, spin, color, isFixed: fixed
    });

    if (type === 'grid') {
        const particles: Particle[] = [];
        const rows = 5;
        const cols = 5;
        const spacing = 60;
        let id = 0;
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                particles.push(mkP(id++, cx + (c-2)*spacing, cy + (r-2)*spacing, COLORS.blue, (r+c)%2, (r%2 === 0 ? 0.5 : -0.5), false, (r+c)));
            }
        }
        return particles;
    } else if (type === 'spin_cluster') {
         // Two interacting clusters with different spins
         const particles: Particle[] = [];
         let id = 0;
         for(let i=0; i<15; i++) {
             // Spin Up Cluster (Left)
             particles.push({
                 id: id++, pos: { x: cx - 150 + (Math.random()-0.5)*120, y: cy + (Math.random()-0.5)*120 },
                 vel: {x:0,y:0}, force: zeroForce, val: 1, valVel: 0, phase: Math.random()*6, phaseVel: 0.1,
                 spin: 0.5, color: COLORS.green, isFixed: false
             });
             // Spin Down Cluster (Right)
             particles.push({
                 id: id++, pos: { x: cx + 150 + (Math.random()-0.5)*120, y: cy + (Math.random()-0.5)*120 },
                 vel: {x:0,y:0}, force: zeroForce, val: 0, valVel: 0, phase: Math.random()*6, phaseVel: 0.1,
                 spin: -0.5, color: COLORS.orange, isFixed: false
             });
         }
         return particles;
    } else if (type === 'logic_gate') {
        // AND, OR, NOT Gate Simulation
        return [
            mkP(0, cx-200, cy-150, COLORS.red, 0, 0.5, true), // Input A
            mkP(1, cx-200, cy-50, COLORS.red, 0, 0.5, true),  // Input B
            mkP(2, cx-50, cy-100, COLORS.blue, 0, 0.5),       // Processor
            mkP(3, cx+100, cy-100, COLORS.green, 0, 0.5),     // Output
            
            mkP(4, cx-200, cy+50, COLORS.red, 0, 0.5, true),  // Input C
            mkP(5, cx-200, cy+150, COLORS.red, 0, 0.5, true), // Input D
            mkP(6, cx-50, cy+100, COLORS.blue, 0.5, 0.5),     // Processor (Biased OR)
            mkP(7, cx+100, cy+100, COLORS.green, 0, 0.5),     // Output
        ];
    } else if (type === 'memory_loop') {
        const particles: Particle[] = [];
        const loops = 1;
        let id = 0;
        // A simple recurrent loop
        const radius = 80;
        const count = 6;
        for(let i=0; i<count; i++) {
            const angle = (i/count) * Math.PI * 2;
            particles.push(mkP(id++, cx + Math.cos(angle)*radius, cy + Math.sin(angle)*radius, COLORS.purple, 0, 0.5, false, angle));
        }
        // Input node
        particles.push(mkP(id++, cx - 200, cy, COLORS.red, 1, 0.5, true));
        return particles;
    } else if (type === 'inhibitory_circuit') {
         // Feedforward Inhibition
         return [
            mkP(0, cx-200, cy, COLORS.red, 1.0, 0.5, true),   // Exc Input
            mkP(1, cx-100, cy-60, COLORS.blue, 0, 0.5),       // Interneuron A (Exc)
            mkP(2, cx-100, cy+60, COLORS.orange, 0, -0.5),    // Interneuron B (Inhib Spin)
            mkP(3, cx+50, cy, COLORS.green, 0, 0.5),          // Output Soma
        ];
    } else if (type === 'fluid_flow') {
        // Flow simulation for Probability Current
        const particles: Particle[] = [];
        const rows = 4;
        const cols = 10;
        let id = 0;
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                const fixed = c === 0; // Source
                particles.push(mkP(id++, cx - 350 + c*70, cy + (r-1.5)*50, fixed ? COLORS.red : COLORS.teal, fixed ? 1 : 0, 0.5, fixed, c*0.5));
            }
        }
        return particles;
    } else if (type === 'kuramoto_sync') {
        const particles: Particle[] = [];
        for(let i=0; i<40; i++) {
            particles.push(mkP(i, cx + (Math.random()-0.5)*500, cy + (Math.random()-0.5)*350, COLORS.blue, Math.random(), 0.5, false, Math.random()*6));
        }
        return particles;
    } else if (type === 'swarm' || type === 'random') {
        // Standard Swarm
        const p = [];
        for(let i=0; i<40; i++) {
            const isSensory = i < 4; 
            p.push({
                id: i,
                pos: { x: cx + (Math.random()-0.5)*600, y: cy + (Math.random()-0.5)*400 },
                vel: {x:0, y:0},
                force: zeroForce,
                val: isSensory ? 1 : Math.random(), 
                valVel: 0,
                phase: Math.random() * Math.PI * 2,
                phaseVel: 0.05 + Math.random()*0.05,
                spin: Math.random() > 0.5 ? 0.5 : -0.5,
                color: isSensory ? COLORS.red : COLORS.blue,
                isFixed: isSensory
            });
        }
        return p;
    }
    return [];
};