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

        // Render at 1/4 resolution for performance and retro aesthetics
        const setSize = () => {
            canvas.width = window.innerWidth / 4;
            canvas.height = window.innerHeight / 4;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        setSize();
        window.addEventListener('resize', setSize);

        // Vertex Shader (Simple Pass-through)
        const vsSource = `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        // Fragment Shader (Procedural Digital Rain)
        const fsSource = `
            precision mediump float;
            varying vec2 vUv;
            uniform float uTime;
            uniform vec2 uResolution;

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            void main() {
                // Grid setup
                vec2 uv = vUv;
                float columns = 40.0;
                float rows = 20.0; // Aspect ratio adjustment handled by resolution
                
                // Discretize coordinates
                vec2 grid = vec2(floor(uv.x * columns), floor(uv.y * rows));
                vec2 st = fract(vec2(uv.x * columns, uv.y * rows));

                // Falling speed varies by column
                float speed = 2.0 + random(vec2(grid.x, 0.0)) * 3.0;
                float yOffset = uTime * speed;
                
                // Character changing speed
                float charChange = floor(uTime * 8.0 + random(grid) * 5.0);
                
                // Calculate cell value based on scrolling position
                float cellVal = floor((uv.y + yOffset * 0.1) * rows);
                
                // Noise value for "character" shape (abstracted)
                float noise = random(vec2(grid.x, cellVal + charChange));
                
                // Trail fade
                float trail = fract((uv.y * 1.5) + uTime * 0.2 + random(vec2(grid.x, 1.0)));
                trail = pow(trail, 8.0); // Make it sharp

                // Digital glyph shape (simple blocky patterns)
                float glyph = step(0.5, noise);
                if (st.x < 0.1 || st.x > 0.9 || st.y < 0.1 || st.y > 0.9) glyph = 0.0; // Padding

                // Color mixing
                vec3 color = vec3(0.0, 0.8, 0.9) * glyph * trail;
                
                // Header (bright lead character)
                float head = step(0.98, trail);
                color += vec3(0.8, 1.0, 1.0) * head * glyph;

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        // Compile Shaders
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

        // Buffer Setup (Full Screen Quad)
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
            className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0 scale-100 origin-top-left"
            style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
        />
    );
};