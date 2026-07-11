import { reaction } from 'mobx'
import { Variable } from '../Variable'
import { config } from '../../config'


export const syncCookieHandler = (paramName: string, input: Variable<any>) => {
    const cookie = document.cookie.split(';').find(row => row.trim().startsWith(`${paramName}=`)) 
    if (cookie) {
        input.setFromString(cookie.split('=')[1])
    }
    // watch for Input changes and update cookie
    input.__disposers.push(reaction(
        () => input.toString(),
        (value) => {
            if (value === undefined)
                // expire the cookie: `max-age=0` plus a past `expires` so every
                // browser actually removes it instead of keeping an empty value
                document.cookie = `${paramName}=; path=/; domain=${config.COOKIE_DOMAIN}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
            else
                document.cookie = `${paramName}=${value}; path=/; domain=${config.COOKIE_DOMAIN}`
        },
        { fireImmediately: true },
    ))
}
