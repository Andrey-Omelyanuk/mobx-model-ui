import { autorun } from 'mobx'


export function waitIsTrue(obj: any, field: string) : Promise<boolean> {
    return new Promise((resolve) => { 
        autorun((reaction) => {
            if (obj[field]) {
                reaction.dispose()
                resolve(true) 
            }
        })
    })
}

export function waitIsFalse(obj: any, field: string) : Promise<boolean> {
    return new Promise((resolve) => { 
        autorun((reaction) => {
            if (!obj[field]) {
                reaction.dispose()
                resolve(true) 
            }
        })
    })
}

export function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
