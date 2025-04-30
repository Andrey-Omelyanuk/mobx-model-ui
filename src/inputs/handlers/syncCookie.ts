import { reaction } from 'mobx'
import { Input } from '../Input'
import { config } from '../../config'


export const syncCookieHandler = (paramName: string, input: Input<any>) => {
    const cookie = document.cookie.split(';').find(row => row.trim().startsWith(`${paramName}=`)) 
    if (cookie) {
        input.setFromString(cookie.split('=')[1])
    }
    // watch for Input changes and update cookie
    input.__disposers.push(reaction(
        () => input.toString(),
        (value) => {
            if (value === undefined)
                document.cookie = `${paramName}=; path=/; domain=${config.COOKIE_DOMAIN}`
            else
                document.cookie = `${paramName}=${value}; path=/; domain=${config.COOKIE_DOMAIN}`
        },
        { fireImmediately: true },
    ))
}
