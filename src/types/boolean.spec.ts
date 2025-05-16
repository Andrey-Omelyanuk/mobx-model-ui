import { BooleanDescriptor } from './boolean' 

describe('Type: Boolean', () => {
    const desc = new BooleanDescriptor()
    describe('toString', () => {
        it('true  => "true"'       , () => { expect(desc.toString(true)).toBe('true') })
        it('false => "false"'      , () => { expect(desc.toString(false)).toBe('false') })
        it('null  => "null"'       , () => { expect(desc.toString(null)).toBe('null') })
        it('undefined => undefined', () => { expect(desc.toString(undefined)).toBe(undefined) })
    })

    describe('fromString', () => {
        it('"0" => false'           , () => { expect(desc.fromString('0'    )).toBe(false) })
        it('"false" => false'       , () => { expect(desc.fromString('false')).toBe(false) })
        it('"true" => true'         , () => { expect(desc.fromString('true' )).toBe(true) })
        it('"123" => true'          , () => { expect(desc.fromString('123'  )).toBe(true) })
        it('"test" => true'         , () => { expect(desc.fromString('test' )).toBe(true) })
        it('"null" => null'         , () => { expect(desc.fromString('null' )).toBe(null) })
        it('null => null'           , () => { expect(desc.fromString(null   )).toBe(null) })
        it('undefined => undefined' , () => { expect(desc.fromString(undefined)).toBe(undefined) })
    })
})
