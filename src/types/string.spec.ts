import { StringDescriptor } from './string'


describe('StringDescriptor', () => {

    describe('toString', () => {
        it('"0" => "0"'            , () => { expect((new StringDescriptor()).toString('0')).toBe('0') })
        it('"test" => "test"'      , () => { expect((new StringDescriptor()).toString('test')).toBe('test') })
        it('"null" => "null"'      , () => { expect((new StringDescriptor()).toString('null')).toBe('null') })
        it('undefined => undefined', () => { expect((new StringDescriptor()).toString(undefined)).toBe(undefined) })
        it('null => "null"'        , () => { expect((new StringDescriptor()).toString(null)).toBe('null') })
    })

    describe('fromString', () => {
        it('"0" => "0"'            , () => { expect((new StringDescriptor()).fromString('0')).toBe('0') })
        it('"test" => "test"'      , () => { expect((new StringDescriptor()).fromString('test')).toBe('test') })
        it('"null" => null'        , () => { expect((new StringDescriptor()).fromString('null')).toBe(null) })
        it('undefined => undefined', () => { expect((new StringDescriptor()).fromString(undefined)).toBe(undefined) })
        it('null => null'          , () => { expect((new StringDescriptor()).fromString(null)).toBe(null) })
    })

    describe('validate', () => {
        it('required', async () => {
            const descriptor = new StringDescriptor({required: true})
            expect(() => descriptor.validate('')).toThrow('Field is required')
        })
        it('not required', async () => {
            const descriptor = new StringDescriptor({required: false})
            expect(() => descriptor.validate('')).not.toThrow()
        })
        it('minLength', async () => {
            const descriptor = new StringDescriptor({minLength: 5})
            expect(() => descriptor.validate('1234')).toThrow('String must be at least 5 characters long')
            expect(() => descriptor.validate('12345')).not.toThrow()
        })
        it('maxLength', async () => {
            const descriptor = new StringDescriptor({maxLength: 5})
            expect(() => descriptor.validate('12345')).not.toThrow()
            expect(() => descriptor.validate('123456')).toThrow('String must be no more than 5 characters long')
        })
    })
})
