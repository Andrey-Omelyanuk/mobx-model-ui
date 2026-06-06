import { EnumDescriptor, ENUM } from './enum'


enum StringStatus {
    Draft = 'draft',
    Published = 'published',
    Archived = 'archived'
}

enum NumericPriority {
    Low = 1,
    Medium = 2,
    High = 3
}

enum NumericAuto {
    Guest,
    User,
    Admin
}


describe('EnumDescriptor', () => {

    describe('with string enum', () => {
        const descriptor = new EnumDescriptor({ options: StringStatus })

        describe('toString', () => {
            it('"draft" => "draft"', () => { expect(descriptor.toString(StringStatus.Draft)).toBe('draft') })
            it('undefined => undefined', () => { expect(descriptor.toString(undefined)).toBe(undefined) })
            it('null => "null"', () => { expect(descriptor.toString(null)).toBe('null') })
        })

        describe('fromString', () => {
            it('"draft" => "draft"', () => { expect(descriptor.fromString('draft')).toBe('draft') })
            it('"null" => null', () => { expect(descriptor.fromString('null')).toBe(null) })
            it('null => null', () => { expect(descriptor.fromString(null)).toBe(null) })
            it('undefined => undefined', () => { expect(descriptor.fromString(undefined)).toBe(undefined) })
            it('"invalid" => undefined', () => { expect(descriptor.fromString('invalid')).toBe(undefined) })
        })

        describe('validate', () => {
            it('valid value', () => { expect(() => descriptor.validate(StringStatus.Draft)).not.toThrow() })
            it('invalid value', () => { expect(() => descriptor.validate('invalid' as any)).toThrow('Value is not a valid enum option') })
        })

        describe('getOptions', () => {
            it('returns correct options', () => {
                expect(descriptor.getOptions()).toEqual([
                    { label: 'Draft', value: StringStatus.Draft },
                    { label: 'Published', value: StringStatus.Published },
                    { label: 'Archived', value: StringStatus.Archived },
                ])
            })
        })

        describe('default', () => {
            it('returns undefined by default', () => { expect(descriptor.default()).toBe(undefined) })
        })
    })

    describe('with numeric enum', () => {
        const descriptor = new EnumDescriptor({ options: NumericPriority })

        describe('toString', () => {
            it('1 => "1"', () => { expect(descriptor.toString(NumericPriority.Low)).toBe('1') })
            it('undefined => undefined', () => { expect(descriptor.toString(undefined)).toBe(undefined) })
            it('null => "null"', () => { expect(descriptor.toString(null)).toBe('null') })
        })

        describe('fromString', () => {
            it('"1" => 1', () => { expect(descriptor.fromString('1')).toBe(1) })
            it('"2" => 2', () => { expect(descriptor.fromString('2')).toBe(2) })
            it('"99" => undefined', () => { expect(descriptor.fromString('99')).toBe(undefined) })
        })

        describe('validate', () => {
            it('valid value', () => { expect(() => descriptor.validate(NumericPriority.Medium)).not.toThrow() })
            it('invalid value', () => { expect(() => descriptor.validate(99 as any)).toThrow('Value is not a valid enum option') })
        })

        describe('getOptions', () => {
            it('returns correct options', () => {
                expect(descriptor.getOptions()).toEqual([
                    { label: 'Low', value: NumericPriority.Low },
                    { label: 'Medium', value: NumericPriority.Medium },
                    { label: 'High', value: NumericPriority.High },
                ])
            })
        })
    })

    describe('with numeric auto enum', () => {
        const descriptor = new EnumDescriptor({ options: NumericAuto })

        describe('toString', () => {
            it('0 => "0"', () => { expect(descriptor.toString(NumericAuto.Guest)).toBe('0') })
            it('1 => "1"', () => { expect(descriptor.toString(NumericAuto.User)).toBe('1') })
        })

        describe('fromString', () => {
            it('"0" => 0', () => { expect(descriptor.fromString('0')).toBe(0) })
            it('"1" => 1', () => { expect(descriptor.fromString('1')).toBe(1) })
            it('"2" => 2', () => { expect(descriptor.fromString('2')).toBe(2) })
        })

        describe('getOptions', () => {
            it('returns correct options', () => {
                expect(descriptor.getOptions()).toEqual([
                    { label: 'Guest', value: NumericAuto.Guest },
                    { label: 'User', value: NumericAuto.User },
                    { label: 'Admin', value: NumericAuto.Admin },
                ])
            })
        })
    })

    describe('with array options', () => {
        const descriptor = new EnumDescriptor({ options: ['a', 'b', 'c'] })

        describe('toString', () => {
            it('"a" => "a"', () => { expect(descriptor.toString('a')).toBe('a') })
        })

        describe('fromString', () => {
            it('"a" => "a"', () => { expect(descriptor.fromString('a')).toBe('a') })
            it('"x" => undefined', () => { expect(descriptor.fromString('x')).toBe(undefined) })
        })

        describe('getOptions', () => {
            it('returns correct options', () => {
                expect(descriptor.getOptions()).toEqual([
                    { label: 'a', value: 'a' },
                    { label: 'b', value: 'b' },
                    { label: 'c', value: 'c' },
                ])
            })
        })
    })

    describe('with numeric array options', () => {
        const descriptor = new EnumDescriptor({ options: [1, 2, 3] })

        describe('getOptions', () => {
            it('returns correct options', () => {
                expect(descriptor.getOptions()).toEqual([
                    { label: '1', value: 1 },
                    { label: '2', value: 2 },
                    { label: '3', value: 3 },
                ])
            })
        })
    })

    describe('required', () => {
        it('required + undefined throws', () => {
            const descriptor = new EnumDescriptor({ options: StringStatus, required: true })
            expect(() => descriptor.validate(undefined)).toThrow('Field is required')
        })
        it('required + null throws', () => {
            const descriptor = new EnumDescriptor({ options: StringStatus, required: true })
            expect(() => descriptor.validate(null)).toThrow('Field is required')
        })
        it('required + valid does not throw', () => {
            const descriptor = new EnumDescriptor({ options: StringStatus, required: true })
            expect(() => descriptor.validate(StringStatus.Draft)).not.toThrow()
        })
    })

    describe('null allowed', () => {
        it('null: true + null does not throw', () => {
            const descriptor = new EnumDescriptor({ options: StringStatus, null: true })
            expect(() => descriptor.validate(null)).not.toThrow()
        })
        it('null: false + null throws', () => {
            const descriptor = new EnumDescriptor({ options: StringStatus, null: false })
            expect(() => descriptor.validate(null)).toThrow('Field is required')
        })
    })

    describe('default', () => {
        it('returns undefined by default', () => {
            const descriptor = new EnumDescriptor({ options: StringStatus })
            expect(descriptor.default()).toBe(undefined)
        })
        it('returns first option if required', () => {
            const descriptor = new EnumDescriptor({ options: StringStatus, required: true })
            expect(descriptor.default()).toBe(StringStatus.Draft)
        })
        it('returns first numeric option if required', () => {
            const descriptor = new EnumDescriptor({ options: NumericPriority, required: true })
            expect(descriptor.default()).toBe(NumericPriority.Low)
        })
    })

    describe('values getter', () => {
        it('returns array of values', () => {
            const descriptor = new EnumDescriptor({ options: StringStatus })
            expect(descriptor.values).toEqual([StringStatus.Draft, StringStatus.Published, StringStatus.Archived])
        })
    })

    describe('ENUM factory', () => {
        it('creates EnumDescriptor', () => {
            const descriptor = ENUM({ options: StringStatus })
            expect(descriptor).toBeInstanceOf(EnumDescriptor)
        })
    })
})
