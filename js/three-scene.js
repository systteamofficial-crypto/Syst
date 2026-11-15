import * as THREE from 'three';

const host = document.querySelector('#hero-scene');

if (host) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallScreen = window.matchMedia('(max-width: 760px)').matches;
    const lowPowerDevice = (navigator.hardwareConcurrency || 8) <= 4;

    // Photos and CSS glass layers remain visible when WebGL is unavailable.
    if (smallScreen || lowPowerDevice || !('WebGLRenderingContext' in window)) {
        host.dataset.fallback = 'true';
    } else {
        let renderer;
        let resizeObserver;
        let visibilityObserver;
        let disposed = false;
        let active = false;
        let pointerX = 0;
        let pointerY = 0;
        const disposableMaterials = new Set();
        const disposableGeometries = new Set();

        const rememberMaterial = (material) => {
            if (Array.isArray(material)) material.forEach((item) => disposableMaterials.add(item));
            else disposableMaterials.add(material);
            return material;
        };

        const rememberGeometry = (geometry) => {
            disposableGeometries.add(geometry);
            return geometry;
        };

        const roundedScreenTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1100;
            canvas.height = 690;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            const bg = ctx.createLinearGradient(0, 0, 1100, 690);
            bg.addColorStop(0, '#102F2D');
            bg.addColorStop(1, '#071E1D');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Browser/editor header.
            ctx.fillStyle = 'rgba(255,255,255,.075)';
            ctx.fillRect(0, 0, 1100, 66);
            ['#E78B83', '#E4C17A', '#7EB59C'].forEach((color, index) => {
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.arc(35 + index * 30, 33, 9, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.fillStyle = 'rgba(245,239,225,.74)';
            ctx.font = '600 19px Arial';
            ctx.fillText('SYST TEAM  /  WORKSPACE', 145, 40);

            // Left navigation.
            ctx.fillStyle = 'rgba(255,255,255,.045)';
            ctx.fillRect(0, 66, 205, 624);
            ctx.fillStyle = '#A9CFC1';
            ctx.font = '600 19px Arial';
            ctx.fillText('PROJECT', 34, 125);
            ['Overview', 'Interface', 'Components', 'Deploy'].forEach((label, index) => {
                const y = 183 + index * 62;
                if (index === 1) {
                    ctx.fillStyle = 'rgba(131,190,166,.16)';
                    ctx.fillRect(18, y - 27, 170, 42);
                }
                ctx.fillStyle = index === 1 ? '#D7E8DC' : 'rgba(245,239,225,.55)';
                ctx.font = '500 17px Arial';
                ctx.fillText(label, 42, y);
            });

            // Main interface cards.
            ctx.fillStyle = '#F5E7D5';
            ctx.font = '700 36px Arial';
            ctx.fillText('A good idea,', 258, 157);
            ctx.fillStyle = '#B7D7C9';
            ctx.fillText('beautifully built.', 258, 202);
            ctx.fillStyle = 'rgba(255,255,255,.075)';
            ctx.fillRect(258, 248, 785, 235);
            ctx.fillStyle = 'rgba(245,231,213,.78)';
            ctx.font = '600 18px Arial';
            ctx.fillText('PROJECT HEALTH', 291, 291);

            const bars = [0.5, 0.74, 0.62, 0.9, 0.78, 0.97, 0.84, 1, 0.72];
            bars.forEach((height, index) => {
                const width = 34;
                const x = 302 + index * 73;
                const y = 440 - height * 112;
                const gradient = ctx.createLinearGradient(0, y, 0, 440);
                gradient.addColorStop(0, '#9DCDB8');
                gradient.addColorStop(1, '#477F70');
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, width, height * 112);
            });

            ctx.fillStyle = 'rgba(255,255,255,.075)';
            ctx.fillRect(258, 515, 375, 130);
            ctx.fillRect(650, 515, 393, 130);
            ctx.fillStyle = '#D8E8DE';
            ctx.font = '600 20px Arial';
            ctx.fillText('Design system', 286, 558);
            ctx.fillText('Ready to publish', 680, 558);
            ctx.fillStyle = 'rgba(216,232,222,.54)';
            ctx.font = '16px Arial';
            ctx.fillText('Reusable components', 286, 593);
            ctx.fillText('All checks passed', 680, 593);

            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = 4;
            return texture;
        };

        try {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 60);
            camera.position.set(0, 0.12, 8.8);

            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: 'low-power'
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.55));
            renderer.setClearColor(0x000000, 0);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.14;
            renderer.domElement.setAttribute('aria-hidden', 'true');
            renderer.domElement.setAttribute('role', 'presentation');
            host.appendChild(renderer.domElement);

            scene.add(new THREE.HemisphereLight(0xF4E5D2, 0x0F3D3A, 2.15));
            const keyLight = new THREE.DirectionalLight(0xFFF1DB, 3.15);
            keyLight.position.set(4, 5, 7);
            scene.add(keyLight);

            const tealLight = new THREE.PointLight(0x7CB7A2, 18, 12);
            tealLight.position.set(-3.4, 1.2, 2.5);
            scene.add(tealLight);
            const burgundyLight = new THREE.PointLight(0x9A3A43, 12, 10);
            burgundyLight.position.set(3.3, -1.2, 1.7);
            scene.add(burgundyLight);

            const composition = new THREE.Group();
            scene.add(composition);

            // Floating laptop, assembled from lightweight Three.js geometry.
            const laptop = new THREE.Group();
            laptop.position.set(0.48, 0.06, -0.1);
            laptop.rotation.set(-0.12, -0.27, 0.055);
            composition.add(laptop);

            const shellMaterial = rememberMaterial(new THREE.MeshPhysicalMaterial({
                color: 0x344944,
                metalness: 0.76,
                roughness: 0.23,
                clearcoat: 1,
                clearcoatRoughness: 0.17
            }));
            const edgeMaterial = rememberMaterial(new THREE.MeshStandardMaterial({
                color: 0xA9C4B9,
                metalness: 0.68,
                roughness: 0.28
            }));
            const darkMaterial = rememberMaterial(new THREE.MeshStandardMaterial({
                color: 0x142622,
                metalness: 0.42,
                roughness: 0.38
            }));

            const base = new THREE.Mesh(
                rememberGeometry(new THREE.BoxGeometry(3.28, 0.14, 2.12)),
                shellMaterial
            );
            base.position.set(0, -1.02, 0.18);
            laptop.add(base);

            const baseTop = new THREE.Mesh(
                rememberGeometry(new THREE.BoxGeometry(3.1, 0.018, 1.93)),
                darkMaterial
            );
            baseTop.position.set(0, -0.94, 0.18);
            laptop.add(baseTop);

            const screenFrame = new THREE.Mesh(
                rememberGeometry(new THREE.BoxGeometry(3.24, 2.03, 0.13)),
                shellMaterial
            );
            screenFrame.position.set(0, 0.11, -0.82);
            laptop.add(screenFrame);

            const screenTexture = roundedScreenTexture();
            if (screenTexture) {
                const screenMaterial = rememberMaterial(new THREE.MeshBasicMaterial({
                    map: screenTexture,
                    toneMapped: false
                }));
                const screenFace = new THREE.Mesh(
                    rememberGeometry(new THREE.PlaneGeometry(3.03, 1.82)),
                    screenMaterial
                );
                screenFace.position.set(0, 0.11, -0.749);
                laptop.add(screenFace);
                disposableMaterials.add(screenMaterial);
            }

            // Keyboard, trackpad and small hinge details.
            const keyGeometry = rememberGeometry(new THREE.BoxGeometry(0.175, 0.026, 0.115));
            const keyMaterial = rememberMaterial(new THREE.MeshStandardMaterial({
                color: 0x60756D,
                metalness: 0.26,
                roughness: 0.48
            }));
            const keyRows = 4;
            const keyColumns = 12;
            const keys = new THREE.InstancedMesh(keyGeometry, keyMaterial, keyRows * keyColumns);
            const keyTransform = new THREE.Object3D();
            let keyIndex = 0;
            for (let row = 0; row < keyRows; row += 1) {
                for (let column = 0; column < keyColumns; column += 1) {
                    keyTransform.position.set(-1.22 + column * 0.222, -0.915, -0.48 + row * 0.17);
                    keyTransform.updateMatrix();
                    keys.setMatrixAt(keyIndex, keyTransform.matrix);
                    keyIndex += 1;
                }
            }
            keys.instanceMatrix.needsUpdate = true;
            laptop.add(keys);

            const trackpad = new THREE.Mesh(
                rememberGeometry(new THREE.BoxGeometry(0.82, 0.018, 0.48)),
                edgeMaterial
            );
            trackpad.position.set(0, -0.911, 0.73);
            laptop.add(trackpad);

            const hinge = new THREE.Mesh(
                rememberGeometry(new THREE.CylinderGeometry(0.047, 0.047, 2.6, 28)),
                edgeMaterial
            );
            hinge.rotation.z = Math.PI / 2;
            hinge.position.set(0, -0.88, -0.77);
            laptop.add(hinge);

            // Thin orbit rings give the composition a sense of depth.
            const orbitMaterial = rememberMaterial(new THREE.MeshBasicMaterial({
                color: 0x6C151E,
                transparent: true,
                opacity: 0.5
            }));
            const orbit = new THREE.Mesh(
                rememberGeometry(new THREE.TorusGeometry(2.42, 0.014, 8, 150)),
                orbitMaterial
            );
            orbit.rotation.set(1.15, 0.18, 0.32);
            orbit.position.set(0.36, 0.04, -0.35);
            composition.add(orbit);

            const secondOrbit = new THREE.Mesh(
                rememberGeometry(new THREE.TorusGeometry(2.08, 0.009, 7, 140)),
                rememberMaterial(new THREE.MeshBasicMaterial({
                    color: 0xD7E7DB,
                    transparent: true,
                    opacity: 0.7
                }))
            );
            secondOrbit.rotation.set(0.48, 1.03, -0.2);
            secondOrbit.position.set(0.28, -0.08, -0.48);
            composition.add(secondOrbit);

            // Floating glass-like objects around the laptop.
            const glassMaterial = rememberMaterial(new THREE.MeshPhysicalMaterial({
                color: 0xD4E6DC,
                metalness: 0.12,
                roughness: 0.12,
                transmission: 0.48,
                transparent: true,
                opacity: 0.82,
                clearcoat: 1,
                clearcoatRoughness: 0.06
            }));
            const glassCube = new THREE.Mesh(
                rememberGeometry(new THREE.BoxGeometry(0.48, 0.48, 0.48)),
                glassMaterial
            );
            glassCube.position.set(-1.9, 1.18, 0.3);
            glassCube.rotation.set(0.45, 0.25, 0.7);
            composition.add(glassCube);

            const glassSphere = new THREE.Mesh(
                rememberGeometry(new THREE.IcosahedronGeometry(0.25, 1)),
                rememberMaterial(new THREE.MeshPhysicalMaterial({
                    color: 0xA9D0C0,
                    metalness: 0.2,
                    roughness: 0.12,
                    transmission: 0.55,
                    transparent: true,
                    opacity: 0.84,
                    clearcoat: 1
                }))
            );
            glassSphere.position.set(2.15, 0.98, 0.45);
            composition.add(glassSphere);

            const accentKnot = new THREE.Mesh(
                rememberGeometry(new THREE.TorusKnotGeometry(0.31, 0.075, 80, 12, 2, 3)),
                rememberMaterial(new THREE.MeshPhysicalMaterial({
                    color: 0x6C151E,
                    metalness: 0.56,
                    roughness: 0.24,
                    clearcoat: 0.94
                }))
            );
            accentKnot.position.set(-2.12, -1.03, 0.55);
            accentKnot.rotation.set(0.4, 0.2, -0.3);
            composition.add(accentKnot);

            const smallRing = new THREE.Mesh(
                rememberGeometry(new THREE.TorusGeometry(0.38, 0.025, 8, 72)),
                rememberMaterial(new THREE.MeshStandardMaterial({
                    color: 0xD7B98F,
                    metalness: 0.68,
                    roughness: 0.26
                }))
            );
            smallRing.position.set(2.02, -1.14, 0.5);
            smallRing.rotation.set(0.8, 0.25, 0.35);
            composition.add(smallRing);

            // Small dust-like points add a soft sense of scale without heavy geometry.
            const particleCount = 68;
            const particlePositions = new Float32Array(particleCount * 3);
            for (let index = 0; index < particleCount; index += 1) {
                particlePositions[index * 3] = (Math.sin(index * 12.9898) * 0.5 + 0.5) * 6.2 - 3.1;
                particlePositions[index * 3 + 1] = (Math.cos(index * 4.1414) * 0.5 + 0.5) * 4.4 - 2.2;
                particlePositions[index * 3 + 2] = -1.2 + (index % 9) * 0.23;
            }
            const particleGeometry = rememberGeometry(new THREE.BufferGeometry());
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
            const particles = new THREE.Points(
                particleGeometry,
                rememberMaterial(new THREE.PointsMaterial({
                    color: 0xF5E7D5,
                    size: 0.027,
                    transparent: true,
                    opacity: 0.74,
                    sizeAttenuation: true
                }))
            );
            composition.add(particles);

            const clock = new THREE.Clock();
            const renderFrame = () => {
                if (!active || disposed) return;
                const elapsed = reducedMotion ? 0 : clock.getElapsedTime();

                if (!reducedMotion) {
                    composition.rotation.y = Math.sin(elapsed * 0.22) * 0.045 + pointerX * 0.09;
                    composition.rotation.x = Math.sin(elapsed * 0.19) * 0.025 + pointerY * 0.055;
                    laptop.position.y = 0.06 + Math.sin(elapsed * 0.72) * 0.075;
                    laptop.rotation.y = -0.27 + pointerX * 0.06 + Math.sin(elapsed * 0.28) * 0.025;
                    orbit.rotation.z = 0.32 + elapsed * 0.055;
                    secondOrbit.rotation.y = 1.03 + elapsed * 0.07;
                    glassCube.rotation.x += 0.0025;
                    glassCube.rotation.y += 0.0035;
                    glassSphere.position.y = 0.98 + Math.sin(elapsed * 0.9) * 0.13;
                    accentKnot.rotation.y = 0.2 + elapsed * 0.18;
                    smallRing.rotation.z = 0.35 + elapsed * 0.16;
                    particles.rotation.y = elapsed * 0.018;
                }

                renderer.render(scene, camera);
            };

            const resize = () => {
                if (disposed) return;
                const width = host.clientWidth;
                const height = host.clientHeight;
                if (!width || !height) return;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height, false);
                if (reducedMotion && active) renderFrame();
            };

            resizeObserver = new ResizeObserver(resize);
            resizeObserver.observe(host);
            resize();

            if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
                host.addEventListener('pointermove', (event) => {
                    const bounds = host.getBoundingClientRect();
                    if (!bounds.width || !bounds.height) return;
                    pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.7;
                    pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.5;
                }, { passive: true });
            }

            visibilityObserver = new IntersectionObserver(([entry]) => {
                active = entry.isIntersecting && document.visibilityState === 'visible';
                if (reducedMotion) {
                    if (active) renderFrame();
                    return;
                }
                renderer.setAnimationLoop(active ? renderFrame : null);
            }, { threshold: 0.04 });
            visibilityObserver.observe(host);

            const onVisibilityChange = () => {
                const bounds = host.getBoundingClientRect();
                active = !disposed && bounds.bottom > 0 && bounds.top < window.innerHeight &&
                    document.visibilityState === 'visible';
                if (reducedMotion) {
                    if (active) renderFrame();
                } else {
                    renderer.setAnimationLoop(active ? renderFrame : null);
                }
            };
            document.addEventListener('visibilitychange', onVisibilityChange);

            window.addEventListener('pagehide', () => {
                disposed = true;
                active = false;
                document.removeEventListener('visibilitychange', onVisibilityChange);
                visibilityObserver?.disconnect();
                resizeObserver?.disconnect();
                renderer?.setAnimationLoop(null);
                disposableGeometries.forEach((geometry) => geometry.dispose());
                disposableMaterials.forEach((material) => {
                    material.map?.dispose();
                    material.dispose();
                });
                renderer?.dispose();
            }, { once: true });
        } catch (error) {
            console.warn('[Syst Team] A cena 3D foi desativada; mantendo as camadas de foto e glass.', error);
            renderer?.dispose();
            host.replaceChildren();
            host.dataset.fallback = 'true';
        }
    }
}
