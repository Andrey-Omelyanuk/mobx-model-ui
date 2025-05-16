import { NumberDescriptor } from './number'


describe('NumberDescriptor', () => {

    describe('toString', () => {
        it('0 => "0"'              , () => { expect((new NumberDescriptor()).toString(0)).toBe('0') })
        it('123 => "123"'          , () => { expect((new NumberDescriptor()).toString(123)).toBe('123') })
        it('null => "null"'        , () => { expect((new NumberDescriptor()).toString(null)).toBe('null') })
        it('undefined => undefined', () => { expect((new NumberDescriptor()).toString(undefined)).toBe(undefined) })
    })

    describe('fromString', () => {
        it('"0" => 0'              , () => { expect((new NumberDescriptor()).fromString('0')).toBe(0) })
        it('"123" => 123'          , () => { expect((new NumberDescriptor()).fromString('123')).toBe(123) })
        it('"test" => undefined'   , () => { expect((new NumberDescriptor()).fromString('test')).toBe(undefined) })
        it('"null" => null'        , () => { expect((new NumberDescriptor()).fromString('null')).toBe(null) })
        it('null => null'          , () => { expect((new NumberDescriptor()).fromString(null)).toBe(null) })
        it('undefined => undefined', () => { expect((new NumberDescriptor()).fromString(undefined)).toBe(undefined) })
    })

    describe('validate', () => {
        it('min', async () => {
            const descriptor = new NumberDescriptor({min: 5})
            expect(() => descriptor.validate(5)).not.toThrow()
            expect(() => descriptor.validate(4)).toThrow('Number should be greater than or equal to 5')
        })
        it('max', async () => {
            const descriptor = new NumberDescriptor({max: 10})
            expect(() => descriptor.validate(10)).not.toThrow()
            expect(() => descriptor.validate(11)).toThrow('Number should be less than or equal to 10')
        })
    })
})
