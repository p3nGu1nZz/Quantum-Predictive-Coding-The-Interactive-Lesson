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

    switch (type) {
        case 'grid': {
            const particles: Particle[] = [];
            const rows = 6; const cols = 8; const spacing = 70;
            let id = 0;
            for(let r=0; r<rows; r++) {
                for(let c=0; c<cols; c++) {
                    const px = cx + (c - cols/2 + 0.5) * spacing;
                    const py = cy + (r - rows/2 + 0.5) * spacing;
                    particles.push(mkP(id++, px, py, COLORS.blue, (r+c)%2, 0.5, false, r+c));
                }
            }
            return particles;
        }
        case 'mean_field': {
            const particles: Particle[] = [];
            // Central chaotic cluster
            for(let i=0; i<30; i++) {
                particles.push(mkP(i, cx + (Math.random()-0.5)*300, cy + (Math.random()-0.5)*300, COLORS.blue, Math.random(), 0.5, false));
            }
            // A few outlier "noise" particles far away
            particles.push(mkP(30, 50, 50, COLORS.red, 1, 0.5, false));
            particles.push(mkP(31, CANVAS_WIDTH-50, 50, COLORS.red, 1, 0.5, false));
            return particles;
        }
        case 'quantum_potential': {
             // Particles flowing through a slit/barrier
             const particles: Particle[] = [];
             for(let i=0; i<40; i++) {
                 particles.push(mkP(i, 50 + Math.random()*100, cy + (Math.random()-0.5)*200, COLORS.teal, 1, 0.5, false));
                 particles[i].vel = {x: 4, y: 0};
             }
             // Barrier
             for(let i=0; i<10; i++) particles.push(mkP(100+i, cx, i*60, COLORS.grey, 0, 0, true));
             // Gap in barrier
             return particles;
        }
        case 'adaptive_grid': {
            const particles: Particle[] = [];
            // Dense center, sparse edges
            for(let i=0; i<30; i++) {
                const r = Math.random() * 200;
                const theta = Math.random() * Math.PI * 2;
                // Skew distribution towards center
                const rad = r * Math.random(); 
                particles.push(mkP(i, cx + Math.cos(theta)*rad, cy + Math.sin(theta)*rad, COLORS.purple, 1, 0.5, false));
            }
            return particles;
        }
        case 'elastic_lattice': {
            const particles: Particle[] = [];
            const rows = 5; const cols = 10;
            let id = 0;
            for(let r=0; r<rows; r++) {
                for(let c=0; c<cols; c++) {
                    particles.push(mkP(id++, 100 + c*60, 150 + r*60, COLORS.blue, 0, 0.5, false));
                }
            }
            return particles;
        }
        case 'error_landscape': {
            const particles: Particle[] = [];
            for(let i=0; i<40; i++) {
                particles.push(mkP(i, cx + (Math.random()-0.5)*CANVAS_WIDTH, 50 + Math.random()*100, COLORS.red, 1, 0.5, false));
            }
            return particles;
        }
        case 'single_particle': {
            return [mkP(0, cx, cy, COLORS.yellow, 1, 0.5, false, 0)];
        }
        case 'interference_grid': {
            const particles: Particle[] = [];
            const rows = 8; const cols = 12; const spacing = 50;
            let id = 0;
            for(let r=0; r<rows; r++) {
                for(let c=0; c<cols; c++) {
                    particles.push(mkP(id++, cx + (c - cols/2)*spacing, cy + (r - rows/2)*spacing, COLORS.teal, 0, 0.5, true, 0));
                }
            }
            return particles;
        }
        case 'kuramoto_sync': {
            const particles: Particle[] = [];
            for(let i=0; i<50; i++) {
                particles.push(mkP(i, cx + (Math.random()-0.5)*600, cy + (Math.random()-0.5)*400, COLORS.blue, Math.random(), 0.5, false, Math.random()*Math.PI*2));
            }
            return particles;
        }
        case 'spin_cluster': {
             const particles: Particle[] = [];
             let id = 0;
             // Left group (Spin Up)
             for(let i=0; i<20; i++) {
                 particles.push(mkP(id++, cx - 200 + (Math.random()-0.5)*150, cy + (Math.random()-0.5)*150, COLORS.green, 1, 0.5, false));
             }
             // Right group (Spin Down)
             for(let i=0; i<20; i++) {
                 particles.push(mkP(id++, cx + 200 + (Math.random()-0.5)*150, cy + (Math.random()-0.5)*150, COLORS.orange, 0, -0.5, false));
             }
             return particles;
        }
        case 'cavity': {
            const particles: Particle[] = [];
            for(let i=0; i<30; i++) {
                particles.push(mkP(i, cx + (Math.random()-0.5)*200, cy + (Math.random()-0.5)*200, COLORS.purple, 0.5, 0.5, false));
            }
            const radius = 250;
            for(let i=0; i<20; i++) {
                const ang = (i/20) * Math.PI*2;
                particles.push(mkP(100+i, cx + Math.cos(ang)*radius, cy + Math.sin(ang)*radius, COLORS.grey, 0, 0, true));
            }
            return particles;
        }
        case 'fluid_flow': {
            const particles: Particle[] = [];
            for(let i=0; i<100; i++) {
                particles.push({
                    id: i, pos: { x: (Math.random()) * CANVAS_WIDTH, y: (Math.random()) * CANVAS_HEIGHT },
                    vel: {x: 2 + Math.random(), y: (Math.random()-0.5)}, 
                    force: zeroForce, val: 0.5, valVel: 0, phase: i, phaseVel: 0.1, spin: 0.5, color: COLORS.teal, isFixed: false
                });
            }
            return particles;
        }
        case 'logic_gate': {
            const particles: Particle[] = [];
            particles.push(mkP(0, cx-100, cy-100, COLORS.yellow, 0, 0.5, true)); // Input A
            particles.push(mkP(1, cx-100, cy+100, COLORS.yellow, 0, 0.5, true)); // Input B
            particles.push(mkP(2, cx, cy, COLORS.blue, 0.1, 0.5, false));
            particles.push(mkP(3, cx+100, cy, COLORS.green, 0, 0.5, true));
            return particles;
        }
        case 'attractor': {
            const particles: Particle[] = [];
            for(let i=0; i<8; i++) {
                const ang = (i/8) * Math.PI*2;
                particles.push(mkP(i, cx + Math.cos(ang)*100, cy + Math.sin(ang)*100, COLORS.purple, 1, 0.5, false, i));
            }
            return particles;
        }
        case 'inhibition': {
            const particles: Particle[] = [];
            for(let i=0; i<10; i++) particles.push(mkP(i, 100 + i*30, cy, COLORS.green, 1, 0.5, false));
            for(let i=0; i<5; i++) particles.push(mkP(20+i, 400, cy - 60 + i*30, COLORS.red, 1, -0.5, true));
            return particles;
        }
        case 'annealing': {
            const particles: Particle[] = [];
            for(let i=0; i<40; i++) {
                particles.push(mkP(i, cx + (Math.random()-0.5)*400, cy + (Math.random()-0.5)*400, COLORS.orange, 1, 0.5, false));
            }
            return particles;
        }
        case 'superposition': {
            const particles: Particle[] = [];
            for(let i=0; i<20; i++) particles.push(mkP(i, 100 + i*30, cy-50, COLORS.blue, 1, 0.5, true)); // Top wave
            for(let i=0; i<20; i++) particles.push(mkP(20+i, 100 + i*30, cy+50, COLORS.blue, -1, 0.5, true)); // Bottom wave
            return particles;
        }
        case 'invariance': {
            const particles: Particle[] = [];
            particles.push(mkP(0, cx, cy-100, COLORS.yellow, 1, 0.5, false));
            particles.push(mkP(1, cx-86, cy+50, COLORS.yellow, 1, 0.5, false));
            particles.push(mkP(2, cx+86, cy+50, COLORS.yellow, 1, 0.5, false));
            return particles;
        }
        case 'morphogenesis': {
            const particles: Particle[] = [];
            for(let i=0; i<12; i++) {
                const ang = (i/12)*Math.PI*2;
                particles.push(mkP(i, cx + Math.cos(ang)*50, cy + Math.sin(ang)*50, COLORS.green, 1, 0.5, false));
            }
            return particles;
        }
        default: {
            const p = [];
            for(let i=0; i<30; i++) {
                p.push(mkP(i, cx + (Math.random()-0.5)*600, cy + (Math.random()-0.5)*400, COLORS.blue, Math.random(), 0.5, false));
            }
            return p;
        }
    }
};