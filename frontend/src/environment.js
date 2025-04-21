let IS_PROD = true;
const server = IS_PROD ?
    "https://mytest-video-call.onrender.com" :

    "http://localhost:8000"


export default server;
