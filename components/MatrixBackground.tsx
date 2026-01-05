import React, { useEffect, useRef } from 'react';

export const MatrixBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const gl = canvas.getContext('webgl');
        if (!gl) return;

        // Render at 1/2 resolution for crispness but performance
        const setSize = () => {
            canvas.width = window.innerWidth / 2;
            canvas.height = window.innerHeight / 2;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        setSize();
        window.addEventListener('resize', setSize);

        const vsSource = `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision mediump float;
            varying vec2 vUv;
            uniform float uTime;
            uniform vec2 uResolution;

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            void main() {
                vec2 uv = vUv;
                // Aspect ratio correction
                float aspect = uResolution.x / uResolution.y;
                
                // Grid for characters
                float columns = 60.0;
                float rows = 30.0; 
                
                vec2 grid = vec2(floor(uv.x * columns), floor(uv.y * rows));
                vec2 st = fract(vec2(uv.x * columns, uv.y * rows));

                // Speed - Significantly Reduced (approx 25% of original)
                float speed = (1.0 + random(vec2(grid.x, 0.0)) * 2.0) * 0.25;
                float t = uTime * speed;
                
                // Falling effect
                float yVal = grid.y / rows;
                float drop = fract(t + random(vec2(grid.x, 1.0)));
                
                // Trail
                float trailLen = 0.5 + random(vec2(grid.x, 2.0)) * 0.3;
                float dist = (drop - uv.y); 
                
                // Wrap around distance logic
                if(dist < 0.0) dist += 1.0;
                
                float intensity = 0.0;
                if(dist < trailLen) {
                    intensity = 1.0 - (dist / trailLen);
                    intensity = pow(intensity, 3.0);
                }

                // Character flicker
                float charFlicker = step(0.5, random(vec2(grid.x, floor(t * 10.0))));
                
                // Matrix Green Color Palette
                // Brightness Reduced to ~11% (1/3 of previous 0.33)
                vec3 color = vec3(0.0, 1.0, 0.2) * intensity * 0.11;
                
                // Bright head (also dimmed significantly)
                if(dist < 0.05) {
                    color = vec3(0.6, 0.8, 0.7) * 0.3;
                }
                
                // Glyph shape (abstracted)
                float glyph = step(0.2, random(vec2(grid.x, grid.y + floor(t * 5.0))));
                if(st.x < 0.1 || st.x > 0.9 || st.y < 0.1 || st.y > 0.9) glyph = 0.0;
                
                gl_FragColor = vec4(color * glyph * charFlicker, 1.0);
            }
        `;

        const createShader = (type: number, source: string) => {
            const shader = gl.createShader(type)!;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const timeLocation = gl.getUniformLocation(program, 'uTime');
        const resolutionLocation = gl.getUniformLocation(program, 'uResolution');

        const render = (now: number) => {
            timeRef.current = now * 0.001;
            gl.uniform1f(timeLocation, timeRef.current);
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestRef.current = requestAnimationFrame(render);
        };

        requestRef.current = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', setSize);
            cancelAnimationFrame(requestRef.current);
            gl.deleteProgram(program);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0 bg-black"
            style={{ width: '100%', height: '100%' }}
        />
    );
};