import { Particle } from '../types';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export const createParticles = (type: string): Particle[] => {
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    
    if (type === 'grid') {
        return [
            { id: 0, pos: { x: cx-50, y: cy-50 }, vel: {x:0,y:0}, val: 1, valVel: 0, phase: 0, phaseVel: 0.1, spin: 0.5, color: COLORS.blue },
            { id: 1, pos: { x: cx+50, y: cy-50 }, vel: {x:0,y:0}, val: 0, valVel: 0, phase: 1, phaseVel: 0.1, spin: -0.5, color: COLORS.blue },
            { id: 2, pos: { x: cx-50, y: cy+50 }, vel: {x:0,y:0}, val: 0, valVel: 0, phase: 2, phaseVel: 0.1, spin: 0.5, color: COLORS.blue },
            { id: 3, pos: { x: cx+50, y: cy+50 }, vel: {x:0,y:0}, val: 0, valVel: 0, phase: 3, phaseVel: 0.1, spin: -0.5, color: COLORS.blue },
        ];
    } else if (type === 'triangle') {
        return [
            { id: 0, pos: { x: cx, y: cy-80 }, vel: {x:0,y:0}, val: 0, valVel: 0, phase: 0, phaseVel: 0.1, spin: 0.5, color: COLORS.blue },
            { id: 1, pos: { x: cx-70, y: cy+40 }, vel: {x:0,y:0}, val: 0, valVel: 0, phase: 0, phaseVel: 0.1, spin: 0.5, color: COLORS.blue },
            { id: 2, pos: { x: cx+70, y: cy+40 }, vel: {x:0,y:0}, val: 0, valVel: 0, phase: 0, phaseVel: 0.1, spin: 0.5, color: COLORS.blue },
        ];
    } else if (type === 'chain') {
         return [
            { id: 0, pos: { x: cx-150, y: cy }, vel: {x:0,y:0}, val: 1, valVel: 0, phase: 0, phaseVel: 0.1, spin: 0.5, color: COLORS.red, isFixed: true }, // Sensory
            { id: 1, pos: { x: cx, y: cy }, vel: {x:0,y:0}, val: 0, valVel: 0, phase: 1, phaseVel: 0.1, spin: 0.5, color: COLORS.blue },
            { id: 2, pos: { x: cx+150, y: cy }, vel: {x:0,y:0}, val: 0, valVel: 0, phase: 2, phaseVel: 0.1, spin: 0.5, color: COLORS.blue },
        ];
    } else if (type === 'spin_cluster') {
         return [
            { id: 0, pos: { x: cx-50, y: cy }, vel: {x:0,y:0}, val: 1, valVel: 0, phase: 0, phaseVel: 0.1, spin: 0.5, color: COLORS.blue },
            { id: 1, pos: { x: cx+50, y: cy }, vel: {x:0,y:0}, val: 0, valVel: 0, phase: 1.5, phaseVel: 0.1, spin: 0.5, color: COLORS.blue },
            { id: 2, pos: { x: cx, y: cy-80 }, vel: {x:0,y:0}, val: 0, valVel: 0, phase: 3, phaseVel: 0.1, spin: -0.5, color: COLORS.blue }, // Opposing spin
            { id: 3, pos: { x: cx, y: cy+80 }, vel: {x:0,y:0}, val: 0, valVel: 0, phase: 4.5, phaseVel: 0.1, spin: -0.5, color: COLORS.blue }, // Opposing spin
        ];
    } else if (type === 'random' || type === 'swarm') {
        const p = [];
        for(let i=0; i<15; i++) {
            const isSensory = i === 0;
            p.push({
                id: i,
                pos: { x: cx + (Math.random()-0.5)*400, y: cy + (Math.random()-0.5)*300 },
                vel: {x:0, y:0},
                val: isSensory ? 1 : Math.random(), // First one is active
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