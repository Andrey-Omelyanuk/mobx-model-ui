import { DateTimeDescriptor } from './datetime'


describe('DateTimeDescriptor', () => {
    const desc = new DateTimeDescriptor()

    describe('toString', () => {
        it('Date => ISO string', () => {
            expect(desc.toString(new Date('2010-10-10T00:00:00Z'))).toBe('2010-10-10T00:00:00.000Z')
        })
        it('null => "null"', () => {
            expect(desc.toString(null)).toBe('null')
        })
        it('undefined => undefined', () => {
            expect(desc.toString(undefined)).toBe(undefined)
        })
    })
})