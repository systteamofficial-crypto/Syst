(() => {
const THREE = window.THREE;

const host = document.querySelector('#hero-scene');

if (host) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowPowerDevice = (navigator.hardwareConcurrency || 8) <= 4;
    let renderer;
    let resizeObserver;
    let visibilityObserver;
    let disposed = false;
    let active = false;
    let pointerX = 0;
    let pointerY = 0;
    let easedX = 0;
    let easedY = 0;
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    const keepGeometry = (geometry) => (geometries.add(geometry), geometry);
    const keepMaterial = (material) => (materials.add(material), material);
    const keepTexture = (texture) => (textures.add(texture), texture);

    function makeScreenTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const bg = ctx.createLinearGradient(0, 0, 1000, 640);
        bg.addColorStop(0, '#143F3A');
        bg.addColorStop(1, '#071F1E');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1000, 640);

        // Window chrome.
        ctx.fillStyle = 'rgba(255,255,255,.075)';
        ctx.fillRect(0, 0, 1000, 62);
        ['#D97878', '#D8B477', '#77AC91'].forEach((color, i) => {
            ctx.beginPath(); ctx.fillStyle = color;
            ctx.arc(34 + i * 30, 31, 8, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = 'rgba(245,218,191,.72)';
        ctx.font = '600 18px Arial';
        ctx.fillText('SYST / CREATIVE WORKSPACE', 140, 38);

        // Sidebar and active navigation.
        ctx.fillStyle = 'rgba(255,255,255,.04)';
        ctx.fillRect(0, 62, 190, 578);
        ctx.fillStyle = '#E9C7A5'; ctx.font = '700 16px Arial';
        ctx.fillText('PROJECT', 28, 118);
        ['Overview', 'Interface', 'Components', 'Deploy'].forEach((label, i) => {
            const y = 175 + i * 60;
            if (i === 1) { ctx.fillStyle = 'rgba(126,181,156,.17)'; ctx.fillRect(16, y - 25, 158, 40); }
            ctx.fillStyle = i === 1 ? '#F5E7D5' : 'rgba(245,231,213,.56)';
            ctx.font = '500 16px Arial'; ctx.fillText(label, 34, y);
        });

        ctx.fillStyle = '#F5E7D5'; ctx.font = '700 37px Arial';
        ctx.fillText('A good idea,', 232, 150);
        ctx.fillStyle = '#B6D7C8';
        ctx.fillText('beautifully built.', 232, 196);
        ctx.fillStyle = 'rgba(255,255,255,.075)';
        ctx.fillRect(232, 232, 730, 225);
        ctx.fillStyle = 'rgba(245,231,213,.76)'; ctx.font = '600 16px Arial';
        ctx.fillText('PROJECT HEALTH', 264, 270);

        const bars = [0.48,0.72,0.58,0.87,0.76,0.95,0.82,1,0.70];
        bars.forEach((h, i) => {
            const x = 277 + i * 72;
            const y = 420 - h * 112;
            const gradient = ctx.createLinearGradient(0,y,0,420);
            gradient.addColorStop(0,'#B5D8C7'); gradient.addColorStop(1,'#477F70');
            ctx.fillStyle = gradient; ctx.fillRect(x,y,34,h*112);
        });

        ctx.fillStyle = 'rgba(255,255,255,.075)';
        ctx.fillRect(232, 482, 350, 120); ctx.fillRect(600, 482, 362, 120);
        ctx.fillStyle = '#D9E9DF'; ctx.font = '600 19px Arial';
        ctx.fillText('Design system', 258, 525); ctx.fillText('Ready to publish', 626, 525);
        ctx.fillStyle = 'rgba(217,233,223,.57)'; ctx.font = '15px Arial';
        ctx.fillText('Reusable components', 258, 557); ctx.fillText('All checks passed', 626, 557);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        return keepTexture(texture);
    }

    try {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 70);
        camera.position.set(0, 0.05, 9.1);

        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !lowPowerDevice,
            powerPreference: 'low-power',
            depth: true,
            stencil: false
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPowerDevice ? 1.1 : 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        renderer.domElement.setAttribute('aria-hidden', 'true');
        renderer.domElement.setAttribute('role', 'presentation');
        host.replaceChildren(renderer.domElement);
        host.dataset.fallback = 'false';

        scene.add(new THREE.HemisphereLight(0xF7E9D9, 0x0F3D3A, 2.05));
        const keyLight = new THREE.DirectionalLight(0xFFF1DE, 3.4);
        keyLight.position.set(4.5, 5, 7);
        scene.add(keyLight);
        const tealRim = new THREE.PointLight(0x83C5AA, 22, 13);
        tealRim.position.set(-3.7, 1.7, 2.4);
        scene.add(tealRim);
        const warmRim = new THREE.PointLight(0xA94C52, 15, 12);
        warmRim.position.set(3.5, -1.3, 1.5);
        scene.add(warmRim);

        const composition = new THREE.Group();
        scene.add(composition);

        // Main floating laptop.
        const laptop = new THREE.Group();
        laptop.position.set(0.18, 0.02, 0);
        laptop.rotation.set(-0.10, -0.24, 0.035);
        composition.add(laptop);

        const shell = keepMaterial(new THREE.MeshPhysicalMaterial({
            color: 0x405A52, metalness: 0.78, roughness: 0.22,
            clearcoat: 1, clearcoatRoughness: 0.14
        }));
        const edge = keepMaterial(new THREE.MeshStandardMaterial({
            color: 0xA7C2B6, metalness: 0.72, roughness: 0.24
        }));
        const dark = keepMaterial(new THREE.MeshStandardMaterial({
            color: 0x142622, metalness: 0.42, roughness: 0.36
        }));

        const base = new THREE.Mesh(keepGeometry(new THREE.BoxGeometry(3.35,0.15,2.12)), shell);
        base.position.set(0,-1.02,0.18); laptop.add(base);
        const deck = new THREE.Mesh(keepGeometry(new THREE.BoxGeometry(3.17,0.018,1.94)), dark);
        deck.position.set(0,-0.936,0.18); laptop.add(deck);

        const screenFrame = new THREE.Mesh(keepGeometry(new THREE.BoxGeometry(3.30,2.02,0.14)), shell);
        screenFrame.position.set(0,0.10,-0.83); laptop.add(screenFrame);
        const screenTexture = makeScreenTexture();
        if (screenTexture) {
            const screenMaterial = keepMaterial(new THREE.MeshBasicMaterial({ map:screenTexture, toneMapped:false }));
            const screen = new THREE.Mesh(keepGeometry(new THREE.PlaneGeometry(3.08,1.82)), screenMaterial);
            screen.position.set(0,0.10,-0.752); laptop.add(screen);
        }

        // Instanced keyboard keys keep the mesh count low.
        const keyCount = 48;
        const keyGeometry = keepGeometry(new THREE.BoxGeometry(0.17,0.025,0.105));
        const keyMaterial = keepMaterial(new THREE.MeshStandardMaterial({
            color:0x72877E, metalness:0.24, roughness:0.42
        }));
        const keys = new THREE.InstancedMesh(keyGeometry,keyMaterial,keyCount);
        const dummy = new THREE.Object3D();
        let keyIndex = 0;
        for (let row=0; row<4; row++) {
            for (let column=0; column<12; column++) {
                dummy.position.set(-1.26 + column*0.229,-0.914,-0.49 + row*0.17);
                dummy.rotation.set(0,0,0); dummy.updateMatrix();
                keys.setMatrixAt(keyIndex++,dummy.matrix);
            }
        }
        keys.instanceMatrix.needsUpdate = true;
        laptop.add(keys);

        const trackpad = new THREE.Mesh(keepGeometry(new THREE.BoxGeometry(0.78,0.018,0.43)),edge);
        trackpad.position.set(0,-0.914,0.76); laptop.add(trackpad);
        const hinge = new THREE.Mesh(keepGeometry(new THREE.CylinderGeometry(0.045,0.045,2.7,24)),edge);
        hinge.rotation.z = Math.PI/2; hinge.position.set(0,-0.88,-0.78); laptop.add(hinge);

        // Fine metallic orbit paths behind the laptop.
        const orbitA = new THREE.Mesh(
            keepGeometry(new THREE.TorusGeometry(2.48,0.014,8,140)),
            keepMaterial(new THREE.MeshBasicMaterial({color:0x8C3942,transparent:true,opacity:0.60}))
        );
        orbitA.rotation.set(1.12,0.18,0.28); orbitA.position.set(0.28,0.06,-0.48); composition.add(orbitA);
        const orbitB = new THREE.Mesh(
            keepGeometry(new THREE.TorusGeometry(2.1,0.009,7,128)),
            keepMaterial(new THREE.MeshBasicMaterial({color:0xEAD8C1,transparent:true,opacity:0.66}))
        );
        orbitB.rotation.set(0.48,1.02,-0.2); orbitB.position.set(0.24,-0.08,-0.56); composition.add(orbitB);

        // Translucent glass elements that catch the colored rim lights.
        const glassMaterial = keepMaterial(new THREE.MeshPhysicalMaterial({
            color:0xD7E8DE, metalness:0.08, roughness:0.12,
            transmission:0.42, thickness:0.8, ior:1.22,
            clearcoat:1, clearcoatRoughness:0.06
        }));
        const glassCube = new THREE.Mesh(keepGeometry(new THREE.BoxGeometry(0.50,0.50,0.50)),glassMaterial);
        glassCube.position.set(-2.02,1.24,0.3); glassCube.rotation.set(0.4,0.25,0.68); composition.add(glassCube);
        const glassSphere = new THREE.Mesh(
            keepGeometry(new THREE.IcosahedronGeometry(0.28,1)),
            keepMaterial(new THREE.MeshPhysicalMaterial({
                color:0xA9D0C0,metalness:0.12,roughness:0.10,
                transmission:0.52,thickness:0.65,ior:1.25,clearcoat:1
            }))
        );
        glassSphere.position.set(2.12,1.06,0.44); composition.add(glassSphere);

        const accentRing = new THREE.Mesh(
            keepGeometry(new THREE.TorusGeometry(0.36,0.026,8,64)),
            keepMaterial(new THREE.MeshStandardMaterial({color:0xD9B98F,metalness:0.78,roughness:0.2}))
        );
        accentRing.position.set(2.12,-1.28,0.35); accentRing.rotation.set(0.8,0.25,0.35); composition.add(accentRing);

        const accentKnot = new THREE.Mesh(
            keepGeometry(new THREE.TorusKnotGeometry(0.30,0.07,64,10,2,3)),
            keepMaterial(new THREE.MeshPhysicalMaterial({
                color:0x77232D,metalness:0.62,roughness:0.2,clearcoat:1
            }))
        );
        accentKnot.position.set(-2.12,-1.05,0.45); accentKnot.rotation.set(0.4,0.2,-0.3); composition.add(accentKnot);

        // A subtle field of dust points adds depth without a heavy particle system.
        const particleCount = lowPowerDevice ? 34 : 64;
        const positions = new Float32Array(particleCount*3);
        for (let i=0;i<particleCount;i++) {
            positions[i*3] = (Math.sin(i*12.9898)*0.5+0.5)*6.4-3.2;
            positions[i*3+1] = (Math.cos(i*4.1414)*0.5+0.5)*4.4-2.2;
            positions[i*3+2] = -1.35+(i%8)*0.24;
        }
        const particleGeometry = keepGeometry(new THREE.BufferGeometry());
        particleGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
        const particles = new THREE.Points(
            particleGeometry,
            keepMaterial(new THREE.PointsMaterial({
                color:0xF5E7D5,size:0.026,transparent:true,opacity:0.72,
                sizeAttenuation:true,depthWrite:false
            }))
        );
        composition.add(particles);

        const clock = new THREE.Clock();
        function renderFrame() {
            if (disposed || !renderer || !active) return;
            const t = reducedMotion ? 0 : clock.getElapsedTime();
            if (!reducedMotion) {
                easedX += (pointerX - easedX) * 0.07;
                easedY += (pointerY - easedY) * 0.07;
                composition.rotation.y = Math.sin(t*0.20)*0.04 + easedX*0.24;
                composition.rotation.x = Math.sin(t*0.18)*0.025 + easedY*0.16;
                laptop.position.y = 0.02 + Math.sin(t*0.72)*0.055;
                laptop.rotation.y = -0.24 + easedX*0.12 + Math.sin(t*0.27)*0.018;
                orbitA.rotation.z = 0.28 + t*0.045;
                orbitB.rotation.y = 1.02 + t*0.055;
                glassCube.rotation.x = 0.4 + t*0.11;
                glassCube.rotation.y = 0.25 + t*0.16;
                glassSphere.position.y = 1.06 + Math.sin(t*0.85)*0.11;
                accentRing.rotation.z = 0.35 + t*0.12;
                accentKnot.rotation.y = 0.2 + t*0.14;
                particles.rotation.y = t*0.012;
            }
            renderer.render(scene,camera);
        }

        function resize() {
            if (disposed) return;
            const width = host.clientWidth;
            const height = host.clientHeight;
            if (!width || !height) return;
            camera.aspect = width/height;
            camera.position.z = Math.max(9.1, 8.3 / camera.aspect);
            camera.updateProjectionMatrix();
            renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, width<560 ? 1.15 : lowPowerDevice ? 1.1 : 1.5));
            renderer.setSize(width,height,false);
            if (reducedMotion && active) renderFrame();
        }

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        const onPointerMove = (event) => {
            const bounds = host.getBoundingClientRect();
            if (!bounds.width || !bounds.height) return;
            pointerX = ((event.clientX-bounds.left)/bounds.width-0.5)*0.65;
            pointerY = ((event.clientY-bounds.top)/bounds.height-0.5)*0.45;
        };
        if (!reducedMotion && window.matchMedia('(pointer:fine)').matches) {
            host.closest('.hero').addEventListener('pointermove',onPointerMove,{passive:true});
        }

        visibilityObserver = new IntersectionObserver(([entry]) => {
            active = entry.isIntersecting && document.visibilityState === 'visible';
            if (reducedMotion) { if (active) renderFrame(); }
            else renderer.setAnimationLoop(active ? renderFrame : null);
        },{threshold:0.04});
        visibilityObserver.observe(host);

        const onVisibilityChange = () => {
            const bounds = host.getBoundingClientRect();
            active = !disposed && bounds.bottom>0 && bounds.top<window.innerHeight && document.visibilityState==='visible';
            if (reducedMotion) { if (active) renderFrame(); }
            else renderer.setAnimationLoop(active ? renderFrame : null);
        };
        document.addEventListener('visibilitychange',onVisibilityChange);

        window.addEventListener('pagehide',(event) => {
            if (event.persisted) return;
            disposed = true; active = false;
            document.removeEventListener('visibilitychange',onVisibilityChange);
            host.closest('.hero').removeEventListener('pointermove',onPointerMove);
            visibilityObserver?.disconnect(); resizeObserver?.disconnect();
            renderer?.setAnimationLoop(null);
            geometries.forEach((geometry) => geometry.dispose());
            materials.forEach((material) => material.dispose());
            textures.forEach((texture) => texture.dispose());
            renderer?.dispose();
        });
    } catch (error) {
        console.warn('[Syst Team] Three.js indisponível; mantendo o visual de fallback.',error);
        renderer?.dispose();
        host.replaceChildren();
        host.dataset.fallback = 'true';
    }
}

})();
