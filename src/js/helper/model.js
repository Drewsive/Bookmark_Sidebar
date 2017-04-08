($ => {
    "use strict";

    window.ModelHelper = function (ext) {

        let defaults = {
            u: { // utility
                openStates: {},
                hiddenEntries: {},
                scrollPos: {},
                entriesLocked: true
            },
            b: { // behaviour
                pxTolerance: {windowed: 20, maximized: 1},
                scrollSensitivity: {mouse: 1, trackpad: 1},
                openAction: "mousedown",
                newTab: "foreground",
                dirAccordion: false,
                rememberScroll: true,
                rememberSearch: true,
                closeTimeout: 1
            },
            a: { // appearance
                sidebarPosition: "left",
                showIndicator: true,
                showBookmarkIcons: true,
                styles: {
                    colorScheme: ext.opts.manifest.version_name === "Dev" ? "rgb(255,184,0)" : "rgb(0,137,123)",
                    indicatorWidth: "50px",
                    indicatorIconSize: "40px",
                    indicatorColor: "rgba(0,0,0,0.5)",
                    sidebarWidth: "350px",
                    sidebarMaskColor: "rgba(255,255,255,0.8)",
                    bookmarksFontSize: "14px",
                    bookmarksIconSize: "16px",
                    bookmarksLineHeight: "40px",
                    bookmarksDirIndentation: "25px",
                    bookmarksHorizontalPadding: "16px",
                    overlayMaskColor: "rgba(0,0,0,0.5)"
                }
            }
        };

        let data = {};

        this.init = (callback) => {
            let keys = ["utility", "behaviour", "appearance"];

            chrome.storage.sync.get(keys, (obj) => {
                data = obj;

                keys.forEach((key) => {
                    if (typeof data[key] === "undefined") {
                        data[key] = {};
                    }
                });

                if (typeof callback === "function") {
                    callback();
                }
            });
        };

        /**
         * Retrieves the stored values for the given keys,
         * if a value is undefined, it will be set to the default value
         *
         * @param {object|string} keys
         */
        this.getData = (keys) => {
            let configKeys = keys;
            if (typeof configKeys === "string") {
                configKeys = [configKeys];
            }

            let result = {};

            configKeys.forEach((keyInfo) => {
                let scope = keyInfo.split("/")[0];
                let key = keyInfo.split("/")[1];
                let value = null;
                let dataSearchScope = null;

                switch (scope) {
                    case "u": {
                        dataSearchScope = data.utility;
                        break;
                    }
                    case "b": {
                        dataSearchScope = data.behaviour;
                        break;
                    }
                    case "a": {
                        dataSearchScope = data.appearance;
                        break;
                    }
                }

                if (dataSearchScope !== null) {
                    if (typeof dataSearchScope[key] === "undefined") {
                        if (typeof defaults[scope] !== "undefined" && typeof defaults[scope][key] !== "undefined") { // default values if undefined
                            value = defaults[scope][key];
                        }
                    } else {
                        value = dataSearchScope[key];
                    }
                }

                if (keyInfo === "a/showIndicator" && value === true && typeof data.behaviour.openAction !== "undefined" && data.behaviour.openAction === "mousemove") { // do not show indicator if sidebar opens on mouseover
                    value = false;
                }

                result[key] = value;
            });

            if (typeof keys === "string") {
                let key = keys.split("/")[1];
                result = result[key];
            }

            return result;
        };

        /**
         * Saves the given values in the storage
         *
         * @param {object} values
         * @param {function} callback
         */
        this.setData = (values, callback) => {
            this.init(() => { // init retrieves the newest data
                Object.keys(values).forEach((keyInfo) => {
                    let scope = keyInfo.split("/")[0];
                    let key = keyInfo.split("/")[1];
                    let value = values[keyInfo];
                    let dataSearchScope = null;

                    switch (scope) {
                        case "u": {
                            data.utility[key] = value;
                            dataSearchScope = data.utility;
                            break;
                        }
                        case "b": {
                            data.behaviour[key] = value;
                            break;
                        }
                        case "a": {
                            data.appearance[key] = value;
                            break;
                        }
                    }
                });

                try { // can fail (e.g. MAX_WRITE_OPERATIONS_PER_MINUTE exceeded)
                    chrome.storage.sync.set(data, () => {
                        if (typeof callback === "function") {
                            callback();
                        }
                    });
                } catch (e) {
                    if (typeof callback === "function") {
                        callback();
                    }
                }
            });
        };

        /**
         * Sends a message to the model and calls the callback function when receiving a response
         *
         * @param {string} key
         * @param {object} opts
         * @param {function} callback
         */
        this.call = (key, opts, callback) => {
            opts.type = key;
            chrome.extension.sendMessage(opts, (response) => {
                if (typeof callback === "function") {
                    callback(response);
                }
            });
        };
    };

})(jsu);
