// Global config of Mobx-ORM
export const config = {
    DEFAULT_PAGE_SIZE   : 50,
    AUTO_UPDATE_DELAY   : 100,  // ms
    FORM_NON_FIELD_ERRORS_KEY : 'non_field_errors',
    FORM_UNKNOWN_ERROR_MESSAGE: 'Unknown errors. Please contact support.',
    // NOTE: React router manage URL by own way. 
    // change UPDATE_SEARCH_PARAMS and WATCH_URL_CHANGES in this case
    UPDATE_SEARCH_PARAMS: (search_params: URLSearchParams) => {
        window.history.pushState(null, '', `${window.location.pathname}?${search_params.toString()}`)

    },
    WATCH_URL_CHANGES: (callback: any) => {
        window.addEventListener('popstate', callback)
        return () => { window.removeEventListener('popstate', callback) }
    },

    DEBOUNCE: (func: (...args: any[]) => any, debounce: number) => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null
        return function(this: any, ...args: any[]) {
            if (timeoutId !== null) {
                clearTimeout(timeoutId)
            }
            timeoutId = setTimeout(() => {
                timeoutId = null
                func.apply(this, args)
            }, debounce)
        }
    },

    COOKIE_DOMAIN: 'localhost' // Change this to your domain if needed.
}
