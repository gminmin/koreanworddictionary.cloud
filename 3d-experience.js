// --- CONFIG & STATE ---
let scene, camera, renderer, controls, transformControls, raycaster, mouse;
let objects = [];
let selectedObject = null;
let activeTool = 'select';
let activeCamera = null;
let isCameraView = false;
let sceneCamera; // The original workspace camera

// History System
let history = [];
let redoStack = [];
const MAX_HISTORY = 50;

const ui = {
    fps: document.getElementById('stat-fps'),
    objects: document.getElementById('stat-objects'),
    vertices: document.getElementById('stat-vertices'),
    pos: {
        x: document.getElementById('pos-x'),
        y: document.getElementById('pos-y'),
        z: document.getElementById('pos-z')
    },
    rot: {
        x: document.getElementById('rot-x'),
        y: document.getElementById('rot-y'),
        z: document.getElementById('rot-z')
    },
    scl: {
        x: document.getElementById('scl-x'),
        y: document.getElementById('scl-y'),
        z: document.getElementById('scl-z')
    },
    matColor: document.getElementById('mat-color'),
    matMetal: document.getElementById('mat-metal'),
    matAlpha: document.getElementById('mat-alpha'),
    btnCamera: document.getElementById('btn-toggle-camera')
};

// --- INITIALIZATION ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    sceneCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    sceneCamera.position.set(5, 5, 5);
    camera = sceneCamera; // Start with scene camera

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true // Required for canvas capture
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('experience-container').appendChild(renderer.domElement);

    // Helpers & Lights
    const grid = new THREE.GridHelper(20, 20, 0x04d9d9, 0x1e293b);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.PointLight(0x04d9d9, 1.2, 50);
    light.position.set(10, 10, 10);
    scene.add(light);

    // Selection Logic
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    transformControls = new THREE.TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', (event) => {
        controls.enabled = !event.value;
        // Capture state after transform ends
        if (!event.value) {
            saveHistory();
        }
    });
    scene.add(transformControls);

    // Add Initial Cube
    addObject('cube', false); // false = don't save history for initial object

    initUI();
    animate();
}

// --- HISTORY LOGIC ---
function saveHistory() {
    const state = objects.map(obj => ({
        type: obj.isCameraObject ? 'camera' : 'mesh',
        uuid: obj.uuid,
        position: obj.position.clone(),
        rotation: obj.rotation.clone(),
        scale: obj.scale.clone(),
        color: !obj.isCameraObject ? obj.material.color.getHex() : null,
        metalness: !obj.isCameraObject ? obj.material.metalness : null,
        opacity: !obj.isCameraObject ? obj.material.opacity : null,
        geometryType: obj.geometry ? obj.geometry.type : null,
        params: obj.isCameraObject ? null : (obj.geometry ? obj.geometry.parameters : null)
    }));

    history.push(JSON.stringify(state));
    if (history.length > MAX_HISTORY) history.shift();
    redoStack = []; // Clear redo stack on new action
}

function undo() {
    if (history.length <= 1) return; // Need at least one previous state

    redoStack.push(history.pop());
    const prevState = JSON.parse(history[history.length - 1]);
    applyState(prevState);
}

function redo() {
    if (redoStack.length === 0) return;

    const nextState = JSON.parse(redoStack.pop());
    history.push(JSON.stringify(nextState));
    applyState(nextState);
}

function applyState(stateData) {
    // 1. Clear current objects (except helpers/lights)
    objects.forEach(obj => {
        if (obj.isCameraObject) {
            if (obj.userData.helper) scene.remove(obj.userData.helper);
            if (obj.userData.camera) scene.remove(obj.userData.camera);
        }
        scene.remove(obj);
    });
    objects = [];

    // 2. Reconstruct from state
    stateData.forEach(data => {
        let mesh;
        if (data.type === 'camera') {
            const camObj = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
            const helper = new THREE.CameraHelper(camObj);
            scene.add(helper);

            const proxyGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const proxyMat = new THREE.MeshBasicMaterial({ color: 0x04d9d9, wireframe: true, transparent: true, opacity: 0.5 });
            mesh = new THREE.Mesh(proxyGeom, proxyMat);

            mesh.userData.camera = camObj;
            mesh.userData.helper = helper;
            mesh.isCameraObject = true;
            activeCamera = camObj;
            scene.add(camObj);
        } else {
            let geometry;
            // Simplified geometry reconstruction
            if (data.geometryType === 'SphereGeometry') geometry = new THREE.SphereGeometry(data.params.radius, data.params.widthSegments, data.params.heightSegments);
            else if (data.geometryType === 'TorusGeometry') geometry = new THREE.TorusGeometry(data.params.radius, data.params.tube, data.params.radialSegments, data.params.tubularSegments);
            else if (data.geometryType === 'CylinderGeometry') geometry = new THREE.CylinderGeometry(data.params.radiusTop, data.params.radiusBottom, data.params.height, data.params.radialSegments);
            else geometry = new THREE.BoxGeometry(data.params.width, data.params.height, data.params.depth);

            const material = new THREE.MeshStandardMaterial({
                color: data.color,
                metalness: data.metalness,
                roughness: 0.5,
                transparent: true,
                opacity: data.opacity
            });
            mesh = new THREE.Mesh(geometry, material);
        }

        mesh.position.copy(data.position);
        mesh.rotation.copy(data.rotation);
        mesh.scale.copy(data.scale);

        scene.add(mesh);
        objects.push(mesh);
    });

    // Re-attach if needed
    if (selectedObject) {
        const stillExists = objects.find(o => o.geometry?.type === selectedObject.geometry?.type && o.position.equals(selectedObject.position));
        if (stillExists) selectObject(stillExists);
        else selectObject(null);
    }
}

// --- OBJECT MANAGEMENT ---
function addObject(type, save = true) {
    let mesh;

    if (type === 'camera') {
        const camObj = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        const helper = new THREE.CameraHelper(camObj);
        scene.add(helper);

        // Create a selectable proxy (Wireframe Box)
        const proxyGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const proxyMat = new THREE.MeshBasicMaterial({ color: 0x04d9d9, wireframe: true, transparent: true, opacity: 0.5 });
        mesh = new THREE.Mesh(proxyGeom, proxyMat);

        mesh.userData.camera = camObj;
        mesh.userData.helper = helper;
        mesh.isCameraObject = true;
        activeCamera = camObj;
        scene.add(camObj); // Add hidden camera to scene
    } else {
        let geometry;
        switch (type) {
            case 'sphere': geometry = new THREE.SphereGeometry(1.2, 32, 32); break;
            case 'torus': geometry = new THREE.TorusGeometry(1, 0.4, 16, 100); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(1, 1, 2, 32); break;
            default: geometry = new THREE.BoxGeometry(2, 2, 2);
        }
        const material = new THREE.MeshStandardMaterial({
            color: 0x5d68a6,
            metalness: 0.2,
            roughness: 0.5,
            transparent: true,
            opacity: 1.0
        });
        mesh = new THREE.Mesh(geometry, material);
    }

    mesh.position.y = 1;
    scene.add(mesh);
    objects.push(mesh);
    selectObject(mesh);

    if (save) saveHistory();
}

function selectObject(obj) {
    selectedObject = obj;
    if (obj) {
        transformControls.attach(obj);
        // Sync UI
        if (!obj.isCameraObject) {
            ui.matColor.value = '#' + obj.material.color.getHexString();
            ui.matMetal.value = obj.material.metalness;
            ui.matAlpha.value = obj.material.opacity;
        }
    } else {
        transformControls.detach();
    }
}

// --- UI HANDLERS ---
function initUI() {
    // Selection
    window.addEventListener('click', (event) => {
        if (event.target.tagName !== 'CANVAS') return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(objects);

        if (intersects.length > 0) {
            selectObject(intersects[0].object);
        } else if (!transformControls.dragging) {
            selectObject(null);
        }
    });

    // Toolbar
    document.getElementById('tool-select').onclick = () => {
        transformControls.detach();
        setActiveTool('tool-select');
    }
    document.getElementById('tool-grab').onclick = () => {
        transformControls.setMode('translate');
        setActiveTool('tool-grab');
    }
    document.getElementById('tool-rotate').onclick = () => {
        transformControls.setMode('rotate');
        setActiveTool('tool-rotate');
    }
    document.getElementById('tool-scale').onclick = () => {
        transformControls.setMode('scale');
        setActiveTool('tool-scale');
    }

    function setActiveTool(id) {
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    // Add Menu Toggle
    const addBtn = document.getElementById('btn-add-object');
    const addDropdown = document.querySelector('.add-dropdown');

    if (addBtn && addDropdown) {
        addBtn.addEventListener('click', (e) => {
            console.log("Add button clicked");
            e.preventDefault();
            e.stopPropagation();
            addDropdown.classList.toggle('active');
            console.log("Menu active state:", addDropdown.classList.contains('active'));
        });

        // Close dropdown on outside click
        window.addEventListener('click', (e) => {
            if (addDropdown.classList.contains('active') && !addDropdown.contains(e.target)) {
                console.log("Closing menu via outside click");
                addDropdown.classList.remove('active');
            }
        });

        // Add Menu Buttons
        addDropdown.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log("Menu button clicked:", btn.dataset.type);
                e.preventDefault();
                e.stopPropagation();
                addObject(btn.dataset.type);
                addDropdown.classList.remove('active');
            });
        });
    } else {
        console.error("Add menu elements not found!");
    }

    // Material Controls
    ui.matColor.oninput = (e) => {
        if (selectedObject && !selectedObject.isCameraObject) {
            selectedObject.material.color.set(e.target.value);
        }
    };
    ui.matColor.onchange = () => saveHistory();

    ui.matMetal.oninput = (e) => {
        if (selectedObject && !selectedObject.isCameraObject) {
            selectedObject.material.metalness = parseFloat(e.target.value);
        }
    };
    ui.matMetal.onchange = () => saveHistory();

    ui.matAlpha.oninput = (e) => {
        if (selectedObject && !selectedObject.isCameraObject) {
            selectedObject.material.opacity = parseFloat(e.target.value);
        }
    };
    ui.matAlpha.onchange = () => saveHistory();

    // Render & Export
    document.getElementById('btn-render').onclick = startRealRender;
    document.getElementById('btn-close-render').onclick = () => document.getElementById('render-overlay').style.display = 'none';

    // Camera Toggle
    ui.btnCamera.onclick = toggleCameraView;

    // Shortcuts
    window.onkeydown = (e) => {
        // Ctrl + Shift + Z or Ctrl + Y (Redo)
        if (e.ctrlKey && (e.shiftKey && e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
            e.preventDefault();
            redo();
            return;
        }
        // Ctrl + Z (Undo)
        if (e.ctrlKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undo();
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'g':
                transformControls.setMode('translate');
                setActiveTool('tool-grab');
                break;
            case 'r':
                transformControls.setMode('rotate');
                setActiveTool('tool-rotate');
                break;
            case 's':
                transformControls.setMode('scale');
                setActiveTool('tool-scale');
                break;
            case 'w':
                transformControls.setMode('translate');
                setActiveTool('tool-grab');
                break;
            case 'z':
                toggleWireframe();
                break;
            case '0': toggleCameraView(); break;
            case 'delete':
                if (selectedObject) {
                    if (selectedObject.isCameraObject) {
                        scene.remove(selectedObject.userData.helper);
                        scene.remove(selectedObject.userData.camera);
                        if (activeCamera === selectedObject.userData.camera) activeCamera = null;
                        isCameraView = false;
                        camera = sceneCamera;
                    }
                    scene.remove(selectedObject);
                    objects = objects.filter(o => o !== selectedObject);
                    selectObject(null);
                    saveHistory();
                }
                break;
        }
    };

    // Initial capture
    saveHistory();
}

function toggleCameraView() {
    if (!activeCamera) {
        alert("Please add a Camera object first.");
        return;
    }
    isCameraView = !isCameraView;
    camera = isCameraView ? activeCamera : sceneCamera;
    ui.btnCamera.classList.toggle('active', isCameraView);

    objects.forEach(obj => {
        if (obj.isCameraObject) {
            obj.userData.helper.visible = !isCameraView;
            obj.visible = !isCameraView; // Hide proxy in camera view
        }
    });
}

// --- REAL RENDER & EXPORT ---
async function startRealRender() {
    const overlay = document.getElementById('render-overlay');
    const simCanvas = document.getElementById('render-canvas-sim');
    const samplesEl = document.getElementById('render-samples');
    const closeBtn = document.getElementById('btn-close-render');

    overlay.style.display = 'flex';
    simCanvas.innerHTML = '<div class="render-loading-text">REFINING DATA...</div>';
    closeBtn.style.display = 'none';

    // Simulate Sampling
    let load = 0;
    while (load < 100) {
        load += 2;
        samplesEl.innerText = Math.floor(load * 10.24);
        document.getElementById('render-progress').style.width = load + '%';
        await new Promise(r => setTimeout(r, 40));
    }

    // --- High Quality Capture Pass ---
    // 1. Determine Camera & Ratio
    const renderCam = activeCamera || camera;
    const ratioVal = document.getElementById('render-ratio').value;

    // Save original states
    const originalSize = new THREE.Vector2();
    renderer.getSize(originalSize);
    const originalAspect = renderCam.aspect;

    // Set Target Dimensions
    let targetW = originalSize.x;
    let targetH = originalSize.y;

    if (ratioVal !== 'viewport') {
        const [rw, rh] = ratioVal.split(':').map(Number);
        // We use a base size (e.g., 1920) but scale to fit within viewport capabilities
        const baseSize = 1280;
        if (rw >= rh) {
            targetW = baseSize;
            targetH = baseSize * (rh / rw);
        } else {
            targetH = baseSize;
            targetW = baseSize * (rw / rh);
        }
    }

    // 2. Hide Technical Elements
    const technicalElements = [];
    scene.traverse(obj => {
        if (obj instanceof THREE.GridHelper || obj instanceof THREE.CameraHelper || obj.isCameraObject) {
            if (obj.visible) {
                technicalElements.push(obj);
                obj.visible = false;
            }
        }
    });

    // Hide Transform Gizmo
    const transformVisible = transformControls.visible;
    transformControls.visible = false;
    transformControls.detach();

    // 3. Apply Target Size & Aspect
    renderer.setSize(targetW, targetH, false);
    renderCam.aspect = targetW / targetH;
    renderCam.updateProjectionMatrix();

    // 4. Forced Render
    renderer.render(scene, renderCam);

    // 5. Capture Canvas
    const dataURL = renderer.domElement.toDataURL("image/png");

    // 6. Restore Everything
    renderer.setSize(originalSize.x, originalSize.y, false);
    renderCam.aspect = originalAspect;
    renderCam.updateProjectionMatrix();

    technicalElements.forEach(obj => obj.visible = true);
    transformControls.visible = transformVisible;
    if (selectedObject) transformControls.attach(selectedObject);

    // If we were in camera view, ensure the active camera proxy remains hidden
    if (isCameraView) {
        objects.forEach(obj => {
            if (obj.isCameraObject) {
                obj.userData.helper.visible = false;
                obj.visible = false;
            }
        });
    }

    // Create Result View
    simCanvas.innerHTML = `
        <div class="render-preview-container" style="aspect-ratio: ${targetW}/${targetH}; max-height: 400px; margin: 0 auto; background: #000; overflow: hidden; border: 1px solid var(--color-cyan);">
            <img src="${dataURL}" style="width:100%; height:100%; object-fit:contain; filter: contrast(1.1) brightness(1.1);">
        </div>
        <div class="render-complete-badge">STUDIO PASS COMPLETE (${Math.round(targetW)}x${Math.round(targetH)})</div>
        <button class="btn-download" id="download-trigger">SAVE TO LOCAL DISK</button>
    `;

    document.getElementById('download-trigger').onclick = () => {
        const link = document.createElement('a');
        link.download = `3D_Club_Render_${Date.now()}.png`;
        link.href = dataURL;
        link.click();
    };

    closeBtn.style.display = 'block';
}

// --- ANIMATION LOOP ---
let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);

    // Sync camera object position
    objects.forEach(obj => {
        if (obj.isCameraObject) {
            obj.userData.camera.position.copy(obj.position);
            obj.userData.camera.quaternion.copy(obj.quaternion);
            obj.userData.helper.update();
        }
    });

    if (time - lastTime > 16) { // Limit UI updates
        ui.fps.innerText = `FPS: ${Math.round(1000 / (time - lastTime))}`;
        ui.objects.innerText = `OBJECTS: ${objects.length}`;

        let totalVerts = 0;
        objects.forEach(obj => {
            if (obj.geometry && obj.geometry.attributes && obj.geometry.attributes.position) {
                totalVerts += obj.geometry.attributes.position.count;
            }
        });
        ui.vertices.innerText = `VERTS: ${totalVerts}`;

        if (selectedObject) {
            ui.pos.x.innerText = selectedObject.position.x.toFixed(2);
            ui.pos.y.innerText = selectedObject.position.y.toFixed(2);
            ui.pos.z.innerText = selectedObject.position.z.toFixed(2);

            // Rotation in Degrees
            ui.rot.x.innerText = (selectedObject.rotation.x * (180 / Math.PI)).toFixed(1);
            ui.rot.y.innerText = (selectedObject.rotation.y * (180 / Math.PI)).toFixed(1);
            ui.rot.z.innerText = (selectedObject.rotation.z * (180 / Math.PI)).toFixed(1);

            // Scale
            ui.scl.x.innerText = selectedObject.scale.x.toFixed(2);
            ui.scl.y.innerText = selectedObject.scale.y.toFixed(2);
            ui.scl.z.innerText = selectedObject.scale.z.toFixed(2);
        }
        lastTime = time;
    }

    controls.update();
    renderer.render(scene, camera);
}

function toggleWireframe() {
    objects.forEach(obj => {
        if (obj.material) {
            obj.material.wireframe = !obj.material.wireframe;
        }
    });
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('DOMContentLoaded', init);
