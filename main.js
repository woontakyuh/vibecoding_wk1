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

// 태양 생성
const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    emissive: 0xffff00
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// 태양 글로우 효과
const sunGlowGeometry = new THREE.SphereGeometry(12, 64, 64);
const sunGlowMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(1.0, 0.6, 0.0, 1.0) * intensity;
        }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
});
const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
scene.add(sunGlow);

// 태양 광원
const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// 약한 주변광
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambientLight);

// 행성 데이터 (거리, 크기, 색상, 공전속도, 자전속도)
const planetData = [
    { name: 'mercury', distance: 20, size: 0.8, color: 0x8c8c8c, orbitSpeed: 0.04, rotationSpeed: 0.005 },
    { name: 'venus', distance: 30, size: 1.2, color: 0xe6c87a, orbitSpeed: 0.015, rotationSpeed: -0.002 },
    { name: 'earth', distance: 45, size: 1.5, color: 0x6b93d6, orbitSpeed: 0.01, rotationSpeed: 0.02, hasAtmosphere: true, hasTexture: true },
    { name: 'mars', distance: 60, size: 1.0, color: 0xc1440e, orbitSpeed: 0.008, rotationSpeed: 0.018 },
    { name: 'jupiter', distance: 90, size: 5, color: 0xd8ca9d, orbitSpeed: 0.002, rotationSpeed: 0.04 },
    { name: 'saturn', distance: 120, size: 4, color: 0xead6b8, orbitSpeed: 0.0009, rotationSpeed: 0.038, hasRing: true },
    { name: 'uranus', distance: 150, size: 2.5, color: 0xd1e7e7, orbitSpeed: 0.0004, rotationSpeed: 0.03 },
    { name: 'neptune', distance: 180, size: 2.3, color: 0x5b5ddf, orbitSpeed: 0.0001, rotationSpeed: 0.032 }
];

const planets = [];

// 행성 생성 함수
function createPlanet(data) {
    const group = new THREE.Group();

    let material;

    if (data.hasTexture) {
        // 지구 텍스처
        const earthTexture = textureLoader.load(
            'https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg'
        );
        material = new THREE.MeshStandardMaterial({
            map: earthTexture,
            roughness: 0.8,
            metalness: 0.1
        });
    } else {
        material = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.8,
            metalness: 0.1
        });
    }

    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const planet = new THREE.Mesh(geometry, material);
    group.add(planet);

    // 대기 효과 (지구)
    if (data.hasAtmosphere) {
        const atmosphereGeometry = new THREE.SphereGeometry(data.size * 1.15, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        group.add(atmosphere);
    }

    // 토성 고리
    if (data.hasRing) {
        const ringGeometry = new THREE.RingGeometry(data.size * 1.4, data.size * 2.2, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xc9b896,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
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
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);

    // 초기 위치 설정
    group.position.x = data.distance;
    scene.add(group);

    return {
        group,
        planet,
        data,
        angle: Math.random() * Math.PI * 2 // 랜덤 시작 위치
    };
}

// 모든 행성 생성
planetData.forEach(data => {
    planets.push(createPlanet(data));
});

// 지구 찾기
const earthObj = planets.find(p => p.data.name === 'earth');

// OrbitControls 추가
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 500;

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);

    // 각 행성 공전 및 자전
    planets.forEach(planetObj => {
        // 공전
        planetObj.angle += planetObj.data.orbitSpeed;
        planetObj.group.position.x = Math.cos(planetObj.angle) * planetObj.data.distance;
        planetObj.group.position.z = Math.sin(planetObj.angle) * planetObj.data.distance;

        // 자전
        planetObj.planet.rotation.y += planetObj.data.rotationSpeed;
    });

    // 태양 자전
    sun.rotation.y += 0.001;

    // 별 배경 천천히 회전
    stars.rotation.y += 0.00005;

    // 컨트롤 업데이트
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
