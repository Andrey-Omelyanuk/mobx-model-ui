import { TypeDescriptor, TypeDescriptorProps } from './type'

export interface NumberDescriptorProps extends TypeDescriptorProps {
    min?: number
    max?: number
}

export class NumberDescriptor extends TypeDescriptor<number> {
    min: number
    max: number

    constructor(props?: NumberDescriptorProps) {
        super(props)
        this.min = props?.min ?? -Infinity
        this.max = props?.max ?? Infinity
    }

    toString(value: number): string {
        if (value === undefined) return undefined
        if (value === null) return 'null'
        return value.toString()
    }

    fromString(value: string): number {
        if (value === undefined) return undefined
        if (value === 'null') return null
        if (value ===  null) return null
        const result = parseInt(value)
        if (isNaN(result)) return undefined
        return result
    }

    validate(value: number) {
        super.validate(value)
        if (this.min && value < this.min)
            throw new Error('Number should be greater than or equal to ' + this.min) 
        if (this.max && value > this.max)
            throw new Error('Number should be less than or equal to ' + this.max)
    }
    default(): number {
        return undefined
    }
}

export function NUMBER(props?: NumberDescriptorProps) : NumberDescriptor {
    return new NumberDescriptor(props)
}
