import { UUIDDescriptor } from './uuid'


describe('UUIDDescriptor', () => {

    describe('toString', () => {
        it('valid UUID => same UUID', () => {
            expect((new UUIDDescriptor()).toString('550e8400-e29b-41d4-a716-446655440000'))
                .toBe('550e8400-e29b-41d4-a716-446655440000')
        })
        it('undefined => undefined', () => {
            expect((new UUIDDescriptor()).toString(undefined)).toBe(undefined)
        })
        it('null => "null"', () => {
            expect((new UUIDDescriptor()).toString(null)).toBe('null')
        })
    })

    describe('fromString', () => {
        it('valid UUID => same UUID', () => {
            expect((new UUIDDescriptor()).fromString('550e8400-e29b-41d4-a716-446655440000'))
                .toBe('550e8400-e29b-41d4-a716-446655440000')
        })
        it('"null" => null', () => {
            expect((new UUIDDescriptor()).fromString('null')).toBe(null)
        })
        it('undefined => undefined', () => {
            expect((new UUIDDescriptor()).fromString(undefined)).toBe(undefined)
        })
        it('null => null', () => {
            expect((new UUIDDescriptor()).fromString(null)).toBe(null)
        })
    })

    describe('validate', () => {
        it('valid UUID', () => {
            const descriptor = new UUIDDescriptor()
            expect(() => descriptor.validate('550e8400-e29b-41d4-a716-446655440000')).not.toThrow()
        })
        it('valid UUID uppercase', () => {
            const descriptor = new UUIDDescriptor()
            expect(() => descriptor.validate('550E8400-E29B-41D4-A716-446655440000')).not.toThrow()
        })
        it('invalid format - no dashes', () => {
            const descriptor = new UUIDDescriptor()
            expect(() => descriptor.validate('550e8400e29b41d4a716446655440000'))
                .toThrow('Invalid UUID format')
        })
        it('invalid format - wrong segments', () => {
            const descriptor = new UUIDDescriptor()
            expect(() => descriptor.validate('550e-e29b-41d4-a716-446655440000'))
                .toThrow('Invalid UUID format')
        })
        it('invalid format - wrong characters', () => {
            const descriptor = new UUIDDescriptor()
            expect(() => descriptor.validate('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz'))
                .toThrow('Invalid UUID format')
        })
        it('empty string - not required', () => {
            const descriptor = new UUIDDescriptor()
            expect(() => descriptor.validate('')).not.toThrow()
        })
        it('empty string - required', () => {
            const descriptor = new UUIDDescriptor({required: true})
            expect(() => descriptor.validate('')).toThrow('Field is required')
        })
        it('undefined - required', () => {
            const descriptor = new UUIDDescriptor({required: true})
            expect(() => descriptor.validate(undefined)).toThrow('Field is required')
        })
        it('null - not nullable', () => {
            const descriptor = new UUIDDescriptor()
            expect(() => descriptor.validate(null)).toThrow('Field is required')
        })
        it('null - nullable', () => {
            const descriptor = new UUIDDescriptor({null: true})
            expect(() => descriptor.validate(null)).not.toThrow()
        })
    })

    describe('default', () => {
        it('returns zero UUID', () => {
            const descriptor = new UUIDDescriptor()
            expect(descriptor.default()).toBe('00000000-0000-0000-0000-000000000000')
        })
    })
})
