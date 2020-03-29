# Shaders Gallery

![Preview](https://habrastorage.org/webt/4g/_y/3h/4g_y3hknx-ryhpmbydzpl4q2pls.gif)


## Description

The Shaders Gallery is a core script for creating galleries of photos with various effects based on WebGL shaders. It has no design, no controls, just a number of options and the methods to switching between the slides.

*WARN: The script is written in ES6+ with Promises. You probably want to transform it through the Babel and add the corresponding polyfills before push it to the production.*


## Dependencies

The gallery has two dependencies:

 - [Three.js](https://threejs.org/)
 - [Anime.js](https://animejs.com/)


## Usage Example

The following steps are required to start using the Shaders Gallery:

```html
<!-- STEP 1: Create a container for gallery -->

<style>
    .gallery-container {
        position: absolute;
        width: calc(100% - 32px);
        height: calc(100% - 32px);
        top: 50%;
        left: 50%;
        transform: translateX(-50%) translateY(-50%);
    }
</style>

<div class='gallery-container'></div>



<!-- STEP 2: Load dependencies -->

<script src='https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.min.js'></script>
<script src='https://cdnjs.cloudflare.com/ajax/libs/animejs/3.1.0/anime.min.js'></script>



<!-- STEP 3: Init and use the gallery -->

<script type='module'>
    import ShadersGallery from './shaders-gallery.js';

    const options = {
        container: document.querySelector('.gallery-container'),
        urls: [
            'https://picsum.photos/id/1018/1920/1080.jpg',
            'https://picsum.photos/id/1015/1920/1080.jpg',
            'https://picsum.photos/id/1016/1920/1080.jpg'
        ],
        imageSize: {
            x: 1920,
            y: 1080
        },
        callbacks: {
            onGalleryCreated: function() {
                // It's time to remove your preloader!
            }
        }
    };

    const gallery = new ShadersGallery(options);

    // Then use it!
    // >> gallery.goToNextSlide();
    // or
    // >> gallery.goToPrevSlide();
    // or
    // >> gallery.goTo(index); where index = 0, 1, 2...
</script>

```


## License

MIT License


Copyright (c) 2020 Ivan Bogachev sfi0zy@gmail.com


