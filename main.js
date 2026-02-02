import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene 생성
const scene = new THREE.Scene();

// Camera 생성
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);
camera.position.set(0, 50, 100);

// Renderer 생성
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 일시정지 상태
let isPaused = false;

// 더블클릭으로 일시정지/재개
renderer.domElement.addEventListener('dblclick', () => {
    isPaused = !isPaused;
});

// 별 배경 생성
function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 2000;
        positions[i + 1] = (Math.random() - 0.5) * 2000;
        positions[i + 2] = (Math.random() - 0.5) * 2000;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        sizeAttenuation: true
    });

    return new THREE.Points(starsGeometry, starsMaterial);
}

const stars = createStars();
scene.add(stars);

// 텍스처 로더
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = 'anonymous';

// 태양 셰이더 (이글이글거리는 효과)
const sunVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const sunFragmentShader = `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 6; i++) {
            value += amplitude * snoise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
        }
        return value;
    }

    void main() {
        vec3 pos = vPosition * 0.15;

        float noise1 = fbm(pos + time * 0.3);
        float noise2 = fbm(pos * 2.0 - time * 0.2);
        float noise3 = fbm(pos * 4.0 + time * 0.4);

        float finalNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

        vec3 innerColor = vec3(1.0, 1.0, 0.8);
        vec3 midColor = vec3(1.0, 0.6, 0.1);
        vec3 outerColor = vec3(0.8, 0.2, 0.0);

        float t = finalNoise * 0.5 + 0.5;
        vec3 color;
        if (t < 0.5) {
            color = mix(outerColor, midColor, t * 2.0);
        } else {
            color = mix(midColor, innerColor, (t - 0.5) * 2.0);
        }

        float brightness = 0.8 + finalNoise * 0.4;
        color *= brightness;

        gl_FragColor = vec4(color, 1.0);
    }
`;

// 태양 생성
const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
const sunMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 }
    },
    vertexShader: sunVertexShader,
    fragmentShader: sunFragmentShader
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// 태양 글로우 효과
const sunGlowGeometry = new THREE.SphereGeometry(14, 64, 64);
const sunGlowMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 }
    },
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            float flicker = 0.9 + 0.1 * sin(time * 3.0);
            vec3 color = vec3(1.0, 0.5, 0.1) * intensity * flicker;
            gl_FragColor = vec4(color, intensity);
        }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
});
const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
scene.add(sunGlow);

// 행성 데이터 - 색상 fallback 포함
const planetData = [
    {
        name: 'mercury',
        distance: 20,
        size: 0.8,
        orbitSpeed: 0.02,
        rotationSpeed: 0.0025,
        color: 0x9e9e9e,
        texture: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Mercury_Globe-MESSENGER_mosance_centered_at_0degN-0degE.jpg'
    },
    {
        name: 'venus',
        distance: 30,
        size: 1.2,
        orbitSpeed: 0.0075,
        rotationSpeed: -0.001,
        color: 0xe8cda0,
        texture: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Solarsystemscope_texture_8k_venus_surface.jpg'
    },
    {
        name: 'earth',
        distance: 45,
        size: 1.5,
        orbitSpeed: 0.005,
        rotationSpeed: 0.01,
        color: 0x6b93d6,
        texture: 'https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg'
    },
    {
        name: 'mars',
        distance: 60,
        size: 1.0,
        orbitSpeed: 0.004,
        rotationSpeed: 0.009,
        color: 0xc1440e,
        texture: 'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg'
    },
    {
        name: 'jupiter',
        distance: 90,
        size: 5,
        orbitSpeed: 0.001,
        rotationSpeed: 0.02,
        color: 0xd8ca9d,
        texture: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg'
    },
    {
        name: 'saturn',
        distance: 120,
        size: 4,
        orbitSpeed: 0.00045,
        rotationSpeed: 0.019,
        hasRing: true,
        color: 0xead6b8,
        texture: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg'
    },
    {
        name: 'uranus',
        distance: 150,
        size: 2.5,
        orbitSpeed: 0.0002,
        rotationSpeed: 0.015,
        color: 0xd1e7e7,
        tilt: 98
    },
    {
        name: 'neptune',
        distance: 180,
        size: 2.3,
        orbitSpeed: 0.00005,
        rotationSpeed: 0.016,
        color: 0x5b5ddf,
        texture: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg'
    }
];

const planets = [];

// 행성 생성 함수
function createPlanet(data) {
    const group = new THREE.Group();

    const geometry = new THREE.SphereGeometry(data.size, 64, 64);

    // MeshBasicMaterial 사용 (조명 불필요, 항상 밝게 보임)
    let material;

    if (data.texture) {
        const texture = textureLoader.load(
            data.texture,
            // 성공 콜백
            () => {},
            // 진행 콜백
            () => {},
            // 실패 콜백 - 색상으로 대체
            () => {
                planet.material = new THREE.MeshBasicMaterial({ color: data.color });
            }
        );
        material = new THREE.MeshBasicMaterial({ map: texture });
    } else {
        material = new THREE.MeshBasicMaterial({ color: data.color });
    }

    const planet = new THREE.Mesh(geometry, material);
    group.add(planet);

    // 천왕성 기울기 적용
    if (data.tilt) {
        planet.rotation.z = THREE.MathUtils.degToRad(data.tilt);
    }

    // 토성 고리
    if (data.hasRing) {
        const ringGeometry = new THREE.RingGeometry(data.size * 1.4, data.size * 2.3, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xc9b896,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2.5;
        group.add(ring);
    }

    // 궤도 표시
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    for (let i = 0; i <= 128; i++) {
        const angle = (i / 128) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(
            Math.cos(angle) * data.distance,
            0,
            Math.sin(angle) * data.distance
        ));
    }
    orbitGeometry.setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x6688aa, transparent: true, opacity: 0.6 });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);

    // 초기 위치 설정
    group.position.x = data.distance;
    scene.add(group);

    return {
        group,
        planet,
        data,
        angle: Math.random() * Math.PI * 2
    };
}

// 모든 행성 생성
planetData.forEach(data => {
    planets.push(createPlanet(data));
});

// OrbitControls 추가
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;

// Raycaster for interactions
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const minDistance = 15;
const maxDistance = 500;

// 클릭 위치 중심으로 회전하도록 설정
renderer.domElement.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // 왼쪽 클릭
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // 모든 행성과 태양을 대상으로 검사
        const allObjects = [sun, ...planets.map(p => p.planet)];
        const intersects = raycaster.intersectObjects(allObjects, true);

        if (intersects.length > 0) {
            // 클릭한 객체의 월드 위치를 타겟으로 설정
            const clickedPoint = intersects[0].point;
            controls.target.copy(clickedPoint);
        } else {
            // 빈 공간 클릭 시 카메라가 보는 방향의 평면과 교차점
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersectPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, intersectPoint);
            if (intersectPoint) {
                controls.target.copy(intersectPoint);
            }
        }
    }
});

// 마우스 커서 위치 중심 줌
renderer.domElement.addEventListener('wheel', (event) => {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const direction = raycaster.ray.direction.clone();

    const zoomSpeed = 10;
    const zoomAmount = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;

    const newCameraPos = camera.position.clone().add(direction.multiplyScalar(zoomAmount));

    const distanceFromOrigin = newCameraPos.length();
    if (distanceFromOrigin >= minDistance && distanceFromOrigin <= maxDistance) {
        camera.position.copy(newCameraPos);
        const targetMove = raycaster.ray.direction.clone().multiplyScalar(zoomAmount * 0.5);
        controls.target.add(targetMove);
    }
}, { passive: false });

// 시간 변수
let time = 0;

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);

    if (!isPaused) {
        time += 0.016;

        sunMaterial.uniforms.time.value = time;
        sunGlowMaterial.uniforms.time.value = time;

        planets.forEach(planetObj => {
            planetObj.angle += planetObj.data.orbitSpeed;
            planetObj.group.position.x = Math.cos(planetObj.angle) * planetObj.data.distance;
            planetObj.group.position.z = Math.sin(planetObj.angle) * planetObj.data.distance;

            planetObj.planet.rotation.y += planetObj.data.rotationSpeed;
        });

        stars.rotation.y += 0.00005;
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

// 윈도우 리사이즈 대응
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
