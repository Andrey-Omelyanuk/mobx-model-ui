import { TypeDescriptor, TypeDescriptorProps } from './type'


export interface StringDescriptorProps extends TypeDescriptorProps {
    minLength?: number
    maxLength?: number
}


export class StringDescriptor extends TypeDescriptor<string> {
    minLength: number
    maxLength: number
    constructor(props?: StringDescriptorProps) {
        super(props)
        this.minLength = props?.minLength ?? 0
        this.maxLength = props?.maxLength ?? 255
    }

    toString(value: string): string {
        if (value === undefined) return undefined
        if (value === null) return 'null'
        return value
    }

    fromString(value: string): string {
             if (value === undefined) return undefined
        else if (value === 'null') return null
        else if (value ===  null) return null
        return value
    }

    validate(value: string) {
        super.validate(value)
        if (value === '' && this.required)
            throw new Error('Field is required')
        if (this.minLength && value?.length < this.minLength)
            throw new Error(`String must be at least ${this.minLength} characters long`)
        if (this.maxLength && value?.length > this.maxLength)
            throw new Error(`String must be no more than ${this.maxLength} characters long`)
    }
    default(): string {
        return ''
    }
}


export function STRING(props?: StringDescriptorProps) {
    return new StringDescriptor(props)
}
