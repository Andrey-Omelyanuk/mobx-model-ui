import { TypeDescriptor } from './type'


describe('TypeDescriptor', () => {
    class TestDescriptor extends TypeDescriptor<string> {
        toString(value: string): string { return value }
        fromString(value: string): string { return value }
        default(): string { return '' }
    }
    describe('validate', () => {
        it('null', async () => {
            const descriptor = new TestDescriptor({null: true})
            expect(() => descriptor.validate(null)).not.toThrow()
        })
        it('not null', async () => {
            const descriptor = new TestDescriptor({null: false})
            expect(() => descriptor.validate(null)).toThrow('Field is required')
        })
        it('required', async () => {
            const descriptor = new TestDescriptor({required: true})
            expect(() => descriptor.validate(undefined)).toThrow('Field is required')
        })
        it('required', async () => {
            const descriptor = new TestDescriptor({required: true})
            expect(() => descriptor.validate('')).not.toThrow()  // TypeDescriptor checks only for undefined
        })
        it('not required', async () => {
            const descriptor = new TestDescriptor({required: false})
            expect(() => descriptor.validate(undefined)).not.toThrow()
        })
    })
})
