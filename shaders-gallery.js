// -----------------------------------------------------------------------------
//
//  Shaders Gallery v1.0.0
//
//  Author:  Ivan Bogachev <sfi0zy@gmail.com>, 2020
//  License: MIT License
//  GitHub:  https://github.com/sfi0zy/shaders-gallery
//
// -----------------------------------------------------------------------------


const ANIMATION_DURATION = 3000;


const VERTEX_SHADER = `
    uniform sampler2D uImage1;
    uniform sampler2D uImage2;
    uniform vec2      uImageSize;
    uniform vec2      uCanvasSize;
    uniform float     uAnimationTime;


    varying vec2 vUv;


    void main() {
        vUv = uv;

        gl_Position = vec4(position, 1.0);
    }
`;


const FRAGMENT_SHADER = `
    uniform sampler2D uImage1;
    uniform sampler2D uImage2;
    uniform vec2      uImageSize;
    uniform vec2      uCanvasSize;
    uniform float     uAnimationTime;


    varying vec2 vUv;


    vec2 rotate(vec2 v, float angle);


    void main() {
        vec2 ratio = vec2(
            min((uCanvasSize.x / uCanvasSize.y) / (uImageSize.x / uImageSize.y), 1.0),
            min((uCanvasSize.y / uCanvasSize.x) / (uImageSize.y / uImageSize.x), 1.0)
        );

        vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
        );

        vec2 centeredUV = vec2(uv.x - 0.5, uv.y - 0.5);

        float centeredUVLength = length(centeredUV);

        vec2 scaledUV = centeredUV / cos(uAnimationTime * 1.2);

        vec2 temp1 = rotate(scaledUV, smoothstep(0.1, 1.0, uAnimationTime));
        vec2 rotatedUV1 = vec2(temp1.x + 0.5, temp1.y + 0.5);

        vec2 temp2 = rotate(centeredUV, (uAnimationTime - 1.0) / 3.0);
        vec2 rotatedUV2 = vec2(temp2.x + 0.5, temp2.y + 0.5);

        vec2 delta = vec2(-sin(centeredUV.x), -sin(centeredUV.y)) * centeredUVLength * 2.0;

        vec2 delta1 = uAnimationTime * delta;
        vec2 delta2 = (1.0 - uAnimationTime) * delta;

        float mask = smoothstep(
            0.6,
            1.0,
            uAnimationTime + uAnimationTime * centeredUVLength * 2.0);

        vec4 color1 = texture2D(uImage1, rotatedUV1 + delta1);
        vec4 color2 = texture2D(uImage2, rotatedUV2 + delta2);

        gl_FragColor = mix(color1, color2, mask);
    }


    vec2 rotate(vec2 v, float angle) {
        float s = sin(angle);
        float c = cos(angle);

        mat2 m = mat2(c, -s, s, c);

        return m * v;
    }

`;



class Events {
    constructor() {
        this.events = {};
    }


    add(name) {
        if (!(name in this.events)) {
            this.events[name] = {
                callbacks: [],
                happenedTimes: 0
            };
        }

        return this;
    }


    addEventListener(name, callback, executeIfAlreadyFired = false) {
        if ((name in this.events) && (typeof callback === 'function')) {
            this.events[name].callbacks.push(callback);

            if (executeIfAlreadyFired && (this.events[name].counter > 0)) {
                callback();
            }
        }

        return this;
    }


    fire(name) {
        if (name in this.events) {
            this.events[name].happenedTimes++;

            this.events[name].callbacks.forEach((callback) => {
                if (typeof callback === 'function') {
                    callback(this.state);
                }
            });
        }

        return this;
    }
}



class ShadersGallery {
    constructor(options) {
        this.options           = options;
        this.events            = null;
        this.scene             = null;
        this.camera            = null;
        this.renderer          = null;
        this.plane             = null;
        this.canvasSize        = new THREE.Vector2(options.container.offsetWidth, options.container.offsetHeight);
        this.animationTime     = 0.0;
        this.textures          = [];
        this.currentSlideIndex = 0;
        this.numberOfSlides    = options.urls.length;
        this.isActive          = false;

        this.init();
    }


    init() {
        this.initEvents();

        this.initScene();
        this.initCamera();
        this.initRenderer();

        this.loadTextures();
    }


    initEvents() {
        this.events = new Events();

        this.events.add('images-loaded');
        this.events.add('gallery-created');
        this.events.add('animation-started');
        this.events.add('animation-ended');
        this.events.add('window-resized');

        this.events.addEventListener('images-loaded',   this.createPlane.bind(this));
        this.events.addEventListener('gallery-created', this.render.bind(this));
        this.events.addEventListener('window-resized',  this.onWindowResize.bind(this));

        this.events.addEventListener('animation-started', () => { this.isActive = true;  });
        this.events.addEventListener('animation-ended',   () => { this.isActive = false; });

        window.addEventListener('resize', this.events.fire.bind(this.events, 'window-resized'));

        if (typeof this.options.callbacks.onGalleryCreated === 'function') {
            this.events.addEventListener('gallery-created', this.options.callbacks.onGalleryCreated);
        }
    }


    initScene() {
        this.scene = new THREE.Scene();
    }


    initCamera() {
        this.camera = new THREE.PerspectiveCamera(45, this.canvasSize.x / this.canvasSize.y, 1, 2000);
        this.camera.position.z = 5;
    }


    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.canvasSize.x, this.canvasSize.y);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMapSort = true;
        this.renderer.setClearColor(0x000000, 0.3);

        this.options.container.appendChild(this.renderer.domElement);
    }


    loadTextures() {
        const loader = new THREE.TextureLoader();

        const promises = [];

        this.options.urls.forEach((url) => {
            promises.push(new Promise((resolve, reject) => {
                loader.load(url, (texture) => {
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                    resolve(texture);
                });
            }));
        });

        Promise.all(promises).then((loadedTextures) => {
            this.textures = loadedTextures;

            this.events.fire('images-loaded');
        });
    }


    createPlane() {
        const geometry = new THREE.PlaneGeometry(2, 2, 100, 100);

        const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uImage1: {
                    type: 't',
                    value: this.textures[0]
                },
                uImage2: {
                    type: 't',
                    value: this.textures[1]
                },
                uImageSize: {
                    type: 'v2',
                    value: new THREE.Vector2(
                        this.options.imageSize.x,
                        this.options.imageSize.y
                    )
                },
                uCanvasSize: {
                    type: 'v2',
                    value: this.canvasSize
                },
                uAnimationTime: {
                    type: 'f',
                    value: this.animationTime
                }
            },
            transparent: true,
            side: THREE.DoubleSide,
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER
        });

        this.plane = new THREE.Mesh(geometry, shaderMaterial);
        this.scene.add(this.plane);

        this.events.fire('gallery-created');
    }


    onWindowResize() {
        const width  = this.options.container.offsetWidth;
        const height = this.options.container.offsetHeight;

        this.canvasSize.set(width, height);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);

        if (!this.isActive) {
            this.updateUniforms();
            this.render();
        }
    }


    goToNextSlide() {
        const nextSlideIndex = (this.currentSlideIndex + 1) % this.numberOfSlides;

        this.animateTransition(this.currentSlideIndex, nextSlideIndex);
    }


    goToPrevSlide() {
        const nextSlideIndex = (this.currentSlideIndex + this.numberOfSlides - 1) % this.numberOfSlides;

        this.animateTransition(this.currentSlideIndex, nextSlideIndex);
    }


    goTo(index) {
        if (index < 0 ||
            index >= this.numberOfSlides ||
            index === this.currentSlideIndex) {
            return;
        }

        this.animateTransition(this.currentSlideIndex, index);
    }


    animateTransition(fromIndex, toIndex) {
        if (this.isActive) {
            return;
        }

        this.events.fire('animation-started');

        this.animationTime = 0.0;

        this.plane.material.uniforms.uImage1.value = this.textures[fromIndex];
        this.plane.material.uniforms.uImage2.value = this.textures[toIndex];

        this.startAnimationLoop();

        const animation = anime({
            targets:       this,
            animationTime: 1.0,
            duration:      ANIMATION_DURATION,
            delay:         0,
            easing:        'easeInOutQuad'
        });

        setTimeout(() => {
            this.plane.material.uniforms.uImage1.value = this.textures[toIndex];
            this.plane.material.uniforms.uImage2.value = this.textures[toIndex];

            this.currentSlideIndex = toIndex;

            this.events.fire('animation-ended');
        }, ANIMATION_DURATION);
    }


    startAnimationLoop() {
        const loop = () => {
            if (!this.isActive) {
                return;
            }

            this.updateUniforms();
            this.render();

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }


    updateUniforms() {
        this.plane.material.uniforms.uAnimationTime.value = this.animationTime;
        this.plane.material.uniforms.uCanvasSize.value = this.canvasSize;
        this.plane.material.needsUpdate = true;
    }


    render() {
        this.renderer.render(this.scene, this.camera);
    }
}


export default ShadersGallery;

