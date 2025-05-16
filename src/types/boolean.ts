import { TypeDescriptor, TypeDescriptorProps } from './type'

export interface BooleanDescriptorProps extends TypeDescriptorProps {}

export class BooleanDescriptor extends TypeDescriptor<boolean> {
    constructor(props?: BooleanDescriptorProps) {
        super(props)
    }

    toString(value: boolean): string {
        if (value === undefined) return undefined
        if (value === null) return 'null'
        if (value === false) return 'false'
        return 'true' 
    }

    fromString(value: string): boolean {
        if (value === 'false' || value === '0') return false
        if (value === 'null' || value === null) return null
        if (value === undefined) return undefined
        return !!value
    }

    default(): boolean {
        return false
    }
}


export function BOOLEAN(props?: BooleanDescriptorProps) {
    return new BooleanDescriptor(props)
}
