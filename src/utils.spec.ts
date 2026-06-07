import { makeAutoObservable, runInAction } from 'mobx'
import { waitIsFalse, waitIsTrue, timeout } from './utils'

describe('Utils', () => {

    it('waitIsFalse', async () => {
        const obj = { field: true }
        makeAutoObservable(obj)
        const promise = waitIsFalse(obj, 'field')
        runInAction(() => obj.field = false)
        await promise
        expect(obj.field).toBe(false)
    })

    it('waitIsTrue', async () => {
        const obj = { field: false }
        makeAutoObservable(obj)
        const promise = waitIsTrue(obj, 'field')
        runInAction(() => obj.field = true)
        await promise
        expect(obj.field).toBe(true)
    })

    it('timeout', async () => {
        const start = Date.now()
        await timeout(50)
        const elapsed = Date.now() - start
        expect(elapsed).toBeGreaterThanOrEqual(45)
    })
})
