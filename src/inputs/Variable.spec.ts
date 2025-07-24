import { config } from '../config'
import { ORDER_BY, STRING, NUMBER, DATE, DATETIME, ARRAY, ASC, DESC } from '../types'
import { Variable } from './Variable'


jest.useFakeTimers()

describe('Input', () => {
    const nameValue = 'test'

    beforeEach(() => {
        localStorage.clear()
    })

    describe('constructor', () => {
        it('empty', async () => {
            const input = new Variable(STRING())
            expect(input).toMatchObject({
                value           : '',
                isDisabled      : false,
                isDebouncing    : false,
                debounce        : undefined,
                errors          : [],
                syncURL         : undefined,
                syncLocalStorage    : undefined,
                __disposers         : []
            })
        })
        it('full args', async () => {
            const input = new Variable(STRING(), {
                value           : 'test',
                disabled        : true,
                debounce        : 100,
                syncURL         : nameValue,
                syncLocalStorage: nameValue, 
            })
            expect(input).toMatchObject({
                value           : 'test',
                isDisabled      : true,
                isDebouncing    : false,
                debounce        : 100,
                errors          : [],
                syncURL         : nameValue,
                syncLocalStorage: nameValue,
            })
            // syncURL +2
            // syncLocalStorage +1
            expect(input.__disposers.length).toBe(3)
        })
    })

    // TODO:
    // it('isReady', async () => {
    //     const input = new Input(STRING())   ; expect(input.isReady).toBe(true)
    //     input.isRequired = true             ; expect(input.isReady).toBe(false)
    //     input.isDisabled = true             ; expect(input.isReady).toBe(true)
    //     input.isDisabled = false            ; expect(input.isReady).toBe(false)
    //     input.set('test')                   ; expect(input.isReady).toBe(true)
    //     input.isDebouncing = true           ; expect(input.isReady).toBe(false)
    // })

    it('debounce', async () => {
        const variable = new Variable(STRING(),{ debounce: 100 }) ; expect(variable.isReady).toBe(true)
        variable.set('test')                                   ; expect(variable.isReady).toBe(false)
        variable.set('test')                                   ; expect(variable.isReady).toBe(false)
        variable.set('test')                                   ; expect(variable.isReady).toBe(false)
        // Fast-forward time
        jest.runAllTimers()                                 ; expect(variable.isReady).toBe(true)
        variable.set('test')                                   ; expect(variable.isReady).toBe(false)
        variable.set('test')                                   ; expect(variable.isReady).toBe(false)
        // Fast-forward time
        jest.runAllTimers()                                 ; expect(variable.isReady).toBe(true)
    })

    it('syncLocalStorage should have more priority than default value', async () => {
        localStorage.setItem(nameValue, 'xxx')                              
        const input = new Variable(STRING(), { value: 'test', syncLocalStorage: nameValue })
                                    ; expect(input.value).toBe('xxx')
    })

    it('syncURL should have more priority then syncLocalStorage', async () => {
        const searchParams = new URLSearchParams()
        searchParams.set(nameValue, 'yyy')
        config.UPDATE_SEARCH_PARAMS(searchParams)
        localStorage.setItem(nameValue, 'xxx')                              
        const input = new Variable(STRING(), { value: 'test', syncURL: nameValue, syncLocalStorage: nameValue })
        expect(input.value).toBe('yyy')
    })

    describe('ArrayInput', () => {
        describe('constructor', () => {
            it('empty', async () => {
                expect((new Variable(ARRAY(STRING()))).value).toEqual([])
                expect((new Variable(ARRAY(NUMBER()))).value).toEqual([])
                expect((new Variable(ARRAY(DATE()))).value).toEqual([])
                expect((new Variable(ARRAY(DATETIME()))).value).toEqual([])
            })
            it('with value', async () => {
                const string_values = ['a', 'b', 'c']
                const number_values = [1, 2, 3]
                const date_values = [new Date(), new Date(), new Date()]
                expect((new Variable(ARRAY(STRING()), {value: string_values})).value).toStrictEqual(string_values)
                expect((new Variable(ARRAY(NUMBER()), {value: number_values})).value).toStrictEqual(number_values)
                expect((new Variable(ARRAY(DATE()), {value: date_values})).value).toStrictEqual(date_values)
                expect((new Variable(ARRAY(DATETIME()), {value: date_values})).value).toStrictEqual(date_values)
            })
        })
    })
    describe('OrderBy input', () => {
        it('orderBy', () => {
            const desc = ORDER_BY()
            const variable1 = new Variable(desc)
            variable1.set(['asc', DESC])
            expect(variable1.value).toEqual(['asc', DESC])
            // it should not fail in compilation time
            const testType1: [string, boolean] = variable1.value

            const variable2 = new Variable(desc, {value: ['asc', ASC]})
            variable2.set(['asc', DESC])
            expect(variable2.value).toEqual(['asc', DESC])
            // it should not fail in compilation time
            const testType2: [string, boolean] = variable2.value

            const arrayVariable = new Variable(ARRAY(desc), {value: [['asc', ASC]]})
            arrayVariable.set([['asc', DESC]])
            expect(arrayVariable.value).toEqual([['asc', DESC]])
            // it should not fail in compilation time
            const testType: [string, boolean][] = arrayVariable.value
        })
    })
})
