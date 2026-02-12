// config.js – shared configuration
window.APP_CONFIG = (function() {
    function detectBaseURL() {
        // ----- Script path detection (looking for 'frontend') -----
        try {
            let scriptUrl = null;
            if (document.currentScript) {
                scriptUrl = document.currentScript.src;
            } else {
                const scripts = document.getElementsByTagName('script');
                for (let s of scripts) {
                    if (s.src && s.src.includes('config.js')) {
                        scriptUrl = s.src;
                        break;
                    }
                }
            }
            if (scriptUrl) {
                const url = new URL(scriptUrl);
                const pathParts = url.pathname.split('/').filter(p => p);
                const frontendIndex = pathParts.indexOf('frontend');
                if (frontendIndex !== -1) {
                    const projectRoot = pathParts.slice(0, frontendIndex).join('/');
                    return `${url.origin}/${projectRoot}/backend/public`.replace(/\/$/, '');
                }
            }
        } catch (e) {}

        // Fallback: window.location
        const origin = window.location.origin;
        let pathname = window.location.pathname;
        const frontendPos = pathname.indexOf('/frontend');
        if (frontendPos !== -1) {
            const projectPath = pathname.substring(0, frontendPos);
            return `${origin}${projectPath}/backend/public`.replace(/\/$/, '');
        }

        // Last resort – maybe you set a manual override?
        return `${origin}/backend/public`.replace(/\/$/, '');
    }

    return {
        API_BASE_URL: detectBaseURL()
    };
})();

console.log('[Config] API Base URL:', window.APP_CONFIG.API_BASE_URL);