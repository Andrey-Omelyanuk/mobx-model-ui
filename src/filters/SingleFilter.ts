import { makeObservable, observable } from 'mobx'
import { Filter } from './Filter'
import { Variable } from '../inputs/Variable'


export class SingleFilter extends Filter {
    readonly    field       : string
    @observable input       : Variable<any> 
    // TODO: is __disposers deprecated? I don't find any usage of it and I don't how it can be used
    __disposers             : (()=>void)[] = []

    readonly getURIField : (field: string) => string 
    readonly operator    : (value_a: any, value_b: any) => boolean

    constructor(
        field: string,
        input: Variable<any>,
        getURIField: (field: string) => string,
        operator: (a: any, b: any) => boolean,
    ) {
        super()
        this.field = field
        this.input = input 
        this.getURIField = getURIField
        this.operator = operator
        makeObservable(this)
    }

    get isReady(): boolean {
        return this.input.isReady
    }

    get URLSearchParams(): URLSearchParams {
        const search_params = new URLSearchParams()
        const value = this.input.toString()
        if (!this.input.isDisabled && value !== undefined) {
            search_params.set(this.getURIField(this.field), value)
        }
        return search_params
    }

    isMatch(obj: any): boolean {
        // it's always match if value of filter is undefined
        if (this.input === undefined || this.input.isDisabled)
            return true

        return match(obj, this.field, this.input.value, this.operator)
    }
}


function match(obj: any, field_name: string, filter_value: any, operator: (value_a: any, value_b: any) => boolean): boolean {
    const field_names = field_name.split('__')
    const current_field_name = field_names[0]
    const current_value = obj[current_field_name]

    if (field_names.length === 1) return operator(current_value, filter_value)
    else if (field_names.length   > 1) {
        const next_field_name = field_name.substring(field_names[0].length+2)
        // we have object relation
        if (typeof current_value === 'object' && current_value !== null) {
            if (Array.isArray(current_value)) {
                let result = false
                for(const item of current_value) {
                    result = match(item, next_field_name, filter_value, operator)
                    if (result) return result
                }
            }
            else {
                return match(current_value, next_field_name, filter_value, operator)
            }
        }
    }
    return false
}

export function EQ(field: string, input: Variable<any>) : SingleFilter {
    return new SingleFilter(field, input, (field: string) => `${field}`, (a: any, b: any) => a === b)
}
export function EQV(field: string, input: Variable<any>) : SingleFilter {
    return new SingleFilter(field, input, (field: string) => `${field}__eq`, (a: any, b: any) => a === b)
}
export function NOT_EQ(field: string, input: Variable<any>) : SingleFilter {
    return new SingleFilter(field, input, (field: string) => `${field}__not_eq`, (a: any, b: any) => a !== b)
}
export function GT(field: string, input: Variable<any>) : SingleFilter {
    return new SingleFilter(field, input, (field: string) => `${field}__gt`, (a: any, b: any) => a > b)
}
export function GTE(field: string, input: Variable<any>) : SingleFilter {
    return new SingleFilter(field, input, (field: string) => `${field}__gte`, (a: any, b: any) => a >= b)
}
export function LT(field: string, input: Variable<any>) : SingleFilter {
    return new SingleFilter(field, input, (field: string) => `${field}__lt`, (a: any, b: any) => a < b)
}
export function LTE(field: string, input: Variable<any>) : SingleFilter {
    return new SingleFilter(field, input, (field: string) => `${field}__lte`, (a: any, b: any) => a <= b)
}
export function LIKE(field: string, input: Variable<any>) : SingleFilter {
    return new SingleFilter(field, input, (field: string) => `${field}__contains`,
        (a: any, b: any) => {
            if (typeof a !== 'string') return false
            return a.includes(b)
        }
    )
}
export function ILIKE(field: string, input: Variable<any>) : SingleFilter {
    return new SingleFilter(field, input, (field: string) => `${field}__icontains`,
        (a: any, b: any) => {
            if (typeof a !== 'string') return false
            return a.toLowerCase().includes(b.toLowerCase())
        }
    )
}
export function IN(field: string, input: Variable<any>) : SingleFilter { 
    return new SingleFilter(field, input, (field: string) => `${field}__in`,
        (a, b) => {
            // it's always match if value of filter is empty []
            if (b.length === 0)
                return true
            for (const v of b) {
                if (v === a)
                    return true
            }
            return false
        }
    )
}
