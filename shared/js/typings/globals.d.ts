/**
 * @global If applicable, identifier of this custom build.
 */
declare let customBuild: string;

/**
 * @global If applicable, favicon for this custom build.
 */
declare let customBuildFavicon: string;

/**
 * @global Event handler for messages to the current thread.
 */
declare let onthreadmessage: (e: MessageEvent) => any;

/**
 * @global Object containing translations for English phrases
 * (only exists in main thread of production environments).
 */
declare let Translations: {[language: string] : {[text: string] : string}};
