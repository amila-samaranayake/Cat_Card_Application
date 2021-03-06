const fetch = require('node-fetch');
const blend = require('@mapbox/blend');
const argv = require('minimist')(process.argv.slice(2));
const { writeFile } = require('fs').promises;
const { join } = require('path');

const BASE_URL = 'https://cataas.com/cat';

const {
    greeting = 'Hello',
    who = 'You',
    width = 400,
    height = 500,
    color = 'Pink',
    size = 100,
} = argv;

/**
 * Generate image URLs with custom text.
 * @param {string} text The text needs to appear in the image. 
 * @param {object} urlParams Image params as an object, width, height, size, color.
 * @returns {string} URL Generated image URL.
 */
const getCatImageUrlWithText = (text, urlParams) => {
    text = text || '';
    let urlParamsStr = '';

    if (urlParams) {
        for (const param in urlParams) {
            if (urlParamsStr === '') { urlParamsStr += `?${param}=${urlParams[param]}` }
            else urlParamsStr += `&${param}=${urlParams[param]}`
        }
    }

    return `${BASE_URL}/says/${text}${urlParamsStr}`;
}

/**
 * Fetch image from Cat as a Service
 * @param {string} url Cat service URL
 * @returns {object} Image as a buffer
 */
const fetchImage = async url => {
    if (!url) {
        console.error('Error caught: Image url not found.');
        return;
    }

    try {
        const response = await fetch(url);
        if (response && response.ok) {
            console.log(`Received response with status: ${response.status}`);
            return response.buffer();
        }
        else {
            console.error(`Error caught: Can't fetch the image`);
            return null;
        }
    } catch (error) {
        console.error(`Error caught: ${error.message}`);
    }
}

/**
 * Binds images together into one image
 * @param {array} imageData List of image objects with image buffer and image coordinates
 * @param {object} options Object of options with generating image width, height, format
 * @returns {object} Blended image buffer
 */
const blendImages = (imageData, options) => {
    return new Promise((resolve, reject) => {
        blend(imageData, options, (error, data) => {
            if (error)
                return reject(error);
            return resolve(data);
        });
    });
}

/**
 * Create the cat-card.jpg image file
 * @param {object} blendedImageBuffer Blended image buffer
 */
const saveBlendedImage = blendedImageBuffer => {
    const fileOut = join(__dirname, '/images/cat-card.jpg');

    writeFile(fileOut, blendedImageBuffer)
        .then(() => { console.log('The file was saved!'); })
        .catch(error => { console.error(`Error caught: ${error}`); });
}

/**
 * The entry point of the application.
 */
const main = async () => {
    const catImageBufferList = [];
    const textList = [greeting, who];

    for (let [index, text] of textList.entries()) {
        const url = getCatImageUrlWithText(text, { width, height, size, color });
        const fetchedImageBuffer = await fetchImage(url);
        let imageCoordinates = { x: 0, y: 0 };

        if (!fetchedImageBuffer) continue;

        if (index === 1) imageCoordinates.x = width;

        catImageBufferList.push({ buffer: fetchedImageBuffer, ...imageCoordinates });
    }

    if (catImageBufferList) {
        blendImages(catImageBufferList, { width: width * 2, height: height, format: 'jpeg' })
            .then((data) => { saveBlendedImage(data); })
            .catch((error) => { console.error(`Error caught: ${error}`); });
    }
}

main();