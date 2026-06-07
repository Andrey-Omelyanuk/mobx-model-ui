import { DateDescriptor, DateDescriptorProps } from './date'


export class DateTimeDescriptor extends DateDescriptor {
    toString(value: Date): string {
        if (value === undefined) return undefined
        if (value === null) return 'null'
        return value.toISOString()
    }
}

export function DATETIME(props?: DateDescriptorProps) {
    return new DateTimeDescriptor(props)
}