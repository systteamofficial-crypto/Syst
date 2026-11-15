import * as THREE from 'three';

const host = document.querySelector('#hero-scene');
if (!host) {
    // No 3D scene is needed on login or checkout pages.
} else {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallScreen = window.matchMedia('(max-width: 760px)').matches;
    const lowPowerDevice = (navigator.hardwareConcurrency || 8) <= 4;

    // The CSS gradient remains as a lightweight fallback on small/low-power devices.
    if (smallScreen || lowPowerDevice || !('WebGLRenderingContext' in window)) {
        host.dataset.fallback = 'true';
    } else {
        let renderer;
        let resizeObserver;
        let pointerX = 0;
        let pointerY = 0;
        let active = false;
        let disposed = false;

        try {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
            camera.position.set(0, 0, 7.2);

            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: 'low-power'
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            renderer.setClearColor(0x000000, 0);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.08;
            renderer.domElement.setAttribute('aria-hidden', 'true');
            renderer.domElement.setAttribute('role', 'presentation');
            host.appendChild(renderer.domElement);

            const keyLight = new THREE.DirectionalLight(0xFFF0D8, 3.2);
            keyLight.position.set(3.5, 4, 5);
            scene.add(keyLight);
            scene.add(new THREE.HemisphereLight(0xF5DABF, 0x0F3D3A, 2.2));
            const rimLight = new THREE.PointLight(0x6C151E, 26, 14);
            rimLight.position.set(-3.2, 1.4, 2);
            scene.add(rimLight);

            const group = new THREE.Group();
            scene.add(group);

            const knotGeometry = new THREE.TorusKnotGeometry(1.02, 0.28, 160, 18, 2, 3);
            const knotMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x0F3D3A,
                metalness: 0.58,
                roughness: 0.24,
                clearcoat: 0.92,
                clearcoatRoughness: 0.18
            });
            const knot = new THREE.Mesh(knotGeometry, knotMaterial);
            knot.rotation.set(0.45, 0.2, -0.28);
            group.add(knot);

            const orbitGeometry = new THREE.TorusGeometry(1.82, 0.018, 8, 120);
            const orbitMaterial = new THREE.MeshStandardMaterial({
                color: 0x6C151E,
                metalness: 0.38,
                roughness: 0.42
            });
            const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbit.rotation.set(1.08, 0.2, 0.48);
            group.add(orbit);

            const innerOrbit = new THREE.Mesh(
                new THREE.TorusGeometry(1.48, 0.009, 6, 100),
                new THREE.MeshBasicMaterial({ color: 0xF5DABF, transparent: true, opacity: 0.75 })
            );
            innerOrbit.rotation.set(0.2, 1.1, 0.2);
            group.add(innerOrbit);

            const beadGeometry = new THREE.SphereGeometry(0.075, 18, 14);
            const beadMaterial = new THREE.MeshStandardMaterial({
                color: 0xF5DABF,
                metalness: 0.22,
                roughness: 0.3,
                emissive: 0x6C151E,
                emissiveIntensity: 0.12
            });
            const bead = new THREE.Mesh(beadGeometry, beadMaterial);
            bead.position.set(1.83, 0.12, 0.1);
            group.add(bead);

            const clock = new THREE.Clock();
            const renderFrame = () => {
                if (!active || disposed) return;
                const elapsed = clock.getElapsedTime();

                if (!reducedMotion) {
                    group.rotation.y = elapsed * 0.12 + pointerX * 0.13;
                    group.rotation.x = Math.sin(elapsed * 0.22) * 0.08 + pointerY * 0.09;
                    knot.rotation.z = -0.28 + Math.sin(elapsed * 0.18) * 0.045;
                    bead.position.y = 0.12 + Math.sin(elapsed * 0.7) * 0.08;
                }

                renderer.render(scene, camera);
            };

            const resize = () => {
                const width = host.clientWidth;
                const height = host.clientHeight;
                if (!width || !height || disposed) return;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height, false);
                if (reducedMotion) renderFrame();
            };

            resizeObserver = new ResizeObserver(resize);
            resizeObserver.observe(host);
            resize();

            if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
                host.addEventListener('pointermove', (event) => {
                    const bounds = host.getBoundingClientRect();
                    pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.7;
                    pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.5;
                }, { passive: true });
            }

            const visibilityObserver = new IntersectionObserver(([entry]) => {
                active = entry.isIntersecting && document.visibilityState === 'visible';
                if (reducedMotion) {
                    if (active) renderFrame();
                    return;
                }
                renderer.setAnimationLoop(active ? renderFrame : null);
            }, { threshold: 0.04 });
            visibilityObserver.observe(host);

            document.addEventListener('visibilitychange', () => {
                active = !disposed && host.getBoundingClientRect().bottom > 0 &&
                    host.getBoundingClientRect().top < window.innerHeight &&
                    document.visibilityState === 'visible';
                if (!reducedMotion) renderer.setAnimationLoop(active ? renderFrame : null);
                else if (active) renderFrame();
            });

            window.addEventListener('pagehide', () => {
                disposed = true;
                active = false;
                visibilityObserver.disconnect();
                resizeObserver?.disconnect();
                renderer.setAnimationLoop(null);
                knotGeometry.dispose();
                knotMaterial.dispose();
                orbitGeometry.dispose();
                orbitMaterial.dispose();
                beadGeometry.dispose();
                beadMaterial.dispose();
                innerOrbit.geometry.dispose();
                innerOrbit.material.dispose();
                renderer.dispose();
            }, { once: true });
        } catch (error) {
            console.warn('[Syst Team] A cena 3D foi desativada; usando o fallback CSS.', error);
            renderer?.dispose();
            host.replaceChildren();
            host.dataset.fallback = 'true';
        }
    }
}
