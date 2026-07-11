import { TypeDescriptor, TypeDescriptorProps } from './type'

export interface NumberDescriptorProps extends TypeDescriptorProps {
    min?: number
    max?: number
}

/**
 * NumberDescriptor - numeric data type
 * fromString uses parseInt, so fractional numbers are truncated to integers (3.14 => 3)
 */
export class NumberDescriptor extends TypeDescriptor<number> {
    min: number
    max: number

    constructor(props?: NumberDescriptorProps) {
        super(props)
        this.min = props?.min ?? -Infinity
        this.max = props?.max ?? Infinity
    }

    toString(value: number): string | undefined {
        if (value === undefined) return undefined
        if (value === null) return 'null'
        return value.toString()
    }

    fromString(value: string): number | null | undefined {
        if (value === undefined) return undefined
        if (value === 'null') return null
        if (value ===  null) return null
        const result = parseInt(value)
        if (isNaN(result)) return undefined
        return result
    }

    validate(value: number) {
        super.validate(value)
        if (this.min !== -Infinity && value < this.min)
            throw new Error('Number should be greater than or equal to ' + this.min) 
        if (this.max !==  Infinity && value > this.max)
            throw new Error('Number should be less than or equal to ' + this.max)
    }
    default(): number | undefined {
        return undefined
    }
}

export function NUMBER(props?: NumberDescriptorProps) : NumberDescriptor {
    return new NumberDescriptor(props)
}
