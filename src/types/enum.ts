import { TypeDescriptor, TypeDescriptorProps } from './type'


export interface EnumOption<T> {
    label: string
    value: T
}

export interface EnumDescriptorProps<T> extends TypeDescriptorProps {
    options: T[] | Record<string, T>
}


function isEnumObject(obj: any): boolean {
    return typeof obj === 'object'
        && obj !== null
        && !Array.isArray(obj)
}


function extractEnumValues<T>(enumObj: Record<string, T>): T[] {
    return Object.keys(enumObj)
        .filter(key => {
            const val = enumObj[key]
            const reverseKey = enumObj[val as any]
            return typeof reverseKey !== 'number'
        })
        .map(key => enumObj[key])
}


function extractEnumLabels<T>(enumObj: Record<string, T>): string[] {
    return Object.keys(enumObj)
        .filter(key => {
            const val = enumObj[key]
            const reverseKey = enumObj[val as any]
            return typeof reverseKey !== 'number'
        })
}


export class EnumDescriptor<T extends string | number> extends TypeDescriptor<T> {
    private _rawOptions: T[] | Record<string, T>
    private _values: T[]
    private _labels: string[]

    constructor(props: EnumDescriptorProps<T>) {
        super(props)
        this._rawOptions = props.options

        if (Array.isArray(props.options)) {
            this._values = props.options
            this._labels = props.options.map(v => String(v))
        } else if (isEnumObject(props.options)) {
            this._values = extractEnumValues(props.options)
            this._labels = extractEnumLabels(props.options)
        } else {
            this._values = []
            this._labels = []
        }
    }

    toString(value: T): string {
        if (value === undefined) return undefined
        if (value === null) return 'null'
        return String(value)
    }

    fromString(value: string): T {
        if (value === undefined) return undefined
        if (value === 'null' || value === null) return null
        const parsed = this._values.find(v => String(v) === value)
        return parsed !== undefined ? parsed : undefined
    }

    validate(value: T): void {
        super.validate(value)
        if (value !== undefined && value !== null && !this._values.includes(value))
            throw new Error('Value is not a valid enum option')
    }

    default(): T {
        if (this.required && this._values.length > 0)
            return this._values[0]
        return undefined
    }

    getOptions(): EnumOption<T>[] {
        return this._values.map((v, i) => ({
            label: this._labels[i],
            value: v
        }))
    }

    get values(): T[] {
        return this._values
    }
}


export function ENUM<T extends string | number>(props: EnumDescriptorProps<T>): EnumDescriptor<T> {
    return new EnumDescriptor<T>(props)
}
