import { config, Input, STRING } from '../..'

function delete_cookie( name, path, domain ) {
    if( get_cookie( name ) ) {
        document.cookie = name + '=' +
        ((path) ? ';path='+path:'')+
        ((domain)?';domain='+domain:'') +
        ';expires=Thu, 01 Jan 1970 00:00:01 GMT'
    }
}
function get_cookie(name) {
    return document.cookie.split(';').some(c => {
        return c.trim().startsWith(name + '=')
    })
}

describe('syncCookieHandler', () => {
    beforeEach(() => {
        // reset cookies
        delete_cookie('test', '/', config.COOKIE_DOMAIN) 
    })

    it('empty value', async () => {
                                      expect(document.cookie).toBe('')
        const testInput = new Input(STRING(), { syncCookie: 'test'})
                                      expect(testInput.value).toBe('')
                                      expect(document.cookie).toBe('test=')
    })
    it('set value', async () => {
        const testInput = new Input(STRING(), { syncCookie: 'test'})
                                    ; expect(testInput.value).toBe('')
                                    ; expect(document.cookie).toBe('test=')
        testInput.set('test')       ; expect(document.cookie).toBe('test=test')
    })
    it('set null', async () => {
        const testInput = new Input(STRING(), { syncCookie: 'test'})  
                                      expect(testInput.value).toBe('')
                                      expect(document.cookie).toBe('test=')
        testInput.set(null)         ; expect(document.cookie).toBe('test=null')
    })
    it('set undefined', async () => {
        const testInput = new Input(STRING(), { syncCookie: 'test'})
                                      expect(document.cookie).toBe('test=')
        testInput.set('test')       ; expect(document.cookie).toBe('test=test')
        testInput.set(undefined)    ; expect(document.cookie).toBe('test=')
    })
})
