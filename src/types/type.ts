export interface TypeDescriptorProps {
    required?: boolean
    null    ?: boolean
}

export abstract class TypeDescriptor<T> {
    required: boolean  // allow undefined value
    null    : boolean  // allow null value
    
    constructor(props?: TypeDescriptorProps) {
        this.null     = props?.null     ?? false
        this.required = props?.required ?? false 
    }
    /**
     * Convert value to the string
     */ 
    abstract toString(value: T): string
    /**
     * Convert string to the value
     */ 
    abstract fromString(value: string): T
    /**
     * Check if the value is valid
     * If not, throw an error
     */ 
    validate(value: T): void {
        if ((value === undefined && this.required) 
        ||  (value === null      && !this.null   ))
            throw new Error('Field is required')
    }

    abstract default(): T
}
