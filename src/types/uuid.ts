import { TypeDescriptor, TypeDescriptorProps } from './type'


export interface UUIDDescriptorProps extends TypeDescriptorProps {}


export class UUIDDescriptor extends TypeDescriptor<string> {
    constructor(props?: UUIDDescriptorProps) {
        super(props)
    }

    toString(value: string): string | undefined {
        if (value === undefined) return undefined
        if (value === null) return 'null'
        return value
    }

    fromString(value: string): string | null | undefined {
             if (value === undefined) return undefined
        else if (value === 'null') return null
        else if (value ===  null) return null
        return value
    }

    validate(value: string) {
        super.validate(value)
        if (value === '' && this.required)
            throw new Error('Field is required')
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (value && !uuidRegex.test(value))
            throw new Error('Invalid UUID format')
    }

    default(): string {
        return '00000000-0000-0000-0000-000000000000'
    }
}


export function UUID(props?: UUIDDescriptorProps) {
    return new UUIDDescriptor(props)
}
