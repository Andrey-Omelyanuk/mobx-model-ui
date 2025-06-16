import { TypeDescriptor, TypeDescriptorProps } from './type'


export interface ArrayDescriptorProps extends TypeDescriptorProps {
    minItems?: number
    maxItems?: number
}

export class ArrayDescriptor<T> extends TypeDescriptor<T[]> {
    type    : TypeDescriptor<T>
    minItems: number
    maxItems: number
    constructor(type: TypeDescriptor<T>, props?: ArrayDescriptorProps) {
        super(props)
        this.type     = type
        this.minItems = props?.minItems ?? 0
        this.maxItems = props?.maxItems ?? Infinity
    }
    toString(value: T[]): string {
        if (!value) return undefined
        if (!value.length) return undefined
        return value.map(item => this.type.toString(item)).join(',')
    }
    fromString(value: string): T[] {
        if (!value) return []
        return value.split(',').map(item => this.type.fromString(item))
    }
    validate(value: T[]) {
        super.validate(value)
        if (this.minItems && value?.length < this.minItems)
            throw new Error('Items count is less than minimum allowed')
        if (this.maxItems && value?.length > this.maxItems)
            throw new Error('Items count is more than maximum allowed')
        value.forEach(item => this.type.validate(item))
    }
    default(): T[] {
        return []
    }
}

export function ARRAY<T>(type: TypeDescriptor<T>, props?: ArrayDescriptorProps) {
    return new ArrayDescriptor(type, props)
}
