import { runInAction } from 'mobx'
import { model, Model } from '../model'
import { NUMBER } from '../types'
import { ObjectInput } from './ObjectInput'
import { autoResetId } from './auto-reset'
import { id } from '../fields'
import { local } from '../adapters'

jest.useFakeTimers()

describe('ObjectInput', () => {
    @local('test')
    @model
    class TestModel extends Model { @id(NUMBER()) id: number } 

    beforeEach(() => {
    })

    describe('constructor', () => {
        it('...', async () => {
            const options = TestModel.getQuery({})
            const input = new ObjectInput(NUMBER(), { options })
            expect(input).toMatchObject({
                value           : undefined,
                options         : options,
            })
            expect(input.__disposers.length).toBe(1)
        })
    })
    it('isReady', async () => {
        const options = TestModel.getQuery({})
        runInAction(() => options.isNeedToUpdate = false)
        const input = new ObjectInput(NUMBER(), { options }); expect(input.isReady).toBe(true)
        runInAction(() => input.type.required = true)          ; expect(input.isReady).toBe(false)
        runInAction(() => input.type.required = false)         ; expect(input.options.isReady).toBe(true)
                                                            ; expect(input.isReady).toBe(true)
        runInAction(() => options.isNeedToUpdate = true)    ; expect(input.options.isReady).toBe(false)
                                                            ; expect(input.isReady).toBe(false)
    })
    it('autoReset', async () => {
        let flag = false
        const options = TestModel.getQuery({})
        const input = new ObjectInput(NUMBER(), {
            options,
            autoReset: (i) => flag = true 
        })                                                  ; expect(flag).toBe(false)
        runInAction(() => options.isNeedToUpdate = true)    ; expect(flag).toBe(false)
        runInAction(() => options.isNeedToUpdate = false)   ; expect(flag).toBe(true)
    })

    it('should be JSON-serializable', () => {
        const options = TestModel.getQuery({ autoupdate: false })
        const input = new ObjectInput(NUMBER(), { options })
        expect(() => JSON.stringify(input)).not.toThrow()
    })
    it('isReady: sync url and options.isReady problem ', async () => {
        // Problem:
        //  1. sync url invoke
        //  2. options is loaded data and made isNeedToUpdate = true
        // Sulution:
        //   Use autoreset function. It will be invoked after options.isReady and set isNeedToUpdate = false.
        const options = TestModel.getQuery({})              ; expect(options.isReady).toBe(false);
        (options as any).__items = [{id: 10}, ]             ; expect(options.items).toEqual([{id: 10}])
        Object.defineProperty(window, 'location', {
            value: { search: '?test=10' }
        })

        const input1 = new ObjectInput(NUMBER(), {
            options,
            syncURL: 'test'
        })                                                  
        jest.runAllTimers()                                 ; expect(input1.isReady).toBe(false)  
                                                            ; expect(input1.value).toBe(10)
        const input2 = new ObjectInput(NUMBER(), {
            options,
            syncURL: 'test',
            autoReset: autoResetId
        })                                                  
        jest.runAllTimers()                                 ; expect(input2.isReady).toBe(false)  
                                                            ; expect(input2.value).toBe(10)
        runInAction(() => options.isNeedToUpdate = false)
        jest.runAllTimers()                                 ; expect(input1.isReady).toBe(false)  
                                                            ; expect(input1.value).toBe(10)
                                                            // ; expect(input2.isReady).toBe(true)  
                                                            ; expect(input2.value).toBe(10)
    })
})
