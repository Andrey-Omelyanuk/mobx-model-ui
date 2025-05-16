import { DateDescriptor } from './date' 

describe('DateDescriptor', () => {
    const desc = new DateDescriptor()

    describe('toString', () => {
        it('10/10/2010 => "10.10.2010"' , () => { expect(desc.toString(new Date(2010, 9, 10))).toBe('2010-10-10T00:00:00.000Z') })
        it('null  => "null"'            , () => { expect(desc.toString(null)).toBe('null') })
        it('undefined => undefined'     , () => { expect(desc.toString(undefined)).toBe(undefined) })
    })

    describe('fromString', () => {
        it('"10.10.2010" => Date(2010,9,10)', () => { expect(desc.fromString('10.10.2010')).toEqual(new Date(2010, 9, 10)) })
        it('"null" => null'                 , () => { expect(desc.fromString('null')).toBe(null) })
        it('null => null'                   , () => { expect(desc.fromString(null)).toBe(null) })
        it('undefined => undefined'         , () => { expect(desc.fromString(undefined)).toBe(undefined) })
    })

    describe('validate', () => {
        it('min', async () => {
            const desc = new DateDescriptor({min: new Date(2020, 0, 1)})
            expect(() => desc.validate(new Date(2019, 11, 31))).toThrow('Date should be later than 2020-01-01T00:00:00.000Z')
            expect(() => desc.validate(new Date(2021, 11, 31))).not.toThrow()
        })
        it('max', async () => {
            const desc = new DateDescriptor({max: new Date(2020, 0, 1)})
            expect(() => desc.validate(new Date(2019, 11, 31))).not.toThrow()
            expect(() => desc.validate(new Date(2021, 11, 31))).toThrow('Date should be earlier than 2020-01-01T00:00:00.000Z')
        })
    })
})
