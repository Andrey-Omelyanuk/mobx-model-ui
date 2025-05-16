import { TypeDescriptor, TypeDescriptorProps } from './type'


export interface DateDescriptorProps extends TypeDescriptorProps {
    min?: Date 
    max?: Date 
}

export class DateDescriptor extends TypeDescriptor<Date> {
    min: Date 
    max: Date 
    constructor(props?: DateDescriptorProps) {
        super(props)
        this.min = props?.min ?? new Date(0)
        this.max = props?.max ?? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) // + 100 years
    }
    toString(value: Date): string {
        if (value === undefined) return undefined
        if (value === null) return 'null'
        return value.toISOString()
    }
    fromString(value: string): Date | null | undefined  {
        if (value === null || value === 'null') return null 
        if (value === undefined) return undefined
        return new Date(value)
    }
    validate(value: Date) {
        super.validate(value)
        if (this.min && value < this.min)
            throw new Error('Date should be later than ' + this.min.toISOString())
        if (this.max && value > this.max)
            throw new Error('Date should be earlier than ' + this.max.toISOString())
    }
    default(): Date {
        return new Date()
    }
}

export function DATE(props?: DateDescriptorProps) {
    return new DateDescriptor(props)
}
