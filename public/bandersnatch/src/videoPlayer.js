class VideoMediaPlayer {
    constructor({ manifestJSON, network, videoComponent }) {
        this.manifestJSON = manifestJSON;
        this.network = network;
        this.videoComponent = videoComponent;
        this.videoElement = null;
        this.sourceBuffer = null;
        this.selected = {};
        this.videoDuration = 0;
        this.activeItem = {};
        this.selections = [];
    }

    initializeCodec() {
        this.videoElement = document.getElementById("vid");
        const mediaSourceSupported = !!window.MediaSource;
        
        if (!mediaSourceSupported) {
            alert('Seu browser ou sistema não tem suporte a MSE!')
            return;
        }

        const codecSupported = MediaSource.isTypeSupported(this.manifestJSON.codec);

        if(!codecSupported) {
            alert(`Seu browser não suporta o codec: ${this.manifestJSON.codec}`);
            return;
        }

        const mediaSource = new MediaSource();
        this.videoElement.src = URL.createObjectURL(mediaSource);

        mediaSource.addEventListener('sourceopen', this.sourceOpenWrapper(mediaSource));
    }

    sourceOpenWrapper(mediaSource) {
        return async (_) => {
            this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec);
            const selected = this.selected = this.manifestJSON.intro;

            mediaSource.duration = this.videoDuration;
            await this.fileDownload(selected.url);
            setInterval(this.waitForQuestions.bind(this), 300);
        };
    }

    waitForQuestions() {
        const currentTime = parseInt(this.videoElement.currentTime);

        if(this.selected.at !== currentTime) return;
        if(this.activeItem.url === this.selected.url) return;

        this.videoComponent.configureModal(this.selected.options);
        this.activeItem = this.selected;
    }

    currentFileResolution() {
        const prepareUrl = {
            url: this.manifestJSON.finalizar.url,
            fileResolution: this.manifestJSON.lowestResolution,
            fileResolutionTag: this.manifestJSON.fileResolutionTag, 
            hostTag: this.manifestJSON.hostTag
        }

        const finalURL = this.network.parseManifestURL(prepareUrl);

        return this.network.getProperResolution(finalURL);
    }

    async nextChunk(data) {
        const key = data.toLowerCase();
        const selected = this.manifestJSON[key];
        this.selected = {
            ...selected,
            at: parseInt(this.videoElement.currentTime + selected.at)
        }

        this.manageLag(data);

        this.videoElement.play();
        await this.fileDownload(selected.url);
    }

    manageLag(selected) {
        if(!!~this.selections.indexOf(selected.url)) {
            selected.at += 5;
            return;
        }

        this.selections.push(selected.url);
    }

    async fileDownload(url) {
        const fileResolution = await this.currentFileResolution();

        const prepareUrl = { 
            url, 
            fileResolution: fileResolution, 
            fileResolutionTag: this.manifestJSON.fileResolutionTag, 
            hostTag: this.manifestJSON.hostTag
        };

        const finalURL = this.network.parseManifestURL(prepareUrl);
        this.setVideoPlayerDuration(finalURL);
        const data = await this.network.fetchFile(finalURL);
        this.processBufferSegments(data);
    }

    setVideoPlayerDuration(finalURL) {
        const bars = finalURL.split('/');
        const [ name, videoDuration ] = bars[bars.length -1].split('-');
        this.videoDuration += parseFloat(videoDuration);
    }

    async processBufferSegments(allSegments) {
        const sourceBuffer = this.sourceBuffer;
        sourceBuffer.appendBuffer(allSegments);

        return new Promise((resolve, reject) => {
            const updateEnd = (_) => {
                sourceBuffer.removeEventListener('updateend', updateEnd);
                sourceBuffer.timestampOffset = this.videoDuration;
                return resolve();
            }

            sourceBuffer.addEventListener('updateend', updateEnd);
            sourceBuffer.addEventListener('error', () => reject);
        });
    }
}