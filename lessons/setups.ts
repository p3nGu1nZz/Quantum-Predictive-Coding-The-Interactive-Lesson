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
        // 5x5 Grid (25 particles)
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
    } else if (type === 'triangle') {
        // Tesselated Triangle (10 particles)
        const particles: Particle[] = [];
        let id = 0;
        const spacing = 70;
        // Pyramid structure
        for(let row=0; row<4; row++) {
            for(let col=0; col<=row; col++) {
                const x = cx + (col - row/2) * spacing;
                const y = cy + (row - 1.5) * spacing * 0.866;
                particles.push(mkP(id++, x, y, COLORS.blue, 0, 0.5));
            }
        }
        return particles;
    } else if (type === 'chain') {
        // Long Chain (12 particles)
        const particles: Particle[] = [];
        const count = 12;
        const spacing = 50;
        for(let i=0; i<count; i++) {
            const isAnchor = i === 0 || i === count-1;
            particles.push(mkP(i, cx + (i - count/2)*spacing, cy + Math.sin(i)*20, isAnchor ? COLORS.red : COLORS.blue, 0, 0.5, isAnchor, i*0.5));
        }
        return particles;
    } else if (type === 'spin_cluster') {
         // Two interacting clusters with different spins (20 particles)
         const particles: Particle[] = [];
         let id = 0;
         for(let i=0; i<10; i++) {
             // Spin Up Cluster (Left)
             particles.push({
                 id: id++, pos: { x: cx - 150 + (Math.random()-0.5)*100, y: cy + (Math.random()-0.5)*100 },
                 vel: {x:0,y:0}, force: zeroForce, val: 1, valVel: 0, phase: Math.random()*6, phaseVel: 0.1,
                 spin: 0.5, color: COLORS.green, isFixed: false
             });
             // Spin Down Cluster (Right)
             particles.push({
                 id: id++, pos: { x: cx + 150 + (Math.random()-0.5)*100, y: cy + (Math.random()-0.5)*100 },
                 vel: {x:0,y:0}, force: zeroForce, val: 0, valVel: 0, phase: Math.random()*6, phaseVel: 0.1,
                 spin: -0.5, color: COLORS.orange, isFixed: false
             });
         }
         return particles;
    } else if (type === 'logic_gate') {
        // Complex Logic: AND, OR, NOT in parallel
        return [
            // AND Gate (Top)
            mkP(0, cx-200, cy-150, COLORS.red, 0, 0.5, true), // In A
            mkP(1, cx-200, cy-90, COLORS.red, 0, 0.5, true), // In B
            mkP(2, cx-50, cy-120, COLORS.blue, 0, 0.5),      // Proc
            mkP(3, cx+100, cy-120, COLORS.green, 0, 0.5),    // Out
            
            // OR Gate (Middle) - Biased Processor
            mkP(4, cx-200, cy, COLORS.red, 0, 0.5, true),    // In C
            mkP(5, cx-200, cy+60, COLORS.red, 0, 0.5, true), // In D
            mkP(6, cx-50, cy+30, COLORS.blue, 0.4, 0.5),     // Proc (Bias 0.4)
            mkP(7, cx+100, cy+30, COLORS.green, 0, 0.5),     // Out

            // NOT Gate (Bottom) - Spin Down Inhibitor
            mkP(8, cx-200, cy+150, COLORS.red, 1, 0.5, true), // In E (Always On)
            mkP(9, cx-50, cy+150, COLORS.blue, 0, -0.5),      // Inverter (Spin Down)
            mkP(10, cx+100, cy+150, COLORS.green, 0, 0.5),    // Out
        ];
    } else if (type === 'memory_loop') {
        // 3 Interconnected Loops
        const particles: Particle[] = [];
        const loops = 3;
        let id = 0;
        for(let l=0; l<loops; l++) {
            const ox = cx + (l-1)*150;
            // Input
            particles.push(mkP(id++, ox - 60, cy, COLORS.red, 0, 0.5, true));
            // The Loop (Triangle)
            particles.push(mkP(id++, ox, cy - 40, COLORS.blue, 0, 0.5));
            particles.push(mkP(id++, ox + 40, cy + 30, COLORS.blue, 0, 0.5));
            particles.push(mkP(id++, ox - 40, cy + 30, COLORS.blue, 0, 0.5));
        }
        return particles;
    } else if (type === 'adder') {
         // Full Adder-like structure
         return [
            mkP(0, cx-200, cy-100, COLORS.red, 0.3, 0.5, true), // A
            mkP(1, cx-200, cy-50, COLORS.red, 0.5, 0.5, true),  // B
            mkP(2, cx-200, cy+50, COLORS.red, 0.2, 0.5, true),  // C
            mkP(3, cx-200, cy+100, COLORS.red, 0.1, 0.5, true), // D
            
            mkP(4, cx-50, cy-75, COLORS.blue, 0, 0.5), // Sum 1
            mkP(5, cx-50, cy+75, COLORS.blue, 0, 0.5), // Sum 2
            
            mkP(6, cx+100, cy, COLORS.teal, 0, 0.5),   // Total Sum
        ];
    } else if (type === 'control_circuit') {
         // More complex control: 2 Excitatory, 2 Inhibitory, 1 Actuator
         return [
            mkP(0, cx-200, cy-120, COLORS.red, 0.8, 0.5, true),   // Heat (Exc)
            mkP(1, cx-200, cy-40, COLORS.red, 0.8, 0.5, true),    // Pressure (Exc)
            
            mkP(2, cx-200, cy+40, COLORS.red, 0.0, -0.5, true),   // Human Presence (Inhib)
            mkP(3, cx-200, cy+120, COLORS.red, 0.0, -0.5, true),  // Emergency Stop (Inhib)
            
            mkP(4, cx-50, cy-80, COLORS.blue, 0, 0.5),  // Pre-proc A
            mkP(5, cx-50, cy+80, COLORS.blue, 0, 0.5),  // Pre-proc B (Inhib layer)
            
            mkP(6, cx+100, cy, COLORS.green, 0, 0.5),   // Actuator
        ];
    } else if (type === 'hamiltonian_demo') {
        // A high energy chaotic system
        const particles: Particle[] = [];
        for(let i=0; i<20; i++) {
            particles.push(mkP(i, cx + (Math.random()-0.5)*300, cy + (Math.random()-0.5)*300, COLORS.blue, Math.random(), 0.5, false, Math.random()*6));
        }
        return particles;
    } else if (type === 'lie_group_symmetry') {
        // Circular ring to demonstrate rotational invariance
        const particles: Particle[] = [];
        const radius = 150;
        const count = 16;
        for(let i=0; i<count; i++) {
            const angle = (i / count) * Math.PI * 2;
            particles.push(mkP(i, cx + Math.cos(angle)*radius, cy + Math.sin(angle)*radius, COLORS.teal, 0.5, 0.5, false, angle));
        }
        // Center pivot
        particles.push(mkP(count, cx, cy, COLORS.yellow, 1, 0.5, true));
        return particles;
    } else if (type === 'de_broglie') {
        // Wave-like line
        const particles: Particle[] = [];
        const count = 32;
        for(let i=0; i<count; i++) {
            particles.push(mkP(i, cx - 350 + i*22, cy, COLORS.purple, 0, 0.5, false, i * 0.5));
        }
        return particles;
    } else if (type === 'probability_current') {
        // Flow from left to right
        const particles: Particle[] = [];
        const rows = 4;
        const cols = 8;
        let id = 0;
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                const fixed = c === 0;
                const val = fixed ? 1 : 0;
                particles.push(mkP(id++, cx - 300 + c*70, cy + (r-1.5)*60, fixed ? COLORS.red : COLORS.blue, val, 0.5, fixed, c*0.2));
            }
        }
        return particles;
    } else if (type === 'global_cluster') {
        // Distinct clusters
        const particles: Particle[] = [];
        let id = 0;
        // Cluster A
        for(let i=0; i<15; i++) particles.push(mkP(id++, cx - 200 + (Math.random()-0.5)*80, cy + (Math.random()-0.5)*80, COLORS.teal));
        // Cluster B
        for(let i=0; i<15; i++) particles.push(mkP(id++, cx + 200 + (Math.random()-0.5)*80, cy + (Math.random()-0.5)*80, COLORS.orange));
        // Bridge
        particles.push(mkP(id++, cx, cy, COLORS.white, 0.5, 0.5));
        return particles;
    } else if (type === 'kuramoto_sync') {
        // Dense random pack
        const particles: Particle[] = [];
        for(let i=0; i<32; i++) {
            particles.push(mkP(i, cx + (Math.random()-0.5)*400, cy + (Math.random()-0.5)*300, COLORS.blue, Math.random(), 0.5, false, Math.random()*6));
        }
        return particles;
    } else if (type === 'random' || type === 'swarm') {
        // Standard Swarm (set to 32)
        const p = [];
        for(let i=0; i<32; i++) {
            const isSensory = i < 3; // First 3 are sensory
            p.push({
                id: i,
                pos: { x: cx + (Math.random()-0.5)*500, y: cy + (Math.random()-0.5)*400 },
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