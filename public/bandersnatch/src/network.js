class Network {
    constructor({ host, manifestJSON }) {
        this.host = host;
        this.manifestJSON = manifestJSON;
    }

    parseManifestURL({ url, fileResolution, fileResolutionTag, hostTag }) {
        return url.replace(fileResolutionTag, fileResolution).replace(hostTag, this.host);
    }

    async fetchFile(url, options = {}) {
        const response = await fetch(url, options);
        return response.arrayBuffer();
    }

    async getProperResolution(url) {
        const startMs = Date.now();
        await this.fetchFile(url, { cache: "no-store" });
        const endMs = Date.now();
        const duration = endMs - startMs;

        const resolutions = [
            { start: 3001, end: 20000, resolution: 144 },
            { start: 901, end: 3000, resolution: 360 },
            { start: 0, end: 900, resolution: 720 }
        ];

        const properResolution = resolutions.find(item => {
            return item.start <= duration && item.end >= duration;
        });

        return !properResolution ? this.manifestJSON.lowestResolution : properResolution.resolution;
    }
}